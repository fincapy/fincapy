test-integration:
	docker compose run --rm nextjs npm run vitest

test-integration-agent:
	docker compose run --rm nextjs npm run vitest:agent
