// const API_BASE = '/api';

// async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
//   const token = localStorage.getItem('token');
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//     ...(options.headers as Record<string, string>),
//   };
//   if (token) headers.Authorization = `Bearer ${token}`;

//   const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
//   const text = await res.text();

//   let data: any = null;
//   if (text) {
//     try {
//       data = JSON.parse(text);
//     } catch {
//       data = null;
//     }
//   }

//   if (!res.ok) {
//     const message = data?.error || data?.message || text || 'Request failed';
//     if (res.status === 429) {
//       throw new Error('Too many requests. Please wait a moment and try again.');
//     }
//     throw new Error(message);
//   }

//   return (data ?? {}) as T;
// }

// export const api = {
//   login: (email: string, password: string) =>
//     request<{ token: string; user: import('./types').User }>('/auth/login', {
//       method: 'POST',
//       body: JSON.stringify({ email, password }),
//     }),

//   getRestaurant: (slug: string) =>
//     request<{ restaurant: import('./types').Restaurant; menu: import('./types').MenuCategory[] }>(
//       `/restaurants/${slug}`
//     ),

//   joinQueue: (slug: string, data: { name: string; phone: string; partySize: number }) =>
//     request<{ entry: import('./types').QueueEntry; restaurant: { name: string; slug: string } }>(
//       `/queue/join-by-slug/${slug}`,
//       { method: 'POST', body: JSON.stringify(data) }
//     ),

//   getQueue: (restaurantId: string) =>
//     request<{ queue: import('./types').QueueEntry[] }>(`/queue/${restaurantId}`),

//   onMyWay: (entryId: string) =>
//     request<{ entry: import('./types').QueueEntry }>(`/queue/${entryId}/on-my-way`, {
//       method: 'PATCH',
//     }),

//   cancelQueue: (entryId: string) =>
//     request<{ entry: import('./types').QueueEntry }>(`/queue/${entryId}/cancel`, {
//       method: 'PATCH',
//     }),

//   preOrder: (entryId: string, items: { menuItemId: string; qty: number; notes?: string }[]) =>
//     request<{ order: import('./types').Order }>(`/queue/${entryId}/pre-order`, {
//       method: 'POST',
//       body: JSON.stringify({ items }),
//     }),

//   getTables: (restaurantId: string) =>
//     request<{ tables: import('./types').Table[] }>(`/tables/${restaurantId}`),

//   updateTableStatus: (tableId: string, status: 'occupied' | 'cleaning' | 'ready') =>
//     request<{ table: import('./types').Table }>(`/tables/${tableId}/status`, {
//       method: 'PATCH',
//       body: JSON.stringify({ status }),
//     }),

//   getKitchenOrders: (restaurantId: string) =>
//     request<{ orders: import('./types').Order[] }>(`/orders/${restaurantId}/kitchen`),

//   startCooking: (orderId: string) =>
//     request<{ order: import('./types').Order }>(`/orders/${orderId}/start-cooking`, {
//       method: 'PATCH',
//     }),

//   markOrderReady: (orderId: string) =>
//     request<{ order: import('./types').Order }>(`/orders/${orderId}/mark-ready`, {
//       method: 'PATCH',
//     }),

//   getAnalytics: (restaurantId: string) =>
//     request<{ stats: import('./types').DashboardStats }>(`/analytics/${restaurantId}`),

//   getSyncState: (restaurantId: string) =>
//     request<{ state: {
//       tables: import('./types').Table[];
//       queue: import('./types').QueueEntry[];
//       kitchenOrders: import('./types').Order[];
//       stats: import('./types').DashboardStats;
//     } }>(`/queue/sync/${restaurantId}`),
// };


