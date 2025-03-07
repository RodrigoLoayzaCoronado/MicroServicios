const calcular = (req, res) => {
    const { a, b, operacion } = req.body;
    let resultado;
  
    // Convertir a números
    const numA = parseFloat(a);
    const numB = parseFloat(b);
  
    // Realizar la operación seleccionada
    switch (operacion) {
      case 'sumar':
        resultado = numA + numB;
        break;
      case 'restar':
        resultado = numA - numB;
        break;
      case 'multiplicar':
        resultado = numA * numB;
        break;
      case 'dividir':
        resultado = numB !== 0 ? numA / numB : 'Error: División por cero';
        break;
      default:
        resultado = 'Operación no válida';
    }
  
    // Enviar el resultado como respuesta
    res.send(`El resultado es: ${resultado}`);
  };
  
  module.exports = { calcular };