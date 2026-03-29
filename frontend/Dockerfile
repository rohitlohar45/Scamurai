# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json pnpm-lock.json* ./
RUN npm install -g pnpm
RUN pnpm i

# Copy rest of the code
COPY . .

# Build the app
RUN npm run build


# ---------- Production Stage ----------
FROM node:20-alpine

WORKDIR /app

# Install only serve (lightweight)
RUN npm install -g serve

# Copy only build output from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Run app
CMD ["serve", "-s", "build", "-l", "3000"]
