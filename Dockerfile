# Stage 1: Build Vite app
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files
COPY pnpm-lock.yaml ./
COPY package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy project files (kecuali node_modules)
COPY . .

# Build project
RUN pnpm run build

# Stage 2: Serve built files
FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve

# Copy dist folder from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
