// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  token?: string;
  user?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET');
  }

  async post<T>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', data);
  }

  async put<T>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', data);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE');
  }

  private async request<T>(
    endpoint: string,
    method: string,
    data?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      // Lire la réponse comme texte d'abord pour éviter les erreurs de parsing
      const text = await response.text();
      let responseData = null;
      
      // Essayer de parser le JSON seulement si la réponse n'est pas vide
      if (text && text.trim()) {
        try {
          responseData = JSON.parse(text);
        } catch (e) {
          console.error('JSON parse error:', e);
          responseData = null;
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return {
          success: false,
          error: responseData?.message || `Erreur HTTP ${response.status}`,
        };
      }

      // Si pas de données, retourner succès
      if (!responseData) {
        return { success: true };
      }

      if (responseData.hasOwnProperty('success')) {
        return responseData;
      }

      return {
        success: true,
        data: responseData,
        ...responseData,
      };
    } catch (error: any) {
      console.error(`API Request Error (${endpoint}):`, error);
      return {
        success: false,
        error: error.message === 'Failed to fetch' 
          ? "Impossible de se connecter au serveur. Vérifiez que le backend est démarré."
          : error.message,
      };
    }
  }
}

export const apiClient = new ApiClient();