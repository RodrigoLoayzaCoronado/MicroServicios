const facturaService = require('../entity/Factura');
const { validationResult } = require('express-validator');

exports.getFacturas = async (req, res) => {
  try {
    const { page = 1, limit = 10, clienteId, fechaInicio, fechaFin } = req.query;
    const filters = { clienteId, fechaInicio, fechaFin };
    const result = await facturaService.findAll(page, limit, filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFacturaById = async (req, res) => {
  try {
    const factura = await facturaService.findByIdWithDetails(req.params.id);
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.json(factura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createFactura = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const factura = await facturaService.create(req.body);
    res.status(201).json(factura);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateFactura = async (req, res) => {
  try {
    const factura = await facturaService.update(req.params.id, req.body);
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.json(factura);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteFactura = async (req, res) => {
  try {
    const deleted = await facturaService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFacturasByCliente = async (req, res) => {
  try {
    const facturas = await facturaService.findByCliente(req.params.clienteId);
    res.json(facturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};