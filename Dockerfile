FROM node:24-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

WORKDIR /app/SILO-plateforme-source-2026-07-27
COPY SILO-plateforme-source-2026-07-27/ ./

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN pnpm install --frozen-lockfile
RUN pnpm run build \
  && find artifacts/3c-studio/dist/public/assets -name 'index-*.js' \
    -exec sed -i 's/typeof import\.meta<"u"&&//g' {} + \
  && sed -i 's/<script type="module" crossorigin/<script defer/' \
    artifacts/3c-studio/dist/public/index.html

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app
COPY --from=build /app/SILO-plateforme-source-2026-07-27 ./SILO-plateforme-source-2026-07-27

EXPOSE 8080

CMD ["node", "SILO-plateforme-source-2026-07-27/artifacts/api-server/dist/index.mjs"]
