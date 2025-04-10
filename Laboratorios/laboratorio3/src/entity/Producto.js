const { EntitySchema } = require("typeorm");

module.exports.Producto = new EntitySchema({
  name: "Producto",
  tableName: "productos",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 100,
    },
    descripcion: {
      type: "text",
      nullable: true,
    },
    marca: {
      type: "varchar",
      length: 50,
    },
    stock: {
      type: "int",
      default: 0,
    },
    precio: { // Añadido aunque no estaba en el enunciado, es necesario para facturación
      type: "decimal",
      precision: 10,
      scale: 2,
    },
  },
});