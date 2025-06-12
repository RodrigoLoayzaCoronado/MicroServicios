const express = require('express');
const graphqlHTTP = require('express-graphql');
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLNonNull
} = require('graphql');


// Esquema
const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
  });

//servidor
const app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true // Habilita UI para pruebas
  }));

app.listen(4000, () => console.log ('Servidor GraphQL en http://localhost:4000/graphql'))