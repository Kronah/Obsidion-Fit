const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/workouts", requireAuth, async (req, res) => {
  const students = (await query("SELECT id, full_name FROM students ORDER BY full_name")).rows;
  const studentId = Number(req.query.student_id || 0);

  let selectedStudent = null;
  let workouts = [];

  if (studentId) {
    selectedStudent = (await query("SELECT * FROM students WHERE id = $1", [studentId])).rows[0];
    workouts = (
      await query("SELECT * FROM workouts WHERE student_id = $1 ORDER BY id DESC", [studentId])
    ).rows;
  }

  res.render("workouts/index", {
    title: "Gerar Treino",
    students,
    selectedStudent,
    workouts,
  });
});

router.post("/workouts", requireAuth, async (req, res) => {
  const { student_id, workout_name, workout_date, muscle_group, exercises_json, notes } = req.body;

  if (!student_id || !workout_name || !exercises_json) {
    req.flash("error", "Informe aluno, nome do treino e exercícios.");
    return res.redirect("/workouts");
  }

  await query(
    `INSERT INTO workouts (
      student_id, workout_name, workout_date, muscle_group, exercises_json, notes
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
    student_id,
    workout_name.trim(),
    workout_date || null,
    muscle_group || null,
    exercises_json,
    notes || null
  ]);

  req.flash("success", "Treino criado com sucesso.");
  return res.redirect(`/workouts?student_id=${student_id}`);
});

module.exports = router;
