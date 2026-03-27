FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
CMD ["npm", "run", "start:dev"]

FROM dev AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
CMD ["node", "dist/main"]
