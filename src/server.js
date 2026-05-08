const path = require("path");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const { initDb } = require("./db");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const studentsRoutes = require("./routes/students");
const progressRoutes = require("./routes/progress");
const workoutsRoutes = require("./routes/workouts");
const dietsRoutes = require("./routes/diets");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "troque-esta-chave-em-producao",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.successMessages = req.flash("success");
  res.locals.errorMessages = req.flash("error");
  next();
});

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(adminRoutes);
app.use(studentsRoutes);
app.use(progressRoutes);
app.use(workoutsRoutes);
app.use(dietsRoutes);

app.use((req, res) => {
  res.status(404).render("not-found", { title: "Não encontrado" });
});

async function startServer() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar servidor:", error.message);
  process.exit(1);
});
