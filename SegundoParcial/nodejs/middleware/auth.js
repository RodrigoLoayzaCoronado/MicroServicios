const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Middleware de autenticación para ADMINISTRADORES 
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN || process.env.JWT_SECRET);
    
    // Verificar que sea un token de administrador
    if (decoded.tipo !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren privilegios de administrador'
      });
    }
    
    // Verificar que el administrador existe
    const [users] = await pool.execute(
      'SELECT id, email, nombre FROM usuarios WHERE id = ?',
      [decoded.adminId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Administrador no válido'
      });
    }

    req.admin = {
      id: decoded.adminId,
      email: users[0].email,
      nombre: users[0].nombre,
      tipo: 'administrador'
    };

    next();
  } catch (error) {
    return handleTokenError(error, res);
  }
};

// Función auxiliar para manejar errores de token
const handleTokenError = (error, res) => {
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  return res.status(403).json({
    success: false,
    message: 'Token no válido'
  });
};

module.exports = {
  authenticateAdmin
};