import { apiClient } from '../api-client';
import { PaginatedResponse, PaginationMeta } from './products';

export interface Client {
  id: number;
  nom: string;
  numero_tel?: string;
  adress?: string;
  email?: string;
  points_fidelite: number;
  total_achete: number;
  nombre_commandes: number;
  created_at: string;
  updated_at: string;
}

export interface DetailCommande {
  id: number;
  commande_id: number;
  produit_id: number;
  quantite: number;
  prix_vente: number;
  total: number;
  produit: {
    id: number;
    nom: string;
    description: string;
  };
}

export interface Commande {
  id: number;
  date_commande: string;
  client_id: number;
  admin_id: number;
  statut: 'en attente' | 'confirmée' | 'livrée' | 'annulée';
  total: number;
  remise: number;
  taxe: number;
  sous_total: number;
  montant_final: number;
  client?: Client;
  admin?: {
    id: number;
    nom: string;
    post_nom: string;
  };
  detailcommandes: DetailCommande[];
  created_at: string;
  updated_at: string;
}

// Clients
export const clientService = {
  async getAll(params?: { per_page?: number; page?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.search) query.append('search', params.search);

    const url = `/clients${query.toString() ? '?' + query.toString() : ''}`;
    return apiClient.get<PaginatedResponse<Client>>(url);
  },

  async getById(id: number) {
    return apiClient.get<Client>(`/clients/${id}`);
  },

  async create(data: Partial<Client>) {
    return apiClient.post<Client>('/clients', data as Record<string, any>);
  },

  async update(id: number, data: Partial<Client>) {
    return apiClient.put<Client>(`/clients/${id}`, data as Record<string, any>);
  },

  async delete(id: number) {
    return apiClient.delete(`/clients/${id}`);
  },
};

// Commandes
export const orderService = {
  async getAll(params?: {
    per_page?: number;
    page?: number;
    client_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.client_id) query.append('client_id', params.client_id.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);

    const url = `/commandes${query.toString() ? '?' + query.toString() : ''}`;
    return apiClient.get<PaginatedResponse<Commande>>(url);
  },

  async getById(id: number) {
    return apiClient.get<Commande>(`/commandes/${id}`);
  },

  async create(data: {
    date_commande: string;
    client_id: number;
    items: Array<{
      produit_id: number;
      quantite: number;
      prix_vente: number;
    }>;
    remise?: number;
    taxe?: number;
  }) {
    return apiClient.post<Commande>('/commandes', data as Record<string, any>);
  },

  async update(
    id: number,
    data: {
      statut?: string;
      remise?: number;
      taxe?: number;
    }
  ) {
    return apiClient.put<Commande>(`/commandes/${id}`, data as Record<string, any>);
  },

  async delete(id: number) {
    return apiClient.delete(`/commandes/${id}`);
  },
};
