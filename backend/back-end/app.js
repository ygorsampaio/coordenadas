const { MongoClient } = require('mongodb');

// Substitua <password> pela senha do seu usuário do banco de dados
// E certifique-se de que o usuário tem permissão de leitura/escrita
const uri = "mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Conectado com sucesso ao Atlas!");
    
    // Teste rápido: listar os bancos de dados
    const databasesList = await client.db().admin().listDatabases();
    console.log("Bancos de dados:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

run();
