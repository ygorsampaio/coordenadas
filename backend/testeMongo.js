const mongoose = require("mongoose");

const uri = "mongodb://ygorsampaio_db_user:1111@ac-iq96m1c-shard-00-00.wiml4e9.mongodb.net:27017,ac-iq96m1c-shard-00-01.wiml4e9.mongodb.net:27017,ac-iq96m1c-shard-00-02.wiml4e9.mongodb.net:27017/?ssl=true&replicaSet=atlas-aknuef-shard-0&authSource=admin&appName=1";
mongoose.connect(uri)
  .then(() => {
    console.log("✅ Conectou no MongoDB");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Erro real:", err);
    process.exit(1);
  });