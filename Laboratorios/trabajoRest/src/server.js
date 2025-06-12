require('dotenv').config();
const express = require("express");
const connectDB = require("./config/database");
const path = require("path");
const clienteRoutes = require("./routes/clienteRoutes");
const productoRoutes = require("./routes/productoRoutes");
const facturaRoutes = require("./routes/facturaRoutes");
const detalleRoutes = require("./routes/detalleRoutes");



const app = express();

// Configuración de middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Rutas
app.use("/api/clientes", clienteRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/facturas", facturaRoutes);
app.use("/api/detalles", detalleRoutes);
app.use("/", (req, res) => {
  res.send("Bienvenido a la página principal!!");
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
