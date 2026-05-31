# EC + DP Timeline 2026 — static site
# Build:  docker build -t ec-dp-timeline .
# Run:    docker run -d --name ec-dp-timeline -p 8765:80 ec-dp-timeline

FROM nginx:alpine

# Copy site
COPY . /usr/share/nginx/html

# Remove non-site files from image
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/README.md

# Apply custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK CMD wget -q -O- http://localhost/ || exit 1
