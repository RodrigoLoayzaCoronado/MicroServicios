const connection = require('../model/bd.js');

// Operación READ (Obtener un contacto por su ID)
const obtenerContactoPorId = (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM agenda WHERE id = ?';
    connection.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error al obtener el contacto:', err);
        res.status(500).send('Error al obtener el contacto');
        return;
      }
      if (results.length === 0) {
        res.status(404).send('Contacto no encontrado');
        return;
      }
      const contacto = results[0];
      res.render('agenda/editar', { contacto }); // Renderizar la plantilla de edición
    });
  };

// Operación CREATE (Crear un nuevo contacto)
const crearContacto = (req, res) => {
  const { nombres, apellidos, direccion, telefono } = req.body;
  const query = 'INSERT INTO agenda (nombres, apellidos, direccion, telefono) VALUES (?, ?, ?, ?)';
  connection.query(query, [nombres, apellidos, direccion, telefono], (err, results) => {
    if (err) {
      console.error('Error al crear el contacto:', err);
      res.status(500).send('Error al crear el contacto');
      return;
    }
    res.redirect('/agenda');
  });
};

// Operación READ (Obtener todos los contactos)
const obtenerContactos = (req, res) => {
  const query = 'SELECT * FROM agenda';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los contactos:', err);
      res.status(500).send('Error al obtener los contactos');
      return;
    }
    res.render('agenda/index', { contactos: results });
  });
};

// Operación UPDATE (Actualizar un contacto)
const actualizarContacto = (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, direccion, telefono } = req.body;
  const query = 'UPDATE agenda SET nombres = ?, apellidos = ?, direccion = ?, telefono = ? WHERE id = ?';
  connection.query(query, [nombres, apellidos, direccion, telefono, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el contacto:', err);
      res.status(500).send('Error al actualizar el contacto');
      return;
    }
    res.redirect('/agenda');
  });
};

// Operación DELETE (Eliminar un contacto)
const eliminarContacto = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM agenda WHERE id = ?';
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el contacto:', err);
      res.status(500).send('Error al eliminar el contacto');
      return;
    }
    res.redirect('/agenda');
  });
};

module.exports = {
  crearContacto,
  obtenerContactos,
  actualizarContacto,
  eliminarContacto,
  obtenerContactoPorId
};