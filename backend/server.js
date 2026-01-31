require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Configuración CORS
app.use(cors({
    origin: ['https://convex-app-kappa.vercel.app', 'http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'API ConveX funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
});

// 🔥 IMPORTANTE: Railway usa estos nombres de variables
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ConveX',
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err.message);
        console.error('Host:', process.env.MYSQLHOST);
        console.error('User:', process.env.MYSQLUSER);
        console.error('Database:', process.env.MYSQLDATABASE);
        return;
    }
    console.log('✅ Conectado a MySQL');
    console.log('📊 Database:', process.env.MYSQLDATABASE);
});

app.post('/registro', (req, res) => {
    const { nombre, apellidos, email, password, fechaAlta, categoria } = req.body;
    
    const query = "INSERT INTO usuarios (nombre, apellidos, email, password, fecha_alta, categoria) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(query, [nombre, apellidos, email, password, fechaAlta, categoria], (err, result) => {
        if (err) {
            console.error("❌ Error en MySQL:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.status(200).json({ message: 'Usuario creado', id: result.insertId });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM usuarios WHERE email = ? AND password = ?";

    db.query(query, [email, password], (err, result) => {
        if (err) {
            console.error("❌ Error en login:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        if (result.length > 0) {
            res.json({ success: true, user: result[0] });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
    });
});