import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Color palette from requirements
const COLORS = {
  primary: "#1976d2",
  secondary: "#424242",
  accent: "#ff9800",
  bg: "#ffffff",
  text: "#222",
  sidebar: "#f8f9fa",
  border: "#e9ecef",
};

const LS_KEY = "notes-organizer-v1";

/**
 * Load notes from localStorage.
 */
function loadNotes() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save notes to localStorage.
 */
function saveNotes(notes) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

// PUBLIC_INTERFACE
function App() {
  const [notes, setNotes] = useState(() => loadNotes());
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [theme] = useState("light"); // for future dark mode, currently fixed to light
  const [editing, setEditing] = useState(false);

  // Filtering and sorting notes
  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.body.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.updated - a.updated);

  // Persist notes to localStorage
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Auto-select on first mount or if notes list changes
  useEffect(() => {
    if (notes.length === 0) setSelectedId(null);
    else if (
      selectedId === null ||
      !notes.some((n) => n.id === selectedId)
    ) {
      setSelectedId(filteredNotes.length ? filteredNotes[0].id : null);
    }
  }, [notes, selectedId, filteredNotes.length]);

  // Handle selecting a different note
  function handleSelectNote(id) {
    setSelectedId(id);
    setEditing(false);
  }

  // PUBLIC_INTERFACE
  function handleAddNote() {
    const id = String(Date.now());
    const now = Date.now();
    const newNote = {
      id,
      title: "Untitled Note",
      body: "",
      created: now,
      updated: now
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(id);
    setEditing(true);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    if (!window.confirm("Delete this note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    setEditing(false);
  }

  // PUBLIC_INTERFACE
  function handleUpdateNote(id, fields) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...fields, updated: Date.now() }
          : n
      )
    );
  }

  // PUBLIC_INTERFACE
  function handleStartEdit() {
    setEditing(true);
  }

  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    setEditing(false);
  }

  // Find selected note
  const selectedNote = notes.find((n) => n.id === selectedId);

  // Style vars
  useEffect(() => {
    document.documentElement.style.background = COLORS.bg;
    document.body.style.background = COLORS.bg;
  }, []);

  return (
    <div
      className="notes-root"
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        margin: 0,
      }}
      data-theme={theme}
    >
      <HeaderBar accentColor={COLORS.accent} />
      <div
        className="notes-layout"
        style={{
          display: "flex",
          height: "calc(100vh - 60px)",
        }}
      >
        <Sidebar
          notes={filteredNotes}
          selectedId={selectedId}
          onSelect={handleSelectNote}
          onAdd={handleAddNote}
          onDelete={handleDeleteNote}
          search={search}
          setSearch={setSearch}
          accentColor={COLORS.accent}
          borderColor={COLORS.border}
        />
        <main
          className="notes-main"
          style={{
            flex: 1,
            background: COLORS.bg,
            padding: 0,
            borderLeft: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {selectedNote ? (
            editing ? (
              <NoteEditor
                note={selectedNote}
                onCancel={handleCancelEdit}
                onSave={(fields) => {
                  handleUpdateNote(selectedNote.id, fields);
                  setEditing(false);
                }}
                accentColor={COLORS.accent}
                primaryColor={COLORS.primary}
              />
            ) : (
              <NoteDetail
                note={selectedNote}
                onEdit={handleStartEdit}
                onDelete={() => handleDeleteNote(selectedNote.id)}
                accentColor={COLORS.accent}
                secondaryColor={COLORS.secondary}
              />
            )
          ) : notes.length === 0 ? (
            <NoNotesDisplay accentColor={COLORS.accent} />
          ) : (
            <NoSelectedNote />
          )}
        </main>
      </div>
    </div>
  );
}

// Header Bar Component
function HeaderBar({ accentColor }) {
  return (
    <header
      style={{
        height: 60,
        background: "#fff",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
      className="notes-header"
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 22,
          color: accentColor,
          display: "flex",
          alignItems: "center",
          letterSpacing: "0.02em",
          gap: 8,
          userSelect: "none",
        }}
      >
        ✏️ Note Organizer
      </div>
      <div style={{ flex: 1 }} />
      {/* Could add user/profile/settings buttons here later */}
    </header>
  );
}

