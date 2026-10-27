
# Étape 1 : construire l'interface React
FROM node:24-bookworm-slim AS build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG BASE_PATH=/td-algorithme-ihme/
RUN npm run build -- --base="${BASE_PATH}"

# Étape 2 : préparer le serveur Express
FROM node:24-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend/ ./
COPY --from=build --chown=node:node /app/frontend/dist /app/dist

USER node

EXPOSE 3000

CMD ["node", "--import", "tsx", "server.ts"]
