require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json({ limit: '10mb' })); 

// CORS
app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedDomains = [
            /https:\/\/.*\.vercel\.app$/,
            /https:\/\/.*\.up\.railway\.app$/, 
            /http:\/\/localhost(:\d+)?$/
        ];
        
        const isAllowed = allowedDomains.some(pattern => pattern.test(origin));
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
});

// ================== ENDPOINTS ==================

app.get('/', (req, res) => {
    res.json({ 
        message: 'API ConveX funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    db.ping((err) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Database connection failed' });
        }
        res.json({ status: 'ok', database: 'connected' });
    });
});

// VALIDAR CÓDIGO
app.post('/validar-codigo', (req, res) => {
  console.log('📝 Petición recibida en /validar-codigo');
  console.log('📦 Body:', req.body);
  
  const CODIGO_SECRETO = process.env.CODIGO_REGISTRO;
  console.log('🔑 Código esperado:', CODIGO_SECRETO);
  console.log('🔑 Código recibido:', req.body.codigo);
  
  if (req.body.codigo === CODIGO_SECRETO) {
    console.log('✅ Código correcto');
    return res.json({ valido: true });
  } else {
    console.log('❌ Código incorrecto');
    return res.json({ valido: false });
  }
});

// REGISTRO
app.post('/registro', (req, res) => {
    const { nombre, apellidos, email, password, fechaAlta, categoria, jornada } = req.body;
    const fechaLimpia = fechaAlta ? fechaAlta.split('T')[0] : null;

    try {
        const checkQuery = "SELECT email FROM usuarios WHERE email = ?";
        db.query(checkQuery, [email], async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error al verificar email' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const query = "INSERT INTO usuarios (nombre, apellidos, email, password, fecha_alta, categoria, jornada) VALUES (?, ?, ?, ?, ?, ?, ?)";

            db.query(query, [nombre, apellidos, email, hashedPassword, fechaLimpia, categoria, jornada || 40], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.sqlMessage });
                }
                console.log(`✅ Usuario registrado: ${email}`);
                res.status(200).json({ message: 'Usuario creado', id: result.insertId });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// LOGIN
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }
    
    db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        
        if (result.length === 0) {
            return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
        }

        try {
            const match = await bcrypt.compare(password, result[0].password);
            
            if (match) {
                const { password: _, ...userWithoutPassword } = result[0];
                console.log(`✅ Login exitoso: ${email}`);
                return res.json({ success: true, user: userWithoutPassword });
            } else {
                return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al verificar credenciales' });
        }
    });
});

// ESCANEAR NÓMINA
app.post('/api/escanear-nomina', async (req, res) => {
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: 'Imagen requerida' });
  }

  try {
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const payload = {
      contents: [{
        parts: [{
          text: `Eres un experto en nóminas de DIA España. Analiza la imagen y extrae: año, mes, salario base (código 0BG) y antigüedad (código WA3). Devuelve SOLO JSON: {"anio":2022,"mes":"string","salarioBase":number,"antiguedadPagada":number,"tipo":"MENSUAL"}`
        }, {
          inline_data: {
            mime_type: 'image/jpeg',
            data: base64Data
          }
        }]
      }]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const limpio = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const resultado = JSON.parse(limpio);
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// ACTUALIZAR JORNADA
app.put('/api/usuarios/actualizar', (req, res) => {
    const { email, jornada } = req.body;

    if (!email || jornada === undefined) {
        return res.status(400).json({ error: 'Email y jornada son requeridos' });
    }

    db.query('UPDATE usuarios SET jornada = ? WHERE email = ?', [jornada, email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ success: true, message: 'Jornada actualizada correctamente' });
    });
});

// ================== INICIAR SERVIDOR (AL FINAL) ==================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log('📋 Endpoints disponibles:');
    console.log('  POST /validar-codigo');
    console.log('  POST /registro');
    console.log('  POST /login');
});
