FROM node:14-slim

LABEL \
    "MAINTAINER"="https://github.com/DIYgod/RSSHub/" \
    "traefik.enable"="true" \
    "traefik.http.routers.rsshub.rule"="Host(`rsshub.royxiang.me`)" \
    "traefik.http.services.rsshub.loadbalancer.server.port"="1200"

RUN ln -sf /bin/bash /bin/sh

RUN apt-get update && apt-get install -yq libgconf-2-4 apt-transport-https git dumb-init python make g++ build-essential --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json tools/clean-nm.sh /app/

RUN npm install --production && sh ./clean-nm.sh

COPY . /app

EXPOSE 1200
ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "run", "start"]
