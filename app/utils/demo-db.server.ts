/**
 * This is a simple in-memory database adapter for demo purposes.
 * It allows the app to run without a real database connection.
 * DO NOT USE THIS IN PRODUCTION!
 */

// In-memory storage
const storage: Record<string, any[]> = {
  users: [],
  shops: [],
  upsellOffers: [],
  shopSettings: [],
  integrations: []
};

// Demo data
const demoShop = {
  id: 'demo-shop-1',
  shopifyDomain: 'demo-shop.myshopify.com',
  accessToken: 'demo-token',
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 'demo-user-1'
};

const demoUser = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
};

const demoSettings = {
  id: 'demo-settings-1',
  displayLocation: 'cart_page',
  maxOffersPerPage: 2,
  offerStyle: 'modal',
  autoApplyDiscount: true,
  showDiscountBadge: true,
  enableAnalytics: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  shopId: 'demo-shop-1'
};

// Initialize demo data
storage.users.push(demoUser);
storage.shops.push(demoShop);
storage.shopSettings.push(demoSettings);

// Helper functions
export function isDemoMode() {
  return !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost');
}

export function getDemoData(table: string) {
  return storage[table] || [];
}

export function addDemoData(table: string, data: any) {
  if (!storage[table]) {
    storage[table] = [];
  }
  storage[table].push(data);
  return data;
}

export function updateDemoData(table: string, id: string, data: any) {
  if (!storage[table]) {
    return null;
  }
  
  const index = storage[table].findIndex((item: any) => item.id === id);
  if (index === -1) {
    return null;
  }
  
  storage[table][index] = { ...storage[table][index], ...data, updatedAt: new Date() };
  return storage[table][index];
}

export function deleteDemoData(table: string, id: string) {
  if (!storage[table]) {
    return false;
  }
  
  const index = storage[table].findIndex((item: any) => item.id === id);
  if (index === -1) {
    return false;
  }
  
  storage[table].splice(index, 1);
  return true;
}

export function findDemoData(table: string, query: Record<string, any>) {
  if (!storage[table]) {
    return null;
  }
  
  return storage[table].find((item: any) => {
    for (const key in query) {
      if (item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  });
}

export function findAllDemoData(table: string, query: Record<string, any> = {}) {
  if (!storage[table]) {
    return [];
  }
  
  if (Object.keys(query).length === 0) {
    return storage[table];
  }
  
  return storage[table].filter((item: any) => {
    for (const key in query) {
      if (item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  });
}
