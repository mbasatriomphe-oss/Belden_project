// lib/api-services/approvisionnements.ts
import { apiClient } from '../api-client';

export interface Approvisionnement {
    id: number;
    date_approv: string;
    fournisseur_id: number;
    admin_id: number;
}

export interface DetailApprovisionnement {
    id: number;
    approv_id: number;
    produit_id: number;
    quantite: number;
    prix_achat: number;
}

export interface LotStock {
    id: number;
    produit_id: number;
    quantite_initiale: number;
    quantite_restante: number;
    prix_achat: number;
    date_entree: string;
    fournisseur_id: number;
    taux_utilisation: number;
    est_epuise: boolean;
}

export const approvisionnementsService = {
    // Créer un approvisionnement
    async create(data: { date_approv: string; fournisseur_id: number; admin_id: number }) {
        const response = await apiClient.post<Approvisionnement>('/approvisionnements', data);
        return response;
    },

    // Ajouter un détail d'approvisionnement (créé un lot automatiquement)
    async addDetail(data: { approv_id: number; produit_id: number; quantite: number; prix_achat: number }) {
        const response = await apiClient.post<DetailApprovisionnement>('/detail-approvisionnements', data);
        return response;
    },

    // Récupérer les lots d'un produit
    async getLotsByProduit(produitId: number) {
        const response = await apiClient.get(`/lots/produit/${produitId}`);
        return response;
    },
    
    // Récupérer tous les fournisseurs
    async getFournisseurs() {
        const response = await apiClient.get('/fournisseurs');
        return response;
    }
};