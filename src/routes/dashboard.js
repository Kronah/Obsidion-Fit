const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireAuth, async (req, res) => {
  const students = await query("SELECT COUNT(*) AS total FROM students");
  const progress = await query("SELECT COUNT(*) AS total FROM progress_entries");
  const workouts = await query("SELECT COUNT(*) AS total FROM workouts");
  const diets = await query("SELECT COUNT(*) AS total FROM diets");

  const totals = {
    students: Number(students.rows[0].total || 0),
    progress: Number(progress.rows[0].total || 0),
    workouts: Number(workouts.rows[0].total || 0),
    diets: Number(diets.rows[0].total || 0),
  };

  res.render("dashboard", { title: "Painel", totals });
});

module.exports = router;
