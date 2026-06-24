const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { Op, Sequelize } = require("sequelize");
const { authMiddleware, requireAdmin } = require("./src/auth");
const { requireEnv } = require("./src/config");
const { Product, sequelize } = require("./src/db");
const { seedProducts, shouldSeedDemoProducts } = require("./src/seed");

const app = express();
const PORT = Number(requireEnv("PORT"));
const openApiPath = path.resolve(__dirname, "../../docs/openapi.yaml");
const swaggerDocument = YAML.load(openApiPath);

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/openapi.yaml", (req, res) => res.sendFile(openApiPath));

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "product-service" });
});

app.get("/products", async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, available } = req.query;
        const whereClause = {};

        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }
        if (category) {
            whereClause.category = category;
        }
        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) whereClause.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) whereClause.price[Op.lte] = parseFloat(maxPrice);
        }
        if (available === "true") {
            whereClause.stock = { [Op.gt]: 0 };
        }

        const products = await Product.findAll({ where: whereClause, order: [["id", "ASC"]] });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/products/categories", async (req, res) => {
    try {
        const categories = await Product.findAll({
            attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("category")), "category"]],
            order: [["category", "ASC"]]
        });
        res.json(categories.map((category) => category.category));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/products/:id", async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Produkt nie istnieje" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/products/:id/reserve", async (req, res) => {
    try {
        const quantity = Number(req.body.quantity);

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: "Nieprawidlowa ilosc." });
        }

        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Nie znaleziono produktu." });
        }

        if (product.stock < quantity) {
            return res.status(409).json({ message: "Niewystarczajacy stan magazynowy." });
        }

        product.stock -= quantity;
        await product.save();

        console.log(`[Product] Zarezerwowano ${quantity} szt. produktu #${product.id}. Pozostalo: ${product.stock}`);
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.patch("/products/:id/stock", authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const stock = Number(req.body.stock);

        if (!Number.isInteger(stock) || stock < 0) {
            return res.status(400).json({ message: "Nieprawidlowa wartosc stanu magazynowego." });
        }

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Nie znaleziono produktu." });
        }

        product.stock = stock;
        await product.save();

        console.log(`[Product] Zmieniono stan magazynowy produktu #${id} na: ${product.stock}`);
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/products", authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { name, description, price, imageUrl, category, stock } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ message: "Nazwa, cena i kategoria sa wymagane." });
        }

        const newProduct = await Product.create({
            name: String(name).trim(),
            description: description || "",
            price: Number(price),
            imageUrl: imageUrl || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500",
            category: String(category).trim(),
            stock: stock !== undefined ? Number(stock) : 0
        });

        console.log(`[Product] Dodano nowy produkt: ${newProduct.name} (#${newProduct.id})`);
        res.status(201).json(newProduct);
    } catch (error) {
        const status = error.name === "SequelizeUniqueConstraintError" ? 409 : 500;
        res.status(status).json({ message: error.message });
    }
});

app.delete("/products/:id", authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ message: "Nie znaleziono produktu o podanym ID." });
        }

        await product.destroy();
        console.log(`[Product] Usunieto produkt #${id}`);
        res.json({ success: true, message: "Produkt zostal usuniety." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function start() {
    try {
        await sequelize.authenticate();

        if (shouldSeedDemoProducts()) {
            await seedProducts();
        }

        app.listen(PORT, () => console.log(`Product service running on port ${PORT}`));
    } catch (error) {
        console.error("Nie udalo sie uruchomic Product Service.");
        console.error(error);
        process.exit(1);
    }
}

start();