// Sidebar component (list/search/add)
function Sidebar({
  notes,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  search,
  setSearch,
  accentColor,
  borderColor,
}) {
  return (
    <aside
      className="notes-sidebar"
      style={{
        width: 280,
        minWidth: 240,
        maxWidth: 360,
        background: "#f8f9fa",
        borderRight: `1px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        zIndex: 2,
        transition: "width 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${borderColor}`,
          padding: "12px 16px",
          gap: 10,
        }}
      >
        <input
          type="text"
          value={search}
          placeholder="Search notes..."
          aria-label="Search notes"
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "7px 10px",
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            outline: "none",
            fontSize: 15,
            background: "#fff"
          }}
        />
        <button
          aria-label="Add note"
          title="Add Note"
          onClick={onAdd}
          style={{
            background: accentColor,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 15,
            width: 36,
            height: 36,
            marginLeft: 5,
            transition: "background 0.16s",
            cursor: "pointer"
          }}
        >
          +
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {notes.length === 0 ? (
          <div
            style={{
              padding: "32px 10px",
              fontSize: 15,
              color: "#aaa",
              textAlign: "center",
            }}
          >
            No notes yet.<br />
            Click <b>+</b> to add.
          </div>
        ) : (
          <ul
            className="notes-list"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {notes.map((note) => (
              <SidebarNoteListItem
                key={note.id}
                note={note}
                selected={note.id === selectedId}
                onSelect={onSelect}
                onDelete={onDelete}
                accentColor={accentColor}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

// Single sidebar note item
function SidebarNoteListItem({
  note,
  selected,
  onSelect,
  onDelete,
  accentColor
}) {
  return (
    <li
      className={selected ? "note-item selected" : "note-item"}
      onClick={() => onSelect(note.id)}
      style={{
        padding: "14px 20px 12px 22px",
        cursor: "pointer",
        background: selected ? "#fff" : "inherit",
        borderLeft: selected ? `4px solid ${accentColor}` : "4px solid transparent",
        display: "flex",
        alignItems: "center",
        transition: "background 0.13s, border-color 0.13s",
        fontWeight: selected ? 500 : 400,
        gap: 10,
      }}
      tabIndex={0}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 16,
            marginBottom: 2,
            color: "#252525",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={note.title}
        >
          {note.title || "Untitled Note"}
        </div>
        <div
          style={{
            color: "#666",
            fontSize: 13,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={note.body}
        >
          {note.body.replace(/\n/g, " ").slice(0, 45) + (note.body.length > 45 ? "..." : "")}
        </div>
      </div>
      <button
        className="note-delete-btn"
        tabIndex={-1}
        aria-label="Delete note"
        title="Delete note"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(note.id);
        }}
        style={{
          marginLeft: 5,
          background: "none",
          border: "none",
          color: "#bbb",
          fontSize: 17,
          cursor: "pointer",
          display: "inline",
        }}
      >
        🗑
      </button>
    </li>
  );
}

// Main area: No notes view
function NoNotesDisplay({ accentColor }) {
  return (
    <div
      style={{
        margin: "auto",
        fontSize: 22,
        color: "#bbb",
        textAlign: "center",
        width: "100%",
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 12 }}>🗒️</div>
      <div>No notes yet</div>
      <div style={{ fontSize: 16, color: accentColor, margin: "15px 0 0" }}>
        Click + to create your first note!
      </div>
    </div>
  );
}

// Main area: No selected note
function NoSelectedNote() {
  return (
    <div
      style={{
        margin: "auto",
        fontSize: 17,
        color: "#888",
        textAlign: "center",
        width: "100%",
      }}
    >
      Select or create a note to get started.
    </div>
  );
}

// Main area: Note Editor
function NoteEditor({
  note,
  onCancel,
  onSave,
  accentColor,
  primaryColor,
}) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const bodyRef = useRef();

  // Focus textarea on mount
  useEffect(() => {
    bodyRef.current && bodyRef.current.focus();
  }, []);

  // Handle keyboard shortcut for saving (Cmd/Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();
        onSave({ title: title.trim() || "Untitled Note", body });
      }
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <form
      className="note-editor"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: 650,
        margin: "48px auto 0",
        background: "#fff",
        borderRadius: 13,
        boxShadow: "0 1.5px 6px rgba(24, 44, 64, 0.07)",
        padding: "34px 36px",
        position: "relative",
        minHeight: 420,
        border: "1px solid #f0f0f0",
        transition: "box-shadow .16s",
      }}
      onSubmit={e => {
        e.preventDefault();
        onSave({ title: title.trim() || "Untitled Note", body });
      }}
      autoComplete="off"
    >
      <input
        name="title"
        type="text"
        aria-label="Title"
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          fontSize: 22,
          marginBottom: 12,
          border: "none",
          outline: "none",
          fontWeight: 700,
          background: "transparent",
          color: "#1d1d28",
          borderBottom: `1.5px solid ${accentColor}`,
          padding: "9px 0",
          width: "100%",
          borderRadius: "0",
          boxShadow: "none",
        }}
        autoFocus
      />
      <textarea
        name="body"
        aria-label="Body"
        placeholder="Write something..."
        ref={bodyRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{
          flex: 1,
          minHeight: 200,
          fontSize: 16,
          lineHeight: 1.6,
          resize: "vertical",
          border: "none",
          outline: "none",
          padding: "15px 0",
          background: "transparent",
          color: "#232340",
        }}
      />
      <div style={{
        display: "flex",
        gap: 10,
        marginTop: 22,
        justifyContent: "flex-end",
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "#f6f6f6",
            color: "#474747",
            border: `1px solid #e0e0e0`,
            borderRadius: 7,
            padding: "8px 16px",
            fontWeight: 500,
            cursor: "pointer",
            fontSize: 15,
            transition: "background 0.13s",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            background: primaryColor,
            color: "#fff",
            border: "none",
            borderRadius: 7,
            padding: "8px 21px",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            transition: "background 0.15s",
            boxShadow: "0 1px 6px rgba(25,118,210,0.08)",
          }}
        >
          Save
        </button>
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#b6b6b8",
          fontWeight: 400,
          position: "absolute",
          bottom: 8,
          right: 24,
          userSelect: "none",
        }}
      >
        <kbd style={{
          background: "#f8f8fa",
          border: "1px solid #e0e0e0",
          borderRadius: 3,
          fontSize: 12,
          padding: "0 3px",
        }}>
          Ctrl+S
        </kbd>{" "}
        to save, <kbd>Esc</kbd> to cancel
      </div>
    </form>
  );
}

