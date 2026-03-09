import React, { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import PostPreview from '../components/PostPreview';
import { useSSE } from '../hooks/useSSE';
import { generatePost, revisePost, publishPost, getSessionDetail } from '../api/client';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [currentDraft, setCurrentDraft] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const { streamingText, isStreaming, startStream, reset } = useSSE();

  // ── Generate a new post ──────────────────────────────────
  const handleSendMessage = useCallback(async (text) => {
    // Parse topic and notes from the input
    const parts = text.split('—');
    const topic = parts[0].trim();
    const userNotes = parts.slice(1).join('—').trim();

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setShowFeedbackInput(false);
    setIsPublished(false);
    setLinkedinUrl('');

    // Add placeholder for assistant
    setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    try {
      const response = await generatePost(topic, userNotes);
      await processStream(response);
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `❌ Error: ${err.message}`,
          isStreaming: false,
        };
        return updated;
      });
    }
  }, []);

  // ── Revise the current draft ─────────────────────────────
  const handleSendFeedback = useCallback(async (feedback) => {
    if (!sessionId) return;

    setMessages((prev) => [...prev, { role: 'user', content: `✏️ ${feedback}` }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }]);
    setShowFeedbackInput(false);

    try {
      const response = await revisePost(sessionId, feedback);
      await processStream(response);
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `❌ Error: ${err.message}`,
          isStreaming: false,
        };
        return updated;
      });
    }
  }, [sessionId]);

  // ── Process the SSE stream ───────────────────────────────
  async function processStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              if (data.token) {
                accumulated += data.token;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: accumulated,
                    isStreaming: true,
                  };
                  return updated;
                });
                setCurrentDraft(accumulated);
              }

              if (data.draft) {
                // Stream completed
                setSessionId(data.session_id);
                setCurrentDraft(data.draft);
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: data.draft,
                    isStreaming: false,
                  };
                  return updated;
                });
                setShowFeedbackInput(true);
              }
            } catch {
              // skip unparseable
            }
          }
        }
      }
    } finally {
      // Ensure streaming state is cleared
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].isStreaming) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            isStreaming: false,
          };
        }
        return updated;
      });
      setShowFeedbackInput(true);
    }
  }

  // ── Publish to LinkedIn ──────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!sessionId || isPublishing) return;

    setIsPublishing(true);
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: '🚀 Publishing to LinkedIn...',
      isStreaming: false,
    }]);

    try {
      const result = await publishPost(sessionId);
      setIsPublished(true);
      setLinkedinUrl(result.linkedin_url);
      setShowFeedbackInput(false);

      const mockNote = result.mock ? ' (mock mode — configure LinkedIn credentials for real publishing)' : '';
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `✅ Successfully published!${mockNote}\n\n🔗 ${result.linkedin_url}`,
        isStreaming: false,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `❌ Publishing failed: ${err.message}`,
        isStreaming: false,
      }]);
    } finally {
      setIsPublishing(false);
    }
  }, [sessionId, isPublishing]);

  // ── Request changes ──────────────────────────────────────
  const handleRevise = useCallback(() => {
    setShowFeedbackInput(true);
    setMessages((prev) => [...prev, {
      role: 'assistant',
      content: '✏️ What changes would you like? Describe what to modify and I\'ll revise the draft.',
      isStreaming: false,
    }]);
  }, []);

  // ── Load a past session ──────────────────────────────────
  const handleSelectSession = useCallback(async (id) => {
    try {
      const detail = await getSessionDetail(id);
      setSessionId(id);
      setCurrentDraft(detail.current_draft || '');
      setIsPublished(detail.status === 'published');
      setLinkedinUrl(detail.linkedin_url || '');
      setShowFeedbackInput(detail.status !== 'published');
      setMessages([
        { role: 'user', content: `📝 Topic: ${detail.topic}` },
        { role: 'assistant', content: detail.current_draft || 'No draft available.', isStreaming: false },
      ]);
    } catch {
      // fail silently
    }
  }, []);

  // ── New session ──────────────────────────────────────────
  const handleNewSession = useCallback(() => {
    setMessages([]);
    setCurrentDraft('');
    setSessionId(null);
    setIsPublished(false);
    setLinkedinUrl('');
    setShowFeedbackInput(false);
    reset();
  }, [reset]);

  // ── Check if we're in a streaming state ──────────────────
  const anyStreaming = messages.some((m) => m.isStreaming);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-primary">
      <Sidebar
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
      />

      <ChatPanel
        messages={messages}
        isStreaming={anyStreaming}
        onSendMessage={handleSendMessage}
        showFeedbackInput={showFeedbackInput}
        onSendFeedback={handleSendFeedback}
      />

      <div className="w-[420px] min-w-[380px]">
        <PostPreview
          draft={currentDraft}
          isPublished={isPublished}
          linkedinUrl={linkedinUrl}
          onPublish={handlePublish}
          onRevise={handleRevise}
          isStreaming={anyStreaming}
        />
      </div>
    </div>
  );
}
