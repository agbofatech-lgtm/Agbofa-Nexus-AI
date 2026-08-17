CREATE TABLE IF NOT EXISTS ai_prompt_templates (
    id UUID PRIMARY KEY,
    prompt_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    template_string TEXT NOT NULL,
    required_variables JSONB NOT NULL DEFAULT '[]',
    max_input_length INT NOT NULL DEFAULT 1024,
    disallow_injection BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(prompt_id, version)
);

CREATE TABLE IF NOT EXISTS ai_model_endpoints (
    id UUID PRIMARY KEY,
    model_id VARCHAR(100) UNIQUE NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    max_context_tokens INT NOT NULL DEFAULT 4096,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_agent_definitions (
    id UUID PRIMARY KEY,
    agent_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    default_model_id VARCHAR(100),
    allowed_tools JSONB NOT NULL DEFAULT '[]',
    max_tokens INT NOT NULL DEFAULT 2048,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_agent_executions (
    id UUID PRIMARY KEY,
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    agent_id VARCHAR(100) REFERENCES ai_agent_definitions(agent_id),
    status VARCHAR(50) NOT NULL,
    output TEXT,
    error_message TEXT,
    tokens_used INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS engineering_constitution_rules (
    id UUID PRIMARY KEY,
    rule_id VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    mandatory BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE ai_agent_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_agent_executions_tenant_isolation_policy ON ai_agent_executions;
CREATE POLICY ai_agent_executions_tenant_isolation_policy ON ai_agent_executions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
