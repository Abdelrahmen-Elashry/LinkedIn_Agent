import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook to consume SSE (Server-Sent Events) from a fetch response.
 * Returns streaming text, status, and control functions.
 */
export function useSSE() {
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [completedData, setCompletedData] = useState(null);
  const abortRef = useRef(null);

  const startStream = useCallback(async (fetchResponse) => {
    setStreamingText('');
    setIsStreaming(true);
    setError(null);
    setCompletedData(null);

    const reader = fetchResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    abortRef.current = reader;

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
                setStreamingText(accumulated);
              }

              if (data.draft) {
                // "done" event
                setCompletedData(data);
              }
            } catch {
              // skip unparseable lines
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.cancel();
      abortRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    setStreamingText('');
    setIsStreaming(false);
    setError(null);
    setCompletedData(null);
  }, []);

  return {
    streamingText,
    isStreaming,
    error,
    completedData,
    startStream,
    stopStream,
    reset,
  };
}
