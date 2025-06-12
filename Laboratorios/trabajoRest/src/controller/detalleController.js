const detalleService = require('../entity/Detalle');
const { validationResult } = require('express-validator');

exports.getDetallesByFactura = async (req, res) => {
  try {
    const detalles = await detalleService.findByFactura(req.params.facturaId);
    res.json(detalles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addDetalle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const detalle = await detalleService.create({
      ...req.body,
      factura_id: req.params.facturaId
    });
    res.status(201).json(detalle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateDetalle = async (req, res) => {
  try {
    const detalle = await detalleService.update(
      req.params.detalleId,
      req.body
    );
    if (!detalle) {
      return res.status(404).json({ error: 'Detalle no encontrado' });
    }
    res.json(detalle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteDetalle = async (req, res) => {
  try {
    const deleted = await detalleService.delete(req.params.detalleId);
    if (!deleted) {
      return res.status(404).json({ error: 'Detalle no encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};