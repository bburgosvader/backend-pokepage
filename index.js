import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import authRouter from "./src/routes/authRoutes.js";
import testRouter from "./src/routes/testRoutes.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/test", testRouter);
// Importa la documentación generada
const swaggerFile = JSON.parse(readFileSync("./swagger-output.json"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀http://localhost:${PORT}/api-docs`),
);
