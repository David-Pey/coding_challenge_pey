'use client';

import { useState, useEffect } from 'react';
import { createNote, getNotes, Note, Sentiment } from '@/lib/notes';

const SENTIMENTS: Sentiment[] = ['happy', 'sad', 'neutral', 'angry'];

const SENTIMENT_EMOJI: Record<Sentiment, string> = {
  happy: '😊',
  sad: '😢',
  neutral: '😐',
  angry: '😠',
};

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  happy: 'bg-[#FFE066]',
  sad: 'bg-[#A8D8EA]',
  neutral: 'bg-[#E8E4DC]',
  angry: 'bg-[#FF9B85]',
};

const ROTATIONS = ['-rotate-2', 'rotate-1', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-3'];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState<Sentiment>('happy');
  const [filter, setFilter] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);

  async function loadNotes(currentFilter: Sentiment | null) {
    setFetching(true);
    try {
      const result = await getNotes({
        limit: 10,
        sentiment: currentFilter ?? undefined,
      });
      setNotes(result.items);
      setNextToken(result.nextToken);
    } catch (err) {
      console.error('Error cargando notas:', err);
    } finally {
      setFetching(false);
    }
  }

  async function loadMore() {
    if (!nextToken) return;
    setLoadingMore(true);
    try {
      const result = await getNotes({
        limit: 10,
        nextToken,
        sentiment: filter ?? undefined,
      });
      setNotes((prev) => [...prev, ...result.items]);
      setNextToken(result.nextToken);
    } catch (err) {
      console.error('Error cargando más notas:', err);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadNotes(filter);
  }, [filter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      const newNote = await createNote(text, sentiment);
      // Solo la agregamos a la vista si coincide con el filtro activo (o no hay filtro)
      if (!filter || filter === newNote.sentiment) {
        setNotes((prev) => [newNote, ...prev]);
      }
      setText('');
    } catch (err) {
      console.error('Error creando nota:', err);
      alert('Hubo un error al crear la nota');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-[380px_1fr]">
      {/* Panel izquierdo: la libreta */}
      <section className="p-8 flex items-start justify-center md:items-center">
        <div className="bg-[#FDF8EE] rounded-sm shadow-2xl p-8 w-full max-w-sm -rotate-1">
          <h1 className="font-handwritten text-4xl font-bold mb-6 text-[#3D2817]">
            Mis Notas 📝
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe tu nota..."
              className="w-full border-2 border-[#3D2817]/20 rounded p-3 resize-none font-handwritten text-lg bg-white/60 focus:outline-none focus:border-[#3D2817]/40"
              rows={5}
            />

            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value as Sentiment)}
              className="w-full border-2 border-[#3D2817]/20 rounded p-2 bg-white/60 text-[#3D2817]"
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
              className="w-full bg-[#3D2817] text-[#FDF8EE] px-4 py-3 rounded font-medium disabled:opacity-50 hover:bg-[#3D2817]/90 transition"
            >
              {loading ? 'Guardando...' : 'Pegar nota'}
            </button>
          </form>
        </div>
      </section>

      {/* Panel derecho: el tablón */}
      <section className="p-8 md:p-12">
        {/* Filtro de sentiment */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-full font-handwritten text-lg shadow transition ${
              filter === null
                ? 'bg-[#3D2817] text-[#FDF8EE]'
                : 'bg-[#FDF8EE]/80 text-[#3D2817] hover:bg-[#FDF8EE]'
            }`}
          >
            Todas
          </button>
          {SENTIMENTS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full font-handwritten text-lg shadow transition ${
                filter === s
                  ? `${SENTIMENT_COLOR[s]} text-[#3D2817] ring-2 ring-[#3D2817]`
                  : 'bg-[#FDF8EE]/80 text-[#3D2817] hover:bg-[#FDF8EE]'
              }`}
            >
              {SENTIMENT_EMOJI[s]} {s}
            </button>
          ))}
        </div>

        {fetching && (
          <p className="text-[#FDF8EE]/70 font-handwritten text-xl">Cargando notas...</p>
        )}

        {!fetching && notes.length === 0 && (
          <p className="text-[#FDF8EE]/70 font-handwritten text-xl">
            {filter ? `No hay notas ${filter}.` : 'Aún no hay notas.'}
          </p>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {notes.map((note, i) => (
            <div
              key={note.id}
              className={`${SENTIMENT_COLOR[note.sentiment]} ${ROTATIONS[i % ROTATIONS.length]} aspect-square p-5 flex flex-col justify-between shadow-lg hover:scale-105 hover:shadow-xl transition-transform cursor-default`}
            >
              <p className="font-handwritten text-lg text-[#3D2817] line-clamp-5">
                {note.text}
              </p>
              <div className="flex justify-between items-end">
                <span className="text-xs text-[#3D2817]/60">
                  {new Date(note.dateCreated).toLocaleDateString()}
                </span>
                <span className="text-xl">{SENTIMENT_EMOJI[note.sentiment]}</span>
              </div>
            </div>
          ))}

          {!fetching && nextToken && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className={`${ROTATIONS[notes.length % ROTATIONS.length]} aspect-square border-2 border-dashed border-[#FDF8EE]/50 flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-105 hover:border-[#FDF8EE] hover:shadow-xl transition disabled:opacity-50 bg-[#FDF8EE]/10`}
            >
              <span className="text-4xl text-[#FDF8EE]">
                {loadingMore ? '⏳' : '+'}
              </span>
              <span className="font-handwritten text-lg text-[#FDF8EE]">
                {loadingMore ? 'Cargando...' : 'Ver más'}
              </span>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}