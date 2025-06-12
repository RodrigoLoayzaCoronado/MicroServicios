const { EntitySchema } = require("typeorm");

module.exports.DetalleFactura = new EntitySchema({
  name: "DetalleFactura",
  tableName: "detalles_factura",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    factura_id: {
      type: "int",
    },
    producto_id: {
      type: "int",
    },
    cantidad: {
      type: "int",
    },
    precio_unitario: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    subtotal: {
      type: "decimal",
      precision: 12,
      scale: 2,
    },
  },
  relations: {
    factura: {
      type: "many-to-one",
      target: "Factura",
      joinColumn: {
        name: "factura_id",
      },
    },
    producto: {
      type: "many-to-one",
      target: "Producto",
      joinColumn: {
        name: "producto_id",
      },
    },
  },
});