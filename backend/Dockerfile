# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copy source code and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy only production dependencies and build artifacts
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules

# Ensure we have the production Prisma client
RUN npm prune --production

EXPOSE 5000

# Script to run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
