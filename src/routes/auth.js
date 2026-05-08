const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  return res.render("auth/login", { title: "Login" });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash("error", "Informe usuário e senha.");
    return res.redirect("/login");
  }

  const professional = db
    .prepare("SELECT * FROM professionals WHERE username = ?")
    .get(username.trim());

  if (!professional || !bcrypt.compareSync(password, professional.password_hash)) {
    req.flash("error", "Usuário ou senha inválidos.");
    return res.redirect("/login");
  }

  req.session.user = {
    id: professional.id,
    username: professional.username,
    full_name: professional.full_name,
    is_admin: professional.is_admin === 1,
  };

  req.flash("success", `Bem-vindo, ${professional.full_name}.`);
  return res.redirect("/dashboard");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
