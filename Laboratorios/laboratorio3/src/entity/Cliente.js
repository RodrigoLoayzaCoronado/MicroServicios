const { EntitySchema } = require("typeorm");

module.exports.Cliente = new EntitySchema({
  name: "Cliente",
  tableName: "clientes",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    ci: {
      type: "varchar",
      length: 20,
      unique: true,
    },
    nombres: {
      type: "varchar",
      length: 100,
    },
    apellidos: {
      type: "varchar",
      length: 100,
    },
    sexo: {
      type: "varchar",
      length: 1,
      comment: "M: Masculino, F: Femenino, O: Otro",
    },
  },
});