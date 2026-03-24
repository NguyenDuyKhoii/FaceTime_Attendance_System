using System.Reflection;
using FluentValidation;
using MediatR;
using Hrms.Application.Common.Behavior;
using Hrms.Application.Features.Attendance.Commands;
using Microsoft.Extensions.DependencyInjection;

namespace Hrms.Application.DependencyInjection
{
    /// <summary>
    /// Class đăng ký tất cả services của Application layer
    /// </summary>
    public static class ApplicationDI
    {
        /// <summary>
        /// Đăng ký tất cả services của Application layer
        /// </summary>
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Lấy assembly của Application layer từ một handler cụ thể
            var applicationAssembly = typeof(CheckInCommandHandler).Assembly;

            // ========== MEDIATR CONFIGURATION ==========
            // Đăng ký MediatR (v8 + MediatR.Extensions.Microsoft.DependencyInjection)
            services.AddMediatR(applicationAssembly);

            // Đăng ký pipeline behavior cho MediatR
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

            // ========== FLUENT VALIDATION ==========
            // Đăng ký FluentValidation (cần FluentValidation.DependencyInjectionExtensions)
            services.AddValidatorsFromAssembly(applicationAssembly!);

            // ========== AUTOMAPPER ==========
            services.AddAutoMapper(applicationAssembly);

            // ========== APPLICATION SERVICES ==========
            // Đăng ký JWT Service
            services.AddScoped<Common.Services.IJwtService, Common.Services.JwtService>();

            return services;
        }
    }
}
