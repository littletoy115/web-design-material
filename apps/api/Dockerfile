FROM node:22-alpine

RUN npm install -g pnpm@11.13.0

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@repo/api exec prisma generate
RUN pnpm --filter=@repo/api build

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/server.js"]
