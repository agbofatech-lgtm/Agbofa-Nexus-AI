package application

import "math"

// clamp restricts a value to [0.0, 1.0].
func clamp(val float64) float64 {
	if math.IsNaN(val) {
		return 0.0
	}
	if val < 0.0 {
		return 0.0
	}
	if val > 1.0 {
		return 1.0
	}
	return val
}

func clampRange(val, minVal, maxVal float64) float64 {
	if math.IsNaN(val) {
		return minVal
	}
	if val < minVal {
		return minVal
	}
	if val > maxVal {
		return maxVal
	}
	return val
}
