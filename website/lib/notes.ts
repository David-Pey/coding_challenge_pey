import { graphqlClient } from './graphql-client';

export type Sentiment = 'happy' | 'sad' | 'neutral' | 'angry';

export interface Note {
  id: string;
  text: string;
  sentiment: Sentiment;
  dateCreated: string;
}

interface NoteQueryResults {
  items: Note[];
  nextToken: string | null;
  scannedCount: number;
}

// --- createNote ---
const CREATE_NOTE = `
  mutation CreateNote($text: String!, $sentiment: Sentiment!) {
    createNote(text: $text, sentiment: $sentiment) {
      id
      text
      sentiment
      dateCreated
    }
  }
`;

export async function createNote(text: string, sentiment: Sentiment): Promise<Note> {
  const data = await graphqlClient.request<{ createNote: Note }>(CREATE_NOTE, {
    text,
    sentiment,
  });
  return data.createNote;
}

// --- getNotes ---
const GET_NOTES = `
  query GetNotes($sentiment: Sentiment, $limit: Int, $nextToken: String) {
    getNotes(sentiment: $sentiment, limit: $limit, nextToken: $nextToken) {
      items {
        id
        text
        sentiment
        dateCreated
      }
      nextToken
      scannedCount
    }
  }
`;

export async function getNotes(params?: {
  sentiment?: Sentiment;
  limit?: number;
  nextToken?: string;
}): Promise<NoteQueryResults> {
  const data = await graphqlClient.request<{ getNotes: NoteQueryResults }>(
    GET_NOTES,
    params ?? {}
  );
  return data.getNotes;
}