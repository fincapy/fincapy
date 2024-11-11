format:
	ruff check --select I --fix .;
	ruff format .

run-migration:
	docker compose run --rm simplebudget poetry run alembic revision --autogenerate

upgrade-db:
	docker compose run --rm simplebudget poetry run alembic upgrade head