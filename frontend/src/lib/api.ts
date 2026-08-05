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
  : '/api';

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

  getRestaurant: (slug: string) =>
    request<{ restaurant: import('./types').Restaurant; menu: import('./types').MenuCategory[] }>(
      `/restaurants/${slug}`
    ),

  joinQueue: (slug: string, data: { name: string; phone: string; partySize: number }) =>
    request<{ entry: import('./types').QueueEntry; restaurant: { name: string; slug: string } }>(
      `/queue/join-by-slug/${slug}`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

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

  getAnalytics: (restaurantId: string) =>
    request<{ stats: import('./types').DashboardStats }>(`/analytics/${restaurantId}`),

  getSyncState: (restaurantId: string) =>
    request<{ state: {
      tables: import('./types').Table[];
      queue: import('./types').QueueEntry[];
      kitchenOrders: import('./types').Order[];
      stats: import('./types').DashboardStats;
    } }>(`/queue/sync/${restaurantId}`),
};