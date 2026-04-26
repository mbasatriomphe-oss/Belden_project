// lib/api-services/categories.ts
import { apiClient } from '../api-client';

export interface Categorie {
    id: number;
    nom: string;
    description: string | null;
    photo: string | null;
    created_at?: string;
    updated_at?: string;
}

export const categoriesService = {
    // Récupérer toutes les catégories
    async getAll(): Promise<Categorie[]> {
        const response = await apiClient.get<Categorie[]>('/categories');
        console.log('📸 Catégories reçues:', response.data); // Pour debug
        if (response.success && response.data) {
            return response.data;
        }
        return [];
    },

    // Créer une nouvelle catégorie avec image
    async createWithImage(data: FormData): Promise<Categorie | null> {
        const token = apiClient.getToken();

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            const result = await response.json();
            if (response.ok) {
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error creating category:', error);
            return null;
        }
    },

    // Mettre à jour une catégorie avec image
    async updateWithImage(id: number, data: FormData): Promise<Categorie | null> {
        const token = apiClient.getToken();

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`, {
                method: 'POST', // Utiliser POST pour supporter FormData
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            const result = await response.json();
            if (response.ok) {
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error updating category:', error);
            return null;
        }
    },

    // Supprimer une catégorie
    async delete(id: number): Promise<boolean> {
        const response = await apiClient.delete(`/categories/${id}`);
        return response.success;
    },
};