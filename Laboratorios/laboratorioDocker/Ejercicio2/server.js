const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();

const db = mysql.createConnection({
    host: process.env.HOST || 'localhost', // Usa la variable de entorno 'HOST'
    user: process.env.USER || 'root',
    password: process.env.PASSWORD || 'password',
    database: process.env.DATABASE || 'usuariosdb'
});

db.connect(err => {
    if (err) throw err;
    console.log('Conectado a la base de datos MySQL');
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) throw err;
        res.render('index', { usuarios: results });
    });
});

app.post('/agregar', (req, res) => {
    const { nombre, correo } = req.body;
    db.query('INSERT INTO usuarios (nombre, correo) VALUES (?, ?)', [nombre, correo], (err) => {
        if (err) throw err;
        res.redirect('/');
    });
});

app.post('/eliminar/:id', (req, res) => {
    db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err) => {
        if (err) throw err;
        res.redirect('/');
    });
});

app.listen(8080, () => {
    console.log('Servidor corriendo en http://localhost:8080');
});