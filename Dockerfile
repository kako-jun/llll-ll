# Multi-stage build for Next.js with Nginx
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with output export for static files
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS runner

# Copy static files from Next.js build
COPY --from=builder /app/out /usr/share/nginx/html

# Custom Nginx config for SPA
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set proper permissions
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx

EXPOSE 80

USER nextjs

CMD ["nginx", "-g", "daemon off;"]