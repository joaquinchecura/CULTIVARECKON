// Cliente local con localStorage - sin backend por ahora
const STORAGE_KEY = 'reckon_data';
const SYNC_KEY = '_reckon_sync';

const getStorage = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setStorage = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Notificar a otras tabs/instancias que localStorage cambió
const broadcast = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNC_KEY, Date.now().toString());
};

const getEntityData = (entity) => getStorage()[entity] || [];

const setEntityData = (entity, data) => {
  const storage = getStorage();
  storage[entity] = data;
  setStorage(storage);
  broadcast();
};

const createEntity = (name) => {
  return {
    list: async (sortBy, limit) => {
      const items = getEntityData(name);
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
      const items = getEntityData(name);
      const newItem = { 
        ...data, 
        id: crypto.randomUUID?.() || Date.now().toString(), 
        created_at: new Date().toISOString() 
      };
      items.push(newItem);
      setEntityData(name, items);
      return newItem;
    },
    update: async (id, data) => {
      const items = getEntityData(name);
      const index = items.findIndex(i => i.id === id);
      if (index >= 0) {
        items[index] = { ...items[index], ...data, updated_at: new Date().toISOString() };
        setEntityData(name, items);
        return items[index];
      }
      throw new Error('Not found');
    },
    delete: async (id) => {
      const items = getEntityData(name);
      setEntityData(name, items.filter(i => i.id !== id));
    },
  };
};

export const entities = {
  UserProfile: createEntity('userProfiles'),
  HealthHistory: createEntity('healthHistories'),
  PhysicalAssessment: createEntity('physicalAssessments'),
  FitnessTest: createEntity('fitnessTests'),
  FitnessPlan: createEntity('fitnessPlans'),
};