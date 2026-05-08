const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
  const professionals = (
    await query(
      "SELECT id, username, full_name, is_admin, created_at FROM professionals ORDER BY id DESC"
    )
  ).rows;

  res.render("admin/index", { title: "Admin", professionals });
});

router.post("/admin/professionals", requireAuth, requireAdmin, async (req, res) => {
  const { username, full_name, password, is_admin } = req.body;

  if (!username || !full_name || !password) {
    req.flash("error", "Preencha nome, usuário e senha.");
    return res.redirect("/admin");
  }

  const exists = await query("SELECT id FROM professionals WHERE username = $1", [
    username.trim(),
  ]);

  if (exists.rowCount) {
    req.flash("error", "Usuário já cadastrado.");
    return res.redirect("/admin");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    "INSERT INTO professionals (username, password_hash, full_name, is_admin) VALUES ($1, $2, $3, $4)",
    [username.trim(), passwordHash, full_name.trim(), Boolean(is_admin)]
  );

  req.flash("success", "Profissional cadastrado com sucesso.");
  return res.redirect("/admin");
});

module.exports = router;
