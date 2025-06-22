test-integration:
	docker compose run --rm nextjs npm run vitest

test-integration-agent:
	docker compose run -T --rm nextjs npm run vitest:agent

test-system:
	docker compose run --rm playwright npm run test:system

test-system-agent:
	docker compose run -T --rm playwright npm run test:system

test-all:
	make test-integration-agent;
	make test-system-agent;

init-aider:
	aider --model gemini/gemini-2.5-pro-preview-06-05 --thinking-tokens 32k --no-check-model-accepts-settings --no-auto-commit
