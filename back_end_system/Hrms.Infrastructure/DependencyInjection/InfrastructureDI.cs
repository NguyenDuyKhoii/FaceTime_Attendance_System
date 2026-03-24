using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Hrms.Application.Interface;
using Hrms.Infrastructure.Data;
using Hrms.Infrastructure.Repositories;

namespace Hrms.Infrastructure.DependencyInjection
{
    /// <summary>
    /// Class đăng ký tất cả services của Infrastructure layer
    /// </summary>
    public static class InfrastructureDI
    {
        /// <summary>
        /// Đăng ký tất cả services của Infrastructure layer
        /// </summary>
        public static IServiceCollection AddInfrastructureServices(
            this IServiceCollection services, 
            IConfiguration configuration)
        {
            // ========== DATABASE CONFIGURATION ==========
            // Đăng ký DbContext với SQL Server
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(connectionString));

            // ========== REPOSITORIES ==========
            // Đăng ký tất cả repositories (Repository Pattern - không dùng UnitOfWork)
            services.AddScoped<IEmployeeRepository, EmployeeRepository>();
            services.AddScoped<IUserAccountRepository, UserAccountRepository>();
            services.AddScoped<IRoleRepository, RoleRepository>();
            services.AddScoped<IDepartmentRepository, DepartmentRepository>();
            services.AddScoped<IShiftRepository, ShiftRepository>();
            services.AddScoped<IShiftAssignmentRepository, ShiftAssignmentRepository>();
            services.AddScoped<IFaceTemplateRepository, FaceTemplateRepository>();
            services.AddScoped<IAttendanceRecordRepository, AttendanceRecordRepository>();
            services.AddScoped<IAttendanceSummaryRepository, AttendanceSummaryRepository>();
            services.AddScoped<IIoTDeviceRepository, IoTDeviceRepository>();
            services.AddScoped<IProductionLineRepository, ProductionLineRepository>();
            services.AddScoped<IManagementRepository, ManagementRepository>();
            services.AddScoped<ISystemLogRepository, SystemLogRepository>();
            services.AddScoped<IAttendanceDeviceLogRepository, AttendanceDeviceLogRepository>();

            // ========== SERVICES ==========
            // Đăng ký HttpClient
            services.AddHttpClient();
            
            // Cấu hình named client cho Python AI Service
            services.AddHttpClient("PythonAIService", client =>
            {
                var baseUrl = configuration["PythonAIService:BaseUrl"] ?? "http://localhost:8000";
                if (!baseUrl.EndsWith("/")) baseUrl += "/";
                client.BaseAddress = new Uri(baseUrl);
                
                var timeoutSeconds = configuration.GetValue<int>("PythonAIService:TimeoutSeconds", 30);
                client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
                
                client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            });

            // Đăng ký PythonAIService
            services.AddScoped<IPythonAIService, Services.PythonAIService>();

            // Đăng ký SignalR Service cho real-time updates
            services.AddScoped<IAttendanceHubService, Services.AttendanceHubService>();

            return services;
        }
    }
}
