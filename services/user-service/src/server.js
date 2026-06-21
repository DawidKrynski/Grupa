const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { Op } = require("sequelize");
const { authMiddleware, JWT_SECRET } = require("./authMiddleware");
const { sequelize, User } = require("./db");

const app = express();
const port = process.env.PORT || 4001;
const openApiPath = path.resolve(__dirname, "../../../docs/openapi.yaml");
const swaggerDocument = YAML.load(openApiPath);

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/openapi.yaml", (req, res) => res.sendFile(openApiPath));

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
  return jwt.sign(publicUser(user), JWT_SECRET, { expiresIn: "2h" });
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

app.post("/auth/register", async (req, res) => {
  try {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Uzupełnij wszystkie pola" });
  }

  const exists = await User.findOne({
    where: {
      [Op.or]: [
        { email },
        { login: email }
      ]
    }
  });
  if (exists) {
    return res.status(409).json({ message: "Email lub login jest już zajęty" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ login: email, firstName, lastName, email, passwordHash });

  res.status(201).json({
    token: signToken(user),
    user: publicUser(user)
  });
  } catch (error) {
    return res.status(400).json({ message: "Problem z danymi wejściowymi." });
  }
});

app.post("/auth/login", async (req, res) => {
  const { login, email, password } = req.body;
  const identifier = login || email;
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { login: identifier },
        { email: identifier }
      ]
    }
  });

  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).json({ message: "Nieprawidłowy login lub hasło" });
  }

  res.json({
    token: signToken(user),
    user: publicUser(user)
  });
});

app.get("/users/me", authMiddleware, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Użytkownik nie istnieje" });
  }

  res.json(publicUser(user));
});

async function upsertUser({ login, firstName, lastName, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({
    where: {
      [Op.or]: [
        { login },
        { email }
      ]
    }
  });
  const user = existing || await User.create({ login, firstName, lastName, email, passwordHash, role });

  await user.update({ firstName, lastName, email, passwordHash, role });
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

sequelize.sync({ alter: true }).then(seedUsers).then(() => {
  app.listen(port, () => {
    console.log(`User Service działa na porcie ${port}`);
  });
});
