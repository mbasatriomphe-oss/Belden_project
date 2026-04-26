import { useState, useEffect } from 'react';
import { orderService, Commande, PaginatedResponse } from '@/lib/api-services/orders';

interface UseOrdersOptions {
  page?: number;
  perPage?: number;
  clientId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useOrders(options?: UseOrdersOptions) {
  const [orders, setOrders] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 15,
    last_page: 1,
  });

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await orderService.getAll({
        page: options?.page || 1,
        per_page: options?.perPage || 15,
        client_id: options?.clientId,
        status: options?.status,
        date_from: options?.dateFrom,
        date_to: options?.dateTo,
      });

      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Commande>;
        setOrders(data.data);
        setPagination({
          current_page: data.meta.current_page,
          total: data.meta.total,
          per_page: data.meta.per_page,
          last_page: data.meta.last_page,
        });
      } else {
        setError(response.error || 'Erreur lors du chargement des commandes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [options?.page, options?.perPage, options?.clientId, options?.status, options?.dateFrom, options?.dateTo]);

  return {
    orders,
    isLoading,
    error,
    pagination,
    refetch: fetchOrders,
  };
}

export function useOrder(id: number) {
  const [order, setOrder] = useState<Commande | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await orderService.getById(id);

        if (response.success && response.data) {
          setOrder(response.data);
        } else {
          setError(response.error || 'Erreur lors du chargement de la commande');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  return { order, isLoading, error };
}
