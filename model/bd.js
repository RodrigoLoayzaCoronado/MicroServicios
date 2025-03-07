// db.js
const mysql = require('mysql2');

// Configurar la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',          // Dirección del servidor de la base de datos
  user: 'root',               // Usuario de la base de datos (cambia si es necesario)
  password: '',  // Contraseña de la base de datos (cambia si es necesario)
  database: 'bd_agenda',      // Nombre de la base de datos
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

module.exports = connection;