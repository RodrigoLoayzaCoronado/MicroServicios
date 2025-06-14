# Usa una imagen base de Node.js para servir archivos estáticos
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos del frontend
# Como el contexto de build es 'frontend/', 'COPY . .' copiará todo lo que está dentro de 'frontend/'
COPY . .

# Instala http-server para servir archivos estáticos (si lo necesitas)
# Si tu frontend se construye a un directorio 'build' o 'dist', querrás servir eso.
# Para tu setup actual con Babel en el navegador, copiar los archivos directamente está bien.
RUN npm install -g http-server

# Expone el puerto donde http-server escuchará
EXPOSE 3005

# Comando para ejecutar el servidor
# --host 0.0.0.0 permite que el servidor sea accesible desde fuera del contenedor
# --port 3000 es el puerto interno del contenedor
# -c-1 deshabilita el cacheo para desarrollo
# --cors habilita CORS
CMD ["http-server", "-p", "3005", "--host", "0.0.0.0", "-c-1", "--cors"]