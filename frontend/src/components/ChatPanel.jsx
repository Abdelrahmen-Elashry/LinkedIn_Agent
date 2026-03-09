import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatPanel({
  messages,
  isStreaming,
  onSendMessage,
  showFeedbackInput,
  onSendFeedback,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Focus input on mount and when feedback input shows
  useEffect(() => {
    inputRef.current?.focus();
  }, [showFeedbackInput]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    if (showFeedbackInput) {
      onSendFeedback(input.trim());
    } else {
      onSendMessage(input.trim());
    }
    setInput('');
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md animate-fade-in-up">
              <div className="text-5xl mb-4 opacity-30">💡</div>
              <h2
                className="text-xl font-bold text-text-primary mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                What's the topic of your post?
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                Tell me what you want to write about and I'll craft a LinkedIn post in your style.
                Add any notes or key points you want included.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            isStreaming={msg.isStreaming}
          />
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <TypingIndicator />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              showFeedbackInput
                ? "Describe the changes you want..."
                : "Enter topic & notes (e.g. 'AI in healthcare — mention patient outcomes, real-time diagnostics')"
            }
            disabled={isStreaming}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text-primary
                       placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)]
                       transition-all duration-200 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-6 py-3 rounded-xl bg-accent text-bg-primary text-sm font-semibold
                       hover:bg-accent-hover transition-all duration-200
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:shadow-lg hover:shadow-accent/20 cursor-pointer"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {showFeedbackInput ? '↻ Revise' : '→ Send'}
          </button>
        </form>
        {showFeedbackInput && (
          <p className="text-[10px] text-accent/60 mt-2 px-1" style={{ fontFamily: 'var(--font-mono)' }}>
            💡 e.g. "make it shorter", "add a CTA", "remove emojis", "more professional tone"
          </p>
        )}
      </div>
    </div>
  );
}
