import socket
import time
import os

DISCOVERY_PORT = 45678
MAGIC = "ATTENDANCE_SERVER"
SERVER_PORT = 8000  # port FastAPI đang chạy
CAMERA_IP_FILE = "camera_ip.txt"  # File to share camera IP between processes

def get_lan_ip() -> str:
    # Lấy IP LAN bằng cách "connect giả" ra ngoài, không gửi dữ liệu
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    finally:
        s.close()

def get_camera_ip() -> str:
    """Read camera IP from shared file"""
    try:
        if os.path.exists(CAMERA_IP_FILE):
            with open(CAMERA_IP_FILE, 'r') as f:
                return f.read().strip()
    except Exception:
        pass
    return ""

def main():
    ip = get_lan_ip()

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    # Gửi broadcast định kỳ
    while True:
        camera_ip = get_camera_ip()
        if camera_ip:
            msg = f"{MAGIC} ip={ip} port={SERVER_PORT} camera_ip={camera_ip} camera_port=81".encode("utf-8")
        else:
            msg = f"{MAGIC} ip={ip} port={SERVER_PORT}".encode("utf-8")
        
        sock.sendto(msg, ("255.255.255.255", DISCOVERY_PORT))
        print("Broadcast:", msg.decode())
        time.sleep(1)

if __name__ == "__main__":
    main()
