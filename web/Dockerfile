FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--allowed-hosts"]

FROM dev AS build
COPY . .
RUN npx ng build

FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
CMD ["node", "dist/web/server/server.mjs"]
