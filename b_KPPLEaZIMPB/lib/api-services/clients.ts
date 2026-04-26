// lib/api-services/clients.ts
import { apiClient } from '../api-client';

export interface Client {
    id: number;
    nom: string;
    numero_tel: string | null;
    adress: string | null;
    email?: string;
    points_fidelite?: number;
    created_at?: string;
    updated_at?: string;
    total_achete?: number;
    nombre_commandes?: number;
}

export interface PaginatedResponse {
    success?: boolean;
    data: Client[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const clientsService = {
    // Récupérer tous les clients
    async getAll(params?: { search?: string; per_page?: number; page?: number }): Promise<PaginatedResponse> {
        try {
            let url = '/clients';
            if (params) {
                const queryParams = new URLSearchParams();
                if (params.search) queryParams.append('search', params.search);
                if (params.per_page) queryParams.append('per_page', params.per_page.toString());
                if (params.page) queryParams.append('page', params.page.toString());
                if (queryParams.toString()) url += `?${queryParams.toString()}`;
            }
            
            const response = await apiClient.get<PaginatedResponse>(url);
            
            console.log('Raw API response:', response); // Debug
            
            if (response.success) {
                // Si la réponse a déjà la structure avec data
                if (response.data && Array.isArray(response.data)) {
                    return {
                        data: response.data,
                        current_page: response.current_page || 1,
                        last_page: response.last_page || 1,
                        per_page: response.per_page || response.data.length,
                        total: response.total || response.data.length
                    };
                }
                
                // Si response.data contient la structure paginée
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    return response.data;
                }
                
                // Si la réponse est directement un tableau dans response
                if (Array.isArray(response)) {
                    return {
                        data: response,
                        current_page: 1,
                        last_page: 1,
                        per_page: response.length,
                        total: response.length
                    };
                }
            }
            
            // Retourner un tableau vide par défaut
            return { 
                data: [], 
                current_page: 1, 
                last_page: 1, 
                per_page: 15, 
                total: 0 
            };
        } catch (error) {
            console.error('Erreur chargement clients:', error);
            return { 
                data: [], 
                current_page: 1, 
                last_page: 1, 
                per_page: 15, 
                total: 0 
            };
        }
    },

    // Récupérer un client par ID
    async getById(id: number): Promise<Client | null> {
        try {
            const response = await apiClient.get<Client>(`/clients/${id}`);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Erreur chargement client:', error);
            return null;
        }
    },

    // Créer un nouveau client
    async create(data: { nom: string; numero_tel?: string; adress?: string; email?: string }): Promise<Client | null> {
        try {
            const response = await apiClient.post<Client>('/clients', data);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error: any) {
            console.error('Erreur création client:', error);
            return null;
        }
    },

    // Mettre à jour un client
    async update(id: number, data: { nom?: string; numero_tel?: string; adress?: string; email?: string; points_fidelite?: number }): Promise<Client | null> {
        try {
            const response = await apiClient.put<Client>(`/clients/${id}`, data);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Erreur mise à jour client:', error);
            return null;
        }
    },

    // Supprimer un client
    async delete(id: number): Promise<boolean> {
        try {
            const response = await apiClient.delete(`/clients/${id}`);
            return response.success === true;
        } catch (error) {
            console.error('Erreur suppression client:', error);
            return false;
        }
    },
};