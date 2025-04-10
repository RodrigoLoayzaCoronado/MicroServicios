const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
      <h2>Calculadora Web</h2>
      <form action="/calcular" method="POST">
        <label for="a">Valor A:</label>
        <input type="number" name="a" required><br>
        <label for="b">Valor B:</label>
        <input type="number" name="b" required><br>
        <label for="operacion">Operación:</label>
        <select name="operacion">
          <option value="sumar">Sumar</option>
          <option value="restar">Restar</option>
          <option value="multiplicar">Multiplicar</option>
          <option value="dividir">Dividir</option>
        </select><br><br>
        <button type="submit">Calcular</button>
      </form>
    `);
  });

  app.post('/calcular', (req, res) => {
    const a = parseFloat(req.body.a);
    const b = parseFloat(req.body.b);
    const operacion = req.body.operacion;
    let resultado;
  
    switch (operacion) {
      case 'sumar':
        resultado = a + b;
        break;
      case 'restar':
        resultado = a - b;
        break;
      case 'multiplicar':
        resultado = a * b;
        break;
      case 'dividir':
        resultado = b !== 0 ? a / b : 'Error: División por cero';
        break;
      default:
        resultado = 'Operación no válida';
    }
  
    res.send(`<h2>Resultado: ${resultado}</h2><a href="/">Volver</a>`);
  });
  
  app.listen(8080, () => {
    console.log('Servidor corriendo en http://localhost:8080');
  });