const productoService = require('../entity/Producto');
const { validationResult } = require('express-validator');

exports.getProductos = async (req, res) => {
  try {
    const { page = 1, limit = 10, marca, minPrice, maxPrice } = req.query;
    const filters = { marca, minPrice, maxPrice };
    const result = await productoService.findAll(page, limit, filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductoById = async (req, res) => {
  try {
    const producto = await productoService.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProducto = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const producto = await productoService.create(req.body);
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProducto = async (req, res) => {
  try {
    const producto = await productoService.update(req.params.id, req.body);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProducto = async (req, res) => {
  try {
    const deleted = await productoService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const producto = await productoService.updateStock(
      req.params.id, 
      req.body.cantidad
    );
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};