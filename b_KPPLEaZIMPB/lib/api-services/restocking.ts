// lib/api-services/restocking.ts
import { apiClient } from '../api-client';

export const restockingService = {
    // Récupérer tous les produits avec leur stock
    async getProducts() {
        try {
            const response = await apiClient.get('/produits?per_page=100');
            if (response.success && response.data) {
                if (response.data.data && Array.isArray(response.data.data)) {
                    return response.data.data;
                }
                if (Array.isArray(response.data)) {
                    return response.data;
                }
                return [];
            }
            return [];
        } catch (error) {
            console.error("Erreur getProducts:", error);
            return [];
        }
    },

    // Récupérer l'historique des approvisionnements
    async getApprovisionnements() {
        try {
            console.log("Chargement des approvisionnements...");
            const response = await apiClient.get('/approvisionnements');
            console.log("Réponse brute:", response);
            
            if (response.success && response.data) {
                let data = response.data;
                if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                }
                if (Array.isArray(response.data)) {
                    data = response.data;
                }
                
                // Vérifier que chaque approvisionnement a ses détails
                data.forEach(approv => {
                    if (approv.detailapprovisionnements) {
                        console.log(`Approvisionnement ${approv.id}: ${approv.detailapprovisionnements.length} produits`);
                    } else {
                        console.warn(`Aucun détail pour l'approvisionnement ${approv.id}`);
                    }
                });
                
                return data;
            }
            return [];
        } catch (error) {
            console.error("Erreur getApprovisionnements:", error);
            return [];
        }
    },

    // Récupérer les approvisionnements avec filtres
    async getApprovisionnementsFiltered(params?: { 
        date_debut?: string; 
        date_fin?: string; 
        fournisseur_id?: number;
        mois?: string;
        annee?: number;
    }) {
        let url = '/approvisionnements';
        const queryParams = new URLSearchParams();
        
        if (params?.date_debut) queryParams.append('date_debut', params.date_debut);
        if (params?.date_fin) queryParams.append('date_fin', params.date_fin);
        if (params?.fournisseur_id) queryParams.append('fournisseur_id', params.fournisseur_id.toString());
        if (params?.mois && params.mois !== "all") queryParams.append('mois', params.mois);
        if (params?.annee) queryParams.append('annee', params.annee.toString());
        
        if (queryParams.toString()) url += `?${queryParams.toString()}`;
        
        try {
            const response = await apiClient.get(url);
            if (response.success && response.data) {
                if (response.data.data && Array.isArray(response.data.data)) {
                    return response.data.data;
                }
                if (Array.isArray(response.data)) {
                    return response.data;
                }
                return [];
            }
            return [];
        } catch (error) {
            console.error("Erreur getApprovisionnementsFiltered:", error);
            return [];
        }
    },

    // Récupérer les détails d'un approvisionnement spécifique
    async getApprovisionnementDetails(id: number) {
        try {
            const response = await apiClient.get(`/approvisionnements/${id}`);
            console.log("Détails approvisionnement:", response);
            
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error("Erreur getApprovisionnementDetails:", error);
            return null;
        }
    },

    // Récupérer les fournisseurs
    async getFournisseurs() {
        try {
            const response = await apiClient.get('/fournisseurs');
            if (response.success && response.data) {
                if (response.data.data && Array.isArray(response.data.data)) {
                    return response.data.data;
                }
                if (Array.isArray(response.data)) {
                    return response.data;
                }
                return [];
            }
            return [];
        } catch (error) {
            console.error("Erreur getFournisseurs:", error);
            return [];
        }
    },

    // Créer un approvisionnement
    async createApprovisionnement(data: {
        date_approv: string;
        fournisseur_id: number;
        admin_id: number;
    }) {
        try {
            const response = await apiClient.post('/approvisionnements', data);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error("Erreur createApprovisionnement:", error);
            return null;
        }
    },

    // Ajouter un détail d'approvisionnement
    async addDetailApprovisionnement(data: {
        approv_id: number;
        produit_id: number;
        quantite: number;
        prix_achat: number;
    }) {
        try {
            const response = await apiClient.post('/detail-approvisionnements', data);
            if (response.success && response.data) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error("Erreur addDetailApprovisionnement:", error);
            return null;
        }
    },
};