# --- STAGE 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and build tools
RUN apk add --no-cache libc6-compat
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# --- STAGE 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies and necessary libraries
RUN apk add --no-cache libc6-compat
RUN npm install --only=production

# Copy the compiled build from Stage 1
COPY --from=build /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
