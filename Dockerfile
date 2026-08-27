FROM node:22-alpine AS builder

WORKDIR /app

# 1. Copia apenas package.json e package-lock.json (melhor cache)
COPY package*.json ./

# 2. Instala dependências (sem legacy, só use se realmente precisar)
RUN npm install

# 3. Copia o restante do projeto
COPY . .

# 4. Build do Vite
RUN npm run build


# --------- NGINX ---------
FROM nginx:alpine

# Copia o build gerado pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Config customizada (se tiver)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]