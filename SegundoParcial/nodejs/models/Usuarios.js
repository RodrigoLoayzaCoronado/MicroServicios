const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ajusta según tu configuración de Sequelize

const Usuarios = sequelize.define('Usuarios', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(200),
    allowNull: false
  }
}, {
  tableName: 'usuarios', // Nombre de la tabla en la base de datos
  timestamps: false // Desactiva createdAt/updatedAt
});

module.exports = Usuarios;