#!/bin/bash

docker compose up db hcb-pos -d
docker compose exec hcb-pos bun run db:push
docker compose stop db hcb-pos