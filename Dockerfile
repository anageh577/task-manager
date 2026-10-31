# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

# --- Production build of the Angular app -------------------------------------
FROM deps AS build
COPY . .
RUN npx ng build --configuration production

# --- Mock REST API (json-server) ----------------------------------------------
FROM deps AS api
COPY data-generator ./data-generator
COPY mock-server ./mock-server
EXPOSE 3000
CMD ["sh", "-c", "node mock-server/build-db.mjs && npx json-server --host 0.0.0.0 --port 3000 --watch mock-server/db.json --routes mock-server/routes.json"]

# --- Static web server; proxies /api to the api service ----------------------
FROM nginx:1.27-alpine AS web
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/task-manager/browser /usr/share/nginx/html
EXPOSE 80
