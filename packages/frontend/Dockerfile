FROM node:22-alpine AS builder

WORKDIR /app
COPY packages/frontend/package*.json ./
RUN npm install

COPY packages/frontend ./
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
