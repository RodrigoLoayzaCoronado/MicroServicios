exports.calcular = (req, res) => {
    const { a, b, operation } = req.body;
    let result;

    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (isNaN(numA) || isNaN(numB)) {
        return res.render("calculadora/index", { 
            title: "Ejercicio 1 - Calculadora",
            a,
            b,
            operation,
            result: null,
            error: "Valores inválidos" 
        });
    }

    switch (operation) {
        case "sum":
            result = numA + numB;
            break;
        case "subtract":
            result = numA - numB;
            break;
        case "multiply":
            result = numA * numB;
            break;
        case "divide":
            if (numB === 0) {
                return res.render("calculadora/index", { 
                    title: "Ejercicio 1 - Calculadora",
                    a,
                    b,
                    operation,
                    result: null,
                    error: "No se puede dividir por cero" 
                });
            }
            result = numA / numB;
            break;
        default:
            return res.render("calculadora/index", { 
                title: "Ejercicio 1 - Calculadora",
                a,
                b,
                operation,
                result: null,
                error: "Operación inválida" 
            });
    }

    res.render("calculadora/index", { 
        title: "Ejercicio 1 - Calculadora",
        a,
        b,
        operation,
        result,
        error: null
    });
};