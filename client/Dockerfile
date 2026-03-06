# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
ARG VITE_SERVER_URL=https://streamsyncback.enstso.com
ENV VITE_SERVER_URL=$VITE_SERVER_URL

RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8003
CMD ["/bin/sh", "-c", "PORT_VALUE=${PORT:-8003}; sed \"s/__PORT__/${PORT_VALUE}/g\" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
