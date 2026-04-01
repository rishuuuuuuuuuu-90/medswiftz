FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/config/package*.json ./packages/config/
RUN npm install --workspace=packages/types --workspace=packages/config --workspace=apps/api

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/types ./packages/types
COPY packages/config ./packages/config
COPY apps/api ./apps/api
RUN cd packages/types && npx tsc
RUN cd apps/api && npx prisma generate
RUN cd apps/api && npx tsc

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
EXPOSE 5000
CMD ["node", "dist/index.js"]
