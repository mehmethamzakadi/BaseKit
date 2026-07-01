using System.Net.Http.Json;
using System.Text.Json.Serialization;
using BaseKit.Modules.Insights.Configuration;
using Microsoft.Extensions.Options;

namespace BaseKit.Modules.Insights.Providers;

/// <summary>Google Gemini ile metin üretir (generateContent uç noktası).</summary>
public sealed class GeminiClient(HttpClient http, IOptions<InsightsOptions> options)
{
    private readonly GeminiOptions _opt = options.Value.Gemini;

    /// <summary>Verilen istemden düz metin yanıt üretir.</summary>
    public async Task<string> GenerateAsync(string prompt, CancellationToken ct)
    {
        var url = $"{_opt.BaseUrl}/v1beta/models/{_opt.Model}:generateContent?key={_opt.ApiKey}";

        // thinkingBudget=0: "düşünen" flash modellerinde düşünme adımını kapatır →
        // yanıt saniyeler içinde döner (aksi halde 30sn+ sürebilir). maxOutputTokens
        // brifingi kısa tutar.
        var body = new GeminiRequest(
            [new GeminiContent([new GeminiPart(prompt)])],
            new GeminiGenerationConfig(0.7, 256, new GeminiThinkingConfig(0)));

        using var res = await http.PostAsJsonAsync(url, body, ct);
        res.EnsureSuccessStatusCode();

        var dto = await res.Content.ReadFromJsonAsync<GeminiResponse>(ct);
        var text = dto?.Candidates?
            .FirstOrDefault()?.Content?.Parts?
            .FirstOrDefault()?.Text;

        return string.IsNullOrWhiteSpace(text)
            ? throw new InvalidOperationException("Gemini boş yanıt döndü.")
            : text.Trim();
    }

    // --- İstek ---
    private sealed record GeminiRequest(
        [property: JsonPropertyName("contents")] IReadOnlyList<GeminiContent> Contents,
        [property: JsonPropertyName("generationConfig")] GeminiGenerationConfig GenerationConfig);

    private sealed record GeminiContent(
        [property: JsonPropertyName("parts")] IReadOnlyList<GeminiPart> Parts);

    private sealed record GeminiPart(
        [property: JsonPropertyName("text")] string Text);

    private sealed record GeminiGenerationConfig(
        [property: JsonPropertyName("temperature")] double Temperature,
        [property: JsonPropertyName("maxOutputTokens")] int MaxOutputTokens,
        [property: JsonPropertyName("thinkingConfig")] GeminiThinkingConfig ThinkingConfig);

    private sealed record GeminiThinkingConfig(
        [property: JsonPropertyName("thinkingBudget")] int ThinkingBudget);

    // --- Yanıt ---
    private sealed record GeminiResponse(
        [property: JsonPropertyName("candidates")] IReadOnlyList<GeminiCandidate>? Candidates);

    private sealed record GeminiCandidate(
        [property: JsonPropertyName("content")] GeminiContent? Content);
}
