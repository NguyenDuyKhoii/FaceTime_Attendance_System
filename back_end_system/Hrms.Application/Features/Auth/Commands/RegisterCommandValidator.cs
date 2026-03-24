using FluentValidation;
using Hrms.Application.Features.Auth.Commands;

namespace Hrms.Application.Features.Auth.Commands
{
    /// <summary>
    /// Validator cho RegisterCommand - validate input trước khi xử lý
    /// </summary>
    public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
    {
        public RegisterCommandValidator()
        {
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Username không được để trống")
                .MinimumLength(3).WithMessage("Username phải có ít nhất 3 ký tự")
                .MaximumLength(50).WithMessage("Username không được quá 50 ký tự")
                .Matches("^[a-zA-Z0-9_]+$").WithMessage("Username chỉ được chứa chữ cái, số và dấu gạch dưới");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password không được để trống")
                .MinimumLength(6).WithMessage("Password phải có ít nhất 6 ký tự")
                .MaximumLength(100).WithMessage("Password không được quá 100 ký tự");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().WithMessage("Xác nhận mật khẩu không được để trống")
                .Equal(x => x.Password).WithMessage("Mật khẩu xác nhận không khớp");

            RuleFor(x => x.RoleId)
                .NotEmpty().WithMessage("RoleId không được để trống");
        }
    }
}
