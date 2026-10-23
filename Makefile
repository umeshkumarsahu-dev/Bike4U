.PHONY: help up down restart logs build test seed clean

help:
	@echo "Bike for U - Management Commands"
	@echo "  make up       - Start all containers in background"
	@echo "  make down     - Stop all containers"
	@echo "  make restart  - Restart all containers"
	@echo "  make logs     - View web container logs"
	@echo "  make build    - Rebuild containers without cache"
	@echo "  make test     - Run vitest scoring engine unit tests"
	@echo "  make seed     - Re-seed database with Indian two-wheelers"

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f web

build:
	docker compose build --no-cache

test:
	npx vitest run

seed:
	docker compose exec web npx tsx prisma/seed.ts

clean:
	docker compose down -v
