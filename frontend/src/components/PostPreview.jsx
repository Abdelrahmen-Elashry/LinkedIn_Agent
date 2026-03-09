import React from 'react';

export default function PostPreview({ draft, isPublished, linkedinUrl, onPublish, onRevise, isStreaming }) {
  return (
    <div className="h-full flex flex-col bg-bg-secondary border-l border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <h2
          className="text-sm font-semibold text-text-primary tracking-wide uppercase"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Post Preview
        </h2>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {draft ? (
          <div className="animate-fade-in-up">
            {/* LinkedIn-style card */}
            <div className="bg-surface rounded-xl border border-border p-6 shadow-lg">
              {/* Author header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent text-sm font-bold" style={{ fontFamily: 'var(--font-heading)' }}>U</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">You</p>
                  <p className="text-xs text-text-muted">Just now · 🌐</p>
                </div>
              </div>

              {/* Post content */}
              <div
                className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              >
                {draft}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-4 ml-0.5 bg-accent animate-pulse align-middle" />
                )}
              </div>

              {/* Engagement bar */}
              <div className="mt-5 pt-3 border-t border-border flex items-center gap-6 text-text-muted text-xs">
                <span>👍 Like</span>
                <span>💬 Comment</span>
                <span>🔁 Repost</span>
                <span>📤 Send</span>
              </div>
            </div>

            {/* Published success */}
            {isPublished && linkedinUrl && (
              <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 animate-success">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-success text-lg">✓</span>
                  <span className="text-success text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                    Published to LinkedIn!
                  </span>
                </div>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline break-all"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {linkedinUrl}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-20">✍️</div>
              <p className="text-text-muted text-sm">Your post preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {draft && !isStreaming && !isPublished && (
        <div className="p-4 border-t border-border flex gap-3 animate-fade-in-up">
          <button
            onClick={onPublish}
            className="flex-1 py-3 px-4 rounded-xl bg-accent text-bg-primary text-sm font-semibold
                       hover:bg-accent-hover transition-all duration-200
                       hover:shadow-lg hover:shadow-accent/20 cursor-pointer"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            🚀 Post to LinkedIn
          </button>
          <button
            onClick={onRevise}
            className="flex-1 py-3 px-4 rounded-xl bg-surface border border-border text-text-primary text-sm font-medium
                       hover:bg-surface-hover hover:border-accent/30 transition-all duration-200 cursor-pointer"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ✏️ Request Changes
          </button>
        </div>
      )}
    </div>
  );
}
