const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/AutenticacionController');
const { authenticateAdmin } = require('../middleware/auth');


// Rutas públicas para administradores
router.post('/login', adminAuthController.loginAdmin);
// Rutas protegidas para administradores
router.post('/register', adminAuthController.registerAdmin);
module.exports = router;