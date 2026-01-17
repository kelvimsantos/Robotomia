import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Mongo conectado isoladamente");
  process.exit(0);
} catch (err) {
  console.error("❌ Mongo NÃO conectou:", err.message);
  process.exit(1);
}
