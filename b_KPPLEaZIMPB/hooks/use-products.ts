import { useState, useEffect } from 'react';
import { productService, Product, PaginatedResponse } from '@/lib/api-services/products';

interface UseProductsOptions {
  page?: number;
  perPage?: number;
  search?: string;
  categorieId?: number;
}

export function useProducts(options?: UseProductsOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 15,
    last_page: 1,
  });

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await productService.getAll({
        page: options?.page || 1,
        per_page: options?.perPage || 15,
        search: options?.search,
        categorie_id: options?.categorieId,
      });

      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Product>;
        setProducts(data.data);
        setPagination({
          current_page: data.meta.current_page,
          total: data.meta.total,
          per_page: data.meta.per_page,
          last_page: data.meta.last_page,
        });
      } else {
        setError(response.error || 'Erreur lors du chargement des produits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [options?.page, options?.perPage, options?.search, options?.categorieId]);

  return {
    products,
    isLoading,
    error,
    pagination,
    refetch: fetchProducts,
  };
}

export function useProduct(id: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await productService.getById(id);

        if (response.success && response.data) {
          setProduct(response.data);
        } else {
          setError(response.error || 'Erreur lors du chargement du produit');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  return { product, isLoading, error };
}
