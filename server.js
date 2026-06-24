const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'abbonamenti.json');

// === CONFIGURAZIONE LOGIN ===
// Password di default: password123
const ADMIN_HASH = '$2a$12$9juPGVLmbnCbi7zQpIidDuGM6CUfl79al0lkyoJ74FE9hh7CzAkUC/.og/at2.uheWG/igi';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(session({
    secret: 'abbonamenti-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// === MIDDLEWARE AUTH ===
function requireAuth(req, res, next) {
    if (req.session.authenticated) return next();
    res.status(401).json({ error: 'Non autorizzato', loginRequired: true });
}

// === ROTTE PAGINE (prima di express.static!) ===

// Pagina login - accessibile a tutti
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// App protetta - richiede login
app.get('/app.html', (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// === ROTTE API ===
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

app.get('/health', (req, res) => {
    res.json({ status: 'ok', protected: true });
});

// === STATIC FILES (DOPO le route!) ===
// Serve solo i file che non hanno route dedicate
app.use(express.static('public'));

// === INIZIALIZZAZIONE DATI ===
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

const defaultData = [
  {"payerName":"Andrea Verghetti","servizio":"Disney Plus (casarox2023@gmail.com)","quota":"4.00","metodo":"Satispay","ultimoPagamento":"2026-06-12","stato":"In Regola","contatto":"+393298799008","note":"","id":"rec_0"},
  {"payerName":"Hamza","servizio":"SURFSHARK (mangustavelox@gmail.com)","quota":"1.50","metodo":"PayPal","ultimoPagamento":"2026-06-12","stato":"In Regola","contatto":"+33 7 66 75 26 70","note":"","id":"rec_1"},
  {"payerName":"Rob","servizio":"Netflix PRemium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-06-09","stato":"In Regola","contatto":"rbmusica@gmail.com - 3406563973","note":"","id":"rec_2"},
  {"payerName":"Paulin G","servizio":"SURFSHARK (mangustavelox@gmail.com)","quota":"1.50","metodo":"PayPal","ultimoPagamento":"2026-06-23","stato":"In Regola","contatto":"(819) 318-2955","note":"","id":"rec_3"},
  {"payerName":"Maurizio Pinto","servizio":"Tidal (Rosfe2025tidal@outlook.com)","quota":"3.50","metodo":"Satispay","ultimoPagamento":"2026-06-01","stato":"In Regola","contatto":"+39 3389949930","note":"","id":"rec_4"},
  {"payerName":"Antonio Vernillo","servizio":"Netflix Premium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-06-01","stato":"In Regola","contatto":"+39 329 105 4354","note":"","id":"rec_5"},
  {"payerName":"Piero Marrucelli","servizio":"Netflix Premium","quota":"5.00","metodo":"Bonifico Bancario","ultimoPagamento":"2026-06-14","stato":"In Regola","contatto":"Whatsapp +393290118270","note":"","id":"rec_6"},
  {"payerName":"Marco Ventimiglia","servizio":"Spotify","quota":"3.00","metodo":"PayPal","ultimoPagamento":"2026-08-01","stato":"In Regola","contatto":"+39 351 356 7270","note":"","id":"rec_7"},
  {"payerName":"Gabriele Salomone","servizio":"Tidal (tidalmala@outlook.com)","quota":"3.50","metodo":"Satispay","ultimoPagamento":"2026-06-14","stato":"In Regola","contatto":"Whatsapp +393405072438","note":"","id":"rec_8"},
  {"payerName":"Marco Ventimiglia","servizio":"Netflix Premium","quota":"5.00","metodo":"Bonifico","ultimoPagamento":"2026-05-28","stato":"In Regola","contatto":"Whatsapp +39 3513567270","note":"","id":"rec_9"},
  {"payerName":"Tiziana La Mantia","servizio":"Netflix Premium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-07-01","stato":"In Regola","contatto":"+39 389 557 4357","note":"","id":"rec_10"},
  {"payerName":"Claudio B","servizio":"Tidal Fedetid2025@hotmail.com","quota":"3.50","metodo":"PayPal","ultimoPagamento":"2026-06-06","stato":"In Regola","contatto":"sarapone@gmail.com","note":"","id":"rec_11"},
  {"payerName":"Davide berti - 3381803535","servizio":"Nord vpn (decoder2rox@gmail.com)","quota":"2.00","metodo":"Bonifico","ultimoPagamento":"2026-06-21","stato":"In Regola","contatto":"iamdavideberti@gmail.com","note":"","id":"rec_12"},
  {"payerName":"Antonio Schinzari","servizio":"Netflix Premium","quota":"5.00","metodo":"Bonifico Bancario","ultimoPagamento":"2026-06-01","stato":"In Regola","contatto":"+393404722707","note":"","id":"rec_13"},
  {"payerName":"Alessandro Tabachi","servizio":"Crunchyroll (casarox_2023@outlook.com)","quota":"2.50","metodo":"PayPal","ultimoPagamento":"2026-06-01","stato":"In Regola","contatto":"sbatacchi7@gmail.com","note":"","id":"rec_14"},
  {"payerName":"Carlo Liberali (Fedejr)","servizio":"Netflix Premium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-06-22","stato":"In Regola","contatto":"+393473046012","note":"","id":"rec_15"},
  {"payerName":"Marco PANETTO","servizio":"SPOTIFY (Tidalmala@outlook.it)","quota":"3.00","metodo":"Bonifico Bancario","ultimoPagamento":"2026-08-11","stato":"In Regola","contatto":"WhatsApp +39 3357590836","note":"","id":"rec_16"},
  {"payerName":"Giuseppe Maria Sicignano","servizio":"Netflix Premium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-06-07","stato":"In Regola","contatto":"+39 3494175203","note":"","id":"rec_17"},
  {"payerName":"Giuseppe Maria Sicignano","servizio":"Disney Plus (alarmmilano3@gmail.com)","quota":"4.00","metodo":"PayPal","ultimoPagamento":"2026-06-07","stato":"In Regola","contatto":"+39 3494175203","note":"","id":"rec_18"},
  {"payerName":"Marco NGTX","servizio":"Netflix Premium","quota":"10.00","metodo":"PayPal","ultimoPagamento":"2026-06-15","stato":"In Regola","contatto":"Whatsapp +447950905375","note":"","id":"rec_19"},
  {"payerName":"Daniele La Mantia","servizio":"Netflix Premium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-07-01","stato":"In Regola","contatto":"silver_shark1@libero.it - +39 327 124 7397","note":"","id":"rec_20"},
  {"payerName":"Alessio Bellezza","servizio":"Crunchyroll (fedebr2023@gmx.com)","quota":"2.50","metodo":"PayPal","ultimoPagamento":"2026-06-02","stato":"In Regola","contatto":"+39 389 882 9693 - a.bellezza92@gmail.com","note":"","id":"rec_21"},
  {"payerName":"Alessandro","servizio":"SURFSHARK (mangustavelox@gmail.com)","quota":"1.50","metodo":"Satispay","ultimoPagamento":"2026-06-01","stato":"In Regola","contatto":"+393293152838","note":"","id":"rec_22"},
  {"payerName":"manuel gallo","servizio":"Netflix premium","quota":"5.00","metodo":"Bonifico","ultimoPagamento":"2026-06-12","stato":"In Regola","contatto":"3738346240","note":"","id":"rec_23"},
  {"payerName":"Raffaele Crispino","servizio":"Netflix Premium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-05-27","stato":"In Regola","contatto":"Raffo2626@gmail.com","note":"","id":"rec_24"},
  {"payerName":"Gianni F (Cosimo de Rosa)","servizio":"Netflix Premium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-06-24","stato":"In Regola","contatto":"+393927639250","note":"","id":"rec_25"},
  {"payerName":"Angelo Filomena","servizio":"SURFSHARK (mangustavelox@gmail.com)","quota":"1.50","metodo":"Bonifico","ultimoPagamento":"2026-06-09","stato":"In Regola","contatto":"+39 366 958 4558","note":"","id":"rec_26"},
  {"payerName":"Angelo Saporetti","servizio":"Tidal (federosson@outlook.it)","quota":"3.50","metodo":"PayPal","ultimoPagamento":"2026-06-01","stato":"In Regola","contatto":"saporettiangelo955@gmail.com","note":"","id":"rec_27"},
  {"payerName":"Barbara Minoja","servizio":"Crunchyroll (frosson2022@gmail.com)","quota":"2.50","metodo":"Satispay","ultimoPagamento":"2026-05-25","stato":"In Regola","contatto":"+393491192335","note":"","id":"rec_28"},
  {"payerName":"Micheal (Mike008)","servizio":"Netflix Premium","quota":"5.00","metodo":"Bonifico Bancario","ultimoPagamento":"2026-06-04","stato":"In Regola","contatto":"+393492432672","note":"","id":"rec_29"},
  {"payerName":"Alessandro Mosca","servizio":"Netflix Premium","quota":"5.00","metodo":"Bonifico Bancario","ultimoPagamento":"2026-06-01","stato":"In Regola","contatto":"3801464617 + neversay-never@virgilio.it","note":"","id":"rec_30"},
  {"payerName":"Othmar Tschrepp","servizio":"Tidal (roxoroxfed@outlook.it)","quota":"3.50","metodo":"PayPal","ultimoPagamento":"2026-06-06","stato":"In Regola","contatto":"othmar@urania.it","note":"","id":"rec_31"},
  {"payerName":"Marco Ventimiglia","servizio":"Netflix PRemium","quota":"5.00","metodo":"PayPal","ultimoPagamento":"2026-10-22","stato":"In Regola","contatto":"Whatsapp +39 3513567270","note":"2° account Netflix","id":"rec_32"}
];

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
}

app.listen(PORT, () => {
    console.log(`🔒 Server protetto avviato sulla porta ${PORT}`);
});