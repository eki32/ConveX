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

// 🔥 IMPORTANTE: Ruta de health check ANTES de MySQL
app.get('/', (req, res) => {
    res.json({ 
        message: 'API ConveX funcionando correctamente',
        timestamp: new Date().toISOString(),
        status: 'ok'
    });
});

// 🔥 IMPORTANTE: Ruta de prueba de base de datos
app.get('/health', (req, res) => {
    db.ping((err) => {
        if (err) {
            return res.status(500).json({ 
                status: 'error', 
                message: 'Database connection failed',
                error: err.message 
            });
        }
        res.json({ 
            status: 'ok', 
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en puerto ${PORT}`);
});

// Conexión a MySQL
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
        console.error('Host:', process.env.DB_HOST);
        console.error('User:', process.env.DB_USER);
        console.error('Database:', process.env.DB_NAME);
        // No detenemos el servidor si falla MySQL
        return;
    }
    console.log('✅ Conectado a MySQL');
    console.log('📊 Database:', process.env.DB_NAME);
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