const express = require('express');
const router = express.Router();
const productoController = require('../controller/productoController');
const { check } = require('express-validator');

// Validaciones
const validateProducto = [
  check('nombre', 'El nombre es requerido').not().isEmpty(),
  check('marca', 'La marca es requerida').not().isEmpty(),
  check('stock', 'El stock debe ser un número entero').isInt({ min: 0 }),
  check('precio', 'El precio debe ser un número positivo').isFloat({ min: 0 })
];

// Rutas para productos
router.get('/', productoController.getProductos);
router.get('/:id', productoController.getProductoById);

router.post('/', validateProducto, productoController.createProducto);

router.put('/:id', validateProducto, productoController.updateProducto);
router.patch('/:id/stock', [
  check('cantidad', 'La cantidad debe ser un número entero').isInt()
], productoController.updateStock);

router.delete('/:id', productoController.deleteProducto);

// Búsqueda especializada
router.get('/search/:term', productoController.searchProductos);
router.get('/marca/:marca', productoController.getByMarca);

module.exports = router;