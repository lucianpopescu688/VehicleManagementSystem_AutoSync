import { api } from './api';

export interface Vehicle {
  id: number;
  vin: string;
  name: string;
  model: string;
  year: number;
  currentMileage: number;
  assignedDriverId: number | null;
}

export const vehicleService = {
  listAll: async (): Promise<Vehicle[]> => {
    return api('/vehicles');
  },
  
  getById: async (id: number): Promise<Vehicle> => {
    return api(`/vehicles/${id}`);
  },
  
  listByOwner: async (ownerId: number): Promise<Vehicle[]> => {
    return api(`/vehicles/owner/${ownerId}`);
  },
  
  create: async (data: Partial<Vehicle>): Promise<Vehicle> => {
    return api('/vehicles', {
      method: 'POST',
      data,
    });
  },
  
  update: async (id: number, data: Partial<Vehicle>): Promise<Vehicle> => {
    return api(`/vehicles/${id}`, {
      method: 'PUT',
      data,
    });
  },
  
  delete: async (id: number): Promise<void> => {
    return api(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};
