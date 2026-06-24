const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'abbonamenti.json');

// Nuova password impostata: Mangusta_2026!
const ADMIN_HASH = '$2a$10$tZ2pWwI7t9bHmWd02.hLleCgWqgZsnv3oR.jYl1eRsh9aB9eWjD1G';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(session({
    secret: 'abbonamenti-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Auth middleware
function requireAuth(req, res, next) {
    if (req.session.authenticated) return next();
    res.status(401).json({ error: 'Non autorizzato' });
}

// === ROUTE PAGINE (prima di static!) ===

// Login page - PUBLIC
app.get('/', (req, res) => {
    const filePath = path.resolve(__dirname, 'public', 'login.html');
    console.log('Serving login from:', filePath);
    res.sendFile(filePath);
});

// App page - PROTECTED
app.get('/app', (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect('/');
    }
    const filePath = path.resolve(__dirname, 'public', 'app.html');
    res.sendFile(filePath);
});

// === API ROUTES ===

app.post('/api/login', async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password richiesta' });
    
    const valid = await bcrypt.compare(password, ADMIN_HASH);
    if (valid) {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Password errata' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
    res.json({ authenticated: !!req.session.authenticated });
});

app.get('/api/records', requireAuth, (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Errore lettura dati' });
    }
});

app.post('/api/records', requireAuth, (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Errore salvataggio' });
    }
});

// === STATIC FILES (dopo le route!) ===
app.use(express.static(path.join(__dirname, 'public')));

// === INIT ===
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// ... il resto del file con il tuo array defaultData rimane invariato ...