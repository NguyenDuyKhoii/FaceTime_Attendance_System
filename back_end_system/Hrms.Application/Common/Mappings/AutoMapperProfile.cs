using AutoMapper;
using Hrms.Application.DTOs;
using Hrms.Application.Features.Employees.Commands;
using Hrms.Domain.Entities;

namespace Hrms.Application.Common.Mappings
{
    /// <summary>
    /// Cấu hình AutoMapper: Entity ↔ DTO, Command → Entity
    /// </summary>
    public class AutoMapperProfile : Profile
    {
        public AutoMapperProfile()
        {
            // Employee
            CreateMap<Employee, EmployeeDTO>();
            CreateMap<UpdateEmployeeCommand, Employee>()
                .ForMember(e => e.CreatedAt, opt => opt.Ignore())
                .ForMember(e => e.UpdatedAt, opt => opt.Ignore())
                .ForMember(e => e.IdentityNumber, opt => opt.Ignore())
                .ForMember(e => e.Department, opt => opt.Ignore())
                .ForMember(e => e.ShiftAssignments, opt => opt.Ignore())
                .ForMember(e => e.AttendanceRecords, opt => opt.Ignore())
                .ForMember(e => e.AttendanceSummaries, opt => opt.Ignore())
                .ForMember(e => e.FaceTemplate, opt => opt.Ignore());

            // Department
            CreateMap<Department, DepartmentDTO>();
        }
    }
}
