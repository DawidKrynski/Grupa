const { Product } = require("./db");

const demoProducts = [
    {
        name: "Trek Marlin 7",
        category: "Rowery Gorskie",
        price: 3899.00,
        stock: 5,
        description: "Swietny rower gorski do jazdy w terenie z amortyzatorem RockShox.",
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
        description: "Sportowy kask rowerowy zapewniajacy dobre bezpieczenstwo.",
        imageUrl: "https://images.unsplash.com/photo-1591511275477-88f079d88154?q=80&w=500"
    },
    {
        name: "Opona Schwalbe Marathon",
        category: "Czesci",
        price: 139.00,
        stock: 22,
        description: "Antyprzebiciowa opona trekkingowa o duzej wytrzymalosci.",
        imageUrl: "https://images.unsplash.com/photo-1572805303228-ade6c711059a?q=80&w=500"
    }
];

function shouldSeedDemoProducts() {
    return !["false", "0", "no"].includes(String(process.env.SEED_DEMO_PRODUCTS || "").toLowerCase());
}

async function seedProducts() {
    for (const product of demoProducts) {
        const [record] = await Product.findOrCreate({
            where: { name: product.name },
            defaults: product
        });

        await record.update(product);
    }
}

module.exports = { seedProducts, shouldSeedDemoProducts };
