const API_BASE = '/api';

/**
 * Generate a new LinkedIn post via SSE streaming.
 * Returns a ReadableStream-based response for token-by-token consumption.
 */
export async function generatePost(topic, userNotes) {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, user_notes: userNotes }),
  });

  if (!response.ok) {
    throw new Error(`Generate failed: ${response.status}`);
  }

  return response;
}

/**
 * Revise a post via SSE streaming.
 */
export async function revisePost(sessionId, feedback) {
  const response = await fetch(`${API_BASE}/revise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, feedback }),
  });

  if (!response.ok) {
    throw new Error(`Revise failed: ${response.status}`);
  }

  return response;
}

/**
 * Publish the current draft to LinkedIn.
 */
export async function publishPost(sessionId) {
  const response = await fetch(`${API_BASE}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    throw new Error(`Publish failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get list of past sessions.
 */
export async function getSessions() {
  const response = await fetch(`${API_BASE}/sessions`);

  if (!response.ok) {
    throw new Error(`Get sessions failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a specific session's details.
 */
export async function getSessionDetail(sessionId) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`);

  if (!response.ok) {
    throw new Error(`Get session failed: ${response.status}`);
  }

  return response.json();
}
