# ==========================================
# Stage 1: Build React Vite Client
# ==========================================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm install

# Build frontend production bundle
COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Server + Discord Bot
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies for server
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy server application source code
COPY server/ ./server/

# Copy built frontend from client-builder stage
COPY --from=client-builder /app/client/dist ./client/dist

# Expose server HTTP port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start Discord bot & web dashboard server
CMD ["node", "server/src/index.js"]
