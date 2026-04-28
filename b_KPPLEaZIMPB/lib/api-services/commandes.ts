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
        client_id?: number | null;
        items: CommandeItem[];
        remise?: number;
        montant_paye?: number;
    }) {
        // N'envoyer que les champs nécessaires
        const payload: any = {
            date_commande: data.date_commande,
            items: data.items,
            remise: data.remise || 0,
        };
        
        // N'inclure client_id que s'il existe
        if (data.client_id) {
            payload.client_id = data.client_id;
        }
        
        // Inclure le montant payé si présent
        if (data.montant_paye) {
            payload.montant_paye = data.montant_paye;
        }
        
        const response = await apiClient.post('/commandes', payload);
        return response;
    },

    async getAll(params?: any) {
        // Correction: apiClient.get accepte un paramètre optionnel
        let url = '/commandes';
        if (params) {
            const queryParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key]) {
                    queryParams.append(key, params[key]);
                }
            });
            if (queryParams.toString()) {
                url += `?${queryParams.toString()}`;
            }
        }
        const response = await apiClient.get(url);
        return response;
    },

    async getById(id: number) {
        const response = await apiClient.get(`/commandes/${id}`);
        return response;
    }
};