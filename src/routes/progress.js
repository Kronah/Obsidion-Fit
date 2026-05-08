const express = require("express");
const { query } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/progress", requireAuth, async (req, res) => {
  const students = (await query("SELECT id, full_name FROM students ORDER BY full_name")).rows;
  const studentId = Number(req.query.student_id || 0);

  let selectedStudent = null;
  let entries = [];

  if (studentId) {
    selectedStudent = (await query("SELECT * FROM students WHERE id = $1", [studentId])).rows[0];
    entries = (
      await query(
        "SELECT * FROM progress_entries WHERE student_id = $1 ORDER BY entry_date DESC, id DESC",
        [studentId]
      )
    ).rows;
  }

  res.render("progress/index", {
    title: "Acompanhar Aluno",
    students,
    selectedStudent,
    entries,
  });
});

router.post("/progress", requireAuth, async (req, res) => {
  const { student_id, entry_date, weight_kg, measurements_json, load_notes, notes } = req.body;

  if (!student_id || !entry_date) {
    req.flash("error", "Selecione aluno e data da evolução.");
    return res.redirect("/progress");
  }

  await query(
    `INSERT INTO progress_entries (
      student_id, entry_date, weight_kg, measurements_json, load_notes, notes
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
    student_id,
    entry_date,
    weight_kg || null,
    measurements_json || null,
    load_notes || null,
    notes || null
  ]);

  req.flash("success", "Evolução registrada com sucesso.");
  return res.redirect(`/progress?student_id=${student_id}`);
});

module.exports = router;
