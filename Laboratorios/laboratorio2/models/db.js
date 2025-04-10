const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db', // Usar 'db' para Docker
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'microServiciolab2',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión al iniciar
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    await connection.ping();
    console.log('✅ Ping a la base de datos exitoso');
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

testConnection().catch(error => {
  console.error('Error crítico en la conexión:', error);
  process.exit(1);
});

module.exports = pool;