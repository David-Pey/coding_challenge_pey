/*
    Archivo para guardar nuevas notas y obtenerlas  
*/
//Exporto cliente
import { graphqlClient } from './graphql-client';

//Defino lista de snetimientos
export type Sentiment = 'happy' | 'sad' | 'neutral' | 'angry';

//Defino la interface de que compone una nota
export interface Note {
  id: string;
  text: string;
  sentiment: Sentiment;
  dateCreated: string;
}

//Definicion del resultado del query
interface NoteQueryResults {
  items: Note[];
  nextToken: string | null;
  scannedCount: number;
}

// Texto del Query para crear la nota
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

//Función asincrona para crear la nota
export async function createNote(text: string, sentiment: Sentiment): Promise<Note> {
  const data = await graphqlClient.request<{ createNote: Note }>(CREATE_NOTE, {
    text,
    sentiment,
  });
  return data.createNote;
}

// Texto del Query para obtener las notas
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