// Main area: Note detail view (read-only)
function NoteDetail({ note, onEdit, onDelete, accentColor, secondaryColor }) {
  // Date formatting, e.g., "Apr 17, 2024, 11:10 AM"
  function formatTime(ts) {
    return new Date(ts).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  return (
    <section
      style={{
        width: "100%",
        maxWidth: 650,
        margin: "54px auto 0",
        background: "#fff",
        borderRadius: 13,
        boxShadow: "0 1.5px 6px rgba(24, 44, 64, 0.07)",
        padding: "38px 40px 54px 40px",
        position: "relative",
        minHeight: 402,
        border: "1px solid #f0f0f0",
      }}
    >
      <h2
        style={{
          fontSize: 25,
          margin: "0 0 8px",
          color: "#1a1a22",
          fontWeight: 700,
          whiteSpace: "pre-line",
        }}
      >
        {note.title}
      </h2>
      <div
        style={{
          color: "#999",
          fontSize: 13.5,
          fontWeight: 400,
          marginBottom: 18,
        }}
      >
        {formatTime(note.updated)}
      </div>
      <div
        style={{
          fontSize: 17,
          color: "#252a32",
          minHeight: 110,
          marginBottom: 16,
          whiteSpace: "pre-line",
          wordBreak: "break-word",
        }}
      >
        {note.body ? note.body : <span style={{ color: "#aaa" }}>No content.</span>}
      </div>
      <div
        style={{
          display: "flex",
          gap: 9,
          marginTop: 27,
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onEdit}
          style={{
            background: accentColor,
            color: "#fff",
            border: "none",
            borderRadius: 7,
            padding: "7px 19px",
            fontWeight: 600,
            fontSize: 15.5,
            cursor: "pointer",
            transition: "background 0.13s",
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            background: secondaryColor,
            color: "#fff",
            border: "none",
            borderRadius: 7,
            padding: "7px 17px",
            fontWeight: 500,
            fontSize: 15.5,
            cursor: "pointer",
            transition: "background 0.13s",
          }}
        >
          Delete
        </button>
      </div>
    </section>
  );
}

export default App;
