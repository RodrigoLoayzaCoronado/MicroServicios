const express = require("express");
const router = express.Router();
const calculadoraController = require("../controllers/calculadoraController");

// Mostrar formulario de calculadora (GET)
router.get("/", (req, res) => {
    res.render("calculadora/index", { 
        title: "Ejercicio 1 - Calculadora",
        a: "",
        b: "",
        operation: "sum", // Valor por defecto
        result: null,
        error: null
    });
});

// Procesar cálculo (POST)
router.post("/calculate", calculadoraController.calcular);

module.exports = router;