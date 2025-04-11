const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Tarea = require('./models/tarea');
const cors = require('cors');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
const mongoURI = process.env.MONGODB_URI || 'mongodb://mongo:27017/tareasdb';
mongoose.connect(mongoURI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('No se pudo conectar a MongoDB', err));


app.get('/tareas', async (req, res) => {
    try {
        const tareas = await Tarea.find();
        res.json(tareas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
);

app.post('/tareas', async (req, res) => {
    const nuevaTarea = new Tarea(req.body);
    await nuevaTarea.save()
        .then(tarea => res.status(201).json(tarea))
        .catch(err => res.status(400).json({ message: err.message }));
});

app.put('/tareas/:id', async (req, res) => {
    const tareaActualizada = await Tarea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(tareaActualizada);
});

app.delete('/tareas/:id', async (req, res) => {
    await Tarea.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tarea eliminada' });
});

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});