// server/index.js - VERSÃO SIMPLIFICADA E FUNCIONAL
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../client/views"));

// Configura rotas dinamicamente
const setupApp = async () => {
  try {
    // 1. Importa episodicMemory (agora existe)
    const { episodicMemory } = await import("./core/episodicMemory.js");
    console.log('✅ episodicMemory carregada');
    
    // 2. Importa chatController
    const chatController = await import("./controllers/chatController.js");
    console.log('✅ chatController carregado');
    
    // 3. Configura rotas básicas
    app.get("/", (req, res) => {
      res.render("index", {
        robotName: "LunaTech 😏",
        robotStatus: "Sistema de memória ativo"
      });
    });
    
    // Rota principal
    if (chatController.chat) {
      app.post("/chat", chatController.chat);
      console.log('✅ Rota /chat configurada');
    }
    
    // Rotas extras se existirem
    if (chatController.saveToDatabase) {
      app.post("/api/save-memory", chatController.saveToDatabase);
      console.log('✅ Rota /api/save-memory configurada');
    }
    
    if (chatController.getRecentMemories) {
      app.get("/api/recent-memories", chatController.getRecentMemories);
      console.log('✅ Rota /api/recent-memories configurada');
    }
    
    // Rota para estado atual
    app.get("/api/current-state", (req, res) => {
      res.json({
        success: true,
        ...episodicMemory.getCurrentStateForUI(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Rota de saúde
    app.get("/health", (req, res) => {
      res.json({ 
        status: "healthy",
        memoryCount: episodicMemory.temporaryMemories?.length || 0,
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('🚀 Todas as rotas configuradas');
    
  } catch (error) {
    console.error("❌ Erro na configuração:", error.message);
    
    // Fallback mínimo
    app.post("/chat", (req, res) => {
      res.json({ 
        reply: "Sistema iniciando...",
        mood: { happiness: 50, stress: 50, energy: 50 }
      });
    });
    
    app.get("/health", (req, res) => {
      res.json({ status: "starting", error: error.message });
    });
  }
};

// Inicia servidor
const startServer = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    
    if (!MONGO_URI) {
      console.warn("⚠️  MONGO_URI não configurada, usando memória apenas");
    } else {
      await mongoose.connect(MONGO_URI);
      console.log("🗄️  MongoDB conectado");
    }
    
    await setupApp();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🤖 LunaTech online em http://localhost:${PORT}`);
      console.log(`💬 Chat: POST /chat`);
      console.log(`📊 Estado: GET /api/current-state`);
      console.log(`❤️  Saúde: GET /health`);
    });
    
  } catch (error) {
    console.error("💥 Falha ao iniciar:", error.message);
    process.exit(1);
  }
};

startServer();