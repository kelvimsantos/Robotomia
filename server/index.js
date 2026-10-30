// server/index.js - VERSÃO SIMPLIFICADA E FUNCIONAL
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
  loadRecentInteractionsFromDb, loadInteractionsByDate, markAsImportant,
  loadImportantMemoriesFromDb, loadContextMemoriesByTags, listMemoryTypes,
  seedMemoryTypes, saveRobotStateToDb, loadRobotStateFromDb
} from "./memory/persistence.js";
import { getEmotionState, regulateByElapsedTime } from "./core/emotion.js";
import { getPersonality } from "./core/personality.js";
import { getAspirations, getKnownTopics, getExperience, getIdentity, setRobotName } from "./core/robotState.js";
import { getRecentInteractions } from "./memory/unifiedMemory.js";

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
    
    // 2.1 Módulo ALEXA (skill) — ativo/inativo según config, nunca rompe el resto
    const alexaRoutes = await import("./routes/alexa.routes.js");
    app.use("/api/alexa", alexaRoutes.default);
    console.log('✅ Ruta /api/alexa configurada (módulo Alexa)');
    
    // 3. Configura rotas básicas
    app.get("/", (req, res) => {
      res.render("index", {
        robotName: getIdentity().name,
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
    
    // Rota para estado atual (emoções + personalidade REALES, contexto para o front)
    app.get("/api/current-state", (req, res) => {
      const mood = regulateByElapsedTime(); // aplica el paso del tiempo al leer
      const pers = getPersonality();
      res.json({
        success: true,
        identity: getIdentity(),
        mood, // happiness, stress, energy, emotion
        personality: {
          ...pers,
          aspirations: getAspirations(),
          knownTopics: getKnownTopics(),
          experience: getExperience()
        },
        memoryCount: getRecentInteractions(20).length,
        timestamp: new Date().toISOString()
      });
    });

    // 💾 Memórias: últimas e por data (momentos com data)
    app.get("/api/memories", async (req, res) => {
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const date = req.query.data || req.query.date;
      const memories = date
        ? await loadInteractionsByDate(date, limit)
        : await loadRecentInteractionsFromDb(limit);
      res.json({ success: true, count: memories.length, memories });
    });

    // ⭐ Marca um momento como importante (copiando para a TABELA DEDICADA)
    app.post("/api/memories/:id/importante", async (req, res) => {
      const updated = await markAsImportant(req.params.id);
      if (updated) {
        res.json({ success: true, memory: updated });
      } else {
        res.status(404).json({ success: false, error: "Moment not found" });
      }
    });

    // ⭐ MomentoS IMPORTANTES da tabela dedicada (resgatável por data/contexto)
    app.get("/api/memories/importantes", async (req, res) => {
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const memories = await loadImportantMemoriesFromDb({
        limit,
        date: req.query.data || req.query.date
      });
      res.json({ success: true, count: memories.length, memories });
    });

    // 🆔 Perfil: identidade (nome) + humor + personalidade + experiência
    app.get("/api/profile", (req, res) => {
      const pers = getPersonality();
      res.json({
        success: true,
        identity: getIdentity(),
        mood: regulateByElapsedTime(),
        personality: {
          ...pers,
          aspirations: getAspirations(),
          knownTopics: getKnownTopics(),
          experience: getExperience()
        }
      });
    });

    // 🆔 Escolher o nome do robô (persistido no banco)
    app.put("/api/profile/name", async (req, res) => {
      const name = String(req.body.name || "").trim();
      if (!name) return res.status(400).json({ success: false, error: "Informe um nome" });
      const identity = setRobotName(name, req.body.creator);
      const mood = getEmotionState();
      const pers = getPersonality();
      await saveRobotStateToDb({
        emotionState: mood,
        personality: {
          traits: pers.traits,
          likes: pers.likes,
          dislikes: pers.dislikes,
          aspirations: pers.aspirations,
          knownTopics: pers.knownTopics
        },
        experience: getExperience(),
        identity
      });
      res.json({ success: true, identity });
    });

    // 🗂️ Tipos de memória (catálogo da tabela de memórias com datas)
    app.get("/api/memory-types", async (req, res) => {
      const types = await listMemoryTypes();
      res.json({ success: true, count: types.length, types });
    });

    // 🧩 Memórias de contexto (resumo completo por tag, com data)
    app.get("/api/context-memories", async (req, res) => {
      const tag = req.query.tag;
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const memories = tag
        ? await loadContextMemoriesByTags(String(tag).split(",").map(t => t.trim()).filter(Boolean), limit)
        : [];
      res.json({ success: true, count: memories.length, tag: tag || null, memories });
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
      // 🧠 MODO OFFLINE (spec §20): sem banco, as operações de memória falham
      // rápido em vez de ficarem aguardando uma conexão que não existe.
      mongoose.set("bufferCommands", false);
    } else {
      await mongoose.connect(MONGO_URI);
      console.log("🗄️  MongoDB conectado");
      await seedMemoryTypes(); // garante a tabela de TIPOS DE MEMÓRIA
    }
    
    await setupApp();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🤖 ${getIdentity().name} online em http://localhost:${PORT}`);
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