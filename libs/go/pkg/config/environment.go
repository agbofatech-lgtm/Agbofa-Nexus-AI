package config

import "strings"

// Environment is a deployment class. Production and staging are fail-closed.
type Environment string

const (
	EnvDevelopment Environment = "development"
	EnvStaging     Environment = "staging"
	EnvProduction  Environment = "production"
	EnvTest        Environment = "test"
)

func ParseEnvironment(raw string) (Environment, error) {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "development", "dev":
		return EnvDevelopment, nil
	case "staging", "stage":
		return EnvStaging, nil
	case "production", "prod":
		return EnvProduction, nil
	case "test":
		return EnvTest, nil
	case "":
		return "", ErrMissingRequired
	default:
		return "", ErrUnknownEnvironment
	}
}

func (e Environment) Strict() bool {
	return e == EnvProduction || e == EnvStaging
}

func (e Environment) Valid() bool {
	switch e {
	case EnvDevelopment, EnvStaging, EnvProduction, EnvTest:
		return true
	default:
		return false
	}
}
