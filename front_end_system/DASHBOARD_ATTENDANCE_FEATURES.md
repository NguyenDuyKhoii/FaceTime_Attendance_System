# Frontend Dashboard & Attendance Features - Implementation Guide

## Tổng Quan

Đã triển khai hoàn chỉnh các tính năng Dashboard và Attendance History theo hướng dẫn từ `frontend_guide.md`.

## Các Files Được Tạo/Sửa

### 1. **Type Definitions** (`src/types/api.types.ts`)

Thêm các interfaces mới:

- `TodayAttendanceDto` - Thống kê hôm nay (Today Summary)
- `DepartmentSummaryDto` - Thống kê theo phòng ban
- `ProductionLineSummaryDto` - Thống kê theo dây chuyền
- `AttendanceHistoryDto` - Một bản ghi trong lịch sử
- `AttendanceHistoryListDto` - Danh sách phân trang
- `AttendanceDetailDto` - Chi tiết bản ghi
- `AttendanceQueryParams` - Query parameters cho filter

### 2. **API Services**

#### `src/api/dashboard.api.ts`

```typescript
// Endpoints
GET / api / Dashboard / today;
GET / api / Dashboard / department - summary;
GET / api / Dashboard / production - line - summary;
```

#### `src/api/attendance.api.ts`

```typescript
// Endpoints
GET / api / attendance; // with pagination & filters
GET / api / attendance / { id }; // detail
```

### 3. **Business Logic Services**

#### `src/service/dashboard.service.ts`

- `getTodayAttendance()` - Lấy tổng quan hôm nay
- `getDepartmentSummary()` - Lấy thống kê phòng ban
- `getProductionLineSummary()` - Lấy thống kê dây chuyền

#### `src/service/attendance.service.ts`

- `getAttendanceHistory()` - Lấy lịch sử (với pagination)
- `getAttendanceDetail()` - Lấy chi tiết
- `formatTime()` - Format thời gian ISO sang HH:mm
- `formatDate()` - Format ngày ISO sang dd/mm/yyyy
- `getStatusColor()` - Trả về màu sắc dựa trên status
- `getStatusLabel()` - Dịch status sang tiếng Việt

### 4. **Real-time Service**

#### `src/service/signalr.service.ts`

- Quản lý kết nối WebSocket tới `/attendanceHub`
- Lắng nghe sự kiện `AttendanceUpdated`
- Tự động reconnect khi mất kết nối
- Subscribe pattern cho listeners

### 5. **Screens**

#### `src/screens/DashboardScreen.tsx`

**Purpose**: Hiển thị tổng quan chấm công hôm nay + thống kê theo phòng ban & dây chuyền

**Features**:

- Today Summary Card (Tổng, Có mặt, Đi muộn, Vắng mặt)
- Attendance Rate Progress Bar
- Department Summary Section
- Production Line Summary Section
- Pull-to-refresh
- Real-time updates qua SignalR

**Layout Components**:

- `StatBox` - Hiển thị 1 metric (biểu tượng + nhãn + giá trị)
- `DepartmentCard` - Card thống kê phòng ban
- `ProductionLineCard` - Card thống kê dây chuyền
- `MiniStat` - Thống kê mini (tổng/có mặt/đi muộn)

---

#### `src/screens/AttendanceHistoryScreen.tsx`

**Purpose**: Danh sách lịch sử chấm công với pagination & filter

**Features**:

- Search by employee name
- Filter by status (Present, Late, Absent, ExceptionPending)
- Infinite pagination (load more on scroll)
- Refresh control
- Tap row to view detail

**Components**:

- `AttendanceHistoryItem` - Một item trong danh sách
  - Status badge (đầu)
  - Employee name + department + check-in time (giữa)
  - Status label (phải)

---

#### `src/screens/AttendanceDetailScreen.tsx`

**Purpose**: Chi tiết một bản ghi chấm công

**Features**:

- Status header (Present/Late/Absent/ExceptionPending)
- Employee info section
- Check-in/out times
- Total hours worked
- Late minutes
- Source (Face Recognition / IoT / Manual)
- Confidence score (nếu có)

**Components**:

- `InfoSection` - Nhóm thông tin
- `InfoRow` - Một hàng thông tin (nhãn + giá trị)

---

### 6. **Navigation Updates**

#### `src/types/navigation.types.ts`

Thêm 3 routes mới:

```typescript
Dashboard: undefined
AttendanceHistory: { employeeId?, departmentId?, productionLineId?, fromDate?, toDate? }
AttendanceDetail: { recordId: string }
```

