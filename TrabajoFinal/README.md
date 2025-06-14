# Sistema de Reservas de Citas Médicas con Microservicios
Descripción General
Este proyecto implementa un sistema distribuido para la gestión de reservas médicas utilizando una arquitectura de microservicios. Se emplean múltiples lenguajes de programación (Node.js y Python), JWT para la autenticación y autorización, APIs REST y GraphQL, análisis de logs con Grafana Loki, y orquestación mediante Docker. El sistema está diseñado para cumplir con los requisitos funcionales y técnicos establecidos, ofreciendo una solución escalable y modular.

# Objetivo General
Desarrollar un sistema distribuido para la gestión de reservas médicas, implementado como una arquitectura de microservicios, utilizando Node.js y Python, JWT para proteger rutas, APIs REST y GraphQL para exponer servicios, y tecnologías de análisis de logs, todo orquestado con Docker.

# Microservicios Implementados
1. Servicio de Usuarios (Node.js + MySQL)
Descripción: Gestiona el registro, inicio de sesión y consulta de perfiles de usuarios (pacientes, médicos y administradores).
Tecnologías: Node.js con Express, MySQL, JWT, Swagger UI.
Funcionalidades:
Roles: Pacientes, médicos y administradores.
Endpoints REST:
POST /auth/register: Registro de usuarios.
POST /auth/login: Inicio de sesión con generación de JWT válido por 24 horas.
GET /auth/profile: Consulta de perfil (protegida por JWT).
Protección: Middleware implementado para validar JWT y extraer roles del payload.
Desarrollo: Se creó un contenedor Docker con un Dockerfile y se integró en docker-compose.yml. La base de datos MySQL se inicializa con un script init-users.sql y usa volúmenes persistentes. La documentación Swagger está disponible en http://localhost:3001/api-docs.
2. Servicio de Reservas (Python + PostgreSQL)
Descripción: Permite crear, consultar y cancelar reservas de citas médicas de 1 hora de duración, validando disponibilidad y autenticación.
Tecnologías: Python con FastAPI, PostgreSQL, RabbitMQ, JWT.
Funcionalidades:
Endpoints REST:
POST /appointments: Crear reserva (1 hora de duración).
GET /appointments/patient/{patient_id}: Consultar reservas de un paciente.
GET /appointments/doctor/{doctor_id}: Consultar reservas de un médico.
DELETE /appointments/{appointment_id}: Cancelar reserva.
Validación: Interacciona con el Servicio de Usuarios para validar pacientes y médicos mediante JWT. Verifica disponibilidad consultando el Servicio de Especialidades y Agendas (pendiente de integración completa).
Notificaciones: Usa RabbitMQ para enviar mensajes a la cola notifications.
Desarrollo: Implementado con FastAPI, dockerizado con un Dockerfile, y configurado en docker-compose.yml con volúmenes persistentes para PostgreSQL. La documentación automática está disponible en http://localhost:3003/docs.
3. Servicio de Especialidades y Agendas Médicas (Node.js + MongoDB)
Descripción: Gestiona el registro de especialidades y agendas de médicos, exponiendo datos de disponibilidad.
Tecnologías: Node.js con Apollo Server, MongoDB, JWT.
Funcionalidades:
API GraphQL:
Query getSpecialties: Lista todas las especialidades.
Query getDoctorAvailability(doctorId: Int!, date: String!): Consulta disponibilidad por médico y fecha.
Mutation createSpecialty(name: String!): Registra una especialidad (solo admin).
Mutation setDoctorSchedule(doctorId: Int!, date: String!, timeSlots: [String!]!): Establece agenda (solo médico).
Protección: Middleware JWT para validar roles (admin para especialidades, médico para agendas).
Desarrollo: Implementado con Apollo Server, dockerizado con un Dockerfile, y configurado en docker-compose.yml con volúmenes persistentes para MongoDB.
4. Servicio de Logs (Grafana Loki)
Descripción: Agrega y visualiza logs de todos los servicios.
Tecnologías: Grafana Loki, integrado con contenedores de los servicios.
Funcionalidades:
Logs: Cada servicio guarda eventos en un archivo local (por ejemplo, auth.log, specialties.log, reservations.log, notifications.log) y envía logs a Loki.
Campos: Incluye IP, usuario, timestamp, acción.
Visualización: Grafana se configura para mostrar logs en http://localhost:3000.
Desarrollo: Loki se levanta como contenedor en docker-compose.yml, y cada servicio implementa un transporte personalizado (Winston para Node.js, logging para Python) para enviar logs a http://loki:3100/loki/api/v1/push.
5. Servicio de Notificaciones
Descripción: Consume mensajes de RabbitMQ y simula el envío de notificaciones.
Tecnologías: Python con Pika, RabbitMQ.
Funcionalidades:
Consuma mensajes de la cola notifications generados por el Servicio de Reservas.
Simula el envío de notificaciones (mock con una URL placeholder) y registra la actividad en logs.
Desarrollo: Implementado con un consumidor Python, dockerizado con un Dockerfile, y configurado en docker-compose.yml.
Autenticación y Autorización
JWT: Todos los servicios aceptan JWT para proteger rutas. Al iniciar sesión en el Servicio de Usuarios, se devuelve un token válido por 24 horas.
Middleware: Implementado en cada servicio para validar JWT y extraer roles (paciente, médico, admin), controlando el acceso a endpoints según el rol.
Requisitos Funcionales
Paciente:
Consulta médicos disponibles por especialidad (via GraphQL en Servicio de Especialidades).
Reserva citas por hora (via REST en Servicio de Reservas).
Cancela sus reservas (via REST en Servicio de Reservas).
Médico:
Establece su agenda (via GraphQL en Servicio de Especialidades).
Administrador:
Agrega nuevas especialidades (via GraphQL en Servicio de Especialidades).
Infraestructura y Contenedores
Docker: Todos los microservicios, bases de datos (MySQL, MongoDB, PostgreSQL), RabbitMQ, Loki y Grafana corren en contenedores Docker.
docker-compose.yml:
Levanta todos los microservicios y dependencias.
Configura bases de datos con volúmenes persistentes (mysql-data, postgres-data, mongo-data).
Incluye Grafana Loki para análisis de logs.
Usa una red personalizada medical-net para comunicación entre contenedores.
Puertos:
3001: Servicio de Usuarios.
3002: Servicio de Especialidades.
3003: Servicio de Reservas.
3004: Servicio de Notificaciones.
3000: Grafana.
3100: Loki.
5672/15672: RabbitMQ.
Documentación Swagger: Disponible en http://localhost:3001/api-docs (Usuarios) y http://localhost:3003/docs (Reservas).
Front-End (Básico con React)
Descripción: Se implementa un front-end básico con React que consume los microservicios a través de un proxy inverso simulado (usando fetch con URLs de los servicios).
Tecnologías: React, Tailwind CSS, hosted via CDN.
Configuración:
Proxy inverso simulado configurado en el cliente React para redirigir solicitudes a los puertos correspondientes (3001, 3002, 3003).
Funcionalidades:
Login y registro (conecta a http://localhost:3001/auth/login).
Consulta de especialidades y disponibilidad (conecta a http://localhost:3002/ con GraphQL).
Reserva y cancelación de citas (conecta a http://localhost:3003/appointments).
Código del Front-End:

index.html
html
Mostrar esquemas alineados
Desarrollo: El front-end se crea como una aplicación HTML única con React via CDN, utilizando Tailwind CSS para estilizado. Las solicitudes se dirigen directamente a los puertos de los servicios (simulando un proxy inverso). Para un proxy inverso real, se recomienda usar Nginx o un balanceador como Traefik, configurado para redirigir /auth, /specialties, y /appointments a los puertos respectivos.
Instrucciones de Ejecución
Clona el repositorio o crea la estructura de carpetas (auth-service, specialties-service, reservations-service, notifications-service).
Asegúrate de tener Docker y Docker Compose instalados.
Copia los archivos proporcionados en cada carpeta (.env, Dockerfile, index.js, main.py, etc.).
Ejecuta:
bash

Contraer

Ajuste

Ejecutar

Copiar
docker-compose up -d
Accede a:
Grafana: http://localhost:3000
Servicio de Usuarios (Swagger): http://localhost:3001/api-docs
Servicio de Especialidades (GraphQL): http://localhost:3002
Servicio de Reservas (Swagger): http://localhost:3003/docs
Servicio de Notificaciones (logs): docker logs <notifications-service-container>
Front-End: http://localhost:3000/index.html (ajusta según archivo HTML)
Notas Finales
Seguridad: En producción, usa claves JWT seguras, HTTPS, y un proxy inverso real (como Nginx).
Escalabilidad: Considera Kubernetes o Docker Swarm para despliegue en producción.
Mejoras: Añadir pruebas unitarias, integración completa de disponibilidad, y una API real de notificaciones.