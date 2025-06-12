const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT,
  logging: false // Desactiva logs de SQL (opcional)
});

// Sincronizar modelos con la base de datos
async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente');
    await sequelize.sync({ force: false }); // Crea la tabla si no existe, no elimina datos existentes
    console.log('Tablas sincronizadas');
  } catch (error) {
    console.error('Error al conectar o sincronizar con MySQL:', error);
    process.exit(1);
  }
}

syncDatabase();

module.exports = sequelize;