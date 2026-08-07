.PHONY: validate registry-check docs-check dependency-check governance-check status

validate: registry-check docs-check dependency-check governance-check

registry-check:
	python3 scripts/generate_registries.py --check

docs-check:
	python3 scripts/documentation_pipeline.py

dependency-check:
	python3 scripts/validate_implementation_dependencies.py

governance-check:
	python3 governance/validators/governance_validator.py

status:
	git status --short
