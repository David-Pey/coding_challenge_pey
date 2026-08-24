// lib/lambda/createNote.ts
import { ulid } from 'ulid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface CreateNoteArgs {
  text: string;
  sentiment: 'happy' | 'sad' | 'neutral' | 'angry';
}

interface AppSyncEvent {
  arguments: CreateNoteArgs;
}

export const handler = async (event: AppSyncEvent) => {
  const { text, sentiment } = event.arguments;

  const note = {
    id: ulid(),
    text,
    sentiment,
    dateCreated: new Date().toISOString(),
  };

  await client.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: note,
    })
  );

  return note;
};