const express = require('express');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const fs = require('fs');


const app = express();
const PORT = 23456;




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
    // Togli spazi iniziali e finali
    filename = filename.trim();

    // Decompone lettere accentate, rimuove accenti e sostituisce caratteri strani con _
    let normalized = filename.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')        // Rimuove accenti
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')      // Rimpiazza tutto ciò che non è alfanumerico o . - _ con _
        .replace(/_+$/g, '');                   // Rimuove underscore finali inutili

    // Abbassa le vocali rimaste in maiuscolo
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
    res.render('dashboard', { files, fs, path });
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


// === CONTROLLO SPAZIO DISCO E MEMORIZZAZIONE IN /API/STORAGE
const checkDiskSpace = require('check-disk-space').default;

app.get('/api/storage', (req, res) => {
    const diskPath = process.platform === 'win32' ? 'C:' : '/';
    checkDiskSpace(diskPath).then((diskSpace) => {
        const { free, size } = diskSpace;
        const used = size - free;
        const percentUsed = (used / size) * 100;
        res.json({
            used,
            total: size,
            percentUsed
        });
    }).catch(err => {
        res.status(500).json({ error: 'Errore nel leggere lo spazio disco' });
    });
});
