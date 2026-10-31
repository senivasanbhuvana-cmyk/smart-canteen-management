FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=/app/data/canteen.db

# Install curl for health checking
RUN apk add --no-cache curl

# Create application data directory and adjust permissions for non-root user 'node'
RUN mkdir -p /app/data && chown -R node:node /app

# Copy dependency definitions
COPY --chown=node:node package*.json ./

# Switch to non-root user for security
USER node

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy backend source
COPY --chown=node:node src/ ./src/

# Expose backend REST API port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start Express server with auto-seeding
CMD ["node", "src/server.js"]
