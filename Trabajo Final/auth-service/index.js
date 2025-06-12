const express = require('express');
const mysql = require('mysql2/promise');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const winston = require('winston');
const Transport = require('winston-transport'); // Clase base para transportes de Winston
const http = require('http'); // Para solicitudes HTTP (Loki es HTTP)
const { URL } = require('url'); // Para parsear la URL de Loki

// --- Implementación de LokiTransportCustom (Opcional si usas Promtail) ---
// Si ya tienes Promtail recolectando logs de stdout/stderr, este transporte
// es redundante y solo añade complejidad y carga extra a tu aplicación.
// La mejor práctica es solo usar winston.transports.Console() y dejar que Promtail
// se encargue de enviar los logs a Loki.
class LokiTransportCustom extends Transport { // <-- ¡ESTA LÍNEA HA SIDO CORREGIDA! Debe extender de 'Transport'
  constructor(opts) {
    super(opts);
    this.lokiUrl = opts.lokiUrl || 'http://loki:3100/loki/api/v1/push';
    this.labels = opts.labels || { app: 'auth-service' };
  }

  log(info, callback) {
    // Loki prefiere timestamps en nanosegundos como string, o milisegundos como número.
    // Usaremos milisegundos como número (Date.now()) que es más fácil y Loki lo maneja bien.
    const timestamp = Date.now(); // Timestamp en milisegundos

    const { level, message, ...meta } = info;
    const payload = {
      streams: [
        {
          stream: { ...this.labels, level },
          // Agregamos una etiqueta 'service' para mejor filtrado en Grafana/Loki
          // También es buena práctica incluir los metadatos como parte del mensaje o en un campo estructurado
          values: [[timestamp.toString(), `${message} ${JSON.stringify(meta)}`]]
        }
      ]
    };

    const parsedUrl = new URL(this.lokiUrl);
    // Seleccionamos el cliente http o https basado en el protocolo de la URL
    const client = parsedUrl.protocol === 'https:' ? require('https') : http;

    const req = client.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      (res) => {
        res.on('data', () => {}); // Consumir datos de la respuesta para asegurar el evento 'end'
        res.on('end', callback);
      }
    );

    req.on('error', (err) => callback(err));
    req.write(JSON.stringify(payload));
    req.end();
  }
}
// --- Fin de LokiTransportCustom ---

// Configuración del logger de Winston
const logger = winston.createLogger({
  level: 'info', // Nivel mínimo de logs (ej: 'info', 'warn', 'error', 'debug')
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Formato de tiempo legible
    winston.format.json() // Exporta logs en formato JSON para un mejor análisis estructurado en Loki
  ),
  transports: [
    // Opción 1: Si usas Promtail, solo necesitas enviar a la consola.
    // Promtail recogerá estos logs de stdout/stderr del contenedor.
    new winston.transports.Console(),

    // Opción 2: Si NO usas Promtail y quieres enviar logs directamente a Loki desde la app.
    // Asegúrate de que Loki esté accesible desde la IP del contenedor.
    // new LokiTransportCustom({
    //   lokiUrl: 'http://loki:3100/loki/api/v1/push',
    //   labels: { app: 'auth-service', service: 'auth-service' } // Añade etiqueta 'service' para facilitar filtros en Grafana
    // }),

    // Opción 3: Si quieres mantener logs en un archivo local DENTRO del contenedor.
    // Ten en cuenta que esto puede duplicar logs en Loki si Promtail también los recoge
    // y puede ser menos eficiente si no mapeas el volumen para este archivo.
    // new winston.transports.File({ filename: 'auth.log' }),
  ]
});

// Configura Express para confiar en los encabezados X-Forwarded-For si usas un proxy inverso
// Esto es crucial para obtener la IP real del cliente con req.ip
app.set('trust proxy', true);

app.use(express.json()); // Middleware para parsear el cuerpo de las solicitudes como JSON

// Middleware para registrar información de cada solicitud HTTP
app.use((req, res, next) => {
  const start = Date.now(); // Captura el tiempo de inicio de la solicitud
  res.on('finish', () => {
    const duration = Date.now() - start; // Calcula la duración de la solicitud
    const userIdentifier = req.user ? req.user.id : 'anonymous'; // Obtiene el ID de usuario si está autenticado

    const logEntry = {
      timestamp: new Date().toISOString(), // Hora exacta de finalización de la solicitud
      method: req.method, // Método HTTP (GET, POST, etc.)
      url: req.url,       // URL de la solicitud
      status: res.statusCode, // Código de estado de la respuesta HTTP
      duration: `${duration}ms`, // Duración de la solicitud en milisegundos
      ip: req.ip,         // Dirección IP del cliente (o del proxy si 'trust proxy' está configurado)
      user: userIdentifier // Identificador del usuario (o 'anonymous')
    };
    logger.info('HTTP Request', logEntry); // Registra el evento de la solicitud como info
  });
  next(); // Pasa el control al siguiente middleware/ruta
});

