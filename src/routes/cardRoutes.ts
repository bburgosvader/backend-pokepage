import express from "express";
import { isValidObjectId } from "mongoose";
import { MovieModel } from "../models/movie.model.js";
import { CardModel } from "../models/card.model.js";

const router = express.Router();


router.get("/", async (req, res) => {

const cards = await CardModel.find().lean();
res.status(200).json(cards);
});





// GET /api/v1/card/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
   
  const card = await CardModel.findOne({ id: id }).lean();
  console.log(card);
  if (!card) {
    res.status(404).json({ error: "Tarjeta no encontrada" });
    return;
  }

  res.status(200).json(card);
});

export default router;