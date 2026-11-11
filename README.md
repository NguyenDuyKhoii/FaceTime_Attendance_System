<div align="center">

# FaceTime Attendance System

**A contactless facial recognition attendance and workforce shift-tracking system powered by ESP32-CAM, Python (`FastAPI` + `OpenCV LBPH`), .NET 8 (`SQL Server` + `SignalR`), and React Native (`Expo`).**

![.NET 8](https://img.shields.io/badge/.NET_8-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)
![SignalR](https://img.shields.io/badge/SignalR-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![ESP32-CAM](https://img.shields.io/badge/ESP32--CAM-E7352C?style=for-the-badge&logo=espressif&logoColor=white)

</div>

---

## 📖 Overview & Hardware Prototype

<table>
  <tr>
    <td width="62%" valign="middle">
      <p><b>The Problem:</b> Manufacturing facilities run across multiple <b>production lines</b> and <b>rotating shifts</b>. Traditional logs and card/fingerprint scanners suffer from buddy-punching, queue bottlenecks, and workers checking in at unauthorized lines or outside scheduled hours.</p>
      <p><b>The Solution:</b> <b>FaceTime</b> automates contactless attendance via edge <b>ESP32-CAM</b> kiosks linked to a FastAPI vision server and .NET 8 HRMS backend—verifying <i>identity, assigned production line, and active shift</i> before logging attendance and computing exact working duration.</p>
      <p><b>Key Capabilities:</b></p>
      <ul>
        <li><b>Edge Biometrics:</b> Fast, contactless face recognition using ESP32-CAM & OpenCV LBPH.</li>
        <li><b>Dual Guardrails:</b> Enforces strict <b>Production Line Isolation</b> & <b>Shift Window Validation</b>.</li>
        <li><b>Real-Time Sync:</b> Pushes live check-in/out events to mobile dashboards via <b>SignalR</b>.</li>
        <li><b>Automated Audit:</b> Calculates net working duration upon check-out automatically.</li>
      </ul>
    </td>
    <td width="38%" align="center" valign="middle">
      <img width="320" alt="ESP32-CAM Hardware Terminal" src="https://github.com/user-attachments/assets/601a3504-40bf-4df3-88c9-16ac18895d79" />
      <br>
      <sub><b>ESP32-CAM Edge Kiosk Terminal</b><br><i>Production Line Scanning Unit</i></sub>
    </td>
  </tr>
</table>

### Target Users
- **Factory Employees:** Quick, hands-free face check-in and check-out with instant visual confirmation and worked-hours feedback.
- **HR & Operations Managers:** Manage employee profiles, facial enrollment, production lines, IoT camera terminals, shift assignments, and live attendance logs from a unified mobile dashboard.

---

## 🛠 Tech Stack Breakdown

| Layer | Technology | Primary Responsibility |
| :--- | :--- | :--- |
| **Edge Hardware** | `ESP32-CAM` (C/C++) | Video capture, MJPEG frame streaming, device terminal identification |
| **Computer Vision** | `Python`, `FastAPI`, `OpenCV (LBPH)` | Face detection, sample enrollment, model training & real-time inference |
| **Core Backend** | `.NET 8 Web API`, `EF Core`, `SQL Server` | Domain business rules, shift/line constraint validation, attendance auditing |
| **Real-Time Comms** | `SignalR` | Instant check-in/out event broadcasting to mobile clients |
| **Mobile Client** | `React Native`, `Expo`, `TypeScript` | HR administration, shift scheduling, face registration, live attendance feed |

---

## 🎬 System Demos

### Core Workflows

<details open>
<summary><b>1. Employee Account Registration & Face Enrollment</b></summary>
<br>

> [!NOTE]
> **Scenario:** HR Manager creates a new employee profile and captures multi-angle facial samples to train the **OpenCV LBPH** recognition model in real time.

https://github.com/user-attachments/assets/74af9e9d-6b2d-4d39-bb48-53c472403dcd

</details>

<details>
<summary><b>2. Shift Creation & Assignment</b></summary>
<br>

> [!NOTE]
> **Scenario:** Operations Manager configures a work shift schedule with specific production line constraints and assigns it to the newly registered employee.

https://github.com/user-attachments/assets/5185ddd1-c853-43e1-821e-da2b7d0d39b6

</details>

<details open>
<summary><b>3. Happy Path — Face Check-In, Check-Out & Working Duration</b></summary>
<br>

> [!TIP]
> **Scenario:** Employee scans their face at the assigned **ESP32-CAM** terminal to check in, then checks out at the end of the shift to receive instant working duration feedback via **SignalR**.

https://github.com/user-attachments/assets/6dcb5812-170f-4c4b-8d69-1599643b9dbd

</details>

### Edge Cases & Security Guardrails

<details>
<summary><b>4. Unhappy Case 1 — Wrong Production Line Rejection</b></summary>
<br>

> [!WARNING]
> **Guardrail Triggered:** Employee attempts to check in at an IoT camera terminal assigned to a **different production line**; the system rejects the scan with a zone mismatch alert.

https://github.com/user-attachments/assets/68dce3a3-ba6f-433f-b1c5-bdf3f61e739a

</details>

<details>
<summary><b>5. Unhappy Case 2 — Unscheduled Access (No Shift Assigned Today)</b></summary>
<br>

> [!CAUTION]
> **Guardrail Triggered:** Employee scans their face on a day with **no assigned work shift**; the system blocks attendance logging outside authorized schedules.

https://github.com/user-attachments/assets/77bcfb08-d1e3-4ab6-8cc0-520dd2279feb

</details>

---

## 📂 Repository Structure

```text
FaceTime_Attendance_System/
├── CameraWebServer/          # Arduino/ESP32-CAM firmware for video streaming & terminal setup
├── ai_attendance_server/     # Python FastAPI + OpenCV LBPH facial recognition service
├── back_end_system/          # .NET 8 Web API, SignalR Hubs, EF Core & SQL Server integration
├── front_end_system/         # React Native (Expo + TypeScript) mobile application
├── demo/                     # Recorded system demonstration clips
└── start-all.bat             # One-click batch script to launch backend, AI server, and frontend
```
