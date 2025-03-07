const express = require('express');
const router = express.Router();
const { generar } = require('../controller/tablaController');

// Ruta para mostrar el formulario
router.get('/tabla', (req, res) => {
  res.render('form');
});

// Ruta para procesar el formulario y mostrar la tabla
router.post('/generar-tabla', generar);

module.exports = router;