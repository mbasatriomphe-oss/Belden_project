// lib/api-services/unites.ts
import { apiClient } from '../api-client';

export interface Unite {
  id: number;
  nom: string;
  abreviation: string;
  created_at?: string;
  updated_at?: string;
}

export const unitesService = {
  // Récupérer toutes les unités
  async getAll(): Promise<Unite[]> {
    const response = await apiClient.get<Unite[]>('/unites');
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  },

  // Créer une nouvelle unité
  async create(data: { nom: string; abreviation: string }): Promise<Unite | null> {
    const response = await apiClient.post<Unite>('/unites', data);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  },

  // Mettre à jour une unité
  async update(id: number, data: { nom: string; abreviation: string }): Promise<Unite | null> {
    const response = await apiClient.put<Unite>(`/unites/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  },

  // Supprimer une unité
  async delete(id: number): Promise<boolean> {
    const response = await apiClient.delete(`/unites/${id}`);
    return response.success;
  },
};