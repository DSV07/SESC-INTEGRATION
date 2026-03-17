import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './express-app.js';
import { env } from './config/env.js';
import { channelsService } from './services/channels.service.js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import express from 'express';

async function startServer() {
  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  // Socket.IO Handlers
  io.on('connection', (socket) => {
    console.log('🔌 Novo socket conectado:', socket.id);

    socket.on('join_channel', (channelId) => {
      socket.join(`channel_${channelId}`);
      console.log(`👤 Usuário ${socket.id} entrou no canal ${channelId}`);
    });

    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel_${channelId}`);
      console.log(`👤 Usuário ${socket.id} saiu do canal ${channelId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const message = await channelsService.createMessage(data);
        const formattedMessage = {
          ...message,
          user_name: message.user.name,
          user_avatar: message.user.avatar,
        };
        io.to(`channel_${data.channel_id}`).emit('receive_message', formattedMessage);
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem via socket:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket desconectado:', socket.id);
    });
  });

  // Integração com Vite (Frontend)
  if (env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = env.PORT || 3000;
  console.log(`🌍 Ambiente (process.env.NODE_ENV): ${process.env.NODE_ENV}`);
  console.log(`🚀 Servidor rodando em http://localhost:${PORT} em modo ${env.NODE_ENV}`);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Ouvindo na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('💥 Falha ao iniciar o servidor:', err);
  process.exit(1);
});
