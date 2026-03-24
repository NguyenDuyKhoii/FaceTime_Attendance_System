using FluentValidation;
using MediatR;

/// <summary>
/// Behavior for validating MediatR requests using FluentValidation.
/// </summary>
namespace Hrms.Application.Common.Behavior
{
    /// <summary>
    /// A MediatR pipeline behavior that validates requests using FluentValidation.
    /// </summary>
    public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
  where TRequest : IRequest<TResponse> // Đảm bảo chỉ áp dụng cho MediatR Request
    {
        // Tất cả các validator cho TRequest sẽ được inject vào đây
        private readonly IEnumerable<IValidator<TRequest>> _validators;

        // MediatR sẽ tự động inject tất cả các IValidator<TRequest> đã đăng ký
        public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        {
            _validators = validators;
        }

        public async Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken, RequestHandlerDelegate<TResponse> next)
        {

            if (_validators.Any())
            {
                var context = new ValidationContext<TRequest>(request);

                // Chạy tất cả các validator không đồng bộ
                var validationResults = await Task.WhenAll(
                    _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

                var failures = validationResults
                    .Where(r => r.Errors.Any())
                    .SelectMany(r => r.Errors)
                    .ToList();

                if (failures.Any())
                {
                    // Ném ngoại lệ khi có lỗi validation (ví dụ: ValidationException)
                    // Bạn có thể custom exception này để API layer dễ dàng bắt lỗi.
                    throw new FluentValidation.ValidationException(failures);
                }
            }

            // Nếu validation thành công, chuyển control cho Behavior tiếp theo hoặc Handler chính
            return await next();
        }
    }
}
