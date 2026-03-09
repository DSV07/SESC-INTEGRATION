import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-educonnect";

// Database Setup
const dbPath = path.join(process.cwd(), "educonnect.db");
const db = new Database(dbPath);

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Aluno',
    department TEXT,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    color TEXT DEFAULT '#ffffff',
    is_pinned BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS planner_docs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    folder TEXT DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    folder TEXT DEFAULT 'General',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed initial channels if empty
const channelsCount = db.prepare("SELECT COUNT(*) as count FROM channels").get() as { count: number };
if (channelsCount.count === 0) {
  const insertChannel = db.prepare("INSERT INTO channels (name, description) VALUES (?, ?)");
  insertChannel.run("Geral", "Canal geral da instituição");
  insertChannel.run("Coordenação", "Assuntos da coordenação");
  insertChannel.run("Financeiro", "Assuntos financeiros");
  insertChannel.run("Secretaria", "Atendimento e secretaria");
  insertChannel.run("Turmas", "Discussões gerais das turmas");
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role, department } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const stmt = db.prepare("INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(name, email, hashedPassword, role || 'Aluno', department || '');
      
      const token = jwt.sign({ id: result.lastInsertRowid, email, role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: result.lastInsertRowid, name, email, role, department } });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Email já cadastrado" });
      } else {
        res.status(500).json({ error: "Erro ao registrar usuário" });
      }
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const user = db.prepare("SELECT id, name, email, role, department, avatar FROM users WHERE id = ?").get(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ user });
  });

  // Channels & Messages
  app.get("/api/channels", authenticateToken, (req, res) => {
    const channels = db.prepare("SELECT * FROM channels").all();
    res.json(channels);
  });

  app.get("/api/channels/:id/messages", authenticateToken, (req, res) => {
    const messages = db.prepare(`
      SELECT m.*, u.name as user_name, u.avatar as user_avatar 
      FROM messages m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.channel_id = ? 
      ORDER BY m.created_at ASC
    `).all(req.params.id);
    res.json(messages);
  });

  // Notes
  app.get("/api/notes", authenticateToken, (req: any, res) => {
    const notes = db.prepare("SELECT * FROM notes WHERE user_id = ? ORDER BY is_pinned DESC, created_at DESC").all(req.user.id);
    res.json(notes);
  });

  app.post("/api/notes", authenticateToken, (req: any, res) => {
    const { title, content, color, is_pinned } = req.body;
    const stmt = db.prepare("INSERT INTO notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)");
    const result = stmt.run(req.user.id, title, content || '', color || '#ffffff', is_pinned ? 1 : 0);
    const newNote = db.prepare("SELECT * FROM notes WHERE id = ?").get(result.lastInsertRowid);
    res.json(newNote);
  });
  
  app.delete("/api/notes/:id", authenticateToken, (req: any, res) => {
    db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Planner
  app.get("/api/planner", authenticateToken, (req: any, res) => {
    const docs = db.prepare("SELECT * FROM planner_docs WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(docs);
  });

  app.post("/api/planner", authenticateToken, (req: any, res) => {
    const { title, content, folder } = req.body;
    const stmt = db.prepare("INSERT INTO planner_docs (user_id, title, content, folder) VALUES (?, ?, ?, ?)");
    const result = stmt.run(req.user.id, title, content || '', folder || 'General');
    const newDoc = db.prepare("SELECT * FROM planner_docs WHERE id = ?").get(result.lastInsertRowid);
    res.json(newDoc);
  });

  // Files (Mocked upload)
  app.get("/api/files", authenticateToken, (req: any, res) => {
    const files = db.prepare("SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(files);
  });

  app.post("/api/files", authenticateToken, (req: any, res) => {
    const { name, size, type, url, folder } = req.body;
    const stmt = db.prepare("INSERT INTO files (user_id, name, size, type, url, folder) VALUES (?, ?, ?, ?, ?, ?)");
    const result = stmt.run(req.user.id, name, size, type, url, folder || 'General');
    const newFile = db.prepare("SELECT * FROM files WHERE id = ?").get(result.lastInsertRowid);
    res.json(newFile);
  });

  // --- Socket.IO ---
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_channel", (channelId) => {
      socket.join(`channel_${channelId}`);
    });

    socket.on("leave_channel", (channelId) => {
      socket.leave(`channel_${channelId}`);
    });

    socket.on("send_message", (data) => {
      const { channel_id, user_id, content } = data;
      try {
        const stmt = db.prepare("INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)");
        const result = stmt.run(channel_id, user_id, content);
        
        const newMessage = db.prepare(`
          SELECT m.*, u.name as user_name, u.avatar as user_avatar 
          FROM messages m 
          JOIN users u ON m.user_id = u.id 
          WHERE m.id = ?
        `).get(result.lastInsertRowid);

        io.to(`channel_${channel_id}`).emit("receive_message", newMessage);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
