const cors = require("cors");
const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { authMiddleware, requireAdmin } = require("./auth");
const { requireEnv } = require("./config");
const { sequelize, ORDER_STATUSES } = require("./db");
const orderService = require("./orderService");

const app = express();
const port = Number(requireEnv("PORT"));
const openApiPath = path.resolve(__dirname, "../../../docs/openapi.yaml");
const swaggerDocument = YAML.load(openApiPath);

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/openapi.yaml", (req, res) => res.sendFile(openApiPath));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order-service" });
});

app.post("/orders", authMiddleware, async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user, req.body, req.authToken);
    res.status(201).json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

app.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await orderService.listOrders(req.user);
    res.json(orders);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

app.get("/orders/:id", authMiddleware, async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.user, req.params.id);
    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

app.patch("/orders/:id/status", authMiddleware, requireAdmin, async (req, res) => {
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Nieprawidłowy status" });
  }

  try {
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

app.post("/orders/:id/retry-payment", authMiddleware, async (req, res) => {
  try {
    const order = await orderService.retryOrderPayment(req.user, req.params.id);
    res.json(order);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
});

sequelize.authenticate().then(() => {
  app.listen(port, () => {
    console.log(`Order Service działa na porcie ${port}`);
  });
});
