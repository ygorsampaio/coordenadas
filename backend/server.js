const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const locationsRouter = require('./routes/locations');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/locations', locationsRouter);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    })
    .then(() => {
      console.log('✅ MongoDB conectado');
    })
    .catch((err) => {
      console.error('⚠️  Erro ao conectar no MongoDB:', err.message);
      console.log('⚠️  Servidor iniciará sem MongoDB. Algumas funcionalidades podem não estar disponíveis.');
    });
} else {
  console.warn('⚠️  MONGODB_URI não configurado. Servidor rodará em modo offline.');
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 Acesse http://localhost:${PORT}`);
});
