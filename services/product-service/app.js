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

const PORT = 3002;
sequelize.authenticate().then(() => {
    seedDatabase().then(() => {
        app.listen(PORT, () => console.log(`Product service running on port ${PORT}`));
    });
});