function isAuthenticated(req, res, next) {
    if (req.session.username) {
        return next();
    }
    res.redirect('/login');
}

function is2FAAuthenticated(req, res, next) {
    if (req.session.is2FAAuthenticated) {
        return next();
    }
    res.redirect('/2fa');
}

module.exports = {
    isAuthenticated,
    is2FAAuthenticated
};
