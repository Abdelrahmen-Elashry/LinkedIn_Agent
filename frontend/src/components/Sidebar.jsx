import React, { useState, useEffect } from 'react';
import { getSessions } from '../api/client';

export default function Sidebar({ currentSessionId, onSelectSession, onNewSession }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, [currentSessionId]);

  async function loadSessions() {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      // silently fail — sidebar is non-critical
    }
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary border-r border-border w-64 min-w-[256px]">
      {/* Header */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
            <span className="text-accent text-base">⚡</span>
          </div>
          <h1
            className="text-base font-bold text-text-primary tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            LinkedIn Agent
          </h1>
        </div>
        <button
          onClick={onNewSession}
          className="w-full py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-semibold
                     hover:bg-accent/20 transition-all duration-200 cursor-pointer"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          + New Post
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-3">
        <p
          className="text-[10px] uppercase tracking-widest text-text-muted mb-2 px-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          History
        </p>
        {sessions.length === 0 ? (
          <p className="text-xs text-text-muted px-2 py-4">No sessions yet</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 cursor-pointer
                ${s.id === currentSessionId
                  ? 'bg-accent/10 border border-accent/20'
                  : 'hover:bg-surface border border-transparent'
                }
              `}
            >
              <p className="text-xs font-medium text-text-primary truncate">{s.topic}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'published' ? 'bg-success' : 'bg-accent/50'}`} />
                <span className="text-[10px] text-text-muted">{formatDate(s.created_at)}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border">
        <p className="text-[10px] text-text-muted text-center" style={{ fontFamily: 'var(--font-mono)' }}>
          Powered by LangGraph + Gemini
        </p>
      </div>
    </div>
  );
}
