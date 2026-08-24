import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'BackendQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    //Creacion de la base de datos
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

    //Union entre el dynamoDB y el GraphQL
    const notesDataSource = api.addDynamoDbDataSource('NotesDataSource', notesTable);

    // Lambda para crear el resolver y generar el ULID de mejor manera en otro codigo
    const createNoteFn = new lambdaNodejs.NodejsFunction(this, 'CreateNoteFn', {
      entry: path.join(__dirname, 'lambda/createNote.ts'),
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TABLE_NAME: notesTable.tableName,
      },
    });

    //Le mando a llamar que para escribir datos use la funcion de createNoteFn
    notesTable.grantWriteData(createNoteFn);
    
    const lambdaDataSource = api.addLambdaDataSource('CreateNoteDataSource', createNoteFn);

    lambdaDataSource.createResolver('CreateNoteResolver', {
      typeName: 'Mutation',
      fieldName: 'createNote',
    });

    //Resolver para obtener las notas (No lo creo en una lambda porque pues, es sencillo)
    notesDataSource.createResolver('GetNotesResolver', {
      typeName: 'Query',
      fieldName: 'getNotes',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "operation": "Scan",
          "limit": #if($ctx.args.limit) $ctx.args.limit #else 10 #end,
          #if($ctx.args.nextToken)
          "nextToken": "$ctx.args.nextToken",
          #end
          #if($ctx.args.sentiment)
          "filter": {
            "expression": "sentiment = :sentiment",
            "expressionValues": {
              ":sentiment": $util.dynamodb.toDynamoDBJson($ctx.args.sentiment)
            }
          }
          #end
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "items": $util.toJson($ctx.result.items),
          "nextToken": $util.toJson($ctx.result.nextToken),
          "scannedCount": $ctx.result.scannedCount
        }
      `),
    });


    //Para revisar como se llaman los nombres y usarlos en el FE
    new cdk.CfnOutput(this, 'GraphQLApiUrl', { value: api.graphqlUrl });
    new cdk.CfnOutput(this, 'GraphQLApiKey', { value: api.apiKey || '' });


  }
}
