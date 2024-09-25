const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');

const app = express();

// Set up EJS templating
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: false }));

// Set up sessions
app.use(session({
    secret: 'secret-key', // In production, use a secure secret
    resave: false,
    saveUninitialized: false
}));

// Routes
app.use(authRoutes);

// Redirect root URL to login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
