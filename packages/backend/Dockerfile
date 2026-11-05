FROM node:22-alpine AS builder

WORKDIR /app
COPY packages/backend/package*.json ./
RUN npm install

COPY packages/backend ./
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY packages/backend/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/index.js"]
