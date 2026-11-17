import { Schema, model } from "mongoose";

export interface Movie {
  title: string;
  year?: number;
  plot?: string;
  genres?: string[];
  runtime?: number;
  rated?: string;
  cast?: string[];
  directors?: string[];
  poster?: string;
  imdb?: {
    rating?: number;
    votes?: number;
    id?: number;
  };
}

const movieSchema = new Schema<Movie>(
  {
    title: { type: String, required: true },
    year: Number,
    plot: String,
    genres: [String],
    runtime: Number,
    rated: String,
    cast: [String],
    directors: [String],
    poster: String,
    imdb: {
      rating: Number,
      votes: Number,
      id: Number,
    },
  },
  { collection: "movies" }
);

export const MovieModel = model<Movie>("Movie", movieSchema);