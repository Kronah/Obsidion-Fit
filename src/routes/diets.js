const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/diets", requireAuth, async (req, res) => {
  const students = (await query("SELECT id, full_name FROM students ORDER BY full_name")).rows;
  const studentId = Number(req.query.student_id || 0);

  let selectedStudent = null;
  let diets = [];

  if (studentId) {
    selectedStudent = (await query("SELECT * FROM students WHERE id = $1", [studentId])).rows[0];
    diets = (await query("SELECT * FROM diets WHERE student_id = $1 ORDER BY id DESC", [studentId]))
      .rows;
  }

  res.render("diets/index", {
    title: "Dieta",
    students,
    selectedStudent,
    diets,
  });
});

router.post("/diets", requireAuth, async (req, res) => {
  const { student_id, diet_name, start_date, meals_json, estimated_calories, notes } = req.body;

  if (!student_id || !diet_name || !meals_json) {
    req.flash("error", "Informe aluno, nome da dieta e refeições.");
    return res.redirect("/diets");
  }

  await query(
    `INSERT INTO diets (
      student_id, diet_name, start_date, meals_json, estimated_calories, notes
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
    student_id,
    diet_name.trim(),
    start_date || null,
    meals_json,
    estimated_calories || null,
    notes || null
  ]);

  req.flash("success", "Dieta criada com sucesso.");
  return res.redirect(`/diets?student_id=${student_id}`);
});

module.exports = router;
