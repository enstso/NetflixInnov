# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
ARG VITE_SERVER_URL=https://STREAMSYNCBack.enstso.com
ENV VITE_SERVER_URL=$VITE_SERVER_URL

RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8003
CMD ["nginx", "-g", "daemon off;"]
