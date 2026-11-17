import express from "express";
import { isValidObjectId } from "mongoose";
import { MovieModel } from "../models/movie.model.js";

const router = express.Router();

// GET /api/v1/movies?limit=10&title=matrix
router.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const title = typeof req.query.title === "string" ? req.query.title : undefined;

  const filtro = title
    ? { title: { $regex: title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
    : {};

  const movies = await MovieModel.find(filtro).limit(limit).lean();
  res.status(200).json(movies);
});

// GET /api/v1/movies/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Id inválido" });
    return;
  }

  const movie = await MovieModel.findById(id).lean();

  if (!movie) {
    res.status(404).json({ error: "Película no encontrada" });
    return;
  }

  res.status(200).json(movie);
});

export default router;