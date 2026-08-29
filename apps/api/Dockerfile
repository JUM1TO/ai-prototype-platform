FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/ai-runtime/package.json packages/ai-runtime/package.json
RUN pnpm install --no-frozen-lockfile
COPY apps/api apps/api
COPY packages/contracts packages/contracts
COPY packages/ai-runtime packages/ai-runtime
RUN pnpm --filter @platform/api... build

FROM node:22-alpine
WORKDIR /workspace
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api ./apps/api
COPY --from=build /workspace/packages ./packages
EXPOSE 8080
CMD ["node", "apps/api/dist/server.js"]
