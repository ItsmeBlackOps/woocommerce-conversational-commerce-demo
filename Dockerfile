FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm ci
RUN npm ci --prefix backend
RUN npm ci --prefix frontend

FROM deps AS build

WORKDIR /app
COPY . .
RUN npm run build --prefix frontend

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY mock ./mock
COPY package.json ./package.json
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 1772
CMD ["node", "backend/src/index.js"]
