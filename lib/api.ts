import { Vendor } from '@/types/vendor';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export const getVendors = async (): Promise<Vendor[]> => {
  const response = await fetch(`${BASE_URL}/vendors`);
  if (!response.ok) throw new Error('Failed to fetch vendors');
  return response.json();
};

export const createVendor = async (vendor: Omit<Vendor, 'vendorId' | 'createdAt'>): Promise<void> => {
  const response = await fetch(`${BASE_URL}/vendors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vendor),
  });
  if (!response.ok) throw new Error('Failed to create vendor');
};

export const deleteVendor = async (vendorId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/vendors`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendorId }),
  });
  if (!response.ok) throw new Error('Failed to delete vendor');
};