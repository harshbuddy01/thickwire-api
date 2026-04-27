# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev) for building
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm install --omit=dev

# Generate Prisma client in production image
RUN npx prisma generate

# Copy built dist from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]
