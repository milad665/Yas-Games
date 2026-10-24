# One image per edition: docker build --build-arg EDITION=lili .  (yas by default)
# The build step only copies files, so it runs on the build machine's own platform.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /src
COPY site/ site/
COPY editions/ editions/
COPY tools/build.mjs tools/
ARG EDITION=yas
RUN node tools/build.mjs "$EDITION" --out /out

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /out/ /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
