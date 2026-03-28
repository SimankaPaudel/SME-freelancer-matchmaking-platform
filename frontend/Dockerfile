# frontend/Dockerfile
# Multi-stage production-ready frontend

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Delete package-lock.json and reinstall fresh for linux/musl
RUN rm -f package-lock.json && \
    npm install && \
    npm cache clean --force

# Copy all source code
COPY . .

# Build the frontend
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling and curl for health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install serve globally
RUN npm install -g serve && npm cache clean --force

# Copy built frontend from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Remove unnecessary files
RUN rm -rf /app/.env* /app/.git*

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5173

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["serve", "-s", "dist", "-l", "5173"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:5173 || exit 1