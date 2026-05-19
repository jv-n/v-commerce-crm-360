FROM node:20-alpine
WORKDIR /app

# Usa corepack para instalar a versão exata definida em packageManager no package.json
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host", "0.0.0.0"]