const express = require('express');
const path = require('path');

// import ApolloServer
const { ApolloServer } = require('apollo-server-express');
// import our typeDefs and resolvers
const { typeDefs, resolvers } = require('./schemas');
const { authMiddleware } = require('./utils/auth');

const db = require('./config/connection');

const app = express();
const PORT = process.env.PORT || 3001;

async function startServer() {
  // create ApolloServer instance
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: authMiddleware,
  });

  await server.start(); // Ensure server is started before applying middleware

  // integrate the ApolloServer with the express application as middleware
  server.applyMiddleware({ app });

  // middleware
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // serve static assets
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));

  db.once('open', () => {
    app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
  });
}

startServer();
