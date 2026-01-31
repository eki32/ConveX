require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();

// Configuración CORS
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedPatterns = [
            /^https:\/\/.*\.vercel\.app$/,
            /^http:\/\/localhost(:\d+)?$/
        ];
        
        const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
        callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rutas de health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'API ConveX funcionando correctamente',
        timestamp: new Date().toISOString(),
        status: 'ok'
    });
});

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

const PORT = process.env.PORT || 8080;
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
        return;
    }
    console.log('✅ Conectado a MySQL');
    console.log('📊 Database:', process.env.DB_NAME);
});

// ========================================
// 🔐 REGISTRO CON ENCRIPTACIÓN
// ========================================
app.post('/registro', async (req, res) => {
    const { nombre, apellidos, email, password, fechaAlta, categoria } = req.body;
    
    // Validaciones básicas
    if (!nombre || !apellidos || !email || !password) {
        return res.status(400).json({ 
            error: 'Todos los campos son requeridos' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            error: 'La contraseña debe tener al menos 6 caracteres' 
        });
    }
    
    try {
        // Verificar si el email ya existe
        const checkQuery = "SELECT email FROM usuarios WHERE email = ?";
        
        db.query(checkQuery, [email], async (err, results) => {
            if (err) {
                console.error("❌ Error verificando email:", err);
                return res.status(500).json({ error: 'Error al verificar email' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ 
                    error: 'El email ya está registrado' 
                });
            }
            
            try {
                // Encriptar la contraseña
                console.log(`🔐 Encriptando contraseña para: ${email}`);
                const hashedPassword = await bcrypt.hash(password, 10);
                
                // Insertar usuario con contraseña encriptada
                const insertQuery = `
                    INSERT INTO usuarios 
                    (nombre, apellidos, email, password, fecha_alta, categoria) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                db.query(
                    insertQuery, 
                    [nombre, apellidos, email, hashedPassword, fechaAlta, categoria], 
                    (err, result) => {
                        if (err) {
                            console.error("❌ Error en MySQL:", err.sqlMessage);
                            return res.status(500).json({ error: err.sqlMessage });
                        }
                        
                        console.log(`✅ Usuario registrado con éxito: ${email}`);
                        console.log(`   ID: ${result.insertId}`);
                        
                        res.status(200).json({ 
                            message: 'Usuario creado exitosamente', 
                            id: result.insertId 
                        });
                    }
                );
            } catch (bcryptError) {
                console.error("❌ Error al encriptar contraseña:", bcryptError);
                return res.status(500).json({ 
                    error: 'Error al procesar la contraseña' 
                });
            }
        });
        
    } catch (error) {
        console.error("❌ Error general en registro:", error);
        res.status(500).json({ error: 'Error al procesar el registro' });
    }
});

// ========================================
// 🔑 LOGIN CON VERIFICACIÓN SEGURA
// ========================================
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Validaciones básicas
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email y contraseña son requeridos' 
        });
    }
    
    const query = "SELECT * FROM usuarios WHERE email = ?";

    db.query(query, [email], async (err, result) => {
        if (err) {
            console.error("❌ Error en login:", err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error en el servidor' 
            });
        }
        
        // Verificar si el usuario existe
        if (result.length === 0) {
            console.log(`❌ Intento de login - Usuario no encontrado: ${email}`);
            return res.status(401).json({ 
                success: false, 
                message: 'Email o contraseña incorrectos' 
            });
        }
        
        try {
            const usuario = result[0];
            
            // Comparar la contraseña ingresada con el hash almacenado
            console.log(`🔐 Verificando contraseña para: ${email}`);
            const match = await bcrypt.compare(password, usuario.password);
            
            if (match) {
                // ⚠️ IMPORTANTE: NO devolver la contraseña al cliente
                const { password: _, ...userWithoutPassword } = usuario;
                
                console.log(`✅ Login exitoso: ${email}`);
                
                res.json({ 
                    success: true, 
                    user: userWithoutPassword 
                });
            } else {
                console.log(`❌ Contraseña incorrecta para: ${email}`);
                res.status(401).json({ 
                    success: false, 
                    message: 'Email o contraseña incorrectos' 
                });
            }
        } catch (bcryptError) {
            console.error("❌ Error al comparar contraseñas:", bcryptError);
            res.status(500).json({ 
                success: false, 
                message: 'Error al verificar credenciales' 
            });
        }
    });
});

// ========================================
// 📊 OBTENER TODOS LOS USUARIOS (para admin)
// ========================================
app.get('/usuarios', (req, res) => {
    const query = "SELECT id, nombre, apellidos, email, fecha_alta, categoria FROM usuarios";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error obteniendo usuarios:", err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        
        res.json({ usuarios: results });
    });
});