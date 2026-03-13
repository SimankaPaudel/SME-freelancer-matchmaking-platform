# frontend/Dockerfile

# ---- Build stage ----
FROM node:22 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install to handle optional dependencies
RUN rm -rf node_modules package-lock.json && npm install --legacy-peer-deps

# Copy frontend code
COPY . .

# Build the frontend
RUN npm run build

# ---- Production stage ----
FROM node:22

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built frontend
COPY --from=build /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]