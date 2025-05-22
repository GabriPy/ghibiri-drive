const express = require('express');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 80;

// === PASSWORD SEGRETA PER ENTRARE ===
const ACCESS_PASSWORD = 'stronati2025';

// === SESSIONI ===
app.use(session({
    secret: 'ghibiridrive_segretissimo',
    resave: false,
    saveUninitialized: true
}));

// === MIDDLEWARE ===
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// === FUNZIONE PER NORMALIZZARE IL NOME FILE ===
const normalizeFilename = (filename) => {
    // Decompone lettere accentate
    let normalized = filename.normalize('NFD')
        // Rimuove accenti
        .replace(/[\u0300-\u036f]/g, '')
        // Sostituisce caratteri strani con _
        .replace(/[^a-zA-Z0-9.\-_]/g, '_');

    // Converti solo le lettere accentate tolte in minuscolo (evita MaturitA)
    // Per fare questo rimpiazziamo le vocali maiuscole se sono all'ultima posizione
    normalized = normalized.replace(/A/g, 'a')
                           .replace(/E/g, 'e')
                           .replace(/I/g, 'i')
                           .replace(/O/g, 'o')
                           .replace(/U/g, 'u');

    return normalized;
};

// === MULTER SETUP (upload file in /uploads) ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const cleanName = normalizeFilename(file.originalname);
        cb(null, `${timestamp}-${cleanName}`);
    }
});
const upload = multer({ storage: storage });

// === ROTTA: LOGIN (GET) ===
app.get('/', (req, res) => {
    if (req.session.loggedIn) {
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: null });
    }
});

// === ROTTA: LOGIN (POST) ===
app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ACCESS_PASSWORD) {
        req.session.loggedIn = true;
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Password sbagliata cittiri' });
    }
});

// === ROTTA: DASHBOARD ===
app.get('/dashboard', (req, res) => {
    if (!req.session.loggedIn) return res.redirect('/');

    const files = fs.readdirSync('./uploads');
    res.render('dashboard', { files });
});

// === ROTTA: UPLOAD FILE ===
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.session.loggedIn) return res.redirect('/');
    res.redirect('/dashboard');
});

// === ROTTA: DOWNLOAD FILE ===
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.download(filePath);
});

// === ROTTA: ELIMINA FILE ===
app.post('/delete', (req, res) => {
    if (!req.session.loggedIn) return res.redirect('/');

    const filename = req.body.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.log('Errore cancellazione file:', err);
            // Puoi anche fare roba più figa tipo messaggio di errore
        }
        res.redirect('/dashboard');
    });
});

// === ROTTA: LOGOUT ===
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// === AVVIO SERVER ===
app.listen(PORT, () => {
    console.log(`🚀 GhibiriDrive attivo su http://localhost:${PORT}`);
});
