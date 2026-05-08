function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash("error", "Faça login para acessar o sistema.");
    return res.redirect("/login");
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    req.flash("error", "Acesso restrito ao administrador.");
    return res.redirect("/");
  }

  return next();
}

module.exports = { requireAuth, requireAdmin };
