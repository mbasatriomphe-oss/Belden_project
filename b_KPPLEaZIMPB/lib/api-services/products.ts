import { apiClient } from './api-client';

export interface Product {
  id: number;
  nom: string;
  description: string;
  photo?: string;
  stock: number;
  prix_achat: number;
  prix_vente: number;
  stock_min: number;
  sku?: string;
  categorie_id: number;
  unite_id: number;
  categorie?: {
    id: number;
    nom: string;
  };
  unite?: {
    id: number;
    nom: string;
  };
  est_en_rupture: boolean;
  marge_brute: number;
}

export interface Category {
  id: number;
  nom: string;
  description: string;
  photo?: string;
}

export interface Unit {
  id: number;
  nom: string;
  abreviation: string;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// Produits
export const productService = {
  async getAll(params?: { per_page?: number; page?: number; search?: string; categorie_id?: number }) {
    const query = new URLSearchParams();
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.categorie_id) query.append('categorie_id', params.categorie_id.toString());

    const url = `/produits${query.toString() ? '?' + query.toString() : ''}`;
    return apiClient.get<PaginatedResponse<Product>>(url);
  },

  async getById(id: number) {
    return apiClient.get<Product>(`/produits/${id}`);
  },

  async create(data: Partial<Product>) {
    return apiClient.post<Product>('/produits', data as Record<string, any>);
  },

  async update(id: number, data: Partial<Product>) {
    return apiClient.put<Product>(`/produits/${id}`, data as Record<string, any>);
  },

  async delete(id: number) {
    return apiClient.delete(`/produits/${id}`);
  },

  async checkStock(id: number, quantite: number) {
    return apiClient.get(`/produits/${id}/check-stock?quantite=${quantite}`);
  },
};

// Catégories
export const categoryService = {
  async getAll(params?: { per_page?: number; page?: number }) {
    const query = new URLSearchParams();
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.page) query.append('page', params.page.toString());

    const url = `/categories${query.toString() ? '?' + query.toString() : ''}`;
    return apiClient.get<PaginatedResponse<Category>>(url);
  },

  async getById(id: number) {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  async create(data: Partial<Category>) {
    return apiClient.post<Category>('/categories', data as Record<string, any>);
  },

  async update(id: number, data: Partial<Category>) {
    return apiClient.put<Category>(`/categories/${id}`, data as Record<string, any>);
  },

  async delete(id: number) {
    return apiClient.delete(`/categories/${id}`);
  },
};

// Unités
export const unitService = {
  async getAll(params?: { per_page?: number; page?: number }) {
    const query = new URLSearchParams();
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.page) query.append('page', params.page.toString());

    const url = `/unites${query.toString() ? '?' + query.toString() : ''}`;
    return apiClient.get<PaginatedResponse<Unit>>(url);
  },

  async getById(id: number) {
    return apiClient.get<Unit>(`/unites/${id}`);
  },

  async create(data: Partial<Unit>) {
    return apiClient.post<Unit>('/unites', data as Record<string, any>);
  },

  async update(id: number, data: Partial<Unit>) {
    return apiClient.put<Unit>(`/unites/${id}`, data as Record<string, any>);
  },

  async delete(id: number) {
    return apiClient.delete(`/unites/${id}`);
  },
};
