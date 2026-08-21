package autonomy

import (
	"strings"

	"github.com/agbofa/nexus/libs/go/pkg/llm"
)

// RouteStrategy is a catalog comparison, not a live provider call.
func RouteStrategy(mode string, registry *llm.Registry) map[string]any {
	mode = strings.ToUpper(strings.TrimSpace(mode))
	if mode == "" {
		mode = "BALANCED"
	}
	pick := map[string]string{
		"HIGH_QUALITY": "anthropic:claude-3-5-sonnet",
		"BALANCED":     "openai:gpt-4o-mini",
		"LOW_COST":     "openai:gpt-4o-mini",
	}
	if mode == "HIGH_QUALITY" {
		pick["HIGH_QUALITY"] = "openai:gpt-4o"
	}
	id := pick[mode]
	if id == "" {
		id = pick["BALANCED"]
		mode = "BALANCED"
	}
	spec, err := registry.Lookup(id)
	out := map[string]any{
		"mode":              mode,
		"model":             id,
		"execution_reality": "ESTIMATED",
		"source":            "registry",
		"note":              "Catalog estimate only. Not an actual provider charge or completion.",
	}
	if err != nil {
		out["available"] = false
		return out
	}
	out["provider"] = spec.Provider
	out["remote_model"] = spec.RemoteModel
	out["input_per_1k_micros"] = spec.InputPer1K
	out["output_per_1k_micros"] = spec.OutputPer1K
	out["currency"] = spec.Currency
	out["available"] = true
	switch mode {
	case "HIGH_QUALITY":
		out["expected_quality"] = "higher"
		out["expected_latency"] = "higher"
	case "LOW_COST":
		out["expected_quality"] = "adequate"
		out["expected_latency"] = "lower"
	default:
		out["expected_quality"] = "balanced"
		out["expected_latency"] = "standard"
	}
	return out
}

func ProjectScenario(freq, quality, costBias float64) map[string]any {
	if freq <= 0 {
		freq = 1
	}
	if quality <= 0 {
		quality = 1
	}
	if costBias <= 0 {
		costBias = 1
	}
	return map[string]any{
		"kind":              "PROJECTED",
		"execution_reality": "SIMULATION",
		"assumptions": []string{
			"linear scaling of frequency",
			"quality index is ordinal not revenue",
			"cost uses registry micros, not invoices",
		},
		"projected": map[string]any{
			"publish_index": freq,
			"quality_index": quality,
			"cost_index":    freq * costBias,
		},
		"confidence": "LOW",
		"note":       "Projected values are not historical actuals and are not provider results.",
	}
}
