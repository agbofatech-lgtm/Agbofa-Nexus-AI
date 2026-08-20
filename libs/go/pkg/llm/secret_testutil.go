package llm

import "github.com/agbofa/nexus/libs/go/pkg/config"

func NewEmptySecret() config.Secret { return config.NewSecret("ai/openai/api_key", "") }
