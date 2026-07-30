import { Vendor } from '@/types/vendor';
import { fetchAuthSession } from 'aws-amplify/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

const getAuthToken = async (): Promise<string> => {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) throw new Error('No active session. Please sign in.');
    return token
}

export const getVendors = async (): Promise<Vendor[]> => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/vendors`, {
    headers:{Authorization: token}
  });
  if (!response.ok) throw new Error('Failed to fetch vendors');
  return response.json();
};

export const createVendor = async (vendor: Omit<Vendor, 'vendorId' | 'createdAt'>): Promise<void> => {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/vendors`, {
    method: 'POST',
    headers: { 
        Authorization: token,
        'Content-Type': 'application/json' 
    },
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