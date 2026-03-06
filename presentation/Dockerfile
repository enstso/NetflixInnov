# syntax=docker/dockerfile:1.7

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 8004
CMD ["/bin/sh", "-c", "PORT_VALUE=${PORT:-8004}; sed \"s/__PORT__/${PORT_VALUE}/g\" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
