require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE BASE DE DATOS
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306 // Railway suele usar 3306 por defecto
});

db.connect(err => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL en la nube');
});

// RUTAS
app.post('/registro', (req, res) => {
    const { nombre, apellidos, email, password, fechaAlta, categoria } = req.body;
    const query = "INSERT INTO usuarios (nombre, apellidos, email, password, fecha_alta, categoria) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(query, [nombre, apellidos, email, password, fechaAlta, categoria], (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.status(200).json({ message: 'Usuario creado' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM usuarios WHERE email = ? AND password = ?";
    db.query(query, [email, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err });
        if (result.length > 0) {
            res.json({ success: true, user: result[0] });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    });
});

// PUERTO (SOLO UN LISTEN Y AL FINAL)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});