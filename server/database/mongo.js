// server/database/mongo.js
import mongoose from "mongoose";

export async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🧠 Memória conectada (Mongo Atlas)");
  } catch (err) {
    console.error("❌ Erro ao conectar no Mongo:", err);
  }
}