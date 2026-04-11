# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including dev deps for prisma generate)
COPY package*.json ./
RUN npm ci

# Copy source and generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy remaining source files
COPY src ./src
COPY .env.example ./

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

# Run as non-root user (built into node:alpine image)
USER node

WORKDIR /app

# Copy only production node_modules from builder
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma client and source from builder
COPY --chown=node:node --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node src ./src
COPY --chown=node:node ecosystem.config.js ./

# Create log and invoice directories with correct ownership
RUN mkdir -p logs invoices

EXPOSE 3000

# dumb-init ensures SIGTERM is forwarded correctly to Node.js
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
