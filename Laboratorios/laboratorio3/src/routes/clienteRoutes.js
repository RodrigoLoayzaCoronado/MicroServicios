const express = require('express');
const router = express.Router();
const clienteController = require('../controller/clienteController');
const { check } = require('express-validator');

// Validaciones
const validateCliente = [
  check('ci', 'La cédula es requerida').not().isEmpty(),
  check('nombres', 'Los nombres son requeridos').not().isEmpty(),
  check('apellidos', 'Los apellidos son requeridos').not().isEmpty(),
  check('sexo', 'El sexo debe ser M, F u O').isIn(['M', 'F', 'O'])
];

// Rutas para clientes
router.get('/', clienteController.getClientes);
router.get('/:id', clienteController.getClienteById);
router.get('/ci/:ci', clienteController.getClienteByCi);

router.post('/', validateCliente, clienteController.createCliente);

router.put('/:id', validateCliente, clienteController.updateCliente);

router.delete('/:id', clienteController.deleteCliente);

module.exports = router;