const STORAGE_KEY = 'reckon_data';

const getStorage = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const setStorage = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const createEntity = (name) => ({
  list: async (sortBy, limit) => {
    const items = getStorage()[name] || [];
    let result = [...items];
    if (sortBy) {
      const desc = sortBy.startsWith('-');
      const key = desc ? sortBy.slice(1) : sortBy;
      result.sort((a, b) => {
        const va = a[key] || '';
        const vb = b[key] || '';
        return desc ? (va > vb ? -1 : 1) : (va > vb ? 1 : -1);
      });
    }
    if (limit) result = result.slice(0, limit);
    return result;
  },
  create: async (data) => {
    const storage = getStorage();
    const items = storage[name] || [];
    const newItem = { 
      ...data, 
      id: crypto.randomUUID?.() || Date.now().toString(), 
      created_at: new Date().toISOString() 
    };
    items.push(newItem);
    storage[name] = items;
    setStorage(storage);
    return newItem;
  },
  update: async (id, data) => {
    const storage = getStorage();
    const items = storage[name] || [];
    const index = items.findIndex(i => i.id === id);
    if (index >= 0) {
      items[index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
      storage[name] = items;
      setStorage(storage);
      return items[index];
    }
    throw new Error('Not found');
  },
  delete: async (id) => {
    const storage = getStorage();
    const items = storage[name] || [];
    storage[name] = items.filter(i => i.id !== id);
    setStorage(storage);
  },
});

export const entities = {
  UserProfile: createEntity('userProfiles'),
  HealthHistory: createEntity('healthHistories'),
  PhysicalAssessment: createEntity('physicalAssessments'),
  FitnessTest: createEntity('fitnessTests'),
  FitnessPlan: createEntity('fitnessPlans'),
};