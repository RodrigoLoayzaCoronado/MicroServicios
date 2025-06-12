const express = require('express');
const router = express.Router();
const facturaController = require('../controller/facturaController');
const { check } = require('express-validator');

// Validaciones
const validateFactura = [
  check('cliente_id', 'El ID del cliente es requerido').not().isEmpty(),
  check('cliente_id', 'El ID del cliente debe ser numérico').isInt(),
  check('fecha', 'La fecha es requerida').optional().isDate()
];

// Rutas para facturas
router.get('/', facturaController.getFacturas);
router.get('/:id', facturaController.getFacturaById);
router.get('/cliente/:clienteId', facturaController.getFacturasByCliente);

router.post('/', validateFactura, facturaController.createFactura);

router.put('/:id', validateFactura, facturaController.updateFactura);

router.delete('/:id', facturaController.deleteFactura);

module.exports = router;