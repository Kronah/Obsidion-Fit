const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/progress", requireAuth, (req, res) => {
  const students = db.prepare("SELECT id, full_name FROM students ORDER BY full_name").all();
  const studentId = Number(req.query.student_id || 0);

  let selectedStudent = null;
  let entries = [];

  if (studentId) {
    selectedStudent = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
    entries = db
      .prepare(
        "SELECT * FROM progress_entries WHERE student_id = ? ORDER BY entry_date DESC, id DESC"
      )
      .all(studentId);
  }

  res.render("progress/index", {
    title: "Acompanhar Aluno",
    students,
    selectedStudent,
    entries,
  });
});

router.post("/progress", requireAuth, (req, res) => {
  const { student_id, entry_date, weight_kg, measurements_json, load_notes, notes } = req.body;

  if (!student_id || !entry_date) {
    req.flash("error", "Selecione aluno e data da evolução.");
    return res.redirect("/progress");
  }

  db.prepare(
    `INSERT INTO progress_entries (
      student_id, entry_date, weight_kg, measurements_json, load_notes, notes
    ) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    student_id,
    entry_date,
    weight_kg || null,
    measurements_json || null,
    load_notes || null,
    notes || null
  );

  req.flash("success", "Evolução registrada com sucesso.");
  return res.redirect(`/progress?student_id=${student_id}`);
});

module.exports = router;
