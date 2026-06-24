const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

function requireEnv(name) {
    const value = typeof process.env[name] === "string" ? process.env[name].trim() : "";
    if (!value) {
        throw new Error(`${name} must be set in .env`);
    }
    return value;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "payment-service" });
});

app.post("/payments/process", (req, res) => {
    const { amount, repairId } = req.body;

    if (!amount) {
        return res.status(400).json({ success: false, message: "Brak kwoty płatności" });
    }

    const isRejected = Math.random() < 0.1;

    if (isRejected) {
        console.log(`[Payment] Płatność dla naprawy #${repairId} na kwotę ${amount} zł ODRZUCONA`);
        return res.status(402).json({
            success: false,
            message: "Płatność została odrzucona."
        });
    }

    const transactionId = "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    console.log(`[Payment] Płatność dla naprawy #${repairId} na kwotę ${amount} zł ZAAKCEPTOWANA. ID: ${transactionId}`);

    res.json({
        success: true,
        transactionId,
        message: "Płatność zrealizowana pomyślnie."
    });
});

const PORT = Number(requireEnv("PORT"));
app.listen(PORT, () => console.log(`Payment service uruchomiony na porcie ${PORT}`));
