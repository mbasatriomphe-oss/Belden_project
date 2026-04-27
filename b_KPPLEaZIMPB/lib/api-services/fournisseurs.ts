// lib/api-services/fournisseurs.ts
import { apiClient } from '../api-client';

export interface Fournisseur {
    id: number;
    nom: string;
    adresse: string | null;
    ville: string | null;
    pays: string | null;
    contact: string | null;
    created_at?: string;
    updated_at?: string;
}

export const fournisseursService = {
    // Récupérer tous les fournisseurs
    async getAll(): Promise<Fournisseur[]> {
        const response = await apiClient.get<Fournisseur[]>('/fournisseurs');
        if (response.success && response.data) {
            return response.data;
        }
        return [];
    },

    // Récupérer un fournisseur par ID
    async getById(id: number): Promise<Fournisseur | null> {
        const response = await apiClient.get<Fournisseur>(`/fournisseurs/${id}`);
        if (response.success && response.data) {
            return response.data;
        }
        return null;
    },

    // Créer un fournisseur
    async create(data: { nom: string; adresse?: string; ville?: string; pays?: string; contact?: string }): Promise<Fournisseur | null> {
        const response = await apiClient.post<Fournisseur>('/fournisseurs', data);
        if (response.success && response.data) {
            return response.data;
        }
        return null;
    },

    // Mettre à jour un fournisseur
    async update(id: number, data: Partial<Fournisseur>): Promise<Fournisseur | null> {
        const response = await apiClient.put<Fournisseur>(`/fournisseurs/${id}`, data);
        if (response.success && response.data) {
            return response.data;
        }
        return null;
    },

    // Supprimer un fournisseur
    async delete(id: number): Promise<boolean> {
        const response = await apiClient.delete(`/fournisseurs/${id}`);
        return response.success;
    },
};