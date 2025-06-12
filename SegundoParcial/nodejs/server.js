const express = require('express');
const app = express();
const cors = require('cors');
const sequelize = require('./config/db'); // Carga Sequelize para inicializar la conexión


//puerto ENV
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas

const adminAuth = require('./routes/adminAuth');


// Usar rutas

app.use('/api/adminAuth', adminAuth);

//Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: err.message
  });
});

//Middleware de manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.listen(port, () => {
  console.log(`"Servidor corriendo en puerto" ${port}`);
});
