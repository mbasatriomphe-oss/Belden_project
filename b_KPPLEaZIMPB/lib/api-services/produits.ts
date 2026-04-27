// lib/api-services/produits.ts
import { apiClient } from '../api-client';

export interface Produit {
    id: number;
    nom: string;
    description: string | null;
    photo: string | null;
    categorie_id: number;
    unite_id: number;
    sku: string | null;
    created_at?: string;
    updated_at?: string;
    categorie?: {
        id: number;
        nom: string;
    };
    unite?: {
        id: number;
        nom: string;
        abreviation: string;
    };
    prix_achat_moyen?: number;
    prix_vente_actuel?: number;
    stock_actuel?: number;
    est_en_rupture?: boolean;
    marge_brute?: number;
}

export interface PaginatedResponse {
    data: Produit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const produitsService = {
    async getAll(params?: { search?: string; categorie_id?: number; per_page?: number; page?: number }): Promise<PaginatedResponse> {
        try {
            let url = '/produits';
            if (params) {
                const queryParams = new URLSearchParams();
                if (params.search) queryParams.append('search', params.search);
                if (params.categorie_id) queryParams.append('categorie_id', params.categorie_id.toString());
                if (params.per_page) queryParams.append('per_page', params.per_page.toString());
                if (params.page) queryParams.append('page', params.page.toString());
                if (queryParams.toString()) url += `?${queryParams.toString()}`;
            }
            
            const response = await apiClient.get<PaginatedResponse>(url);
            
            if (response.success && response.data) {
                // Vérifier si les données sont paginées ou non
                if (response.data.data && Array.isArray(response.data.data)) {
                    return response.data;
                }
                if (Array.isArray(response.data)) {
                    return {
                        data: response.data,
                        current_page: 1,
                        last_page: 1,
                        per_page: response.data.length,
                        total: response.data.length
                    };
                }
            }
            
            return { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
        } catch (error) {
            console.error("Erreur getAll produits:", error);
            return { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
        }
    },

    async getById(id: number): Promise<Produit | null> {
        try {
            const response = await apiClient.get<Produit>(`/produits/${id}`);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error("Erreur getById:", error);
            return null;
        }
    },

    async createWithImage(formData: FormData): Promise<Produit | null> {
        try {
            const response = await apiClient.post<Produit>('/produits', formData);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Erreur création produit:', error);
            return null;
        }
    },

    async updateWithImage(id: number, formData: FormData): Promise<Produit | null> {
        try {
            // Pour les formulaires multipart, on utilise fetch directement
            const token = apiClient.getToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            
            const response = await fetch(`${API_URL}/produits/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            
            const result = await response.json();
            if (response.ok) {
                return result;
            }
            return null;
        } catch (error) {
            console.error('Erreur mise à jour produit:', error);
            return null;
        }
    },

    async update(id: number, data: Partial<Produit>): Promise<Produit | null> {
        try {
            const response = await apiClient.put<Produit>(`/produits/${id}`, data);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error("Erreur update:", error);
            return null;
        }
    },

    async delete(id: number): Promise<boolean> {
        try {
            const response = await apiClient.delete(`/produits/${id}`);
            return response.success;
        } catch (error) {
            console.error("Erreur delete:", error);
            return false;
        }
    },
    
    async getStats(id: number): Promise<any> {
        try {
            const response = await apiClient.get(`/produits/${id}/stats`);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error("Erreur getStats:", error);
            return null;
        }
    }
};