// lib/api-services/commandes.ts
import { apiClient } from '../api-client';

export interface CommandeItem {
    produit_id: number;
    quantite: number;
    prix_vente: number;
}

export const commandesService = {
    async create(data: {
        date_commande: string;
        client_id: number;
        items: CommandeItem[];
        remise?: number;
        taxe?: number;
    }) {
        const response = await apiClient.post('/commandes', data);
        return response;
    },
    
    async getAll(params?: any) {
        const response = await apiClient.get('/commandes', params);
        return response;
    },
    
    async getById(id: number) {
        const response = await apiClient.get(`/commandes/${id}`);
        return response;
    },
    
    async update(id: number, data: any) {
        const response = await apiClient.put(`/commandes/${id}`, data);
        return response;
    },
    
    async delete(id: number) {
        const response = await apiClient.delete(`/commandes/${id}`);
        return response;
    },
    
    async getLotsProduit(produitId: number) {
        const response = await apiClient.get(`/commandes/lots/${produitId}`);
        return response;
    }
};