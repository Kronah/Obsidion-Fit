const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireAuth, (req, res) => {
  const totals = {
    students: db.prepare("SELECT COUNT(*) AS total FROM students").get().total,
    progress: db.prepare("SELECT COUNT(*) AS total FROM progress_entries").get().total,
    workouts: db.prepare("SELECT COUNT(*) AS total FROM workouts").get().total,
    diets: db.prepare("SELECT COUNT(*) AS total FROM diets").get().total,
  };

  res.render("dashboard", { title: "Painel", totals });
});

module.exports = router;
