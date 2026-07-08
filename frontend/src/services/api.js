import axios from "axios";

// Dynamic API Base: accepts full URLs, local proxy paths, or bare Railway/Vercel domains.
function normalizeApiBase(value) {
  const raw = String(value || "").trim();
  if (!raw) return "/api";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("/")) return raw;
  return `https://${raw}`;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

// 🚀 STEP 14 — CREATE AXIOS CLIENT
export const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach token
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle 401 globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("fs_authed");
      localStorage.removeItem("fs_user");
    }
    return Promise.reject(error);
  }
);

export function normalizeConversationMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) =>
    typeof m === "string" ? { text: m } : { text: m?.text ?? "" }
  );
}

// Wrapping Axios in your existing `api` function to maintain 100% backward compatibility with your frontend
async function api(endpoint, options = {}) {
  try {
    const res = await axiosClient({
      url: endpoint,
      method: options.method || "GET",
      data: options.body ? JSON.parse(options.body) : undefined,
    });
    
    const data = res.data;
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
  } catch (err) {
    if (!err.response) {
      return {
        error: "Server not reachable. Start the API (uvicorn) or check the URL.",
        _network: true,
      };
    }
    if (err.response.status === 401) {
      return { error: "Session expired. Please sign in again.", _status: 401 };
    }
    const data = err.response.data;
    const detail = data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join("; ")
          : data?.error;
    return {
      error: msg || `Unable to process request. (${err.response.status})`,
      _status: err.response.status,
    };
  }
}

export async function checkHealth() {
  try {
    const res = await axiosClient.get("/health", { timeout: 3000 });
    return res.data?.status === "healthy" || res.data?.status === "ok";
  } catch {
    return false;
  }
}

export const authApi = {
  login: (username, password) =>
    api("/auth/login", { method: "POST", body: JSON.stringify({ email: username, password }) }),
  register: (name, email, password) =>
    api("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  forgotPassword: (email) => 
    api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token, new_password) =>
    api("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password }) }),
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
  getDashboardStats: () => api("/dashboard-stats"),
};

export const analyzeMessage = (text) => analysisApi.analyzeMessage(text);
export const analyzeConversation = (messages, conversation_id) =>
  analysisApi.analyzeConversation(messages, conversation_id);
export const fetchConversations = () => analysisApi.getConversations();

export const feedbackApi = {
  submit: (data) =>
    api("/feedback", { method: "POST", body: JSON.stringify(data) }),
};
