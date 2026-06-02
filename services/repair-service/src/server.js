const cors = require("cors");
const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { Op } = require("sequelize");
const { authMiddleware, requireAdmin } = require("./auth");
const { Repair, RepairService, sequelize } = require("./db");

const app = express();
const port = process.env.PORT || 4005;
const openApiPath = path.resolve(__dirname, "../../../docs/openapi.yaml");
const swaggerDocument = YAML.load(openApiPath);
const WORK_HOURS_PER_DAY = 8;
const ACTIVE_STATUSES = ["booked", "accepted", "in_progress", "ready"];
const FINAL_STATUSES = ["completed", "cancelled"];

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/openapi.yaml", (req, res) => res.sendFile(openApiPath));

const repairInclude = [{ model: RepairService }];

function toDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value, days) {
  const date = typeof value === "string" ? toDate(value) : new Date(value);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function isWorkingDay(dateKey) {
  const day = toDate(dateKey).getDay();
  return day !== 0 && day !== 6;
}

function getLoad(loads, dateKey) {
  return loads.get(dateKey) || 0;
}

function addLoad(loads, dateKey, hours) {
  loads.set(dateKey, getLoad(loads, dateKey) + hours);
}

function buildPlan(startDate, durationHours, loads) {
  let remaining = durationHours;
  let dateKey = startDate;
  const plan = [];

  while (remaining > 0) {
    if (isWorkingDay(dateKey)) {
      const freeHours = Math.max(0, WORK_HOURS_PER_DAY - getLoad(loads, dateKey));
      const usedHours = Math.min(freeHours, remaining);

      if (usedHours > 0) {
        plan.push({ date: dateKey, hours: usedHours });
        remaining -= usedHours;
      }
    }

    if (remaining > 0) {
      dateKey = addDays(dateKey, 1);
    }
  }

  return {
    readyDate: plan[plan.length - 1].date,
    plan
  };
}

async function buildLoads(excludedRepairId = null) {
  const repairs = await Repair.findAll({
    where: { status: ACTIVE_STATUSES },
    include: RepairService,
    order: [["createdAt", "ASC"], ["id", "ASC"]]
  });
  const loads = new Map();

  for (const repair of repairs) {
    if (excludedRepairId && repair.id === excludedRepairId) {
      continue;
    }

    const plan = buildPlan(repair.dropOffDate, repair.plannedHours, loads).plan;
    for (const item of plan) {
      addLoad(loads, item.date, item.hours);
    }
  }

  return loads;
}

async function estimateRepair(repairServiceId, dropOffDate) {
  const service = await RepairService.findByPk(repairServiceId);
  if (!service) {
    return null;
  }

  const loads = await buildLoads();
  return {
    service,
    ...buildPlan(dropOffDate, service.durationHours, loads)
  };
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "repair-service" });
});

app.get("/repair-services", async (req, res) => {
  res.json(await RepairService.findAll({ order: [["id", "ASC"]] }));
});

app.get("/repair-calendar", async (req, res) => {
  const start = req.query.from || toDateKey(new Date());
  const days = Math.min(Number(req.query.days || 21), 60);
  const loads = await buildLoads();
  const calendar = [];

  for (let index = 0; index < days; index += 1) {
    const date = addDays(start, index);
    const bookedHours = getLoad(loads, date);
    const workingDay = isWorkingDay(date);

    calendar.push({
      date,
      workingDay,
      bookedHours,
      freeHours: workingDay ? Math.max(0, WORK_HOURS_PER_DAY - bookedHours) : 0
    });
  }

  res.json(calendar);
});

app.post("/repair-estimate", async (req, res) => {
  const { repairServiceId, dropOffDate } = req.body;

  if (!repairServiceId || !dropOffDate) {
    return res.status(400).json({ message: "Wybierz rodzaj naprawy i dzień oddania" });
  }

  const estimate = await estimateRepair(repairServiceId, dropOffDate);
  if (!estimate) {
    return res.status(404).json({ message: "Nie znaleziono usługi" });
  }

  res.json({
    durationHours: estimate.service.durationHours,
    readyDate: estimate.readyDate,
    plan: estimate.plan
  });
});

app.post("/repairs", authMiddleware, async (req, res) => {
  const { bikeDescription, issueDescription, repairServiceId, dropOffDate } = req.body;

  if (!bikeDescription || !issueDescription || !repairServiceId || !dropOffDate) {
    return res.status(400).json({ message: "Uzupełnij dane zgłoszenia" });
  }

  const estimate = await estimateRepair(repairServiceId, dropOffDate);
  if (!estimate) {
    return res.status(404).json({ message: "Nie znaleziono usługi" });
  }

  const repair = await Repair.create({
    userId: req.user.id,
    userEmail: req.user.email,
    bikeDescription,
    issueDescription,
    dropOffDate,
    readyDate: estimate.readyDate,
    plannedHours: estimate.service.durationHours,
    RepairServiceId: estimate.service.id
  });

  res.status(201).json(await Repair.findByPk(repair.id, { include: repairInclude }));
});

app.get("/repairs", authMiddleware, async (req, res) => {
  const where = req.user.role === "admin" ? {} : { userId: req.user.id };
  const repairs = await Repair.findAll({
    where,
    include: repairInclude,
    order: [["createdAt", "DESC"]]
  });

  res.json(repairs);
});

app.get("/repairs/:id", authMiddleware, async (req, res) => {
  const repair = await Repair.findByPk(req.params.id, { include: repairInclude });

  if (!repair) {
    return res.status(404).json({ message: "Zgłoszenie nie istnieje" });
  }

  if (req.user.role !== "admin" && repair.userId !== req.user.id) {
    return res.status(403).json({ message: "Brak uprawnień" });
  }

  res.json(repair);
});

app.patch("/repairs/:id/status", authMiddleware, requireAdmin, async (req, res) => {
  if (![...ACTIVE_STATUSES, ...FINAL_STATUSES].includes(req.body.status)) {
    return res.status(400).json({ message: "Nieprawidłowy status" });
  }

  const repair = await Repair.findByPk(req.params.id);

  if (!repair) {
    return res.status(404).json({ message: "Zgłoszenie nie istnieje" });
  }

  repair.status = req.body.status || repair.status;
  await repair.save();

  res.json(await Repair.findByPk(repair.id, { include: repairInclude }));
});

app.delete("/repairs", authMiddleware, requireAdmin, async (req, res) => {
  const deleted = await Repair.destroy({ where: {} });
  res.json({ deleted });
});

async function seedData() {
  const services = [
    { name: "Szybka regulacja", description: "Regulacja hamulców i przerzutek.", durationHours: 2, price: 89 },
    { name: "Przegląd standardowy", description: "Kontrola napędu, kół, hamulców i dokręcenie osprzętu.", durationHours: 4, price: 149 },
    { name: "Serwis napędu", description: "Wymiana lub czyszczenie łańcucha, kasety i linek.", durationHours: 8, price: 249 },
    { name: "Naprawa poważna", description: "Diagnoza i naprawa wymagająca pracy przez więcej niż jeden dzień.", durationHours: 12, price: 399 }
  ];
  const names = services.map((service) => service.name);

  await RepairService.destroy({
    where: {
      name: { [Op.notIn]: names }
    }
  });

  for (const service of services) {
    const [record] = await RepairService.findOrCreate({
      where: { name: service.name },
      defaults: service
    });

    await record.update(service);
  }
}

sequelize.sync({ alter: true }).then(seedData).then(() => {
  app.listen(port, () => {
    console.log(`Repair Service działa na porcie ${port}`);
  });
});
