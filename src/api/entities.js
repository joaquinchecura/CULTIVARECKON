// Cliente local con localStorage - sin backend por ahora
const STORAGE_KEY = 'reckon_data';

const getStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const setStorage = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const getEntityData = (entity) => getStorage()[entity] || [];

const setEntityData = (entity, data) => {
  const storage = getStorage();
  storage[entity] = data;
  setStorage(storage);
};

const createEntity = (name) => {
  return {
    list: async () => getEntityData(name),
    create: async (data) => {
      const items = getEntityData(name);
      const newItem = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
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