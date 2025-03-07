const express = require('express');
const router = express.Router();
const { calcular } = require('../Controller/calculadoraController'); 

// Ruta para manejar las operaciones
router.post('/calcular', calcular);

module.exports = router;