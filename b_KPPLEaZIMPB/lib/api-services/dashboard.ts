// lib/api-services/dashboard.ts
import { apiClient } from '../api-client';

export interface DashboardStats {
    total_sales: number;
    total_orders: number;
    total_customers: number;
    low_stock_items: number;
    sales_growth: number;
    orders_growth: number;
    top_products: Array<{
        id: number;
        nom: string;
        total_ventes: number;
        quantite_vendue: number;
        croissance: number;
    }>;
    recent_orders: Array<{
        id: number;
        client_nom: string;
        total: number;
        status: string;
        date: string;
    }>;
    chart_data: {
        labels: string[];
        sales: number[];
        orders: number[];
    };
}

export const dashboardService = {
    async getStats(timeRange: string = '7d'): Promise<DashboardStats | null> {
        const response = await apiClient.get<DashboardStats>(`/dashboard/stats?period=${timeRange}`);
        if (response.success && response.data) {
            return response.data;
        }
        return null;
    },
};