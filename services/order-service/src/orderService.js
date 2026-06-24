const { Order, OrderItem } = require("./db");
const { requireEnv } = require("./config");
const { getCurrentUser } = require("./userClient");

const PRODUCT_SERVICE_URL = requireEnv("PRODUCT_SERVICE_URL");
const PAYMENT_SERVICE_URL = requireEnv("PAYMENT_SERVICE_URL");

const orderInclude = [{ model: OrderItem }];

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getProduct(productId) {
  const response = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}`);
  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(data?.message || "Nie udało się pobrać produktu");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function reserveProduct(productId, quantity) {
  const response = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}/reserve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity })
  });
  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(data?.message || "Nie udało się zarezerwować produktu");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function releaseProduct(productId, quantity) {
  const product = await getProduct(productId);
  const response = await fetch(`${PRODUCT_SERVICE_URL}/products/${productId}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock: product.stock + quantity })
  });
  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(data?.message || "Nie udało się zwolnić rezerwacji produktu");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function processPayment(orderId, amount) {
  const response = await fetch(`${PAYMENT_SERVICE_URL}/payments/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, amount })
  });
  const data = await parseJson(response);

  return {
    ok: response.ok,
    data
  };
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Zamówienie musi zawierać co najmniej jedną pozycję");
    error.status = 400;
    throw error;
  }

  return items.map((item) => {
    const quantity = Number(item.quantity);
    const productId = Number(item.productId);

    if (!productId || !quantity || quantity < 1) {
      const error = new Error("Każda pozycja musi mieć productId i dodatnią quantity");
      error.status = 400;
      throw error;
    }

    return { productId, quantity };
  });
}

async function resolveOrderUser(user, authToken) {
  const currentUser = await getCurrentUser(authToken);

  if (Number(currentUser.id) !== Number(user.id)) {
    const error = new Error("Token uzytkownika nie pasuje do profilu.");
    error.status = 401;
    throw error;
  }

  return {
    ...user,
    email: currentUser.email
  };
}

async function createOrder(user, body, authToken) {
  const orderUser = await resolveOrderUser(user, authToken);
  const { items, deliveryAddress, paymentMethod } = body;

  if (!deliveryAddress || !paymentMethod) {
    const error = new Error("Adres dostawy i metoda płatności są wymagane");
    error.status = 400;
    throw error;
  }

  const normalizedItems = normalizeItems(items);
  const reservedItems = [];
  const orderItems = [];
  let totalAmount = 0;

  try {
    for (const item of normalizedItems) {
      const product = await getProduct(item.productId);

      if (product.stock < item.quantity) {
        const error = new Error(`Niewystarczający stan magazynowy produktu: ${product.name}`);
        error.status = 409;
        throw error;
      }

      await reserveProduct(item.productId, item.quantity);
      reservedItems.push(item);

      const lineTotal = Number(product.price) * item.quantity;
      totalAmount += lineTotal;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: Number(product.price)
      });
    }

    const order = await Order.create({
      userId: orderUser.id,
      userEmail: orderUser.email,
      deliveryAddress,
      paymentMethod,
      status: "pending",
      totalAmount
    });

    await OrderItem.bulkCreate(orderItems.map((item) => ({ ...item, OrderId: order.id })));

    const payment = await processPayment(order.id, totalAmount);

    if (payment.ok && payment.data?.success) {
      await order.update({
        status: "paid",
        paymentTransactionId: payment.data.transactionId || null,
        paymentMessage: payment.data.message || "Płatność zrealizowana pomyślnie."
      });
    } else {
      await order.update({
        status: "failed",
        paymentMessage: payment.data?.message || "Płatność została odrzucona."
      });

      for (const item of reservedItems) {
        await releaseProduct(item.productId, item.quantity);
      }
    }

    return Order.findByPk(order.id, { include: orderInclude });
  } catch (error) {
    for (const item of reservedItems) {
      try {
        await releaseProduct(item.productId, item.quantity);
      } catch {
        // Ignoruj błędy przy cofaniu rezerwacji po wcześniejszym błędzie.
      }
    }

    throw error;
  }
}

async function listOrders(user) {
  const where = user.role === "admin" ? {} : { userId: user.id };

  return Order.findAll({
    where,
    include: orderInclude,
    order: [["createdAt", "DESC"]]
  });
}

async function getOrderById(user, orderId) {
  const order = await Order.findByPk(orderId, { include: orderInclude });

  if (!order) {
    const error = new Error("Zamówienie nie istnieje");
    error.status = 404;
    throw error;
  }

  if (user.role !== "admin" && order.userId !== user.id) {
    const error = new Error("Brak uprawnień");
    error.status = 403;
    throw error;
  }

  return order;
}

async function updateOrderStatus(orderId, status) {
  const order = await Order.findByPk(orderId, { include: orderInclude });

  if (!order) {
    const error = new Error("Zamówienie nie istnieje");
    error.status = 404;
    throw error;
  }

  const previousStatus = order.status;
  order.status = status;
  await order.save();

  if (status === "cancelled" && ["pending", "paid", "failed"].includes(previousStatus)) {
    for (const item of order.OrderItems) {
      await releaseProduct(item.productId, item.quantity);
    }
  }

  return Order.findByPk(order.id, { include: orderInclude });
}

async function retryOrderPayment(user, orderId) {
  const order = await Order.findByPk(orderId, { include: orderInclude });

  if (!order) {
    const error = new Error("Zamówienie nie istnieje");
    error.status = 404;
    throw error;
  }

  if (user.role !== "admin" && order.userId !== user.id) {
    const error = new Error("Brak uprawnień");
    error.status = 403;
    throw error;
  }

  if (order.status !== "failed") {
    const error = new Error("Ponowienie płatności możliwe tylko dla nieudanych zamówień");
    error.status = 400;
    throw error;
  }

  const reservedItems = [];

  try {
    for (const item of order.OrderItems) {
      const product = await getProduct(item.productId);

      if (product.stock < item.quantity) {
        const error = new Error(`Niewystarczający stan magazynowy produktu: ${product.name}`);
        error.status = 409;
        throw error;
      }

      await reserveProduct(item.productId, item.quantity);
      reservedItems.push({ productId: item.productId, quantity: item.quantity });
    }

    await order.update({
      status: "pending",
      paymentMessage: null,
      paymentTransactionId: null
    });

    const payment = await processPayment(order.id, order.totalAmount);

    if (payment.ok && payment.data?.success) {
      await order.update({
        status: "paid",
        paymentTransactionId: payment.data.transactionId || null,
        paymentMessage: payment.data.message || "Płatność zrealizowana pomyślnie."
      });
    } else {
      await order.update({
        status: "failed",
        paymentMessage: payment.data?.message || "Płatność została odrzucona."
      });

      for (const item of reservedItems) {
        await releaseProduct(item.productId, item.quantity);
      }
    }

    return Order.findByPk(order.id, { include: orderInclude });
  } catch (error) {
    for (const item of reservedItems) {
      try {
        await releaseProduct(item.productId, item.quantity);
      } catch {
        // Ignoruj błędy przy cofaniu rezerwacji po wcześniejszym błędzie.
      }
    }

    throw error;
  }
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  retryOrderPayment
};
