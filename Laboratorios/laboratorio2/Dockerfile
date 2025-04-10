
# Usar una imagen base de Node.js
FROM node:20-alpine

WORKDIR /app
# Copiar los archivos necesarios al contenedor
COPY package.json .
COPY package-lock.json .

RUN npm install
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