// Configuración del pool de conexiones a la base de datos MySQL
const pool = mysql.createPool({
  host: 'mysql', // Nombre del servicio MySQL en docker-compose
  user: 'root', // Usuario de la base de datos (se puede usar 'user' si se configuró así)
  password: 'root', // Contraseña del usuario
  database: 'authdb', // Base de datos a la que conectarse
  waitForConnections: true, // Espera si no hay conexiones disponibles
  connectionLimit: 10, // Máximo número de conexiones en el pool
  queueLimit: 0 // Cola ilimitada para solicitudes de conexión
});

// Verifica la conexión inicial a la base de datos
pool.getConnection()
  .then(connection => {
    console.log('Conectado a MySQL'); // Mensaje en consola si la conexión es exitosa
    connection.release(); // Libera la conexión de vuelta al pool
  })
  .catch(err => {
    console.error('MySQL connection error:', err); // Mensaje de error si la conexión falla
    logger.error('Error FATAL: No se pudo conectar a MySQL.', { error: err.message, stack: err.stack });
    process.exit(1); // Sale del proceso si la conexión inicial a la DB falla críticamente
  });

// Validaciones para el registro de usuarios
const validateRegister = [
  body('email').isEmail().withMessage('El email no es válido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('role').isIn(['paciente', 'medico', 'admin']).withMessage('Rol no válido')
];

// Secreto para firmar y verificar tokens JWT (¡MUY IMPORTANTE CAMBIAR EN PRODUCCIÓN!)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_y_largo_para_jwt_aqui';

// Middleware para autenticar JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Obtiene el token del encabezado Authorization
  if (!token) {
    logger.warn('Intento de acceso a ruta protegida sin token');
    return res.status(401).json({ error: 'No se proporcionó token' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Token JWT inválido o expirado', { error: err.message, token: token.substring(0, 30) + '...' }); // Loggea solo una parte del token
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user; // Almacena la información del usuario decodificada en el objeto de solicitud
    next(); // Continúa con la siguiente función de middleware/ruta
  });
};

// Rutas de API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); // Ruta para la documentación Swagger

// Ruta para el registro de usuarios
app.post('/auth/register', validateRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Error de validación al registrar usuario', { errors: errors.array(), body: req.body });
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10); // Hash de la contraseña

  try {
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );
    logger.info('Usuario registrado exitosamente', { userId: result.insertId, email, role });
    res.status(201).json({ user: { id: result.insertId, email, name, role } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      logger.warn('Intento de registro con email ya existente', { email });
      return res.status(409).json({ error: 'El email ya existe' });
    }
    logger.error('Error inesperado al registrar usuario', { error: err.message, stack: err.stack, email });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta para el inicio de sesión
app.post('/auth/login', [
  body('email').isEmail().withMessage('El email no es válido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña no puede estar vacía')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Error de validación al intentar login', { errors: errors.array(), body: req.body });
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      logger.warn('Intento de login con usuario no encontrado', { email });
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = users[0];
    const match = await bcrypt.compare(password, user.password); // Compara la contraseña
    if (!match) {
      logger.warn('Intento de login con credenciales inválidas', { email });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' }); // Genera el JWT
    logger.info('Login exitoso', { userId: user.id, email });
    res.json({ token });
  } catch (err) {
    logger.error('Error durante el proceso de login', { error: err.message, stack: err.stack, email });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta para obtener el perfil del usuario (protegida con JWT)
app.get('/auth/profile', authenticateJWT, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, name, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      logger.warn('Perfil de usuario no encontrado (después de autenticación)', { userId: req.user.id });
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    logger.info('Acceso a perfil de usuario', { userId: req.user.id });
    res.json(users[0]);
  } catch (err) {
    logger.error('Error al obtener perfil de usuario', { error: err.message, stack: err.stack, userId: req.user.id });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta principal del servicio (health check simple)
app.get('/', (req, res) => {
  res.json({ message: 'Auth service corriendo' });
});

const PORT = 3000; // Puerto interno del contenedor para el servicio Auth
app.listen(PORT, () => {
  console.log(`Servicio Auth corriendo en el puerto ${PORT}`);
});
