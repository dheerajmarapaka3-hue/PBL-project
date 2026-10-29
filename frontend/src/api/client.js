import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Returns the base protocol and host of the backend server (without /api/v1).
 */
export function getBackendOrigin() {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

/**
 * Resolves a relative static asset path against the backend server origin.
 */
export function resolveAssetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const origin = getBackendOrigin();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("healthmate_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (localStorage.getItem("healthmate_token")) {
        localStorage.removeItem("healthmate_token");
        localStorage.removeItem("healthmate_user");
        window.dispatchEvent(new Event("auth_logout"));
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth & Profile
  auth: {
    register: (data) => apiClient.post("/auth/register", data),
    login: (data) => apiClient.post("/auth/login", data),
    getMe: () => apiClient.get("/auth/me"),
    updateProfile: (data) => apiClient.put("/auth/profile", data),
    deleteAccount: () => apiClient.delete("/auth/account"),
    exportData: () => apiClient.get("/auth/export"),
  },

  // Dashboard Summary
  dashboard: {
    getSummary: () => apiClient.get("/dashboard/summary"),
  },

  // Health Tracking / Vitals
  vitals: {
    getMeasurements: (type) => apiClient.get("/vitals/measurements", { params: { type } }),
    createMeasurement: (data) => apiClient.post("/vitals/measurements", data),
    updateMeasurement: (id, data) => apiClient.put(`/vitals/measurements/${id}`, data),
    deleteMeasurement: (id) => apiClient.delete(`/vitals/measurements/${id}`),
    getAnalytics: (days = 30) => apiClient.get("/vitals/analytics", { params: { days } }),
  },

  // Medical Documents
  documents: {
    list: () => apiClient.get("/documents/"),
    get: (id) => apiClient.get(`/documents/${id}`),
    upload: (formData) =>
      apiClient.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    delete: (id) => apiClient.delete(`/documents/${id}`),
    askQuestion: (id, question) => apiClient.post(`/documents/${id}/question`, { question }),
    download: (id) => apiClient.get(`/documents/${id}/download`, { responseType: "blob" }),
    getDownloadUrl: (id) => `${API_BASE_URL}/documents/${id}/download`,
  },

  // Medicines & Reminders
  medicines: {
    list: (activeOnly = false) => apiClient.get("/medicines/", { params: { active_only: activeOnly } }),
    create: (data) => apiClient.post("/medicines/", data),
    update: (id, data) => apiClient.put(`/medicines/${id}`, data),
    delete: (id) => apiClient.delete(`/medicines/${id}`),
    getTodayDoses: () => apiClient.get("/medicines/today-doses"),
    updateDoseStatus: (id, status, notes) =>
      apiClient.post(`/medicines/doses/${id}/status`, { status, notes }),
  },

  // Nutrition
  nutrition: {
    getMeals: (date) => apiClient.get("/nutrition/meals", { params: { date } }),
    logMeal: (data) => apiClient.post("/nutrition/meals", data),
    updateMeal: (id, data) => apiClient.put(`/nutrition/meals/${id}`, data),
    deleteMeal: (id) => apiClient.delete(`/nutrition/meals/${id}`),
    getDailySummary: (date) => apiClient.get("/nutrition/daily-summary", { params: { date } }),
  },

  // Workouts
  workouts: {
    list: () => apiClient.get("/workouts/"),
    log: (data) => apiClient.post("/workouts/", data),
    delete: (id) => apiClient.delete(`/workouts/${id}`),
    getStats: () => apiClient.get("/workouts/stats"),
  },

  // Exercise Library & Catalogue
  exercises: {
    list: (params) => apiClient.get("/exercises/", { params }),
    getFilters: () => apiClient.get("/exercises/filters"),
    getDetail: (id) => apiClient.get(`/exercises/${id}`),
  },

  // Meditation & Yoga
  meditation: {
    getCatalog: () => apiClient.get("/meditation/sessions"),
    complete: (data) => apiClient.post("/meditation/complete", data),
    getHistory: () => apiClient.get("/meditation/history"),
  },

  // Daily Routines & Goals
  routines: {
    list: () => apiClient.get("/routines/"),
    create: (data) => apiClient.post("/routines/", data),
    update: (id, data) => apiClient.put(`/routines/${id}`, data),
    delete: (id) => apiClient.delete(`/routines/${id}`),
    toggle: (id) => apiClient.post(`/routines/${id}/toggle`),
    aiSuggest: (goal_prompt) => apiClient.post("/routines/ai-suggest", { goal_prompt }),
  },

  goals: {
    list: () => apiClient.get("/goals/"),
    create: (data) => apiClient.post("/goals/", data),
    update: (id, data) => apiClient.put(`/goals/${id}`, data),
    delete: (id) => apiClient.delete(`/goals/${id}`),
  },

  // AI Assistant Chat
  chat: {
    listConversations: () => apiClient.get("/chat/conversations"),
    createConversation: (title) => apiClient.post("/chat/conversations", { title }),
    getConversation: (id) => apiClient.get(`/chat/conversations/${id}`),
    deleteConversation: (id) => apiClient.delete(`/chat/conversations/${id}`),
    sendMessage: (conversationId, content) =>
      apiClient.post(`/chat/conversations/${conversationId}/messages`, { content }),
  },
};

export default apiClient;
