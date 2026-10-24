# syntax=docker/dockerfile:1

# ---------- Dependencies ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Development ----------
FROM node:20-bookworm-slim AS development
WORKDIR /usr/src/app
ENV NODE_ENV=development
COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

# ---------- Build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Production ----------
FROM node:20-bookworm-slim AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 4000
USER node
CMD ["node", "dist/main"]
