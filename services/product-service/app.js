const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes, Op } = require("sequelize");

const app = express();
app.use(cors());
app.use(express.json());

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
});

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT
    },
    imageUrl: {
        type: DataTypes.STRING
    }
});

async function seedDatabase() {
    await sequelize.sync({ force: true });

    await Product.bulkCreate([
        {
            name: "Trek Marlin 7",
            category: "Rowery Górskie",
            price: 3899.00,
            stock: 5,
            description: "Świetny rower górski do jazdy w terenie z amortyzatorem RockShox.",
            imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500"
        },
        {
            name: "Specialized Sirrus 2.0",
            category: "Rowery Fitness",
            price: 2999.00,
            stock: 8,
            description: "Lekki i zwinny rower szosowo-miejski idealny na dojazdy do pracy.",
            imageUrl: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500"
        },
        {
            name: "Kask Abus Macator",
            category: "Akcesoria",
            price: 249.00,
            stock: 15,
            description: "Sportowy kask rowerowy zapewniający doskonałe bezpieczeństwo.",
            imageUrl: "https://images.unsplash.com/photo-1591511275477-88f079d88154?q=80&w=500"
        },
        {
            name: "Opona Schwalbe Marathon",
            category: "Części",
            price: 139.00,
            stock: 22,
            description: "Antyprzebiciowa opona trekkingowa o legendarnej wytrzymałości.",
            imageUrl: "https://images.unsplash.com/photo-1572805303228-ade6c711059a?q=80&w=500"
        }
    ]);
    console.log("Database seeded with sample products successfully.");
}

app.get("/products", async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice } = req.query;
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

        const products = await Product.findAll({ where: whereClause });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/products/categories", async (req, res) => {
    try {
        const categories = await Product.findAll({
            attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("category")), "category"]]
        });
        res.json(categories.map(c => c.category));
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
        const { quantity } = req.body;

        if (!quantity || Number(quantity) < 1) {
            return res.status(400).json({ message: "Nieprawidłowa ilość." });
        }

        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Nie znaleziono produktu." });
        }

        if (product.stock < Number(quantity)) {
            return res.status(409).json({ message: "Niewystarczający stan magazynowy." });
        }

        product.stock -= Number(quantity);
        await product.save();

        console.log(`[Product] Zarezerwowano ${quantity} szt. produktu #${product.id}. Pozostało: ${product.stock}`);
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.patch("/products/:id/stock", async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({ message: "Nieprawidłowa wartość stanu magazynowego." });
        }

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Nie znaleziono produktu." });
        }

        product.stock = Number(stock);
        await product.save();

        console.log(`[Product] Zmieniono stan magazynowy produktu #${id} na: ${product.stock}`);
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post("/products", async (req, res) => {
    try {
        const { name, description, price, imageUrl, category, stock } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ message: "Nazwa, cena i kategoria są wymagane." });
        }

        const newProduct = await Product.create({
            name,
            description: description || "",
            price: Number(price),
            imageUrl: imageUrl || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500",
            category,
            stock: stock !== undefined ? Number(stock) : 0
        });

        console.log(`[Product] Dodano nowy produkt: ${newProduct.name} (#${newProduct.id})`);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ message: "Nie znaleziono produktu o podanym ID." });
        }

        await product.destroy();
        console.log(`[Product] Usunięto produkt #${id}`);
        res.json({ success: true, message: "Produkt został pomyślnie usunięty." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = 3002;
sequelize.authenticate().then(() => {
    seedDatabase().then(() => {
        app.listen(PORT, () => console.log(`Product service running on port ${PORT}`));
    });
});