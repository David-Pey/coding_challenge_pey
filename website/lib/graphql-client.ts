import { GraphQLClient } from 'graphql-request';

//Aqui solo es crear el cliente de GraphQL
export const graphqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL!,
  {
    headers: {
      'x-api-key': process.env.NEXT_PUBLIC_GRAPHQL_API_KEY!,
    },
  }
);