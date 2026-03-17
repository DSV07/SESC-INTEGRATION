import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './express-app.js';
import { env } from './config/env.js';
import { channelsService } from './services/channels.service.js';
import { prisma } from './config/db.js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import express from 'express';

async function startServer() {
  // Sincronização de emergência: Adiciona a coluna se ela não existir
  try {
    console.log('🔄 Verificando esquema do banco de dados...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Message ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Banco de dados sincronizado.');
  } catch (dbErr) {
    console.log('⚠️ Aviso: Não foi possível adicionar a coluna is_announcement (pode já existir ou sem permissão).');
  }

  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  // Disponibilizar io para as rotas/controllers
  app.set('io', io);

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
        const user = await prisma.user.findUnique({
          where: { id: data.user_id },
          include: { system_role: true, department: true, unit: true }
        });

        const formattedMessage = {
          ...message,
          user_name: user.name,
          user_avatar: user.avatar,
          user_role_tag: user.system_role?.name,
          user_dept_tag: user.department?.name,
          user_unit_tag: user.unit?.name,
        };
        
        // Processar Menções
        const mentions = data.content.match(/@([A-Z-a-zÀ-ü\s]+?)(?=\s|$)/g);
        if (mentions) {
          for (const mention of mentions) {
            const userName = mention.slice(1).trim();
            const mentionedUser = await prisma.user.findFirst({
              where: { name: userName }
            });

            if (mentionedUser && mentionedUser.id !== data.user_id) {
              // Criar Notificação no BD
              const notification = await prisma.notification.create({
                data: {
                  user_id: mentionedUser.id,
                  type: 'MENTION',
                  title: 'Você foi mencionado!',
                  content: `${user.name} mencionou você em uma mensagem.`,
                  link: `/chat?channel=${data.channel_id}&message=${message.id}`
                }
              });

              // Avisar o usuário em tempo real se ele estiver conectado
              io.emit(`notification_${mentionedUser.id}`, notification);
            }
          }
        }

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
