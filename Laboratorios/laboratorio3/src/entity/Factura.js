const { EntitySchema } = require("typeorm");

module.exports.Factura = new EntitySchema({
  name: "Factura",
  tableName: "facturas",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    fecha: {
      type: "date",
      default: () => "CURRENT_DATE",
    },
    cliente_id: {
      type: "int",
    },
    total: { // Campo calculado para almacenar el total de la factura
      type: "decimal",
      precision: 12,
      scale: 2,
      default: 0,
    },
  },
  relations: {
    cliente: {
      type: "many-to-one",
      target: "Cliente",
      joinColumn: {
        name: "cliente_id",
      },
    },
    detalles: {
      type: "one-to-many",
      target: "DetalleFactura",
      inverseSide: "factura",
    },
  },
});