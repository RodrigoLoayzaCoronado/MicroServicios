const pool = require('../models/db');

module.exports = {
    getAllUsers: async (req, res) => {
        try {
            const [users] = await pool.query(`
                SELECT id, name, email, created_at 
                FROM users 
                ORDER BY created_at DESC
            `);
            res.render('users/index', {
                title: 'Gestión de Usuarios',
                users: users || [],
                error: null
            });
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.render('users/index', {
                title: 'Gestión de Usuarios',
                users: [],
                error: 'Error al cargar los usuarios'
            });
        }
    },

    addUserForm: (req, res) => {
        res.render('users/add', {
            title: 'Agregar Usuario',
            formData: { name: '', email: '' },
            error: null
        });
    },

    createUser: async (req, res) => {
        const { name, email } = req.body;
        
        if (!name || !email) {
            return res.render('users/add', {
                title: 'Agregar Usuario',
                formData: req.body,
                error: 'Nombre y email son requeridos'
            });
        }

        try {
            await pool.query(
                'INSERT INTO users (name, email) VALUES (?, ?)',
                [name, email]
            );
            res.redirect('/users');
        } catch (error) {
            console.error('Error al crear usuario:', error);
            res.render('users/add', {
                title: 'Agregar Usuario',
                formData: req.body,
                error: error.code === 'ER_DUP_ENTRY' 
                    ? 'El email ya está registrado' 
                    : 'Error al guardar el usuario'
            });
        }
    },

    deleteUser: async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM users WHERE id = ?', [id]);
            res.redirect('/users');
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.redirect('/users');
        }
    }
};