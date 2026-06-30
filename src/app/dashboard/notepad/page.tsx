"use client";

import { useState, useEffect, useRef } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STORAGE_KEY = "apex-notepad-notes";

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function NotepadPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = loadNotes();
    setNotes(stored);
    if (stored.length > 0) setActiveId(stored[0].id);
  }, []);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  function createNote() {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "Новая заметка",
      content: "",
      updatedAt: Date.now(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setActiveId(note.id);
    setTimeout(() => titleRef.current?.select(), 50);
  }

  function updateNote(fields: Partial<Note>) {
    const updated = notes.map((n) =>
      n.id === activeId ? { ...n, ...fields, updatedAt: Date.now() } : n
    );
    setNotes(updated);
    saveNotes(updated);
  }

  function deleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[0].id : null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0a0a0a]">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-semibold text-white">Блокнот</h1>
            <button
              onClick={createNote}
              className="size-7 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors flex items-center justify-center"
              title="Новая заметка"
            >
              <svg className="size-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 px-3 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 && (
            <p className="text-xs text-white/25 text-center py-8">Нет заметок</p>
          )}
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => setActiveId(note.id)}
              className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                activeId === note.id
                  ? "bg-violet-600/20 border border-violet-500/30"
                  : "hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <div className="text-xs font-medium text-white truncate pr-5">
                {note.title || "Без названия"}
              </div>
              <div className="text-[10px] text-white/30 mt-0.5 truncate">
                {note.content || "Пусто"} · {formatDate(note.updatedAt)}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all flex items-center justify-center"
                title="Удалить"
              >
                <svg className="size-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-white/20 text-center">
            {notes.length} {notes.length === 1 ? "заметка" : notes.length < 5 ? "заметки" : "заметок"} · сохранено локально
          </p>
        </div>
      </aside>

      {/* Editor */}
      {activeNote ? (
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 pt-6 pb-4 border-b border-white/[0.06]">
            <input
              ref={titleRef}
              type="text"
              value={activeNote.title}
              onChange={(e) => updateNote({ title: e.target.value })}
              className="w-full text-xl font-bold text-white bg-transparent outline-none placeholder-white/20"
              placeholder="Название заметки"
            />
            <p className="text-xs text-white/25 mt-1">Изменено {formatDate(activeNote.updatedAt)}</p>
          </div>
          <textarea
            ref={contentRef}
            value={activeNote.content}
            onChange={(e) => updateNote({ content: e.target.value })}
            className="flex-1 px-8 py-5 text-sm text-white/80 bg-transparent outline-none resize-none leading-relaxed placeholder-white/20"
            placeholder="Начните писать..."
          />
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="size-16 rounded-2xl border border-dashed border-white/[0.10] flex items-center justify-center">
            <svg className="size-7 text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="text-sm text-white/30">Выберите заметку или создайте новую</p>
          <button
            onClick={createNote}
            className="h-9 px-5 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all"
          >
            Создать заметку
          </button>
        </main>
      )}
    </div>
  );
}
