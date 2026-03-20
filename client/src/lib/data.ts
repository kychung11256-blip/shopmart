// ShopMart - Mock Data Store
// Design: 活力促銷電商風 - 紅白主色調

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  sold: number;
  rating: number;
  description?: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
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

export const categories: Category[] = [
  { id: 1, name: 'HOME PET', icon: '🏠', count: 45 },
  { id: 2, name: 'OUTDOORS', icon: '🌿', count: 32 },
  { id: 3, name: 'DIGITAL', icon: '💻', count: 58 },
  { id: 4, name: 'Apparel', icon: '👗', count: 124 },
  { id: 5, name: 'Children', icon: '🧸', count: 67 },
  { id: 6, name: 'COSMETICS', icon: '💄', count: 89 },
  { id: 7, name: 'Food & Drink', icon: '🍷', count: 43 },
  { id: 8, name: 'Sports', icon: '⚽', count: 56 },
];

export const products: Product[] = [
  {
    id: 1,
    name: 'Crepe Off-the-Shoulder Dress',
    price: 124.00,
    originalPrice: 165.00,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
    category: 'Apparel',
    sold: 238,
    rating: 4.8,
    description: 'Elegant off-shoulder crepe dress perfect for formal occasions.',
    stock: 45,
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    name: '中文名称商品',
    price: 0.01,
    originalPrice: 0.01,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop',
    category: 'Apparel',
    sold: 1024,
    rating: 4.5,
    description: '高品質商品，物美價廉。',
    stock: 999,
    status: 'active',
    createdAt: '2024-01-20',
  },
  {
    id: 3,
    name: 'Cotton Eyelet Midi Dress',
    price: 245.00,
    originalPrice: 320.00,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=300&fit=crop',
    category: 'Apparel',
    sold: 156,
    rating: 4.9,
    description: 'Beautiful cotton eyelet midi dress with elegant details.',
    stock: 28,
    status: 'active',
    createdAt: '2024-02-01',
  },
  {
    id: 4,
    name: 'Handheld Single Shoulder Canvas Bag',
    price: 6.00,
    originalPrice: 12.00,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop',
    category: 'Apparel',
    sold: 892,
    rating: 4.3,
    description: 'Lightweight canvas bag perfect for everyday use.',
    stock: 200,
    status: 'active',
    createdAt: '2024-02-10',
  },
  {
    id: 5,
    name: '1.3L Air Humidifier DoubleSpray Port Cool Mist',
    price: 0.01,
    originalPrice: 0.01,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&h=300&fit=crop',
    category: 'HOME PET',
    sold: 567,
    rating: 4.6,
    description: 'Compact air humidifier with dual spray ports for better coverage.',
    stock: 150,
    status: 'active',
    createdAt: '2024-02-15',
  },
  {
    id: 6,
    name: 'PHATOIL 100ml Aromatherapy Fragrance',
    price: 0.01,
    originalPrice: 111.00,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=300&fit=crop',
    category: 'COSMETICS',
    sold: 423,
    rating: 4.7,
    description: 'Premium aromatherapy fragrance oil for relaxation.',
    stock: 80,
    status: 'active',
    createdAt: '2024-03-01',
  },
  {
    id: 7,
    name: '89 Years of French Red Wine Collection',
    price: 0.01,
    originalPrice: 0.01,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=300&fit=crop',
    category: 'Food & Drink',
    sold: 234,
    rating: 4.9,
    description: 'Exquisite collection of aged French red wines.',
    stock: 12,
    status: 'active',
    createdAt: '2024-03-05',
  },
  {
    id: 8,
    name: 'Hot Selling Brand Eau De Toilette for Men Fresh Romantic',
    price: 0.01,
    originalPrice: 0.01,
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300&h=300&fit=crop',
    category: 'COSMETICS',
    sold: 678,
    rating: 4.5,
    description: 'Fresh and romantic fragrance for the modern man.',
    stock: 95,
    status: 'active',
    createdAt: '2024-03-10',
  },
  {
    id: 9,
    name: 'Customized 4.5 Inch Creative Ceramic Mortar',
    price: 27.00,
    originalPrice: 45.00,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop',
    category: 'HOME PET',
    sold: 345,
    rating: 4.4,
    description: 'Handcrafted ceramic mortar for grinding spices and herbs.',
    stock: 67,
    status: 'active',
    createdAt: '2024-03-15',
  },
  {
    id: 10,
    name: 'Eco Friendly Black Walnut Wood Serving Tray',
    price: 15.54,
    originalPrice: 28.00,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop',
    category: 'HOME PET',
    sold: 189,
    rating: 4.8,
    description: 'Natural black walnut wood tray for serving food and drinks.',
    stock: 34,
    status: 'active',
    createdAt: '2024-03-20',
  },
  {
    id: 11,
    name: 'Wireless Mechanical Gaming Keyboard RGB',
    price: 89.99,
    originalPrice: 129.99,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop',
    category: 'DIGITAL',
    sold: 512,
    rating: 4.7,
    description: 'Professional gaming keyboard with RGB backlighting.',
    stock: 78,
    status: 'active',
    createdAt: '2024-04-01',
  },
  {
    id: 12,
    name: 'Premium Wireless Bluetooth Headphones',
    price: 59.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    category: 'DIGITAL',
    sold: 934,
    rating: 4.6,
    description: 'High-quality wireless headphones with noise cancellation.',
    stock: 120,
    status: 'active',
    createdAt: '2024-04-05',
  },
];

