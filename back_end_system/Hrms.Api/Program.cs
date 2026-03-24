using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Hrms.Application.DependencyInjection;
using Hrms.Infrastructure.DependencyInjection;
using Hrms.Infrastructure.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ========== CONFIGURATION ==========
var configuration = builder.Configuration;

// ========== DEPENDENCY INJECTION ==========
// Đăng ký tất cả services từ các layers
builder.Services.AddInfrastructureServices(configuration);  // Database, Repositories
builder.Services.AddApplicationServices();                  // MediatR, FluentValidation, Application Services

// ========== API SERVICES ==========
// Controllers
builder.Services.AddControllers();

// SignalR & Caching cho Dashboard
builder.Services.AddSignalR();
builder.Services.AddMemoryCache();

// CORS Configuration - Cho phép ESP32-CAM và Mobile app gọi API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// JWT Authentication
var jwtSettings = configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyForJWTTokenGeneration-Minimum32Characters!";
var issuer = jwtSettings["Issuer"] ?? "Hrms.FaceAttendance";
var audience = jwtSettings["Audience"] ?? "Hrms.FaceAttendance";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Hỗ trợ debug lỗi JWT
    options.IncludeErrorDetails = true;
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.FromMinutes(5), // Cho phép sai lệch thời gian 5 phút
        RoleClaimType = ClaimTypes.Role,     // Đảm bảo mapping Role đúng
        NameClaimType = ClaimTypes.Name      // Đảm bảo mapping Name đúng
    };
});

// Cho phép hiển thị lỗi chi tiết của JWT trong môi trường Dev
if (builder.Environment.IsDevelopment())
{
    Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;
}

builder.Services.AddAuthorization();

// Swagger Configuration
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HRMS Face Attendance API",
        Version = "v1",
        Description = "API cho hệ thống chấm công bằng nhận diện khuôn mặt"
    });

    // Thêm JWT Authentication vào Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// HttpClient đã được đăng ký trong InfrastructureDI

var app = builder.Build();

// ========== MIDDLEWARE PIPELINE ==========
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "HRMS Face Attendance API v1");
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS phải đặt trước Authentication
app.UseCors("AllowAll");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Exception handling middleware (có thể thêm sau)
// app.UseExceptionHandler();

app.MapControllers();

// Map SignalR Hub
app.MapHub<AttendanceHub>("/attendanceHub");

app.Run();
