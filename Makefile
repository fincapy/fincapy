test-integration:
	docker compose run --rm nextjs npm run vitest

test-integration-agent:
	docker compose run -T --rm nextjs npm run vitest:agent

test-system:
	docker compose run --rm playwright npm run test:system

test-system-agent:
	docker compose run -T --rm playwright npm run test:system
