const express = require('express');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Local storage for users
const usersFilePath = path.join(__dirname, '../data/users.json');
let users = require(usersFilePath);

// Middleware to protect routes
const { isAuthenticated, is2FAAuthenticated } = require('../middlewares/authMiddleware');

// Helper function to save users to JSON file
function saveUsersToFile() {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 4));
}

// Login Page
router.get('/login', (req, res) => {
    res.render('login');
});

// Login POST
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.username = username;
        if (!user.twoFactorEnabled) {
            return res.redirect('/setup-2fa');
        } else {
            req.session.is2FAAuthenticated = false; // Reset 2FA status
            return res.redirect('/2fa');
        }
    } else {
        return res.render('login', { error: 'Invalid credentials' });
    }
});

// 2FA Setup Page
router.get('/setup-2fa', isAuthenticated, (req, res) => {
    const user = users.find(u => u.username === req.session.username);

    if (user.twoFactorEnabled) {
        return res.redirect('/home');
    }

    const secret = speakeasy.generateSecret({ name: `MyApp (${req.session.username})` });
    req.session.tempSecret = secret.base32;

    qrcode.toDataURL(secret.otpauth_url, (err, dataURL) => {
        res.render('setup-2fa', { qrCodeURL: dataURL });
    });
});

// 2FA Setup POST
router.post('/setup-2fa', isAuthenticated, (req, res) => {
    const user = users.find(u => u.username === req.session.username);
    const { token } = req.body;
    
    const verified = speakeasy.totp.verify({
        secret: req.session.tempSecret,
        encoding: 'base32',
        token
    });

    if (verified) {
        user.twoFactorEnabled = true;
        user.twoFactorSecret = req.session.tempSecret;
        saveUsersToFile();
        res.redirect('/home');
    } else {
        res.render('setup-2fa', { error: 'Invalid token, please try again' });
    }
});

// 2FA Page
router.get('/2fa', isAuthenticated, (req, res) => {
    res.render('2fa');
});

// 2FA POST
router.post('/2fa', isAuthenticated, (req, res) => {
    const user = users.find(u => u.username === req.session.username);
    const { token } = req.body;

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token
    });

    if (verified) {
        req.session.is2FAAuthenticated = true;
        res.redirect('/home');
    } else {
        res.render('2fa', { error: 'Invalid token, please try again' });
    }
});

// Home Page
router.get('/home', isAuthenticated, is2FAAuthenticated, (req, res) => {
    res.render('home', { username: req.session.username });
});

module.exports = router;
