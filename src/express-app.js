import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rotas da API
app.use('/api', routes);

// Middleware de Erro Centralizado
app.use(errorMiddleware);

export { app };
