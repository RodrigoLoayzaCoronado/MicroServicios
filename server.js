const express = require('express');
const app = express();
const port = 5000;

// Middleware para servir archivos estáticos
app.use(express.static('public'));
// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware para procesar datos del formulario
app.use(express.urlencoded({ extended: true }));

// Importar y usar las rutas de la calculadora
const calculadoraRoutes = require('./Routes/calculadoraRoutes');
const tablaRoutes = require('./routes/tablaRoutes');
const agendaRoutes = require('./routes/agendaRoutes');

app.use('/agenda', agendaRoutes);
app.use('/', calculadoraRoutes);
app.use('/', tablaRoutes);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
