const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// ── GET /api/locations ─────────────────────────────────────────
// Lista todos os locais salvos (mais recentes primeiro)
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar locais', detail: err.message });
  }
});

// ── GET /api/locations/:id ────────────────────────────────────
// Busca um local específico por ID
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ error: 'Local não encontrado' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar local', detail: err.message });
  }
});

// ── POST /api/locations ────────────────────────────────────────
// Cria um novo local salvo
router.post('/', async (req, res) => {
  try {
    const { label, display_name, lat, lon, notes } = req.body;

    const location = new Location({ label, display_name, lat, lon, notes });
    const saved = await location.save();

    res.status(201).json(saved);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Dados inválidos', detail: err.message });
    }
    res.status(500).json({ error: 'Erro ao salvar local', detail: err.message });
  }
});

// ── PUT /api/locations/:id ─────────────────────────────────────
// Atualiza label e/ou notes de um local
router.put('/:id', async (req, res) => {
  try {
    const { label, notes } = req.body;

    const updated = await Location.findByIdAndUpdate(
      req.params.id,
      { label, notes },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Local não encontrado' });
    res.json(updated);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Dados inválidos', detail: err.message });
    }
    res.status(500).json({ error: 'Erro ao atualizar local', detail: err.message });
  }
});

// ── DELETE /api/locations/:id ──────────────────────────────────
// Remove um local salvo
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Location.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Local não encontrado' });
    res.json({ message: 'Local removido com sucesso', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover local', detail: err.message });
  }
});

module.exports = router;
