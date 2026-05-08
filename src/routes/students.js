const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "public", "uploads", "student-photos");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = ext || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if ((file.mimetype || "").startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Apenas arquivos de imagem são permitidos."));
  },
});

const studentPhotoUploadMiddleware = (req, res, next) => {
  upload.fields([
    { name: "photo_front", maxCount: 1 },
    { name: "photo_side", maxCount: 1 },
    { name: "photo_back", maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    req.flash("error", "Falha no envio das fotos. Use imagens de até 5MB.");
    res.redirect("/");
  });
};

function normalizeText(value) {
  return value && String(value).trim() ? String(value).trim() : null;
}

function normalizeChoice(value) {
  return normalizeText(value);
}

function normalizeChoiceList(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => normalizeText(item)).filter(Boolean);
    return cleaned.length ? cleaned.join(", ") : null;
  }
  return normalizeText(value);
}

function mergePhotoAttachments(extraJsonRaw, filesByField) {
  const attachments = [];

  const pushFile = (field, label) => {
    const file = filesByField?.[field]?.[0];
    if (!file) return;
    attachments.push({
      tipo: label,
      nome: file.originalname,
      caminho: `/uploads/student-photos/${file.filename}`,
    });
  };

  pushFile("photo_front", "Frente");
  pushFile("photo_side", "Lado");
  pushFile("photo_back", "Costas");

  if (!attachments.length) {
    return extraJsonRaw;
  }

  let parsed = {};
  if (extraJsonRaw) {
    try {
      parsed = JSON.parse(extraJsonRaw);
    } catch {
      parsed = { observacaoLivre: extraJsonRaw };
    }
  }

  if (!parsed.avaliacaoFisica) {
    parsed.avaliacaoFisica = {};
  }

  parsed.avaliacaoFisica.fotosArquivos = attachments;
  return JSON.stringify(parsed, null, 2);
}

function extractPhotoAttachments(extraJsonRaw) {
  if (!extraJsonRaw) return [];

  try {
    const parsed = JSON.parse(extraJsonRaw);
    const photos = parsed?.avaliacaoFisica?.fotosArquivos;
    if (!Array.isArray(photos)) return [];

    return photos.filter((photo) => photo && photo.caminho);
  } catch {
    return [];
  }
}

