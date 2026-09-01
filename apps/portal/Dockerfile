FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/portal/package.json apps/portal/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile
COPY apps/portal apps/portal
COPY packages/contracts packages/contracts
RUN pnpm --filter @platform/contracts build && pnpm --filter @platform/portal build

FROM nginx:1.27-alpine
COPY --from=build /workspace/apps/portal/dist /usr/share/nginx/html
COPY apps/portal/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
