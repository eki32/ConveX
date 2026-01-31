require('dotenv').config(); // <-- Esta línea debe ser la PRIMERA
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Permitir Vercel
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    // Si el navegador pregunta (OPTIONS), respondemos OK de inmediato
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ConveX',
    port: process.env.DB_PORT || 3306

});

db.connect(err => {
    if (err) throw err;
    console.log('✅ Conectado a MySQL');
});

app.post('/registro', (req, res) => {
    const { nombre, apellidos, email, password, fechaAlta, categoria } = req.body;
    
    // Mapeamos fechaAlta (Angular) -> fecha_alta (MySQL)
    const query = "INSERT INTO usuarios (nombre, apellidos, email, password, fecha_alta, categoria) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(query, [nombre, apellidos, email, password, fechaAlta, categoria], (err, result) => {
        if (err) {
            console.error("❌ Error en MySQL:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.status(200).json({ message: 'Usuario creado' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM usuarios WHERE email = ? AND password = ?";

    db.query(query, [email, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err });
        
        if (result.length > 0) {
            // Enviamos success: true para que login.ts entre al bloque de navegación
            res.json({ success: true, user: result[0] });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    });
});