const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? '/api'
  : 'https://smartwaitlist.onrender.com/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = data?.error || data?.message || text || 'Request failed';
    if (res.status === 401 && !path.includes('/auth/login')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
        if (typeof document !== 'undefined') {
          document.cookie.split(';').forEach((c) => {
            const eqPos = c.indexOf('=');
            const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
            if (name) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            }
          });
        }
      } catch (e) {
        console.error('Error clearing local cache and cookies:', e);
      }
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = `${window.location.pathname.includes('/SmartWaitlist') ? '/SmartWaitlist' : ''}/login`;
      }
    }
    if (res.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    throw new Error(message);
  }

  return (data ?? {}) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: import('./types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  clearDummyData: () =>
    request<{ message: string }>('/auth/clear-dummy', {
      method: 'POST',
    }),

  seedDemoSimulation: (restaurantId?: string) =>
    request<{ message: string; restaurantId: string }>('/auth/seed-demo-simulation', {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
    }),

  getPublicRestaurants: () =>
    request<{
      restaurants: {
        id: string;
        name: string;
        slug: string;
        address: string;
        whatsappPhone?: string;
        description?: string;
        openingHours?: string;
        cuisine?: string;
        location?: { lat: number; lng: number };
        activeQueueCount: number;
        tableCount: number;
      }[];
      stats: { totalRestaurants: number; totalQueues: number; totalSeated: number };
    }>('/restaurants/public/list'),

  getRestaurant: (slug: string) =>
    request<{ restaurant: import('./types').Restaurant; menu: import('./types').MenuCategory[] }>(
      `/restaurants/${slug}`
    ),

  joinQueue: (slug: string, data: { name: string; phone: string; partySize: number }) =>
    request<{ entry: import('./types').QueueEntry; restaurant: { name: string; slug: string } }>(
      `/queue/join-by-slug/${slug}`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getQueueEntry: (entryId: string) =>
    request<{
      entry: import('./types').QueueEntry & { restaurantId?: string };
      restaurant?: { name: string; slug: string; id: string };
      order?: import('./types').Order;
    }>(`/queue/entry/${entryId}`),

  getQueue: (restaurantId: string) =>
    request<{ queue: import('./types').QueueEntry[] }>(`/queue/${restaurantId}`),

  onMyWay: (entryId: string) =>
    request<{ entry: import('./types').QueueEntry }>(`/queue/${entryId}/on-my-way`, {
      method: 'PATCH',
    }),

  cancelQueue: (entryId: string) =>
    request<{ entry: import('./types').QueueEntry }>(`/queue/${entryId}/cancel`, {
      method: 'PATCH',
    }),

  preOrder: (entryId: string, items: { menuItemId: string; qty: number; notes?: string }[]) =>
    request<{ order: import('./types').Order }>(`/queue/${entryId}/pre-order`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  getTables: (restaurantId: string) =>
    request<{ tables: import('./types').Table[] }>(`/tables/${restaurantId}`),

  createTable: (number: string, capacity: number) =>
    request<{ message: string; table: import('./types').Table }>('/tables', {
      method: 'POST',
      body: JSON.stringify({ number, capacity }),
    }),

  deleteTable: (tableId: string) =>
    request<{ message: string }>(`/tables/${tableId}`, {
      method: 'DELETE',
    }),

  updateTableStatus: (tableId: string, status: 'occupied' | 'cleaning' | 'ready') =>
    request<{ table: import('./types').Table }>(`/tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getKitchenOrders: (restaurantId: string) =>
    request<{ orders: import('./types').Order[] }>(`/orders/${restaurantId}/kitchen`),

  startCooking: (orderId: string) =>
    request<{ order: import('./types').Order }>(`/orders/${orderId}/start-cooking`, {
      method: 'PATCH',
    }),

  markOrderReady: (orderId: string) =>
    request<{ order: import('./types').Order }>(`/orders/${orderId}/mark-ready`, {
      method: 'PATCH',
    }),

  updateOrderStatus: (orderId: string, status: 'confirmed' | 'cooking' | 'ready' | 'completed') =>
    request<{ order: import('./types').Order }>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getAnalytics: (restaurantId: string) =>
    request<{ stats: import('./types').DashboardStats }>(`/analytics/${restaurantId}`),

  getSyncState: (restaurantId: string) =>
    request<{ state: {
      tables: import('../types').Table[];
      queue: import('../types').QueueEntry[];
      kitchenOrders: import('../types').Order[];
      stats: import('../types').DashboardStats;
    } }>(`/queue/sync/${restaurantId}`),

  // SuperAdmin APIs
  getSuperAdminRestaurants: () =>
    request<{
      restaurants: import('../types').SuperAdminRestaurant[];
      stats: import('../types').SuperAdminStats;
    }>('/superadmin/restaurants'),

  createRestaurant: (data: {
    name: string;
    slug: string;
    address: string;
    whatsappPhone: string;
    settings?: { avgTurnoverMinutes?: number; maxQueueSize?: number; preOrderEnabled?: boolean };
    owner?: { name: string; email: string; password: string };
  }) =>
    request<{ message: string; restaurant: any; owner: any }>('/superadmin/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRestaurant: (
    id: string,
    data: {
      name?: string;
      slug?: string;
      address?: string;
      whatsappPhone?: string;
      settings?: { avgTurnoverMinutes?: number; maxQueueSize?: number; preOrderEnabled?: boolean };
    }
  ) =>
    request<{ message: string; restaurant: any }>(`/superadmin/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRestaurant: (id: string) =>
    request<{ message: string }>(`/superadmin/restaurants/${id}`, {
      method: 'DELETE',
    }),

  createRestaurantUser: (
    restaurantId: string,
    data: { name: string; email: string; password: string; role: 'owner' | 'staff' | 'kitchen' }
  ) =>
    request<{ message: string; user: any }>(`/superadmin/restaurants/${restaurantId}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAuditLogs: () => request<any[]>('/superadmin/audit-logs'),

  getSuperAdminInquiries: () =>
    request<import('../types').PartnerInquiry[]>('/superadmin/inquiries'),

  updateInquiryStatus: (id: string, status: 'pending' | 'contacted' | 'approved') =>
    request<{ message: string; inquiry: any }>(`/superadmin/inquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteInquiry: (id: string) =>
    request<{ message: string }>(`/superadmin/inquiries/${id}`, {
      method: 'DELETE',
    }),

  wipeAllRestaurants: () =>
    request<{ message: string }>('/superadmin/wipe-restaurants', {
      method: 'POST',
    }),

  // Restaurant Owner Management APIs
  getMyRestaurant: () =>
    request<{ restaurant: import('../types').Restaurant }>('/restaurants/my-restaurant'),

  updateMyRestaurant: (data: {
    name?: string;
    address?: string;
    whatsappPhone?: string;
    description?: string;
    openingHours?: string;
    cuisine?: string;
    settings?: { avgTurnoverMinutes?: number; maxQueueSize?: number; preOrderEnabled?: boolean };
  }) =>
    request<{ message: string; restaurant: import('../types').Restaurant }>('/restaurants/my-restaurant', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getOwnerMenu: () =>
    request<{
      categories: import('../types').MenuCategory[];
      items: import('../types').MenuItem[];
    }>('/restaurants/my-restaurant/menu'),

  createCategory: (name: string, sortOrder?: number) =>
    request<{ message: string; category: import('../types').MenuCategory }>(
      '/restaurants/my-restaurant/menu/categories',
      {
        method: 'POST',
        body: JSON.stringify({ name, sortOrder }),
      }
    ),

  updateCategory: (id: string, name: string, sortOrder?: number) =>
    request<{ message: string; category: import('../types').MenuCategory }>(
      `/restaurants/my-restaurant/menu/categories/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name, sortOrder }),
      }
    ),

  deleteCategory: (id: string) =>
    request<{ message: string }>(`/restaurants/my-restaurant/menu/categories/${id}`, {
      method: 'DELETE',
    }),

  createMenuItem: (data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    prepTimeMinutes?: number;
    gstRate?: number;
    isAvailable?: boolean;
  }) =>
    request<{ message: string; item: import('../types').MenuItem }>('/restaurants/my-restaurant/menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMenuItem: (
    id: string,
    data: {
      categoryId?: string;
      name?: string;
      description?: string;
      price?: number;
      prepTimeMinutes?: number;
      gstRate?: number;
      isAvailable?: boolean;
    }
  ) =>
    request<{ message: string; item: import('../types').MenuItem }>(
      `/restaurants/my-restaurant/menu/items/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  deleteMenuItem: (id: string) =>
    request<{ message: string }>(`/restaurants/my-restaurant/menu/items/${id}`, {
      method: 'DELETE',
    }),

  getRestaurantStaff: () =>
    request<{ staff: import('../types').StaffUser[] }>('/restaurants/my-restaurant/staff'),

  createStaffUser: (data: { name: string; email: string; password: string; role: 'staff' | 'kitchen' | 'owner' }) =>
    request<{ message: string; user: import('../types').StaffUser }>('/restaurants/my-restaurant/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteStaffUser: (id: string) =>
    request<{ message: string }>(`/restaurants/my-restaurant/staff/${id}`, {
      method: 'DELETE',
    }),

  createPaymentOrder: (data: { type: 'preorder' | 'deposit'; orderId?: string; queueEntryId?: string; amount: number; paymentMethod?: string }) =>
    request<{ session: { razorpayOrderId: string; amount: number; currency: string; keyId: string } }>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyPayment: (data: { type: 'preorder' | 'deposit'; orderId?: string; queueEntryId?: string; paymentId: string; paymentMethod?: string }) =>
    request<{ result: any }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  mockPay: (data: { type: 'preorder' | 'deposit'; orderId?: string; queueEntryId?: string; amount: number; paymentMethod?: string }) =>
    request<{ success: boolean; paymentId: string; result: any }>('/payments/mock-pay', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitInquiry: (data: {
    restaurantName: string;
    ownerName: string;
    phone: string;
    email: string;
    city?: string;
    dailyFootfall?: string;
    notes?: string;
  }) =>
    request<{ success: boolean; message: string }>('/restaurants/inquiry', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addOrderItems: (orderId: string, items: { menuItemId: string; qty: number; notes?: string }[]) =>
    request<{ order: import('../types').Order; message: string }>(`/orders/${orderId}/add-items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};