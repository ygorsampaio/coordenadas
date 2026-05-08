const mongoose = require("mongoose");

const uri = "mongodb+srv://ygorsampaio_db_user:6FsefyHZGZ7f6Xyt@cluster0.wiml4e9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri)
  .then(() => {
    console.log("✅ Conectou no MongoDB");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Erro real:", err);
    process.exit(1);
  });