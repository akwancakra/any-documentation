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

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 cys-wiki

# Copy built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown cys-wiki:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=cys-wiki:nodejs /app/.next/standalone ./
COPY --from=builder --chown=cys-wiki:nodejs /app/.next/static ./.next/static

# Copy content directory (untuk dynamic MDX loading)
COPY --chown=cys-wiki:nodejs content ./content

USER cys-wiki

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"] 