const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

function getToken(): string | null {
  try {
    return localStorage.getItem("hairguru_token");
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem("hairguru_token", token);
    } else {
      localStorage.removeItem("hairguru_token");
    }
  } catch {}
}

export function getStoredUser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem("hairguru_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: Record<string, unknown> | null) {
  try {
    if (user) {
      localStorage.setItem("hairguru_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hairguru_user");
    }
  } catch {}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return res.json() as Promise<T>;
}

export type AuthResponse = {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    display_name?: string;
    avatar_initials?: string;
    created_at: string;
  };
  error?: string;
};

export type AnalyzeResponse = {
  success: boolean;
  analysis_id?: number;
  face_shape?: string;
  gender?: string;
  gender_confidence?: number;
  confidence?: number;
  measurements?: Record<string, number>;
  recommendations?: Array<{
    id: string;
    name: string;
    match: number;
    best_for: string[];
    hair_type: string;
    length: string;
    maintenance: string;
    gender?: string;
  }>;
  engine_used?: string;
  error?: string;
};

export type TryOnResponse = {
  success: boolean;
  response?: string;
  error?: string;
  details?: string;
};

export type HistoryItem = {
  id: number;
  face_shape: string;
  confidence: number;
  engine_used: string;
  created_at: string;
  recommendations: Array<{ name: string; match: number }>;
};

export type SavedStyleItem = {
  id: number;
  style_name: string;
  style_id?: string;
  image_url?: string;
  created_at: string;
};

export type SavedStyleResponse = {
  success: boolean;
  saved_styles?: SavedStyleItem[];
  history?: HistoryItem[];
  error?: string;
};

export type AdminStatsResponse = {
  success: boolean;
  stats?: {
    total_users: number;
    total_analyses: number;
    total_saved: number;
    today_analyses: number;
    shape_distribution: Array<{ name: string; value: number }>;
    popular_styles: Array<{ name: string; count: number }>;
    recent_users: Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_initials?: string;
      created_at: string;
    }>;
  };
  error?: string;
};

export type MeResponse = {
  success: boolean;
  user?: {
    id: number;
    username: string;
    display_name?: string;
    avatar_initials?: string;
    created_at: string;
  };
  stats?: {
    analyses_count: number;
    saved_count: number;
    try_on_count: number;
  };
};

export type HealthResponse = {
  status: string;
  version: string;
  engines: Record<string, boolean>;
};

export const api = {
  register: (username: string, password: string, display_name?: string) =>
    request<AuthResponse>("POST", "/api/auth/register", { username, password, display_name }),

  login: (username: string, password: string) =>
    request<AuthResponse>("POST", "/api/auth/login", { username, password }),

  me: () => request<MeResponse>("GET", "/api/auth/me"),

  analyze: (imageBase64: string, hairType?: string, gender?: string, engine?: string) =>
    request<AnalyzeResponse>("POST", "/api/analyze", {
      image_base64: imageBase64,
      hair_type: hairType,
      gender,
      engine,
    }),

  getAnalysis: (analysisId: number) =>
    request<AnalyzeResponse>("GET", `/api/analyze/${analysisId}`),

  getRecommendations: (faceShape?: string, hairType?: string, gender?: string, limit = 10) => {
    const params = new URLSearchParams();
    if (faceShape) params.set("face_shape", faceShape);
    if (hairType) params.set("hair_type", hairType);
    if (gender) params.set("gender", gender);
    params.set("limit", String(limit));
    return request<AnalyzeResponse>("GET", `/api/recommendations?${params}`);
  },

  tryOn: (imageBase64: string, hairstyleName: string, mimeType?: string) =>
    request<TryOnResponse>("POST", "/api/try-on", {
      image_base64: imageBase64,
      hairstyle_name: hairstyleName,
      mime_type: mimeType ?? "image/jpeg",
    }),

  getHistory: () => request<SavedStyleResponse>("GET", "/api/users/history"),

  getSaved: () => request<SavedStyleResponse>("GET", "/api/users/saved"),

  saveStyle: (styleName: string, styleId?: string, imageUrl?: string) =>
    request<SavedStyleResponse>("POST", "/api/users/saved", {
      style_name: styleName,
      style_id: styleId,
      image_url: imageUrl,
    }),

  deleteSaved: (styleId: number) =>
    request<SavedStyleResponse>("DELETE", `/api/users/saved/${styleId}`),

  getAdminStats: () => request<AdminStatsResponse>("GET", "/api/admin/stats"),

  health: () => request<HealthResponse>("GET", "/api/health"),
};
