import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import { config } from "./config.js";
import storeRouter, { initializeAccounts } from "./routes/storeRoutes.js";
import testRouter from "./routes/testRoutes.js";
import movieRouter from "./routes/movieRoutes.js";
import cardRouter from "./routes/cardRoutes.js";

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/api/v1", storeRouter);
app.use("/api/v1/test", testRouter);
app.use("/api/v1/movies", movieRouter);
app.use("/api/v1/cards", cardRouter);

const swaggerFile = JSON.parse(readFileSync("./swagger-output.json", "utf-8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

const startServer = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Conectado exitosamente a MongoDB Atlas");

    await initializeAccounts();
    app.listen(config.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error(
      "❌ Error al conectar a MongoDB Atlas:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    process.exit(1);
  }
};

startServer();