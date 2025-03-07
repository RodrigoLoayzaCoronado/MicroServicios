const express = require('express');
const router = express.Router();
const {
  crearContacto,
  obtenerContactos,
  actualizarContacto,
  eliminarContacto,
  obtenerContactoPorId, // Nueva función para obtener un contacto por su ID
} = require('../controller/agendaController');

// Ruta para mostrar todos los contactos
router.get('/', obtenerContactos);

// Ruta para mostrar el formulario de edición de un contacto
router.get('/editar/:id', obtenerContactoPorId);

// Ruta para crear un nuevo contacto
router.post('/crear', crearContacto);

// Ruta para actualizar un contacto
router.post('/actualizar/:id', actualizarContacto);

// Ruta para eliminar un contacto
router.get('/eliminar/:id', eliminarContacto);

module.exports = router;