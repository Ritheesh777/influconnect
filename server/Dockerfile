# InfluConnect API — container image (works on Render, Railway, Fly, or any
# Docker host). Node 20 slim.
FROM node:20-slim

WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# App source
COPY . .

# Hosts inject PORT; our server reads process.env.PORT (defaults to 5050)
ENV NODE_ENV=production
EXPOSE 5050

CMD ["node", "src/index.js"]
