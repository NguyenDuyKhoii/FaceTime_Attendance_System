# HRMS Face Attendance System - Backend API

Hệ thống chấm công bằng nhận diện khuôn mặt sử dụng ESP32-CAM và Python AI Service.

## 📋 Tổng Quan

Hệ thống được xây dựng theo kiến trúc Clean Architecture với các layer:
- **Hrms.Api**: API Controllers, Middleware, Configuration
- **Hrms.Application**: Business Logic, Commands/Queries (MediatR), DTOs, Services
- **Hrms.Domain**: Entities, Enums
- **Hrms.Infrastructure**: DbContext, Repositories, External Services

## 🏗️ Các Module Đã Implement

### ✅ Module 1: Authentication & Authorization
- **JWT Authentication**: Login/Logout với JWT tokens
- **Role-Based Access Control (RBAC)**: Admin, HR, Manager, Employee
- **Endpoints**:
  - `POST /api/auth/login` - Đăng nhập
  - `POST /api/auth/logout` - Đăng xuất
  - `GET /api/auth/me` - Lấy thông tin user hiện tại

### ✅ Module 2: Employee Management
- **CRUD Employee**: Tạo, đọc, cập nhật, xóa nhân viên
- **Face Template Management**: Upload và lưu trữ face embedding vectors
- **Department Management**: Quản lý phòng ban
- **Endpoints**:
  - `GET /api/employees` - Lấy danh sách employees
  - `POST /api/employees` - Tạo employee mới
  - `POST /api/employees/{id}/face-template` - Upload face template

### ✅ Module 3: Face Recognition Integration ⭐ CORE
- **Nhận ảnh từ ESP32-CAM**: API nhận base64 image
- **Gọi Python AI Service**: Gửi ảnh đến Python service để nhận diện
- **So sánh với Database**: Tìm employee match với confidence score
- **Lưu Device Logs**: Lưu lịch sử nhận diện
- **Endpoints**:
  - `POST /api/face-recognition/process` - Xử lý nhận diện khuôn mặt (AllowAnonymous)
  - `GET /api/face-recognition/results` - Lịch sử nhận diện

### ✅ Module 4: Attendance Processing ⭐ CORE
- **Check-in Logic**: 
  - Tìm shift hiện tại của employee
  - Tính toán Late minutes
  - Tạo AttendanceRecord
  - Cập nhật AttendanceSummary
- **Check-out Logic**:
  - Tính toán TotalHours (trừ break time)
  - Tính EarlyLeaveMinutes
  - Cập nhật AttendanceRecord và Summary
- **Endpoints**:
  - `POST /api/attendance/checkin` - Check-in (AllowAnonymous)
  - `POST /api/attendance/checkout` - Check-out (AllowAnonymous)
  - `GET /api/attendance/today/{employeeId}` - Xem attendance hôm nay
  - `GET /api/attendance/records` - Lịch sử attendance

### ✅ Module 5: IoT Device Management
- **Device Registration**: Đăng ký ESP32-CAM devices
- **Heartbeat Monitoring**: ESP32 gửi heartbeat để báo online/offline
- **Device Status Tracking**: Quản lý trạng thái devices
- **Endpoints**:
  - `POST /api/iot-devices/register` - Đăng ký device
  - `POST /api/iot-devices/{deviceId}/heartbeat` - Cập nhật heartbeat (AllowAnonymous)
  - `GET /api/iot-devices` - Danh sách devices

### ✅ Module 6: Shift & Assignment Management
- **CRUD Shifts**: Tạo, quản lý ca làm việc
- **Shift Assignment**: Gán shift cho employees
- **Endpoints**:
  - `POST /api/shifts` - Tạo shift mới
  - `POST /api/shifts/assign` - Gán shift cho employee
  - `GET /api/shifts` - Danh sách shifts

### ⏳ Module 7: Reporting & Analytics (TODO)
- Consolidated Attendance Sheets
- Detailed Attendance Records
- Line-specific Statistics
- Payroll Export

### ⏳ Module 8: System Configuration & Monitoring (TODO)
- System Logs viewing
- System Alerts
- Configuration management

## 🗄️ Database Schema

### Core Tables:
- **UserAccounts**: Tài khoản người dùng
- **Roles & UserRoles**: Phân quyền
- **Employees**: Thông tin nhân viên
- **FaceTemplates**: Face embedding vectors
- **Shifts**: Ca làm việc
- **ShiftAssignments**: Gán shift cho employees
- **AttendanceRecords**: Chi tiết check-in/check-out
- **AttendanceSummaries**: Tổng hợp attendance theo ngày
- **IoTDevices**: Quản lý ESP32-CAM devices
- **AttendanceDeviceLogs**: Log từ devices
- **SystemLogs**: Audit trail
- **Departments**: Phòng ban
- **SystemSettings**: Cấu hình hệ thống

## 🔧 Cấu Hình

### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=HrmsFaceAttendanceDb;..."
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKey...",
    "Issuer": "Hrms.FaceAttendance",
    "Audience": "Hrms.FaceAttendance",
    "ExpirationInMinutes": 1440
  },
  "PythonAIService": {
    "BaseUrl": "http://localhost:5000",
    "TimeoutSeconds": 30
  }
}
```

## 🚀 Setup & Run

### 1. Restore Packages
```bash
dotnet restore
```

### 2. Tạo Database Migration
```bash
cd Hrms.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../Hrms.Api
dotnet ef database update --startup-project ../Hrms.Api
```

### 3. Chạy Application
```bash
cd Hrms.Api
dotnet run
```

### 4. Truy cập Swagger UI
- URL: `https://localhost:7253/swagger` hoặc `http://localhost:5028/swagger`

