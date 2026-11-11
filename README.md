# FaceTime Attendance System

A contactless facial recognition attendance and workforce shift-tracking system powered by **ESP32-CAM**, **Python (`FastAPI` + `OpenCV LBPH`)**, **.NET 8 (`SQL Server` + `SignalR`)**, and **React Native (`Expo`)**.

![.NET 8](https://img.shields.io/badge/.NET_8-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![ESP32-CAM](https://img.shields.io/badge/ESP32--CAM-E7352C?style=for-the-badge&logo=espressif&logoColor=white)

---

## Overview & Context

**Context & Problem:**  
In factories and manufacturing facilities, employees work across distinct **production lines** and **rotating shifts**. Traditional attendance methods (paper logs, ID cards, or shared fingerprint scanners) are prone to buddy-punching, delays, and workers checking in at the wrong production line or outside assigned schedules.

**What This System Does:**  
FaceTime automates real-time attendance through camera kiosks using edge **ESP32-CAM** devices connected to a local facial recognition service and central HRMS backend. Every check-in/check-out verifies not just *who* the person is, but also *whether they are scanning at their assigned production line and within an active shift*—calculating exact working duration on check-out.

**Who It Serves:**
- **Factory Employees:** Quick, hands-free face check-in and check-out with instant visual confirmation and worked-hours feedback.
- **HR & Operations Managers:** Manage employee accounts, face enrollment, production lines, IoT camera terminals, shift assignments, and live attendance history from a unified mobile dashboard.

---

## System Demos

### 1. Employee Account Registration & Face Enrollment
Create an employee account/profile and enroll facial training samples into the AI recognition model.

[Watch clip (`demo/register_employee_and_face.mp4`)](demo/register_employee_and_face.mp4)

### 2. Shift Creation & Assignment
Create a work shift schedule and assign it to the newly registered employee.

[Watch clip (`demo/create_shift_and_assign_employee.mp4`)](demo/create_shift_and_assign_employee.mp4)

### 3. Happy Path — Face Check-In, Check-Out & Working Duration
Employee completes face check-in via ESP32-CAM, then checks out to receive the calculated total working duration.

[Watch clip (`demo/tracking_employee_attendance.mp4`)](demo/tracking_employee_attendance.mp4)

### 4. Unhappy Case 1 — Wrong Production Line
Employee attempts to check in at an IoT camera assigned to a different production line; the system rejects the scan with a mismatch notice.

[Watch clip (`demo/handle_unexpected_productline.mp4`)](demo/handle_unexpected_productline.mp4)

### 5. Unhappy Case 2 — No Shift Assigned Today
Employee scans their face on a day with no assigned work shift; the system blocks attendance outside valid schedules.

[Watch clip (`demo/handle_unexpected_shift.mp4`)](demo/handle_unexpected_shift.mp4)
