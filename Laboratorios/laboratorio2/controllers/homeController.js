module.exports = {
    showHome: (req, res) => {
        res.render('index', { 
            title: 'Laboratorio Microservicios' 
        });
    }
};