const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuarios = require('../models/Usuarios');

const generateAdminToken = (adminId) => {
  return jwt.sign(
    { 
      adminId: adminId,
      tipo: 'administrador'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRATION
    }
  );
};

const registerAdmin = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validar datos de entrada
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: nombre, email o password'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await Usuarios.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const saltRounds = 14;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario
    const user = await Usuarios.create({
      nombre,
      email,
      password_hash: hashedPassword
    });

    const token = generateAdminToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        admin: {
          id: user.id,
          nombre: user.nombre,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Error en registro de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: email o password'
      });
    }

    // Buscar usuario por email
    const user = await Usuarios.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = generateAdminToken(user.id);

    res.json({
      success: true,
      message: 'Login usuario exitoso',
      data: {
        token,
        admin: {
          id: user.id,
          nombre: user.nombre,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Error en login de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
};