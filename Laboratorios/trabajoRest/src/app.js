const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Opcional para logs
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const express = require('express');
const router = express.Router();
const productoRoutes = require('./producto.routes');
const clienteRoutes = require('./cliente.routes');
const facturaRoutes = require('./factura.routes');
const detalleRoutes = require('./detalle.routes');



const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logger de solicitudes HTTP

// Swagger Documentation
const swaggerDocument = YAML.load(path.join(__dirname, './swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
router.use('/productos', productoRoutes);
router.use('/clientes', clienteRoutes);
router.use('/facturas', facturaRoutes);
router.use('/detalles', detalleRoutes);

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = router;
// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;