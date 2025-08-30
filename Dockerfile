FROM oven/bun:alpine

COPY . /app

WORKDIR /app

RUN bun install --frozen-lockfile
RUN bun run build

EXPOSE 5173

CMD ["bun", "run", "start"]