#### `src/navigation/AppNavigator.tsx`

- Thêm 3 screens mới vào Stack Navigator
- Import các screens mới

#### `src/screens/index.ts`

- Export 3 screens mới

### 7. **Home Screen Updates**

#### `src/screens/HomeScreen.tsx`

**Thêm 2 primary action cards**:

1. **Dashboard** (tím/xanh) - Dẫn đến dashboard analytics
2. **Employees** (xanh nhạt) - Dẫn đến employee list

**System section buttons**:

1. **History** (xanh lá) - Attendance history
2. **Check-in** (tím) - Face recognition
3. **IoT** (xanh đen) - IoT devices
4. **Logout** (đỏ) - Sign out

### 8. **Dependencies**

#### `package.json`

Thêm:

```json
"@microsoft/signalr": "^8.0.0"
```

## API Endpoints Reference

### Dashboard APIs

```
GET /api/Dashboard/today
  Query: Không có
  Response: TodayAttendanceDto
  Quyền: Admin, HR, Manager
  Cache: 30s

GET /api/Dashboard/department-summary
  Query: Không có
  Response: List<DepartmentSummaryDto>
  Quyền: Admin, HR

GET /api/Dashboard/production-line-summary
  Query: Không có
  Response: List<ProductionLineSummaryDto>
  Quyền: Admin, HR
```

### Attendance APIs

```
GET /api/attendance
  Query:
    - employeeId (Guid, optional)
    - departmentId (int, optional)
    - productionLineId (int, optional)
    - fromDate (DateTime, optional)
    - toDate (DateTime, optional)
    - pageNumber (int, default=1)
    - pageSize (int, default=20)
  Response: AttendanceHistoryListDto
  Quyền: Admin, HR, Manager

GET /api/attendance/{id}
  Query: Không có
  Response: AttendanceDetailDto
  Quyền: Admin, HR, Manager
```

### SignalR Hub

```
Hub URL: /attendanceHub
Event: AttendanceUpdated
  Triggered: Khi có check-in mới
  Action: Dashboard tự động refetch dữ liệu
```

## Usage Examples

### 1. Xem Dashboard

```
Home → Dashboard
  ↓
Hiển thị:
- Today's attendance summary
- Department attendance breakdown
- Production line attendance breakdown
- Real-time updates qua SignalR
- Pull to refresh
```

### 2. Xem Lịch sử Chấm công

```
Home → Attendance History
  ↓
- Tìm kiếm theo tên nhân viên
- Lọc theo status (Present/Late/Absent/ExceptionPending)
- Pagination automatic (scroll to load more)
- Tap row → Xem detail
```

### 3. Xem Chi tiết Bản ghi

```
Attendance History → Tap row
  ↓
Hiển thị:
- Employee name
- Work date
- Check-in/out times
- Total hours
- Late minutes
- Nguồn (Face Recognition/IoT/Manual)
- Confidence score
```

## Status & Colors

| Status           | Color            | Dịch      |
| ---------------- | ---------------- | --------- |
| Present          | #10B981 (Green)  | Có mặt    |
| Late             | #F59E0B (Amber)  | Đi muộn   |
| Absent           | #EF4444 (Red)    | Vắng mặt  |
| ExceptionPending | #8B5CF6 (Purple) | Chờ xử lý |

## Real-time Updates (SignalR)

**Flow**:

1. DashboardScreen mount → kết nối SignalR
2. Backend check-in event → gửi sự kiện `AttendanceUpdated`
3. DashboardScreen nhận event → refetch dữ liệu
4. UI tự động update

**Fallback**: Nếu SignalR không work, dùng pull-to-refresh

## Permissions

| Feature            | Admin | HR  | Manager | Employee |
| ------------------ | ----- | --- | ------- | -------- |
| Dashboard          | ✅    | ✅  | ✅      | ❌       |
| Attendance History | ✅    | ✅  | ✅      | ❌       |
| Attendance Detail  | ✅    | ✅  | ✅      | ❌       |

**Note**: Manager chỉ xem được data của phòng ban/dây chuyền mình (server filter)

## Pagination

**AttendanceHistoryScreen**:

- Default: pageSize=20
- Infinite scroll: Load more khi scroll đến cuối
- Hiển thị: "Trang X • Tổng: Y"

## Notes

1. **SignalR**: Có thể cần enable WebSocket trên server
2. **Performance**: Dashboard cache 30s server-side
3. **Responsive**: Tất cả screens responsive với safe area
4. **Animations**: FadeInUp/FadeInDown animations cho smooth UX
5. **Error Handling**: Tất cả API calls có try-catch