export const orders: Order[] = [
  {
    id: 'ORD-2024-001',
    userId: 1,
    userName: 'Alice Johnson',
    products: [
      { productId: 1, name: 'Crepe Off-the-Shoulder Dress', qty: 1, price: 124.00 },
      { productId: 4, name: 'Handheld Single Shoulder Canvas Bag', qty: 2, price: 6.00 },
    ],
    total: 136.00,
    status: 'delivered',
    createdAt: '2024-03-01',
    address: '123 Fashion St, New York, NY 10001',
  },
  {
    id: 'ORD-2024-002',
    userId: 2,
    userName: 'Bob Smith',
    products: [
      { productId: 11, name: 'Wireless Mechanical Gaming Keyboard', qty: 1, price: 89.99 },
    ],
    total: 89.99,
    status: 'shipped',
    createdAt: '2024-03-05',
    address: '456 Tech Ave, San Francisco, CA 94102',
  },
  {
    id: 'ORD-2024-003',
    userId: 3,
    userName: 'Carol White',
    products: [
      { productId: 6, name: 'PHATOIL 100ml Aromatherapy Fragrance', qty: 3, price: 0.01 },
      { productId: 8, name: 'Hot Selling Brand Eau De Toilette', qty: 1, price: 0.01 },
    ],
    total: 0.04,
    status: 'processing',
    createdAt: '2024-03-10',
    address: '789 Beauty Blvd, Los Angeles, CA 90001',
  },
  {
    id: 'ORD-2024-004',
    userId: 4,
    userName: 'David Lee',
    products: [
      { productId: 7, name: '89 Years of French Red Wine Collection', qty: 2, price: 0.01 },
    ],
    total: 0.02,
    status: 'pending',
    createdAt: '2024-03-15',
    address: '321 Wine Lane, Chicago, IL 60601',
  },
  {
    id: 'ORD-2024-005',
    userId: 5,
    userName: 'Emma Davis',
    products: [
      { productId: 3, name: 'Cotton Eyelet Midi Dress', qty: 1, price: 245.00 },
    ],
    total: 245.00,
    status: 'delivered',
    createdAt: '2024-03-18',
    address: '654 Style Road, Miami, FL 33101',
  },
  {
    id: 'ORD-2024-006',
    userId: 6,
    userName: 'Frank Wilson',
    products: [
      { productId: 12, name: 'Premium Wireless Bluetooth Headphones', qty: 1, price: 59.99 },
      { productId: 9, name: 'Customized 4.5 Inch Creative Ceramic Mortar', qty: 1, price: 27.00 },
    ],
    total: 86.99,
    status: 'cancelled',
    createdAt: '2024-03-20',
    address: '987 Music Ave, Seattle, WA 98101',
  },
];

export const users: User[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
    orders: 12,
    spent: 1580.50,
    status: 'active',
    createdAt: '2023-06-15',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    orders: 8,
    spent: 920.00,
    status: 'active',
    createdAt: '2023-08-20',
  },
  {
    id: 3,
    name: 'Carol White',
    email: 'carol@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    orders: 25,
    spent: 3240.75,
    status: 'active',
    createdAt: '2023-03-10',
  },
  {
    id: 4,
    name: 'David Lee',
    email: 'david@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
    orders: 3,
    spent: 145.00,
    status: 'active',
    createdAt: '2024-01-05',
  },
  {
    id: 5,
    name: 'Emma Davis',
    email: 'emma@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
    orders: 18,
    spent: 2890.00,
    status: 'active',
    createdAt: '2023-05-22',
  },
  {
    id: 6,
    name: 'Frank Wilson',
    email: 'frank@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
    orders: 1,
    spent: 86.99,
    status: 'banned',
    createdAt: '2024-02-14',
  },
];

export const dashboardStats = {
  totalRevenue: 128450.75,
  totalOrders: 1284,
  totalUsers: 8920,
  totalProducts: 256,
  revenueGrowth: 12.5,
  ordersGrowth: 8.3,
  usersGrowth: 15.2,
  productsGrowth: 5.1,
};

export const salesData = [
  { month: 'Jan', revenue: 8500, orders: 120 },
  { month: 'Feb', revenue: 9200, orders: 135 },
  { month: 'Mar', revenue: 11000, orders: 158 },
  { month: 'Apr', revenue: 10500, orders: 142 },
  { month: 'May', revenue: 12800, orders: 175 },
  { month: 'Jun', revenue: 14200, orders: 198 },
  { month: 'Jul', revenue: 13500, orders: 185 },
  { month: 'Aug', revenue: 15800, orders: 210 },
  { month: 'Sep', revenue: 16200, orders: 225 },
  { month: 'Oct', revenue: 14900, orders: 205 },
  { month: 'Nov', revenue: 18500, orders: 260 },
  { month: 'Dec', revenue: 22000, orders: 310 },
];

export const categoryData = [
  { name: 'Apparel', value: 35, color: '#E93323' },
  { name: 'DIGITAL', value: 25, color: '#FF6B6B' },
  { name: 'COSMETICS', value: 18, color: '#FF8E8E' },
  { name: 'HOME PET', value: 12, color: '#FFB3B3' },
  { name: 'Others', value: 10, color: '#FFD5D5' },
];
