const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
const { sequelize } = require("./db");

const MIGRATIONS_TABLE = "SequelizeMeta";

async function tableExists(queryInterface, tableName) {
    const tables = await queryInterface.showAllTables();
    return tables.some((table) => {
        const currentName = typeof table === "string" ? table : table.tableName;
        return currentName === tableName;
    });
}

async function ensureMigrationsTable(queryInterface) {
    if (await tableExists(queryInterface, MIGRATIONS_TABLE)) {
        return;
    }

    await queryInterface.createTable(MIGRATIONS_TABLE, {
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false
        }
    });
}

async function getExecutedMigrations() {
    const rows = await sequelize.query(`SELECT name FROM ${MIGRATIONS_TABLE}`, {
        type: Sequelize.QueryTypes.SELECT
    });

    return new Set(rows.map((row) => row.name));
}

async function markMigrationAsExecuted(queryInterface, name) {
    await queryInterface.bulkInsert(MIGRATIONS_TABLE, [{
        name,
        createdAt: new Date()
    }]);
}

async function runMigrations() {
    const migrationsDir = path.resolve(__dirname, "migrations");
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".js"))
        .sort();
    const queryInterface = sequelize.getQueryInterface();

    await sequelize.authenticate();
    await ensureMigrationsTable(queryInterface);

    const executed = await getExecutedMigrations();

    for (const file of migrationFiles) {
        if (executed.has(file)) {
            continue;
        }

        const migration = require(path.join(migrationsDir, file));
        console.log(`Running migration ${file}`);
        await migration.up(queryInterface, Sequelize);
        await markMigrationAsExecuted(queryInterface, file);
    }

    console.log("Migrations completed.");
}

runMigrations()
    .catch((error) => {
        console.error("Migration failed.");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
