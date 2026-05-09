# Environment Variables para Vercel

Adicione as seguintes variáveis de ambiente no Vercel dashboard:

## MONGODB_URI
MongoDB connection string. Exemplo:
```
mongodb+srv://usuario:senha@cluster.mongodb.net/coordenadas?retryWrites=true&w=majority
```

Se não configurar MONGODB_URI:
- A API rodará sem banco de dados
- As funcionalidades de salvar/carregar não funcionarão
- O health check ainda funcionará

## Configurar no Vercel:
1. Vá para o projeto no Vercel
2. Projeto Settings > Environment Variables
3. Adicione `MONGODB_URI` com o valor da sua conexão MongoDB
4. Redeploy o projeto
