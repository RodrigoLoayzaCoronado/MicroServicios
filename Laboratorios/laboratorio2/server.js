const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const PORT = process.env.PORT || 8080;

// Middleware para servir archivos estáticos
app.use(express.static('public'));
app.use(express.json());

// Configurar EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', './views');
// Middleware para procesar datos del formulario
app.use(express.urlencoded({ extended: true }));

const calculadoraRoutes = require('./routes/calculadoraRoutes');
const userRoutes = require('./routes/userRoutes');
const indexRoutes = require('./routes/indexRoutes');

app.use("/calculadora", calculadoraRoutes);
app.use("/users", userRoutes);
app.use("/", indexRoutes);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});