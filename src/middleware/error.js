export const errorMiddleware = (err, req, res, next) => {
  console.error('❌ Erro inesperado:', err.stack);

  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(status).json({
    error: message,
    status,
  });
};
