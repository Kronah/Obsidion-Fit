const PDFDocument = require("pdfkit");
// Visualizar detalhes do aluno
router.get("/students/:id", requireAuth, async (req, res) => {
  const student = (await query("SELECT * FROM students WHERE id = $1", [Number(req.params.id)])).rows[0];
  if (!student) {
    req.flash("error", "Aluno não encontrado.");
    return res.redirect("/students");
  }
  res.render("students/show", { title: `Aluno #${student.id}", student });
});

// Exportar PDF do aluno
router.get("/students/:id/pdf", requireAuth, async (req, res) => {
  const student = (await query("SELECT * FROM students WHERE id = $1", [Number(req.params.id)])).rows[0];
  if (!student) {
    return res.status(404).send("Aluno não encontrado");
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=aluno_${student.id}.pdf`);
  const doc = new PDFDocument();
  doc.pipe(res);
  doc.fontSize(18).text(`Ficha do Aluno #${student.id}`, { align: "center" });
  doc.moveDown();
  doc.fontSize(12);
  doc.text(`Nome: ${student.full_name}`);
  doc.text(`Telefone: ${student.phone || "-"}`);
  doc.text(`Email: ${student.email || "-"}`);
  doc.text(`Cidade: ${student.address_city || "-"}`);
  doc.text(`Objetivo: ${student.goal || "-"}`);
  doc.text(`Notas: ${student.notes || "-"}`);
  doc.text(`Data de Cadastro: ${student.created_at}`);
  doc.end();
});
const express = require("express");
const path = require("path");
const multer = require("multer");
const { query, supabase, storageBucket } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
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

  const pushFile = (field, label, uploadedFile) => {
    if (!uploadedFile) return;
    attachments.push({
      tipo: label,
      nome: uploadedFile.originalName,
      caminho: uploadedFile.publicUrl,
      storagePath: uploadedFile.storagePath,
      field,
    });
  };

  pushFile("photo_front", "Frente", filesByField?.photo_front);
  pushFile("photo_side", "Lado", filesByField?.photo_side);
  pushFile("photo_back", "Costas", filesByField?.photo_back);

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

async function uploadPhotoAttachments(filesByField = {}, studentName = "aluno") {
  const hasAnyFile =
    (filesByField?.photo_front && filesByField.photo_front.length) ||
    (filesByField?.photo_side && filesByField.photo_side.length) ||
    (filesByField?.photo_back && filesByField.photo_back.length);

  if (!hasAnyFile) {
    return { photo_front: null, photo_side: null, photo_back: null };
  }

  if (!supabase) {
    throw new Error("Supabase não configurado para upload de fotos.");
  }

  const attachments = [];

  const uploadOne = async (field, label) => {
    const file = filesByField?.[field]?.[0];
    if (!file) return;

    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const folder = String(studentName || "aluno")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const storagePath = `${folder || "aluno"}/${safeName}`;

    const { error } = await supabase.storage.from(storageBucket).upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

    if (error) {
      throw new Error(`Falha ao enviar foto ${label.toLowerCase()}: ${error.message}`);
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(storagePath);

    attachments.push({
      originalName: file.originalname,
      publicUrl: data.publicUrl,
      storagePath,
      label,
      field,
    });
  };

  await uploadOne("photo_front", "Frente");
  await uploadOne("photo_side", "Lado");
  await uploadOne("photo_back", "Costas");

  return {
    photo_front: attachments.find((item) => item.field === "photo_front") || null,
    photo_side: attachments.find((item) => item.field === "photo_side") || null,
    photo_back: attachments.find((item) => item.field === "photo_back") || null,
  };
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
    Boolean(data.consent_terms),
    Boolean(data.lgpd_consent),
    data.notes,
    data.extra_json,
  ];

  if (!studentId) {
    return query(
      `INSERT INTO students (
        full_name, phone, whatsapp, email, birth_date, gender, profession,
        address_city, address_state, emergency_contact_name, emergency_contact_phone,
        height_cm, initial_weight_kg, goal, training_experience, available_days, preferred_shift,
        medical_conditions, medications, allergies, injuries_history, surgeries_history,
        pain_points, physical_restrictions, blood_pressure_history, heart_disease_history,
        diabetes_history, family_history, smoking_status, alcohol_status, sleep_hours, stress_level,
        dietary_habits, water_intake_liters, consent_terms, lgpd_consent, notes, extra_json
      ) VALUES (${params.map((_, index) => `$${index + 1}`).join(", ")})`,
      params
    );
  }

  return query(
    `UPDATE students SET
      full_name = $1, phone = $2, whatsapp = $3, email = $4, birth_date = $5, gender = $6,
      profession = $7, address_city = $8, address_state = $9, emergency_contact_name = $10,
      emergency_contact_phone = $11, height_cm = $12,
      initial_weight_kg = $13, goal = $14, training_experience = $15, available_days = $16, preferred_shift = $17,
      medical_conditions = $18, medications = $19, allergies = $20, injuries_history = $21, surgeries_history = $22,
      pain_points = $23, physical_restrictions = $24, blood_pressure_history = $25, heart_disease_history = $26,
      diabetes_history = $27, family_history = $28, smoking_status = $29, alcohol_status = $30, sleep_hours = $31,
      stress_level = $32, dietary_habits = $33, water_intake_liters = $34, consent_terms = $35, lgpd_consent = $36,
      notes = $37, extra_json = $38
    WHERE id = $39`,
    [...params, Number(studentId)]
  );
}

router.get("/", (req, res) => {
  res.render("students/public-form", {
    title: "Cadastro do Aluno",
    student: null,
    action: "/student-registration",
  });
});

router.post("/student-registration", studentPhotoUploadMiddleware, async (req, res) => {
  try {
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

    const uploaded = await uploadPhotoAttachments(req.files, payload.full_name);
    payload.extra_json = mergePhotoAttachments(payload.extra_json, uploaded);

    await upsertStudent(payload);
    req.flash("success", "Cadastro enviado com sucesso. Sua ficha foi registrada.");
    return res.redirect("/");
  } catch (error) {
    req.flash("error", `Erro ao salvar cadastro: ${error.message}`);
    return res.redirect("/");
  }
});

router.get("/students", requireAuth, async (req, res) => {
  const students = (await query("SELECT * FROM students ORDER BY id DESC")).rows;
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

router.post("/students", requireAuth, async (req, res) => {
  const payload = mapStudentPayload(req.body);

  if (!payload.full_name) {
    req.flash("error", "Nome do aluno é obrigatório.");
    return res.redirect("/students/new");
  }

  await upsertStudent(payload);

  req.flash("success", "Aluno cadastrado com sucesso.");
  res.redirect("/students");
});

router.get("/students/:id/edit", requireAuth, async (req, res) => {
  const student = (await query("SELECT * FROM students WHERE id = $1", [Number(req.params.id)])).rows[0];

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

router.post("/students/:id", requireAuth, async (req, res) => {
  const payload = mapStudentPayload(req.body);

  if (!payload.full_name) {
    req.flash("error", "Nome do aluno é obrigatório.");
    return res.redirect(`/students/${req.params.id}/edit`);
  }

  await upsertStudent(payload, req.params.id);

  req.flash("success", "Aluno atualizado com sucesso.");
  res.redirect("/students");
});

router.post("/students/:id/delete", requireAuth, async (req, res) => {
  await query("DELETE FROM students WHERE id = $1", [Number(req.params.id)]);
  req.flash("success", "Aluno removido com sucesso.");
  res.redirect("/students");
});

module.exports = router;
