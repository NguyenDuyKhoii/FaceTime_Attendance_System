import os
import sqlite3
import base64
import glob
import numpy as np
import cv2
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

DB_PATH = "attendance.db"
UPLOAD_DIR = "uploads"
DATASET_DIR = "dataset"
MODEL_PATH = "lbph_model.yml"

# LBPH: confidence is "distance" (smaller is closer).
# Increased threshold from 70 to 80 to be less strict
LBPH_THRESHOLD = 80.0

# Global instances
FACE_CASCADE = cv2.CascadeClassifier(
    os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
)
_RECOGNIZER = None
CAMERA_IP = ""

def get_recognizer():
    global _RECOGNIZER
    if _RECOGNIZER is None:
        _RECOGNIZER = cv2.face.LBPHFaceRecognizer_create()
        if os.path.exists(MODEL_PATH):
            _RECOGNIZER.read(MODEL_PATH)
            print(f"[STARTUP] Model loaded from {MODEL_PATH}")
    return _RECOGNIZER

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(DATASET_DIR, exist_ok=True)
    init_db()
    get_recognizer() # Pre-load AI model
    
    # Restore camera IP if exists
    global CAMERA_IP
    if os.path.exists("camera_ip.txt"):
        try:
            with open("camera_ip.txt", "r") as f:
                CAMERA_IP = f.read().strip()
                print(f"[STARTUP] Restored Camera IP: {CAMERA_IP}")
        except Exception as e:
            print(f"[STARTUP] Error reading camera_ip.txt: {e}")
            
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== DATABASE HELPERS ==========

def init_db():
    with sqlite3.connect(DB_PATH) as con:
        # For attendance logs
        con.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            device_id TEXT NOT NULL,
            person_id TEXT,
            name TEXT,
            confidence REAL,
            image_path TEXT
        )
        """)

        # For employee mapping (PersonId <-> Label)
        con.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            person_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            label INTEGER UNIQUE NOT NULL,
            created_ts TEXT NOT NULL
        )
        """)
        con.commit()

def get_or_create_label(con, person_id: str, name: str, ts: str) -> int:
    row = con.execute("SELECT label FROM employees WHERE person_id=?", (person_id,)).fetchone()
    if row:
        con.execute("UPDATE employees SET name=? WHERE person_id=?", (name, person_id))
        return int(row[0])

    max_row = con.execute("SELECT MAX(label) FROM employees").fetchone()
    next_label = int(max_row[0] or 0) + 1

    con.execute(
        "INSERT INTO employees (person_id, name, label, created_ts) VALUES (?,?,?,?)",
        (person_id, name, next_label, ts)
    )
    return next_label

def label_to_person(con, label: int):
    row = con.execute("SELECT person_id, name FROM employees WHERE label=?", (int(label),)).fetchone()
    if not row:
        return None, None
    return row[0], row[1]

# ========== AI HELPERS ==========

def decode_image(b: bytes):
    return cv2.imdecode(np.frombuffer(b, np.uint8), cv2.IMREAD_COLOR)

def detect_one_face(gray: np.ndarray):
    # Equalize histogram to improve contrast in different lighting conditions
    gray = cv2.equalizeHist(gray)
    
    faces = FACE_CASCADE.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
    if len(faces) != 1:
        print(f"[AI] Detected {len(faces)} faces. Expected 1.")
        return None, int(len(faces))

    x, y, w, h = faces[0]
    roi = gray[y:y + h, x:x + w]
    roi = cv2.resize(roi, (200, 200))
    return roi, 1

# ========== API ENDPOINTS ==========

