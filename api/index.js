const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const locationsRouter = require('../backend/routes/locations');

require('dotenv').config();

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/locations', locationsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    })
    .then(() => console.log('✅ MongoDB conectado'))
    .catch((err) => console.error('⚠️ Erro ao conectar no MongoDB:', err.message));
} else {
  console.warn('⚠️ MONGODB_URI não configurado. API rodará sem MongoDB.');
}

module.exports = app;
