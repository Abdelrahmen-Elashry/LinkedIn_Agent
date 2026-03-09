import React from 'react';

export default function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
    >
      <div
        className={`
          max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-accent/15 text-text-primary border border-accent/20 rounded-br-md'
            : 'bg-surface text-text-primary border border-border rounded-bl-md'
          }
          ${isStreaming ? 'animate-pulse-glow' : ''}
        `}
        style={{ fontFamily: isUser ? 'var(--font-body)' : 'var(--font-mono)', fontSize: isUser ? '0.875rem' : '0.8125rem' }}
      >
        {/* Render content with line breaks */}
        {content.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 ml-0.5 bg-accent animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
