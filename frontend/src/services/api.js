const API_BASE =
  import.meta.env.VITE_API_URL != null && import.meta.env.VITE_API_URL !== ""
    ? import.meta.env.VITE_API_URL
    : "http://127.0.0.1:8000";
export function normalizeConversationMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) =>
    typeof m === "string" ? { text: m } : { text: m?.text ?? "" }
  );
}
async function api(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    return {
      error: "Server not reachable. Start the API (uvicorn) or check the URL.",
      _network: true,
    };
  }
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("fs_authed");
    return { error: "Session expired. Please sign in again.", _status: 401 };
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {
      error: !res.ok
        ? `Unable to analyze. Try again. (${res.status})`
        : "Server returned an unexpected response.",
      _status: res.status,
    };
  }
  const data = await res.json();
  if (!res.ok) {
    const detail = data.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join("; ")
          : data.error;
    return {
      error: msg || `Unable to analyze. Try again. (${res.status})`,
      _status: res.status,
    };
  }
  if (data.success === true && data.data !== undefined) {
    return data.data;
  }
  if (data.success === false && data.error) {
     return { error: data.error === "invalid input" ? "Invalid input." : data.error };
  }
  if (data.error && typeof data.error === "string" && data.error !== "") {
    return { error: data.error === "invalid input" ? "Invalid input." : data.error };
  }
  return data;
}
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return data.status === "ok";
    }
    return false;
  } catch {
    return false;
  }
}
export const authApi = {
  login: (username, password) =>
    api("/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username, password) =>
    api("/register", { method: "POST", body: JSON.stringify({ username, password }) }),
};
export const analysisApi = {
  analyzeMessage: (text) =>
    api("/analyze-message", { method: "POST", body: JSON.stringify({ text }) }),
  analyzeConversation: (messages, conversation_id = "web_input") =>
    api("/analyze-conversation", {
      method: "POST",
      body: JSON.stringify({
        conversation_id,
        messages: normalizeConversationMessages(messages),
      }),
    }),
  getHistory: () => api("/history"),
  getConversations: () => api("/conversations"),
  getConversation: (id) => api(`/history/${id}`),
  continueConversation: (id, message) =>
    api(`/conversations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ message }),
    }),
  deleteConversation: (id) =>
    api(`/conversations/${id}`, {
      method: "DELETE",
    }),
  saveConversation: (input, result) =>
    api("/save-conversation", {
      method: "POST",
      body: JSON.stringify({ input, result }),
    }),
};
export const analyzeMessage = (text) => analysisApi.analyzeMessage(text);
export const analyzeConversation = (messages, conversation_id) =>
  analysisApi.analyzeConversation(messages, conversation_id);
export const fetchConversations = () => analysisApi.getConversations();
export const feedbackApi = {
  submit: (data) =>
    api("/feedback", { method: "POST", body: JSON.stringify(data) }),
};