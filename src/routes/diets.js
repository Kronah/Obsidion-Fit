const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/diets", requireAuth, (req, res) => {
  const students = db.prepare("SELECT id, full_name FROM students ORDER BY full_name").all();
  const studentId = Number(req.query.student_id || 0);

  let selectedStudent = null;
  let diets = [];

  if (studentId) {
    selectedStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
    diets = db.prepare("SELECT * FROM diets WHERE student_id = ? ORDER BY id DESC").all(studentId);
  }

  res.render("diets/index", {
    title: "Dieta",
    students,
    selectedStudent,
    diets,
  });
});

router.post("/diets", requireAuth, (req, res) => {
  const { student_id, diet_name, start_date, meals_json, estimated_calories, notes } = req.body;

  if (!student_id || !diet_name || !meals_json) {
    req.flash("error", "Informe aluno, nome da dieta e refeições.");
    return res.redirect("/diets");
  }

  db.prepare(
    `INSERT INTO diets (
      student_id, diet_name, start_date, meals_json, estimated_calories, notes
    ) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    student_id,
    diet_name.trim(),
    start_date || null,
    meals_json,
    estimated_calories || null,
    notes || null
  );

  req.flash("success", "Dieta criada com sucesso.");
  return res.redirect(`/diets?student_id=${student_id}`);
});

module.exports = router;
