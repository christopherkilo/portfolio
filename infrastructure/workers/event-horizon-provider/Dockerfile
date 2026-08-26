# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm ci && npx tsc

FROM node:22-alpine
RUN addgroup -S worker && adduser -S worker -G worker
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER worker
CMD ["node", "dist/index.js"]
