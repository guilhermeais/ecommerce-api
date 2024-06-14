#
# 🧑‍💻 Development
#
FROM node:20-alpine as dev
WORKDIR /app

ENV NODE_ENV development

RUN deluser --remove-home node && \
    addgroup --system --gid 1001 node && \
    adduser --system --uid 1001 node

RUN apk add --no-cache libc6-compat python3 py3-pip build-base pkgconfig python3-dev gcc musl-dev linux-headers && \
    pip3 install --no-cache-dir --break-system-packages joblib scikit-learn pandas numpy matplotlib seaborn plotly scipy psutil

ENV JOBLIB_START_METHOD=forkserver

COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .

#
# 🏡 Production Build
#
FROM dev as build
ENV JOBLIB_START_METHOD=forkserver
ENV NODE_ENV production

COPY --chown=node:node . .
RUN mkdir dist
RUN chown -R node:node dist
RUN npm run build && npm ci --omit=dev && npm cache clean --force

#
# 🚀 Production Server
#
FROM node:20-alpine as prod

WORKDIR /app

ENV NODE_ENV production
ENV JOBLIB_START_METHOD=forkserver

RUN deluser --remove-home node && \
    addgroup --system --gid 1001 node && \
    adduser --system --uid 1001 node && \
    apk add --no-cache libc6-compat

    
RUN apk add --no-cache libc6-compat python3 py3-pip build-base pkgconfig python3-dev gcc musl-dev linux-headers && \
pip3 install --no-cache-dir --break-system-packages joblib scikit-learn pandas numpy matplotlib seaborn plotly scipy psutil

COPY --chown=node:node --from=build /app/dist dist
COPY --chown=node:node --from=build /app/node_modules node_modules

USER node

CMD ["node", "dist/src/infra/main.js"]