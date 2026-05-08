const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'O campo label é obrigatório'],
      trim: true,
      maxlength: [80, 'Label muito longo (máx. 80 caracteres)'],
    },
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
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Nota muito longa (máx. 200 caracteres)'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Location', locationSchema);
