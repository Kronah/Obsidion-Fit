const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/admin", requireAuth, requireAdmin, (req, res) => {
  const professionals = db
    .prepare("SELECT id, username, full_name, is_admin, created_at FROM professionals ORDER BY id DESC")
    .all();

  res.render("admin/index", { title: "Admin", professionals });
});

router.post("/admin/professionals", requireAuth, requireAdmin, (req, res) => {
  const { username, full_name, password, is_admin } = req.body;

  if (!username || !full_name || !password) {
    req.flash("error", "Preencha nome, usuário e senha.");
    return res.redirect("/admin");
  }

  const exists = db
    .prepare("SELECT id FROM professionals WHERE username = ?")
    .get(username.trim());

  if (exists) {
    req.flash("error", "Usuário já cadastrado.");
    return res.redirect("/admin");
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO professionals (username, password_hash, full_name, is_admin) VALUES (?, ?, ?, ?)"
  ).run(username.trim(), passwordHash, full_name.trim(), is_admin ? 1 : 0);

  req.flash("success", "Profissional cadastrado com sucesso.");
  return res.redirect("/admin");
});

module.exports = router;
