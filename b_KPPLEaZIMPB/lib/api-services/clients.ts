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
    data: Client[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export const clientsService = {
    // Récupérer tous les clients
    async getAll(params?: { search?: string; per_page?: number; page?: number }): Promise<PaginatedResponse> {
        let url = '/clients';
        if (params) {
            const queryParams = new URLSearchParams();
            if (params.search) queryParams.append('search', params.search);
            if (params.per_page) queryParams.append('per_page', params.per_page.toString());
            if (params.page) queryParams.append('page', params.page.toString());
            if (queryParams.toString()) url += `?${queryParams.toString()}`;
        }
        
        const response = await apiClient.get<PaginatedResponse>(url);
        if (response.success && response.data) {
            return response.data;
        }
        return { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 };
    },

    // Récupérer un client par ID
    async getById(id: number): Promise<Client | null> {
        const response = await apiClient.get<Client>(`/clients/${id}`);
        if (response.success && response.data) {
            return response.data;
        }
        return null;
    },

    // Créer un nouveau client
    async create(data: { nom: string; numero_tel?: string; adress?: string; email?: string }): Promise<Client | null> {
        try {
            const response = await apiClient.post<Client>('/clients', data);
            console.log('Réponse création client:', response);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Erreur création client:', error);
            return null;
        }
    },

    // Mettre à jour un client
    async update(id: number, data: { nom?: string; numero_tel?: string; adress?: string; email?: string; points_fidelite?: number }): Promise<Client | null> {
        const response = await apiClient.put<Client>(`/clients/${id}`, data);
        if (response.success && response.data) {
            return response.data;
        }
        return null;
    },

    // Supprimer un client
    async delete(id: number): Promise<boolean> {
        const response = await apiClient.delete(`/clients/${id}`);
        return response.success;
    },
};