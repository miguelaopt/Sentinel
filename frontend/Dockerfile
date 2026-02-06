# 1. Base Image (Atualizado para Node 20)
FROM node:20-alpine AS base

# 2. Dependencies
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar ficheiros de dependências
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desativar telemetria durante o build
ENV NEXT_TELEMETRY_DISABLED 1

# Construir o projeto
RUN npm run build

# 4. Runner (Production Image)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar public e ficheiros estáticos
COPY --from=builder /app/public ./public

# Configurar permissões corretas para o Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Otimização para reduzir tamanho da imagem (Standalone mode)
# Nota: O next.config.mjs deve ter output: 'standalone' para isto funcionar perfeitamente, 
# mas o container funciona na mesma copiando o .next clássico se falhar.
# Vamos copiar o .next/standalone se existir, ou o default.
# Para garantir compatibilidade com o teu setup atual, copiamos tudo o que é necessário.

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
# O hostname deve ser 0.0.0.0 para docker
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]