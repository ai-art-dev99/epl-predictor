# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install deps (clean install, no legacy flags needed with Vite)
RUN npm install

# Copy source
COPY index.html ./
COPY vite.config.js ./
COPY src ./src
COPY public ./public

# Build (Vite outputs to /dist)
RUN npm run build

# Production stage — nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
