# Imagen base
FROM node:20

# Directorio de trabajo
WORKDIR /app

# Copiar archivos del proyecto
COPY package*.json ./
RUN npm install

COPY . .

# Exponer el puerto
EXPOSE 8080

# Comando para iniciar la app
CMD ["node", "server.js"]
