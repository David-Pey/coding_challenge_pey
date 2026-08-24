'use client';

import { useState, useEffect } from 'react';
import { createNote, getNotes, Note, Sentiment } from '@/lib/notes';

//Lista de Sentimientos
const SENTIMENTS: Sentiment[] = ['happy', 'sad', 'neutral', 'angry'];

//Diccionario de emojis para que se vea mas bonito en la lista de notas
const SENTIMENT_EMOJI: Record<Sentiment, string> = {
  happy: '😊',
  sad: '😢',
  neutral: '😐',
  angry: '😠',
};

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState<Sentiment>('happy');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);

  //Funcion para obtener las primeras 10 notas
  async function loadNotes() {
    setFetching(true);
    try {
      const result = await getNotes({ limit: 10 });
      setNotes(result.items);
      setNextToken(result.nextToken);
    } catch (err) {
      console.error('Error cargando notas:', err);
    } finally {
      setFetching(false);
    }
  }

  //Funcion para obtener mas notas si es que hace falta
  async function loadMore() {
    if (!nextToken) return;

    setLoadingMore(true);
    try {
      const result = await getNotes({ limit: 10, nextToken });
      setNotes((prev) => [...prev, ...result.items]);
      setNextToken(result.nextToken);
    } catch (err) {
      console.error('Error cargando más notas:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  //Mandar una nueva nota al GraphQL
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const newNote = await createNote(text, sentiment);
      setNotes((prev) => [newNote, ...prev]);
      setText('');
    } catch (err) {
      console.error('Error creando nota:', err);
      alert('Hubo un error al crear la nota');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mis Notas</h1>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu nota..."
          className="w-full border rounded-lg p-3 resize-none"
          rows={3}
        />

        <div className="flex items-center gap-3">
          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value as Sentiment)}
            className="border rounded-lg p-2"
          >
            {SENTIMENTS.map((s) => (
              <option key={s} value={s}>
                {SENTIMENT_EMOJI[s]} {s}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear nota'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {fetching && <p className="text-gray-500">Cargando notas...</p>}

        {!fetching && notes.length === 0 && (
          <p className="text-gray-500">Aún no hay notas.</p>
        )}

        {notes.map((note) => (
          <div key={note.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <p>{note.text}</p>
              <span className="text-xl">{SENTIMENT_EMOJI[note.sentiment]}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(note.dateCreated).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {!fetching && nextToken && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full mt-4 border rounded-lg py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingMore ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </main>
  );
}