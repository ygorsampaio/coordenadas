const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI não encontrado em .env');
  process.exit(1);
}

console.log('Tentando conectar com MONGODB_URI:', uri.replace(/(mongodb:\/\/[^:]+:)[^@]+/, '$1****'));

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
})
  .then(() => {
    console.log('✅ Conectou no MongoDB');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro real:', err);
    process.exit(1);
  });