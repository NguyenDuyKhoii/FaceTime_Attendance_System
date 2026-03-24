using Hrms.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Data
{
    /// <summary>
    /// DbContext chính của ứng dụng - quản lý tất cả entities
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // ========== MODULE 1: Authentication & Authorization ==========
        public DbSet<UserAccount> UserAccounts { get; set; } = null!;
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<SystemLog> SystemLogs { get; set; } = null!;

        // ========== MODULE 2: Employee Management ==========
        public DbSet<Employee> Employees { get; set; } = null!;
        public DbSet<Department> Departments { get; set; } = null!;
        public DbSet<FaceTemplate> FaceTemplates { get; set; } = null!;
        public DbSet<Management> Managements { get; set; } = null!;
        public DbSet<ProductionLine> ProductionLines { get; set; } = null!;

        // ========== MODULE 4: Attendance Processing ==========
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; } = null!;
        public DbSet<AttendanceSummary> AttendanceSummaries { get; set; } = null!;
        public DbSet<AttendanceDeviceLog> AttendanceDeviceLogs { get; set; } = null!;

        // ========== MODULE 5: IoT Device Management ==========
        public DbSet<IoTDevice> IoTDevices { get; set; } = null!;

        // ========== MODULE 6: Shift & Assignment Management ==========
        public DbSet<Shift> Shifts { get; set; } = null!;
        public DbSet<ShiftAssignment> ShiftAssignments { get; set; } = null!;

        // ========== MODULE 8: System Configuration ==========
        public DbSet<SystemSetting> SystemSettings { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ========== CẤU HÌNH RELATIONSHIPS ==========

            // UserAccount - Role (Many-to-One) - Theo ERD: Users có RoleId (FK)
            modelBuilder.Entity<UserAccount>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Employee - Department (Many-to-One)
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Employee - FaceTemplate (One-to-One) - EmployeeId là PK
            modelBuilder.Entity<FaceTemplate>()
                .HasKey(ft => ft.EmployeeId);

            modelBuilder.Entity<FaceTemplate>()
                .HasOne(ft => ft.Employee)
                .WithOne(e => e.FaceTemplate)
                .HasForeignKey<FaceTemplate>(ft => ft.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Employee - ShiftAssignment (One-to-Many)
            modelBuilder.Entity<ShiftAssignment>()
                .HasOne(sa => sa.Employee)
                .WithMany(e => e.ShiftAssignments)
                .HasForeignKey(sa => sa.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ShiftAssignment>()
                .HasOne(sa => sa.Shift)
                .WithMany(s => s.ShiftAssignments)
                .HasForeignKey(sa => sa.ShiftId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ShiftAssignment>()
                .HasOne(sa => sa.ProductionLine)
                .WithMany()
                .HasForeignKey(sa => sa.ProductionLineId)
                .OnDelete(DeleteBehavior.SetNull);

            // Employee - AttendanceRecord (One-to-Many)
            modelBuilder.Entity<AttendanceRecord>()
                .HasOne(ar => ar.Employee)
                .WithMany(e => e.AttendanceRecords)
                .HasForeignKey(ar => ar.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AttendanceRecord>()
                .HasOne(ar => ar.Shift)
                .WithMany()
                .HasForeignKey(ar => ar.ShiftId)
                .OnDelete(DeleteBehavior.SetNull);

            // Employee - AttendanceSummary (One-to-Many)
            modelBuilder.Entity<AttendanceSummary>()
                .HasOne(asum => asum.Employee)
                .WithMany(e => e.AttendanceSummaries)
                .HasForeignKey(asum => asum.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AttendanceSummary>()
                .HasOne(asum => asum.Shift)
                .WithMany()
                .HasForeignKey(asum => asum.ShiftId)
                .OnDelete(DeleteBehavior.SetNull);

            // ProductionLine - Department (Many-to-One)
            modelBuilder.Entity<ProductionLine>()
                .HasOne(pl => pl.Department)
                .WithMany(d => d.ProductionLines)
                .HasForeignKey(pl => pl.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // IoTDevice - ProductionLine (Many-to-One)
            modelBuilder.Entity<IoTDevice>()
                .HasOne(d => d.ProductionLine)
                .WithMany(pl => pl.IoTDevices)
                .HasForeignKey(d => d.LineId)
                .OnDelete(DeleteBehavior.SetNull);

            // IoTDevice - AttendanceDeviceLog (One-to-Many)
            modelBuilder.Entity<AttendanceDeviceLog>()
                .HasOne(adl => adl.Device)
                .WithMany(d => d.DeviceLogs)
                .HasForeignKey(adl => adl.DeviceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AttendanceDeviceLog>()
                .HasOne(adl => adl.Employee)
                .WithMany()
                .HasForeignKey(adl => adl.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);

            // UserAccount - SystemLog (One-to-Many)
            modelBuilder.Entity<SystemLog>()
                .HasOne(sl => sl.UserAccount)
                .WithMany(u => u.SystemLogs)
                .HasForeignKey(sl => sl.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Management - UserAccount (Many-to-One) - User quản lý
            modelBuilder.Entity<Management>()
                .HasOne(m => m.UserAccount)
                .WithMany(u => u.ManagementAssignments)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Management - Department (Many-to-One)
            modelBuilder.Entity<Management>()
                .HasOne(m => m.Department)
                .WithMany(d => d.ManagementAssignments)
                .HasForeignKey(m => m.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Management - UserAccount (CreatedBy)
            modelBuilder.Entity<Management>()
                .HasOne(m => m.CreatedByUser)
                .WithMany(u => u.CreatedManagements)
                .HasForeignKey(m => m.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Management - UserAccount (UpdatedBy)
            modelBuilder.Entity<Management>()
                .HasOne(m => m.UpdatedByUser)
                .WithMany(u => u.UpdatedManagements)
                .HasForeignKey(m => m.UpdatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // ========== CẤU HÌNH INDEXES ==========
            
            // Unique constraints
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.EmployeeCode)
                .IsUnique();

            modelBuilder.Entity<UserAccount>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.RoleName)
                .IsUnique();

            modelBuilder.Entity<Department>()
                .HasIndex(d => d.DepartmentCode)
                .IsUnique();

            modelBuilder.Entity<Shift>()
                .HasIndex(s => s.ShiftCode)
                .IsUnique();

            modelBuilder.Entity<SystemSetting>()
                .HasIndex(s => s.Key)
                .IsUnique();

            // Composite indexes for performance
            modelBuilder.Entity<AttendanceRecord>()
                .HasIndex(ar => new { ar.EmployeeId, ar.WorkDate });

            modelBuilder.Entity<AttendanceSummary>()
                .HasIndex(asum => new { asum.EmployeeId, asum.RecordDate })
                .IsUnique();

            modelBuilder.Entity<ShiftAssignment>()
                .HasIndex(sa => new { sa.EmployeeId, sa.ShiftId, sa.FromDate });
        }
    }
}
