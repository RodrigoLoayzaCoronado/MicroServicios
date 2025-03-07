// controllers/tablaController.js
const generar = (req, res) => {
  const { operacion, numero, inicio, fin } = req.body;

  let tabla = [];
  for (let i = inicio; i <= fin; i++) {
      let resultado;
      switch (operacion) {
          case 'suma':
              resultado = numero + i;
              break;
          case 'resta':
              resultado = numero - i;
              break;
          case 'multiplicacion':
              resultado = numero * i;
              break;
          case 'division':
              resultado = numero / i;
              break;
          default:
              resultado = 'Operación no válida';
      }
      tabla.push({ numero, operacion, valor: i, resultado });
  }

  // Renderiza la vista y pasa los datos
  res.render('tabla', { tabla, operacion, numero });
};

module.exports = { generar };