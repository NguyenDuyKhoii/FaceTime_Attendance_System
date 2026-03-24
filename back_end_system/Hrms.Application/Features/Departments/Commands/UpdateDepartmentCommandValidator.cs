using FluentValidation;
using Hrms.Application.Features.Departments.Commands;

namespace Hrms.Application.Features.Departments.Commands
{
    /// <summary>
    /// Validator cho UpdateDepartmentCommand
    /// </summary>
    public class UpdateDepartmentCommandValidator : AbstractValidator<UpdateDepartmentCommand>
    {
        public UpdateDepartmentCommandValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Id phòng ban không hợp lệ");

            RuleFor(x => x.DepartmentCode)
                .NotEmpty().WithMessage("Mã phòng ban không được để trống")
                .MaximumLength(50).WithMessage("Mã phòng ban không được quá 50 ký tự");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên phòng ban không được để trống")
                .MaximumLength(200).WithMessage("Tên phòng ban không được quá 200 ký tự");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Mô tả không được quá 500 ký tự")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }
    }
}
