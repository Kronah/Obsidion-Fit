const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/workouts", requireAuth, (req, res) => {
  const students = db.prepare("SELECT id, full_name FROM students ORDER BY full_name").all();
  const studentId = Number(req.query.student_id || 0);

  let selectedStudent = null;
  let workouts = [];

  if (studentId) {
    selectedStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
    workouts = db
      .prepare("SELECT * FROM workouts WHERE student_id = ? ORDER BY id DESC")
      .all(studentId);
  }

  res.render("workouts/index", {
    title: "Gerar Treino",
    students,
    selectedStudent,
    workouts,
  });
});

router.post("/workouts", requireAuth, (req, res) => {
  const { student_id, workout_name, workout_date, muscle_group, exercises_json, notes } = req.body;

  if (!student_id || !workout_name || !exercises_json) {
    req.flash("error", "Informe aluno, nome do treino e exercícios.");
    return res.redirect("/workouts");
  }

  db.prepare(
    `INSERT INTO workouts (
      student_id, workout_name, workout_date, muscle_group, exercises_json, notes
    ) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    student_id,
    workout_name.trim(),
    workout_date || null,
    muscle_group || null,
    exercises_json,
    notes || null
  );

  req.flash("success", "Treino criado com sucesso.");
  return res.redirect(`/workouts?student_id=${student_id}`);
});

module.exports = router;
