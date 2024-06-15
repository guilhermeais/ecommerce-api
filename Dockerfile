#
# 🧑‍💻 Development
#
FROM node:20-alpine as dev
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV development

RUN deluser --remove-home node
RUN addgroup --system --gid 1001 node
RUN adduser --system --uid 1001 node

COPY --chown=node:node . .

RUN npm ci

USER node

#
# 🏡 Production Build
#
FROM node:20-alpine as build

WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV production

RUN deluser --remove-home node
RUN addgroup --system --gid 1001 node
RUN adduser --system --uid 1001 node

COPY --chown=node:node --from=dev /app/node_modules ./node_modules
COPY --chown=node:node . .

RUN npm run build

RUN npm ci --omit=dev && npm cache clean --force

USER node

#
# 🚀 Production Server
#
FROM node:20-alpine as prod

WORKDIR /app
RUN apk add --no-cache libc6-compat

ENV NODE_ENV production

RUN deluser --remove-home node
RUN addgroup --system --gid 1001 node
RUN adduser --system --uid 1001 node

COPY --chown=node:node --from=build /app/dist dist
COPY --chown=node:node --from=build /app/node_modules node_modules

USER node

CMD ["node", "dist/src/infra/main.js"]