@app.post("/api/enroll")
async def enroll(
    person_id: str = Form(...),
    name: str = Form(...),
    image: UploadFile = File(...),
):
    data = await image.read()
    img = decode_image(data)
    if img is None:
        return JSONResponse({"ok": False, "reason": "INVALID_IMAGE"}, status_code=400)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face, face_count = detect_one_face(gray)
    if face is None:
        return JSONResponse(
            {"ok": False, "reason": "REQUIRE_EXACTLY_ONE_FACE", "face_count": face_count},
            status_code=400
        )

    ts = datetime.now().isoformat(timespec="seconds")

    # Save face to dataset
    person_dir = os.path.join(DATASET_DIR, person_id)
    os.makedirs(person_dir, exist_ok=True)
    
    filename = f"{ts.replace(':','-')}.jpg"
    filepath = os.path.join(person_dir, filename)
    cv2.imwrite(filepath, img)

    with sqlite3.connect(DB_PATH) as con:
        label = get_or_create_label(con, person_id, name, ts)
        con.commit()

    recognizer = get_recognizer()
    has_model = os.path.exists(MODEL_PATH)
    if has_model:
        recognizer.update([face], np.array([label], dtype=np.int32))
    else:
        recognizer.train([face], np.array([label], dtype=np.int32))
    
    recognizer.write(MODEL_PATH)
    return {"ok": True, "ts": ts, "person_id": person_id, "name": name, "label": int(label)}

@app.post("/api/recognize_face")
@app.post("/attendance/face-checkin")
async def recognize_face(
    device_id: str | None = Form(default=None),
    image: UploadFile = File(...),
):
    ts = datetime.now().isoformat(timespec="seconds")
    data = await image.read()
    
    # Save raw upload for logging
    filename = f"{ts.replace(':','-')}_{device_id or 'unknown'}.jpg"
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(data)

    img = decode_image(data)
    if img is None:
        return JSONResponse({"ok": False, "reason": "INVALID_IMAGE"}, status_code=400)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face, face_count = detect_one_face(gray)
    
    if face is None:
        decision = "reject"
        reason = "REQUIRE_EXACTLY_ONE_FACE"
        person_id = name = label = None
        dist = 0.0
    else:
        recognizer = get_recognizer()
        if not os.path.exists(MODEL_PATH):
            decision = "reject"
            reason = "EMPTY_GALLERY"
            person_id = name = label = None
            dist = 0.0
        else:
            label, dist = recognizer.predict(face)
            decision = "accept" if float(dist) <= LBPH_THRESHOLD else "reject"
            reason = None if decision == "accept" else "LOW_CONFIDENCE"
            
            person_id = name = None
            if decision == "accept":
                with sqlite3.connect(DB_PATH) as con:
                    person_id, name = label_to_person(con, int(label))

    # Log to local DB
    with sqlite3.connect(DB_PATH) as con:
        con.execute(
            "INSERT INTO attendance (ts, device_id, person_id, name, confidence, image_path) VALUES (?,?,?,?,?,?)",
            (ts, device_id or "N/A", person_id, name, float(dist), path),
        )
        con.commit()

    return {
        "ok": True,
        "ts": ts,
        "device_id": device_id,
        "decision": decision,
        "reason": reason,
        "person_id": person_id,
        "name": name,
        "confidence": float(dist),
        "threshold": float(LBPH_THRESHOLD),
        "face_count": face_count,
        "saved_image": path
    }

@app.get("/api/get_images/{person_id}")
def get_images(person_id: str):
    person_dir = os.path.join(DATASET_DIR, person_id)
    if not os.path.exists(person_dir):
        return {"ok": True, "person_id": person_id, "images": []}

    image_paths = glob.glob(os.path.join(person_dir, "*.jpg"))
    images = []
    image_paths.sort(reverse=True)

    for path in image_paths:
        try:
            with open(path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode('utf-8')
                images.append({
                    "filename": os.path.basename(path), 
                    "data": f"data:image/jpeg;base64,{encoded}"
                })
        except Exception:
            pass
    return {"ok": True, "person_id": person_id, "images": images}


@app.post("/api/camera/register")
async def register_camera(device_id: str = Form(...), ip_address: str = Form(...)):
    """Endpoint for ESP32 camera to register its IP address"""
    global CAMERA_IP
    CAMERA_IP = ip_address
    
    # Save to file so UDP broadcast can read it
    try:
        with open("camera_ip.txt", "w") as f:
            f.write(ip_address)
    except Exception as e:
        print(f"[CAMERA REGISTER] Error saving to file: {e}")
    
    print(f"[CAMERA REGISTER] Device: {device_id}, IP: {ip_address}")
    return JSONResponse({
        "ok": True,
        "message": "Camera registered successfully",
        "device_id": device_id,
        "ip_address": ip_address
    })

@app.get("/api/camera/ip")
async def get_registered_camera_ip():
    """Retrieve the currently registered camera IP"""
    return {"ok": True, "ip": CAMERA_IP}
