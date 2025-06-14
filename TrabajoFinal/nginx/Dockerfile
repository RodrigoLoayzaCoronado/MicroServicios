FROM nginx:alpine

# Copia el archivo de configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# ¡Elimina la línea 'COPY ../frontend /usr/share/nginx/html/'!
# Nginx no necesita los archivos estáticos aquí directamente.

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]