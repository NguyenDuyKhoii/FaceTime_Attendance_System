using FluentValidation;
using Hrms.Application.Features.Departments.Commands;

namespace Hrms.Application.Features.Departments.Commands
{
    /// <summary>
    /// Validator cho CreateDepartmentCommand
    /// </summary>
    public class CreateDepartmentCommandValidator : AbstractValidator<CreateDepartmentCommand>
    {
        public CreateDepartmentCommandValidator()
        {
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
