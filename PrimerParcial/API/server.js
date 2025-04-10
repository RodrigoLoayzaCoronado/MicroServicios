const express = require('express');
const app = express();
const mongoose = require('mongoose');

app.use(express.json());

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/librosdb';

const db = mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('MongoDB error:', err));

const libros = mongoose.model('libros', new mongoose.Schema({
    titulo: String,
    autor: String,
    editorial: String,
    anio: Number,
    descripcion: String,
    numero_pagina: Number
    }));

app.get('/libros', async (req, res) => {
    try {
        const librosList = await libros.find();
        res.json(librosList);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los libros' });
    }
});

app.post('/libros', async (req, res) => {
    try{
        const nuevoLibro = new libros(req.body);
        await nuevoLibro.save();
        res.status(201).json(nuevoLibro);   
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar el libro' });
    }
});

app.put('/libros/:id', async (req, res) => {
    try {
        const libroActualizado = await libros.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(libroActualizado);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar el libro' });
    }
});

app.delete('/libros/:id', async (req, res) => {
    try {
        const libroEliminado = await libros.findByIdAndDelete(req.params.id);
        res.json({ message: 'Libro eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el libro' });
    }
});

app.listen(3000, () =>{
    console.log('Servidor corriendo en el puerto 3000')
});