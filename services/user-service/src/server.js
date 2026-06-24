const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { Op } = require("sequelize");
const { authMiddleware, JWT_SECRET } = require("./authMiddleware");
const { requireEnv } = require("./config");
const { sequelize, User } = require("./db");

const app = express();
const port = Number(requireEnv("PORT"));
const openApiPath = path.resolve(__dirname, "../../../docs/openapi.yaml");
const swaggerDocument = YAML.load(openApiPath);

const EMAIL_MAX_LENGTH = 254;
const LOGIN_MIN_LENGTH = 3;
const LOGIN_MAX_LENGTH = 40;
const NAME_MAX_LENGTH = 60;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_PATTERN = /^[a-z0-9._-]+$/;

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/openapi.yaml", (req, res) => res.sendFile(openApiPath));

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeLogin(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validateRegisterPayload(body) {
  body = body || {};
  const firstName = normalizeText(body.firstName);
  const lastName = normalizeText(body.lastName);
  const email = normalizeEmail(body.email);
  const explicitLogin = normalizeLogin(body.login);
  const login = explicitLogin || email;
  const password = typeof body.password === "string" ? body.password : "";
  const errors = [];

  if (!firstName) {
    errors.push("Podaj imie.");
  } else if (firstName.length > NAME_MAX_LENGTH) {
    errors.push(`Imie moze miec maksymalnie ${NAME_MAX_LENGTH} znakow.`);
  }

  if (!lastName) {
    errors.push("Podaj nazwisko.");
  } else if (lastName.length > NAME_MAX_LENGTH) {
    errors.push(`Nazwisko moze miec maksymalnie ${NAME_MAX_LENGTH} znakow.`);
  }

  if (!email) {
    errors.push("Podaj email.");
  } else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.push("Podaj poprawny email.");
  }

  if (explicitLogin) {
    if (explicitLogin.length < LOGIN_MIN_LENGTH || explicitLogin.length > LOGIN_MAX_LENGTH) {
      errors.push(`Login musi miec od ${LOGIN_MIN_LENGTH} do ${LOGIN_MAX_LENGTH} znakow.`);
    }

    if (!LOGIN_PATTERN.test(explicitLogin)) {
      errors.push("Login moze zawierac tylko male litery, cyfry, kropke, myslnik i podkreslenie.");
    }
  }

  if (!password) {
    errors.push("Podaj haslo.");
  } else if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Haslo musi miec od ${PASSWORD_MIN_LENGTH} do ${PASSWORD_MAX_LENGTH} znakow.`);
  }

  if (errors.length) {
    throw new HttpError(400, errors[0], errors);
  }

  return { firstName, lastName, email, login, password };
}

function validateLoginPayload(body) {
  body = body || {};
  const identifier = normalizeLogin(body.login) || normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const errors = [];

  if (!identifier) {
    errors.push("Podaj login lub email.");
  } else if (identifier.length > EMAIL_MAX_LENGTH) {
    errors.push("Login lub email jest za dlugi.");
  }

  if (!password) {
    errors.push("Podaj haslo.");
  }

  if (errors.length) {
    throw new HttpError(400, errors[0], errors);
  }

  return { identifier, password };
}

function publicUser(user) {
  return {
    id: user.id,
    login: user.login,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function buildIdentifierConditions(values) {
  return [...new Set(values.filter(Boolean))].flatMap((value) => [
    { email: value },
    { login: value }
  ]);
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

app.post("/auth/register", asyncHandler(async (req, res) => {
  const { firstName, lastName, email, login, password } = validateRegisterPayload(req.body);
  const exists = await User.findOne({
    where: {
      [Op.or]: buildIdentifierConditions([email, login])
    }
  });

  if (exists) {
    throw new HttpError(409, "Email lub login jest juz zajety.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ login, firstName, lastName, email, passwordHash });

  res.status(201).json({
    token: signToken(user),
    user: publicUser(user)
  });
}));

app.post("/auth/login", asyncHandler(async (req, res) => {
  const { identifier, password } = validateLoginPayload(req.body);
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { login: identifier },
        { email: identifier }
      ]
    }
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Nieprawidlowy login lub haslo.");
  }

  res.json({
    token: signToken(user),
    user: publicUser(user)
  });
}));

app.get("/users/me", authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    throw new HttpError(404, "Uzytkownik nie istnieje.");
  }

  res.json(publicUser(user));
}));

async function upsertUser({ login, firstName, lastName, email, password, role }) {
  const normalizedLogin = normalizeLogin(login);
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({
    where: {
      [Op.or]: buildIdentifierConditions([normalizedLogin, normalizedEmail])
    }
  });
  const user = existing || await User.create({
    login: normalizedLogin,
    firstName,
    lastName,
    email: normalizedEmail,
    passwordHash,
    role
  });

  await user.update({
    login: normalizedLogin,
    firstName,
    lastName,
    email: normalizedEmail,
    passwordHash,
    role
  });
}

async function seedUsers() {
  await upsertUser({
    login: "user",
    firstName: "Klient",
    lastName: "Testowy",
    email: "user@user.user",
    password: "user",
    role: "customer"
  });
  await upsertUser({
    login: "admin",
    firstName: "Admin",
    lastName: "VeloShop",
    email: "admin@admin.admin",
    password: "admin",
    role: "admin"
  });
}

function shouldSeedDemoUsers() {
  return !["false", "0", "no"].includes(String(process.env.SEED_DEMO_USERS || "").toLowerCase());
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof HttpError) {
    const body = { message: error.message };
    if (error.details) {
      body.errors = error.details;
    }
    return res.status(error.status).json(body);
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ message: "Email lub login jest juz zajety." });
  }

  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      message: error.errors?.[0]?.message || "Nieprawidlowe dane wejsciowe."
    });
  }

  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ message: error.message || "Nieprawidlowe zadanie." });
  }

  console.error(error);
  return res.status(500).json({ message: "Wystapil blad serwera." });
}

app.use(errorHandler);

async function start() {
  try {
    await sequelize.authenticate();

    if (shouldSeedDemoUsers()) {
      await seedUsers();
    }

    app.listen(port, () => {
      console.log(`User Service dziala na porcie ${port}`);
    });
  } catch (error) {
    console.error("Nie udalo sie uruchomic User Service.");
    console.error(error);
    process.exit(1);
  }
}

start();
