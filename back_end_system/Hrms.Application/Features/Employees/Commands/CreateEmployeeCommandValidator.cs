using FluentValidation;
using Hrms.Application.Features.Employees.Commands;

namespace Hrms.Application.Features.Employees.Commands
{
    public class CreateEmployeeCommandValidator : AbstractValidator<CreateEmployeeCommand>
    {
        public CreateEmployeeCommandValidator()
        {
            RuleFor(x => x.EmployeeCode)
                .NotEmpty().WithMessage("Mã nhân viên không được để trống")
                .MaximumLength(50).WithMessage("Mã nhân viên không được quá 50 ký tự");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Họ tên không được để trống")
                .MaximumLength(200).WithMessage("Họ tên không được quá 200 ký tự");

            RuleFor(x => x.DateOfBirth)
                .NotEmpty().WithMessage("Ngày sinh không được để trống")
                .LessThan(DateTime.Now).WithMessage("Ngày sinh phải nhỏ hơn ngày hiện tại");

            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("Email không hợp lệ")
                .When(x => !string.IsNullOrEmpty(x.Email));

            RuleFor(x => x.HireDate)
                .NotEmpty().WithMessage("Ngày vào làm không được để trống");
        }
    }
}