function mapStudentPayload(body) {
  const mainGoals = normalizeChoiceList(body.main_goals);
  const goalOther = normalizeText(body.goal_other);
  const targetRegions = normalizeChoiceList(body.target_regions);

  const trainedBefore = normalizeChoice(body.trained_before);
  const trainingLevel = normalizeChoice(body.training_level);
  const trainingLocation = normalizeChoice(body.training_location);
  const daysPerWeek = normalizeChoice(body.days_per_week);

  const hasHealthProblem = normalizeChoice(body.has_health_problem);
  const healthProblemDesc = normalizeText(body.health_problem_desc);
  const lesions = normalizeChoiceList(body.lesions);
  const lesionOther = normalizeText(body.lesion_other);
  const hasPain = normalizeChoice(body.has_pain);
  const painWhere = normalizeText(body.pain_where);
  const healthConditions = normalizeChoiceList(body.health_conditions);

  const usesMedication = normalizeChoice(body.uses_medication);
  const medicationList = normalizeText(body.medication_list);

  const preferredTime = normalizeChoice(body.preferred_time);
  const sleepRange = normalizeChoice(body.sleep_range);
  const jobType = normalizeChoice(body.job_type);

  const followsDiet = normalizeChoice(body.follows_diet);
  const hadNutritionist = normalizeChoice(body.had_nutritionist);
  const mealsPerDay = normalizeChoice(body.meals_per_day);

  const waist = normalizeText(body.measure_waist);
  const abdomen = normalizeText(body.measure_abdomen);
  const hip = normalizeText(body.measure_hip);
  const thigh = normalizeText(body.measure_thigh);
  const arm = normalizeText(body.measure_arm);
  const commitmentLevel = normalizeChoice(body.commitment_level);

  const photosNote = normalizeText(body.photos_note);

  return {
    full_name: normalizeText(body.full_name),
    phone: normalizeText(body.phone),
    whatsapp: normalizeText(body.whatsapp),
    email: normalizeText(body.email),
    birth_date: normalizeText(body.birth_date),
    gender: normalizeText(body.gender),
    profession: normalizeText(body.profession),
    address_city: normalizeText(body.address_city),
    address_state: normalizeText(body.address_state),
    emergency_contact_name: normalizeText(body.emergency_contact_name),
    emergency_contact_phone: normalizeText(body.emergency_contact_phone),
    height_cm: normalizeText(body.height_cm),
    initial_weight_kg: normalizeText(body.initial_weight_kg),
    goal: [
      mainGoals ? `Objetivo principal: ${mainGoals}` : null,
      goalOther ? `Outro objetivo: ${goalOther}` : null,
      targetRegions ? `Regiões foco: ${targetRegions}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    training_experience: [
      trainedBefore ? `Histórico: ${trainedBefore}` : null,
      trainingLevel ? `Nível: ${trainingLevel}` : null,
      trainingLocation ? `Local: ${trainingLocation}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    available_days: daysPerWeek,
    preferred_shift: preferredTime,
    medical_conditions: [
      hasHealthProblem ? `Problema de saúde: ${hasHealthProblem}` : null,
      healthProblemDesc ? `Descrição: ${healthProblemDesc}` : null,
      healthConditions ? `Condições: ${healthConditions}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    medications: [
      usesMedication ? `Usa medicamentos: ${usesMedication}` : null,
      medicationList ? `Quais: ${medicationList}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    allergies: normalizeText(body.allergies),
    injuries_history: [
      lesions ? `Lesões: ${lesions}` : null,
      lesionOther ? `Outra lesão: ${lesionOther}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    surgeries_history: normalizeText(body.surgeries_history),
    pain_points: [
      hasPain ? `Sente dores: ${hasPain}` : null,
      painWhere ? `Onde: ${painWhere}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    physical_restrictions: normalizeText(body.physical_restrictions),
    blood_pressure_history: normalizeText(body.blood_pressure_history),
    heart_disease_history: normalizeText(body.heart_disease_history),
    diabetes_history: normalizeText(body.diabetes_history),
    family_history: normalizeText(body.family_history),
    smoking_status: normalizeText(body.smoking_status),
    alcohol_status: normalizeText(body.alcohol_status),
    sleep_hours: sleepRange,
    stress_level: jobType,
    dietary_habits: [
      followsDiet ? `Segue dieta: ${followsDiet}` : null,
      hadNutritionist ? `Acompanhamento nutricionista: ${hadNutritionist}` : null,
      mealsPerDay ? `Refeições por dia: ${mealsPerDay}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
    water_intake_liters: normalizeText(body.water_intake_liters),
    notes: normalizeText(body.notes),
    extra_json:
      normalizeText(body.extra_json) ||
      JSON.stringify(
        {
          objetivo: {
            principal: mainGoals,
            outro: goalOther,
            regioes: targetRegions,
          },
          historicoTreino: {
            jaTreinou: trainedBefore,
            nivel: trainingLevel,
            diasSemana: daysPerWeek,
            local: trainingLocation,
          },
          saude: {
            problemaSaude: hasHealthProblem,
            problemaDescricao: healthProblemDesc,
            lesoes: lesions,
            outraLesao: lesionOther,
            senteDor: hasPain,
            dorOnde: painWhere,
            condicoes: healthConditions,
            usaMedicamento: usesMedication,
            medicamentos: medicationList,
          },
          rotina: {
            horarioPreferido: preferredTime,
            horasSono: sleepRange,
            tipoTrabalho: jobType,
          },
          alimentacao: {
            segueDieta: followsDiet,
            nutricionista: hadNutritionist,
            refeicoesPorDia: mealsPerDay,
          },
          avaliacaoFisica: {
            fotos: photosNote,
            medidas: {
              cintura: waist,
              abdomen,
              quadril: hip,
              coxa: thigh,
              braco: arm,
            },
          },
          comprometimento: commitmentLevel,
        },
        null,
        2
      ),
    consent_terms: body.consent_terms ? 1 : 0,
    lgpd_consent: body.lgpd_consent ? 1 : 0,
  };
}

function upsertStudent(data, studentId = null) {
  const params = [
    data.full_name,
    data.phone,
    data.whatsapp,
    data.email,
    data.birth_date,
    data.gender,
    data.profession,
    data.address_city,
    data.address_state,
    data.emergency_contact_name,
    data.emergency_contact_phone,
    data.height_cm,
    data.initial_weight_kg,
    data.goal,
    data.training_experience,
    data.available_days,
    data.preferred_shift,
    data.medical_conditions,
    data.medications,
    data.allergies,
    data.injuries_history,
    data.surgeries_history,
    data.pain_points,
    data.physical_restrictions,
    data.blood_pressure_history,
    data.heart_disease_history,
    data.diabetes_history,
    data.family_history,
    data.smoking_status,
    data.alcohol_status,
    data.sleep_hours,
    data.stress_level,
    data.dietary_habits,
    data.water_intake_liters,
    data.consent_terms,
    data.lgpd_consent,
    data.notes,
    data.extra_json,
  ];

  if (!studentId) {
    db.prepare(
      `INSERT INTO students (
        full_name, phone, whatsapp, email, birth_date, gender, profession,
        address_city, address_state, emergency_contact_name, emergency_contact_phone,
        height_cm, initial_weight_kg, goal, training_experience, available_days, preferred_shift,
        medical_conditions, medications, allergies, injuries_history, surgeries_history,
        pain_points, physical_restrictions, blood_pressure_history, heart_disease_history,
        diabetes_history, family_history, smoking_status, alcohol_status, sleep_hours, stress_level,
        dietary_habits, water_intake_liters, consent_terms, lgpd_consent, notes, extra_json
      ) VALUES (${params.map(() => "?").join(", ")})`
    ).run(...params);
    return;
  }

  db.prepare(
    `UPDATE students SET
      full_name = ?, phone = ?, whatsapp = ?, email = ?, birth_date = ?, gender = ?,
      profession = ?, address_city = ?, address_state = ?, emergency_contact_name = ?,
      emergency_contact_phone = ?, height_cm = ?,
      initial_weight_kg = ?, goal = ?, training_experience = ?, available_days = ?, preferred_shift = ?,
      medical_conditions = ?, medications = ?, allergies = ?, injuries_history = ?, surgeries_history = ?,
      pain_points = ?, physical_restrictions = ?, blood_pressure_history = ?, heart_disease_history = ?,
      diabetes_history = ?, family_history = ?, smoking_status = ?, alcohol_status = ?, sleep_hours = ?,
      stress_level = ?, dietary_habits = ?, water_intake_liters = ?, consent_terms = ?, lgpd_consent = ?,
      notes = ?, extra_json = ?
    WHERE id = ?`
  ).run(...params, studentId);
}

router.get("/", (req, res) => {
  res.render("students/public-form", {
    title: "Cadastro do Aluno",
    student: null,
    action: "/student-registration",
  });
});

router.post(
  "/student-registration",
  studentPhotoUploadMiddleware,
  (req, res) => {
  const selectedGoals = normalizeChoiceList(req.body.main_goals);
  const payload = mapStudentPayload(req.body);

  if (!payload.full_name || !payload.phone || !payload.email || !payload.birth_date) {
    req.flash(
      "error",
      "Preencha os campos essenciais: nome, telefone, e-mail e data de nascimento."
    );
    return res.redirect("/");
  }

  if (!selectedGoals) {
    req.flash("error", "Selecione pelo menos 1 opção em Objetivo com o treino.");
    return res.redirect("/");
  }

  if (!payload.consent_terms || !payload.lgpd_consent) {
    req.flash("error", "É obrigatório aceitar os termos e o consentimento LGPD.");
    return res.redirect("/");
  }

  payload.extra_json = mergePhotoAttachments(payload.extra_json, req.files);

  upsertStudent(payload);
  req.flash("success", "Cadastro enviado com sucesso. Sua ficha foi registrada.");
  return res.redirect("/");
}
);

router.get("/students", requireAuth, (req, res) => {
  const students = db.prepare("SELECT * FROM students ORDER BY id DESC").all();
  res.render("students/index", { title: "Alunos", students });
});

router.get("/students/new", requireAuth, (req, res) => {
  res.render("students/form", {
    title: "Novo Aluno",
    student: null,
    photoAttachments: [],
    action: "/students",
  });
});

router.post("/students", requireAuth, (req, res) => {
  const payload = mapStudentPayload(req.body);

  if (!payload.full_name) {
    req.flash("error", "Nome do aluno é obrigatório.");
    return res.redirect("/students/new");
  }

  upsertStudent(payload);

  req.flash("success", "Aluno cadastrado com sucesso.");
  res.redirect("/students");
});

router.get("/students/:id/edit", requireAuth, (req, res) => {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);

  if (!student) {
    req.flash("error", "Aluno não encontrado.");
    return res.redirect("/students");
  }

  return res.render("students/form", {
    title: "Editar Aluno",
    student,
    photoAttachments: extractPhotoAttachments(student.extra_json),
    action: `/students/${student.id}`,
  });
});

router.post("/students/:id", requireAuth, (req, res) => {
  const payload = mapStudentPayload(req.body);

  if (!payload.full_name) {
    req.flash("error", "Nome do aluno é obrigatório.");
    return res.redirect(`/students/${req.params.id}/edit`);
  }

  upsertStudent(payload, req.params.id);

  req.flash("success", "Aluno atualizado com sucesso.");
  res.redirect("/students");
});

router.post("/students/:id/delete", requireAuth, (req, res) => {
  db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
  req.flash("success", "Aluno removido com sucesso.");
  res.redirect("/students");
});

module.exports = router;
