const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    // Label definido pelo usuário (ex: "Casa", "Trabalho")
    label: {
      type: String,
      required: [true, 'O campo label é obrigatório'],
      trim: true,
      maxlength: [80, 'Label muito longo (máx. 80 caracteres)'],
    },
    // Nome completo retornado pelo Nominatim
    display_name: {
      type: String,
      required: [true, 'O campo display_name é obrigatório'],
    },
    lat: {
      type: String,
      required: [true, 'Latitude é obrigatória'],
    },
    lon: {
      type: String,
      required: [true, 'Longitude é obrigatória'],
    },
    // Anotações opcionais do usuário
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Nota muito longa (máx. 200 caracteres)'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automáticos
  }
);

module.exports = mongoose.model('Location', locationSchema);
