import "dotenv/config";
import express from "express";
import session from "express-session";
import hbs from "hbs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import sequelize from "./models/db.js";
import "./models/associations.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const viewsPath = path.join(__dirname, "views");
const partialsPath = path.join(viewsPath, "partials");

// VIEW ENGINE
app.engine("xian", hbs.__express);
app.set("view engine", "xian");
app.set("views", viewsPath);

// REGISTER PARTIALS MANUALLY
const partialFiles = {
  head: "head.xian",
  navbar: "navbar.xian",
  foot: "foot.xian"
};

for (const [partialName, fileName] of Object.entries(partialFiles)) {
  const filePath = path.join(partialsPath, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing partial file: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");

  hbs.handlebars.registerPartial(partialName, content);

  console.log(`Partial registered: ${partialName}`);
}

// HELPERS
hbs.registerHelper("eq", (a, b) => a === b);

hbs.registerHelper("currency", value =>
  `₱${Number(value || 0).toFixed(2)}`
);

hbs.registerHelper("formatDate", value =>
  value ? new Date(value).toLocaleString("en-PH") : ""
);

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "beantrack-development-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.notice = req.session.notice || null;

  delete req.session.notice;

  next();
});

// ROUTES
app.use("/", routes);

// 404 ERROR
app.use((req, res) => {
  res.status(404).render("404", {
    title: "Page not found"
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).render("error", {
    title: "Something went wrong",
    message: "Please check the server terminal for details."
  });
});

// DATABASE AND SERVER
const PORT = process.env.PORT || 3000;

try {
  await sequelize.authenticate();

  console.log("MySQL connected.");

  await sequelize.sync();

  console.log("BeanTrack database tables synchronized.");

  app.listen(PORT, () => {
    console.log(`BeanTrack running at http://localhost:${PORT}`);
  });

} catch (error) {
  console.error("Unable to start BeanTrack:", error);

  process.exit(1);
}
