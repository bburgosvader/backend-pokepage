import cors from "cors";
import express from "express";
import mongoose from "mongoose";
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
// app.listen(PORT, () =>
//   console.log(`🚀http://localhost:${PORT}/api-docs`),
// );

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado exitosamente a MongoDB Atlas');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

startServer();