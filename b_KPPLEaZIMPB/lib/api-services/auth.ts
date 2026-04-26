// lib/api-services/auth.ts
import { apiClient } from '../api-client';

export interface User {
  id: number;
  nom: string;
  post_nom: string;
  role: 'admin' | 'vendeur';
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface LoginCredentials {
  post_nom: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    console.log('🔐 AuthService - Tentative login avec:', {
      post_nom: credentials.post_nom,
      password_length: credentials.password.length
    });
    
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      console.log('📥 AuthService - Réponse reçue:', response);
      
      if (response.success && response.token) {
        console.log('✅ AuthService - Token reçu, sauvegarde');
        apiClient.setToken(response.token);
      } else {
        console.log('❌ AuthService - Pas de token ou success false');
      }
      
      return response;
    } catch (error) {
      console.error('❌ AuthService - Erreur:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue'
      };
    }
  },

  async getUser() {
    console.log('👤 AuthService - Récupération utilisateur');
    return apiClient.get<User>('/auth/user');
  },

  async logout() {
    console.log('🚪 AuthService - Déconnexion');
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    if (response.success) {
      apiClient.clearToken();
    }
    return response;
  },

  async refreshToken() {
    console.log('🔄 AuthService - Rafraîchissement token');
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    if (response.success && response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  setToken(token: string) {
    apiClient.setToken(token);
  },

  clearToken() {
    apiClient.clearToken();
  },
};