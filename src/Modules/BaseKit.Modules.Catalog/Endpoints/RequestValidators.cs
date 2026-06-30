using FastEndpoints;
using FluentValidation;

namespace BaseKit.Modules.Catalog.Endpoints;

// FastEndpoints, Validator<TRequest> sınıflarını otomatik keşfeder. Doğrulama
// hataları RFC7807 ProblemDetails (400) olarak döner.

public sealed class CreateProductRequestValidator : Validator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Ürün adı zorunlu.")
            .MaximumLength(200).WithMessage("Ürün adı en fazla 200 karakter olabilir.");
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).WithMessage("Fiyat negatif olamaz.");
    }
}

public sealed class UpdateProductRequestValidator : Validator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Ürün adı zorunlu.")
            .MaximumLength(200).WithMessage("Ürün adı en fazla 200 karakter olabilir.");
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).WithMessage("Fiyat negatif olamaz.");
    }
}
