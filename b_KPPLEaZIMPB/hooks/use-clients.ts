import { useState, useEffect } from 'react';
import { clientService, Client, PaginatedResponse } from '@/lib/api-services/orders';

interface UseClientsOptions {
  page?: number;
  perPage?: number;
  search?: string;
}

export function useClients(options?: UseClientsOptions) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 15,
    last_page: 1,
  });

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await clientService.getAll({
        page: options?.page || 1,
        per_page: options?.perPage || 15,
        search: options?.search,
      });

      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Client>;
        setClients(data.data);
        setPagination({
          current_page: data.meta.current_page,
          total: data.meta.total,
          per_page: data.meta.per_page,
          last_page: data.meta.last_page,
        });
      } else {
        setError(response.error || 'Erreur lors du chargement des clients');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [options?.page, options?.perPage, options?.search]);

  return {
    clients,
    isLoading,
    error,
    pagination,
    refetch: fetchClients,
  };
}

export function useClient(id: number) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await clientService.getById(id);

        if (response.success && response.data) {
          setClient(response.data);
        } else {
          setError(response.error || 'Erreur lors du chargement du client');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
  }, [id]);

  return { client, isLoading, error };
}
