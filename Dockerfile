FROM node:14-buster-slim as dep-builder

LABEL MAINTAINER https://github.com/DIYgod/RSSHub/

RUN ln -sf /bin/bash /bin/sh

RUN apt-get update \
    && apt-get install -yq libgconf-2-4 apt-transport-https git dumb-init python3 build-essential --no-install-recommends

WORKDIR /app

COPY package.json yarn.lock /app/

RUN export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    && npm i -g npm \
    && npm update -g corepack \
    && yarn

COPY . /app

RUN node scripts/docker/minify-docker.js

FROM node:14-slim as app

LABEL \
    "traefik.enable"="true" \
    "traefik.http.routers.rsshub.rule"="Host(`rsshub.royxiang.me`)" \
    "traefik.http.services.rsshub.loadbalancer.server.port"="1200"

ENV NODE_ENV production
ENV TZ Asia/Shanghai

WORKDIR /app
COPY . /app
COPY --from=dep-builder /app/app-minimal/node_modules /app/node_modules
COPY --from=dep-builder /usr/bin/dumb-init /usr/bin/dumb-init

EXPOSE 1200
ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "run", "start"]
