import { client } from './client';

const createEntity = (name) => {
  const endpoint = '/' + name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') + 's';
  return {
    list: async () => (await client.get(endpoint)).data,
    create: async (data) => (await client.post(endpoint, data)).data,
    get: async (id) => (await client.get(`${endpoint}/${id}`)).data,
    update: async (id, data) => (await client.put(`${endpoint}/${id}`, data)).data,
    delete: async (id) => (await client.delete(`${endpoint}/${id}`)).data,
  };
};

export const entities = {
  UserProfile: createEntity('userProfile'),
  HealthHistory: createEntity('healthHistory'),
  FitnessPlan: createEntity('fitnessPlan'),
  FitnessTest: createEntity('fitnessTest'),
};
