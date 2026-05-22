# frontend/Dockerfile
# Multi-stage production-ready frontend

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
# These will be passed from docker-compose.yaml
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_ESEWA_PAYMENT_URL
ARG VITE_ENV=production
ARG FRONTEND_PORT=5173

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}
ENV VITE_ESEWA_PAYMENT_URL=${VITE_ESEWA_PAYMENT_URL}
ENV VITE_ENV=${VITE_ENV}
ENV FRONTEND_PORT=${FRONTEND_PORT}

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

# Accept runtime arguments
ARG FRONTEND_PORT=5173

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

# Expose port (using build arg)
EXPOSE ${FRONTEND_PORT}

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application with dynamic port
CMD ["sh", "-c", "serve -s dist -l ${FRONTEND_PORT:-5173}"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${FRONTEND_PORT:-5173} || exit 1