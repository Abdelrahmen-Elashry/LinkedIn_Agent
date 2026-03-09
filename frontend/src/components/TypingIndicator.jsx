import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-2 h-2 rounded-full bg-accent"
            style={{
              animation: 'typingBounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
      <span
        className="ml-2 text-xs font-mono text-text-muted"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        AI is writing...
      </span>
    </div>
  );
}
