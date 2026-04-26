# Stage 1: Build Vite app
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY pnpm-lock.yaml ./
COPY package.json ./

# Improve registry reliability in CI
RUN pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-factor 2 \
  && pnpm config set fetch-retry-mintimeout 10000 \
  && pnpm config set fetch-retry-maxtimeout 120000 \
  && pnpm config set network-concurrency 1

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy project files
COPY . .

ARG ENV_FILE
COPY ${ENV_FILE} .env

# Build project
RUN pnpm run build

# Stage 2: Serve built files
FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve

# Copy dist folder from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:5173"]