import { Schema, model } from "mongoose";

export interface Card {
  id: string;
  type: string;
  name: string;
  price: number;
  image: string;

}

const cardSchema = new Schema<Card>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
  },
  { collection: "cards" }
);

export const CardModel = model<Card>("Card", cardSchema);