## 📡 Luồng Xử Lý Chính

### Flow 1: Face Check-in/Check-out
```
1. ESP32-CAM capture ảnh
   ↓
2. POST /api/face-recognition/process
   - Backend gửi ảnh đến Python AI Service
   - Python trả về embedding vector
   - Backend so sánh với database
   ↓
3. POST /api/attendance/checkin (nếu nhận diện thành công)
   - Tìm shift hiện tại
   - Tính Late minutes
   - Lưu AttendanceRecord
   ↓
4. Trả về kết quả cho ESP32-CAM
   - Success: "Check-in: 08:00 AM"
   - Failed: "Face not recognized"
```

### Flow 2: Upload Face Template
```
1. Admin/HR upload ảnh nhân viên
   ↓
2. POST /api/employees/{id}/face-template
   - Backend gửi ảnh đến Python AI Service
   - Python trả về embedding vector
   - Backend lưu vào FaceTemplates table
```

## 🔐 Authentication

### Login Request
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "password123"
}
```

### Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-01-25T10:00:00Z",
  "user": {
    "id": "guid",
    "username": "admin",
    "fullName": "Admin User",
    "roles": ["Admin"],
    "employeeId": null
  }
}
```

### Sử dụng Token
Thêm header: `Authorization: Bearer {token}`

## 📝 API Examples

### 1. Tạo Employee
```json
POST /api/employees
Authorization: Bearer {token}
{
  "employeeCode": "EMP001",
  "fullName": "Nguyễn Văn A",
  "dateOfBirth": "1990-01-01",
  "phoneNumber": "0123456789",
  "email": "nguyenvana@example.com",
  "departmentId": "guid",
  "hireDate": "2024-01-01"
}
```

### 2. Upload Face Template
```json
POST /api/employees/{employeeId}/face-template
Authorization: Bearer {token}
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### 3. Face Recognition (từ ESP32-CAM)
```json
POST /api/face-recognition/process
{
  "imageBase64": "data:image/jpeg;base64,...",
  "deviceId": "ESP32-CAM-001",
  "capturedAt": "2026-01-24T08:00:00Z"
}
```

### 4. Check-in
```json
POST /api/attendance/checkin
{
  "employeeId": "guid",
  "deviceId": "ESP32-CAM-001",
  "checkInTime": "2026-01-24T08:00:00Z"
}
```

## 🛠️ Tech Stack

- **.NET 8.0**: Backend framework
- **Entity Framework Core 8.0**: ORM
- **SQL Server**: Database
- **MediatR**: CQRS pattern
- **FluentValidation**: Input validation
- **JWT Bearer**: Authentication
- **Swagger/OpenAPI**: API documentation
- **BCrypt**: Password hashing

## 📦 Dependencies

### Hrms.Api
- MediatR
- Microsoft.AspNetCore.Authentication.JwtBearer
- Swashbuckle.AspNetCore
- BCrypt.Net-Next

### Hrms.Application
- MediatR
- FluentValidation
- AutoMapper
- Microsoft.EntityFrameworkCore
- System.IdentityModel.Tokens.Jwt
- BCrypt.Net-Next

### Hrms.Infrastructure
- Microsoft.EntityFrameworkCore.SqlServer
- Microsoft.EntityFrameworkCore.Tools

## 🔄 Integration với Python AI Service

Backend gọi Python AI Service qua HTTP:
- **Endpoint**: `/api/face-recognition/encode` (upload face template)
- **Endpoint**: `/api/face-recognition/recognize` (nhận diện)

**Request Format**:
```json
{
  "image_base64": "data:image/jpeg;base64,..."
}
```

**Response Format**:
```json
{
  "embedding": [0.123, 0.456, ...], // Array of floats
  "quality_score": 0.95
}
```

## 📌 Notes

1. **Face Recognition Threshold**: Confidence score >= 0.7 để match employee
2. **Late Minutes**: Tính từ shift start time
3. **Total Hours**: Trừ break duration nếu có
4. **Device Heartbeat**: ESP32-CAM nên gọi `/api/iot-devices/{deviceId}/heartbeat` mỗi 30 giây
5. **CORS**: Đã cấu hình AllowAll cho development (nên restrict trong production)

## 🐛 Troubleshooting

### Database Connection Error
- Kiểm tra connection string trong `appsettings.json`
- Đảm bảo SQL Server đang chạy

### Python AI Service Error
- Kiểm tra Python service đang chạy tại URL trong config
- Kiểm tra network connectivity

### JWT Token Invalid
- Kiểm tra SecretKey trong `appsettings.json`
- Đảm bảo token chưa hết hạn

## 📚 Next Steps

1. Implement Module 7: Reporting & Analytics
2. Implement Module 8: System Configuration
3. Add Unit Tests
4. Add Integration Tests
5. Setup CI/CD Pipeline
6. Deploy to Production

## 👥 Roles

- **Admin**: Full access
- **HR**: Employee management, Attendance management
- **Manager**: View department attendance
- **Employee**: View own attendance

---

**Developed with ❤️ for HRMS Face Attendance System**
