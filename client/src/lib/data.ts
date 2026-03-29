/**
 * PinKoi - Shared Type Definitions
 * All fake/test data has been removed.
 * Data is now fetched exclusively from backend APIs via tRPC.
 */

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  image?: string | null;
  categoryId?: number | null;
  category?: string;
  sold: number;
  rating?: number | null;
  description?: string | null;
  stock: number;
  status: 'active' | 'inactive' | 'deleted' | 'out_of_stock';
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  count: number;
}

export interface Order {
  id: string;
  userId: number;
  userName: string;
  products: { productId: number; name: string; qty: number; price: number }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  address: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  orders: number;
  spent: number;
  status: 'active' | 'banned';
  createdAt: string;
}
