import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import * as path from 'path';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'BackendQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const notesTable = new dynamodb.Table(this, 'NotesTable', {
      tableName: 'Notes',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Para cuando pida leer por sentimientos
    notesTable.addGlobalSecondaryIndex({
      indexName: 'SentimentIndex',
      partitionKey: {
        name: 'sentiment',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'dateCreated',
        type: dynamodb.AttributeType.STRING,
      },
    });

    //Creacion del GraphQL sobre el AppSync
    const api = new appsync.GraphqlApi(this, 'NotesApi', {
      name: 'notes-api',
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, 'schema.graphql')
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
    });

    const notesDataSource = api.addDynamoDbDataSource('NotesDataSource', notesTable);

    //Para revisar como se llaman los nombres y usarlos en el FE
    new cdk.CfnOutput(this, 'GraphQLApiUrl', { value: api.graphqlUrl });
    new cdk.CfnOutput(this, 'GraphQLApiKey', { value: api.apiKey || '' });


  }
}
