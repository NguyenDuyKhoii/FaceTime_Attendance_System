using FluentValidation;
using Hrms.Application.Features.Auth.Commands;

namespace Hrms.Application.Features.Auth.Commands
{
    /// <summary>
    /// Validator cho LoginCommand - validate input trước khi xử lý
    /// </summary>
    public class LoginCommandValidator : AbstractValidator<LoginCommand>
    {
        public LoginCommandValidator()
        {
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Username không được để trống")
                .MinimumLength(3).WithMessage("Username phải có ít nhất 3 ký tự");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password không được để trống")
                .MinimumLength(6).WithMessage("Password phải có ít nhất 6 ký tự");
        }
    }
}
