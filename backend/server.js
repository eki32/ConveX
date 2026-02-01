require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();

// ✅ Configuración CORS CORREGIDA
/*app.use(cors({
    origin: [
        'https://convex-app-kappa.vercel.app',
        'https://convex-k0hdiejgs-ekaitzs-projects-43e98c06.vercel.app', // ⭐ Añadido
        'http://localhost:4200',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));*/

app.use(express.json({ limit: '10mb' })); 


// O MEJOR AÚN: Acepta todos los subdominios de Vercel (más flexible)

app.use(cors({
    origin: function(origin, callback) {
        // Permite requests sin origin (como Postman) o desde dominios permitidos
        if (!origin) return callback(null, true);
        
        const allowedDomains = [
            /https:\/\/.*\.vercel\.app$/,  // ⭐ Cualquier subdominio .vercel.app
            /http:\/\/localhost(:\d+)?$/   // localhost con cualquier puerto
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

//app.use(express.json());


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
    const { nombre, apellidos, email, password, fechaAlta, categoria, jornada } = req.body;
    const fechaLimpia = fechaAlta ? fechaAlta.split('T')[0] : null;

    try {
        const checkQuery = "SELECT email FROM usuarios WHERE email = ?";
        db.query(checkQuery, [email], async (err, results) => {
            if (err) {
                console.error("❌ Error verificando email:", err);
                return res.status(500).json({ error: 'Error al verificar email' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            // 2. Encriptar la contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const query = "INSERT INTO usuarios (nombre, apellidos, email, password, fecha_alta, categoria, jornada) VALUES (?, ?, ?, ?, ?, ?, ?)";

            // NOTA: Aquí deberías usar 'hashedPassword' si quieres que se guarde encriptada
            db.query(query, [nombre, apellidos, email, hashedPassword, fechaLimpia, categoria, jornada || 40], (err, result) => {
                if (err) {
                    console.error("❌ Error detallado:", err);
                    return res.status(500).json({ error: err.sqlMessage });
                }
                console.log(`✅ Usuario registrado: ${email}`);
                res.status(200).json({ message: 'Usuario creado', id: result.insertId });
            });
        }); // <-- Cierra el bloque db.query de checkQuery
    } catch (error) { // <-- Aquí se cierra el try
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/escanear-nomina', async (req, res) => {
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: 'Imagen requerida' });
  }

  try {
    console.log('📸 Procesando imagen con Gemini...');
    
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Eres un experto en nóminas de DIA España.
Analiza la imagen para un trabajador del Grupo que recojas en la lectura de nóminas.
Extrae: año, mes, salario base (código 0BG) y antigüedad (código WA3).

REGLA CRÍTICA:
Si el salario base es menor a 900, avisa.

Devuelve SOLO JSON puro con este formato exacto:
{"anio":2022,"mes":"string","salarioBase":number,"antiguedadPagada":number,"tipo":"MENSUAL"}`
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Gemini API:', errorData);
      return res.status(response.status).json({ 
        error: 'Error al procesar la imagen con Gemini' 
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('❌ No se recibió texto de Gemini');
      return res.status(500).json({ error: 'No se pudo extraer información' });
    }

    const limpio = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const resultado = JSON.parse(limpio);
    
    console.log('✅ Nómina procesada:', resultado);
    res.json(resultado);

  } catch (error) {
    console.error('❌ Error en escanear-nomina:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email y contraseña son requeridos' 
        });
    }
    
    const query = "SELECT * FROM usuarios WHERE email = ?";

    db.query(query, [email, password], async (err, result) => {
        if (err) {
            console.error("❌ Error en login:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        
        if (result.length > 0) {
            res.json({ success: true, user: result[0] });
        } else {
            res.json({ success: false, message: 'Usuario no encontrado' });
        }
        try {
            // Comparar la contraseña ingresada con el hash almacenado
            const match = await bcrypt.compare(password, result[0].password);
            
            if (match) {
                // ⚠️ IMPORTANTE: NO devolver la contraseña al cliente
                const { password: _, ...userWithoutPassword } = result[0];
                
                console.log(`✅ Login exitoso: ${email}`);
                res.json({ 
                    success: true, 
                    user: userWithoutPassword 
                });
            } else {
                console.log(`❌ Intento de login fallido: ${email}`);
                res.status(401).json({ 
                    success: false, 
                    message: 'Email o contraseña incorrectos' 
                });
            }
        } catch (error) {
            console.error("❌ Error al comparar contraseñas:", error);
            res.status(500).json({ 
                success: false, 
                message: 'Error al verificar credenciales' 
            });
        }

    });
});