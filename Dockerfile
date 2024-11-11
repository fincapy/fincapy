FROM python:3.13 as prod
WORKDIR /app

COPY ./src ./src
COPY ./pyproject.toml ./pyproject.toml
COPY ./poetry.lock ./poetry.lock
COPY ./alembic.ini ./alembic.ini

RUN pip install --upgrade pip
RUN pip install poetry
RUN poetry install --without dev

FROM prod as dev

RUN poetry install