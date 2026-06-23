async function tableExists(queryInterface, tableName) {
    const tables = await queryInterface.showAllTables();
    return tables.some((table) => {
        const currentName = typeof table === "string" ? table : table.tableName;
        return currentName === tableName;
    });
}

module.exports = {
    async up(queryInterface, Sequelize) {
        const productsTable = "Products";

        if (!(await tableExists(queryInterface, productsTable))) {
            await queryInterface.createTable(productsTable, {
                id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                category: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                price: {
                    type: Sequelize.FLOAT,
                    allowNull: false
                },
                stock: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                imageUrl: {
                    type: Sequelize.STRING,
                    allowNull: true
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            });
        }

    },

    async down(queryInterface) {
        await queryInterface.dropTable("Products");
    }
};
