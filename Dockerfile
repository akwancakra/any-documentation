# Production Dockerfile untuk CYS Wiki
FROM node:20-alpine AS base

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy all source code first (needed for fumadocs-mdx postinstall)
COPY . .

# Install dependencies
RUN npm ci

# Set environment untuk build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# curl untuk HEALTHCHECK (Alpine minimal)
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 any-documentation

# Copy built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown any-documentation:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=any-documentation:nodejs /app/.next/standalone ./
COPY --from=builder --chown=any-documentation:nodejs /app/.next/static ./.next/static

# MDX docs: gunakan S3 di prod (DOCS_STORAGE=s3). Jangan bundle content/docs ke image.

USER any-documentation

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -sf http://127.0.0.1:3000/api/health > /dev/null || exit 1

CMD ["node", "server.js"]
