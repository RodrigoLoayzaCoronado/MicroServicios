const express = require('express');
const router = express.Router();
const detalleController = require('../controllers/detalleController');
const { check } = require('express-validator');

// Validaciones
const validateDetalle = [
  check('producto_id', 'El ID del producto es requerido').not().isEmpty(),
  check('producto_id', 'El ID del producto debe ser numérico').isInt(),
  check('cantidad', 'La cantidad es requerida').not().isEmpty(),
  check('cantidad', 'La cantidad debe ser un número entero positivo').isInt({ min: 1 }),
  check('precio_unitario', 'El precio unitario es requerido').not().isEmpty(),
  check('precio_unitario', 'El precio unitario debe ser un número positivo').isFloat({ min: 0 })
];

// Rutas para detalles de factura
router.get('/factura/:facturaId', detalleController.getDetallesByFactura);

router.post('/factura/:facturaId', validateDetalle, detalleController.addDetalle);

router.put('/:detalleId', validateDetalle, detalleController.updateDetalle);

router.delete('/:detalleId', detalleController.deleteDetalle);

module.exports = router;