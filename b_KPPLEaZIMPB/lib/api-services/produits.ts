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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const produitsService = {
    async getAll(params?: { search?: string; categorie_id?: number; per_page?: number; page?: number }): Promise<PaginatedResponse> {
        let url = `${API_URL}/produits`;
        
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.search) queryParams.append('search', params.search);
            if (params.categorie_id) queryParams.append('categorie_id', params.categorie_id.toString());
            if (params.per_page) queryParams.append('per_page', params.per_page.toString());
            if (params.page) queryParams.append('page', params.page.toString());
            if (queryParams.toString()) url += `?${queryParams.toString()}`;
        }
        
        const token = apiClient.getToken();
        
        // Vérifier si le token existe
        if (!token) {
            console.error("Token d'authentification manquant");
            return { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
        }
        
        try {
            console.log("Fetching products from:", url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                console.error("Erreur HTTP:", response.status);
                return { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
            }
            
            const data = await response.json();
            console.log("Données reçues:", data);
            
            // Gérer différents formats de réponse
            if (data.data && Array.isArray(data.data)) {
                return data;
            }
            
            if (Array.isArray(data)) {
                return { data, current_page: 1, last_page: 1, per_page: data.length, total: data.length };
            }
            
            return { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
        } catch (error) {
            console.error("Erreur détaillée getAll:", error);
            return { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
        }
    },

    async createWithImage(formData: FormData): Promise<Produit | null> {
        const token = apiClient.getToken();
        
        if (!token) {
            console.error("Token manquant");
            return null;
        }
        
        try {
            const response = await fetch(`${API_URL}/produits`, {
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
            console.error("Erreur création:", result);
            return null;
        } catch (error) {
            console.error('Erreur création produit:', error);
            return null;
        }
    },

    async updateWithImage(id: number, formData: FormData): Promise<Produit | null> {
        const token = apiClient.getToken();
        
        if (!token) {
            console.error("Token manquant");
            return null;
        }
        
        formData.append('_method', 'PUT');
        
        try {
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

    async delete(id: number): Promise<boolean> {
        const response = await apiClient.delete(`/produits/${id}`);
        return response.success;
    },
};