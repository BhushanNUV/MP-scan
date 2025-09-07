'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Vitals {
  id: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  bloodGlucose?: number;
  weight?: number;
  bmi?: number;
  painLevel?: number;
  notes?: string;
  symptoms?: string;
  recordedAt: string;
}

interface VitalsAnalytics {
  summary: any;
  trends: any;
  healthScore: number;
  distributions: any;
}

export function useVitals() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestVitals = async () => {
    if (!session) return null;
    
    try {
      const response = await fetch('/api/health-vitals/latest');
      if (!response.ok) throw new Error('Failed to fetch vitals');
      return await response.json();
    } catch (err) {
      console.error('Error fetching latest vitals:', err);
      return null;
    }
  };

  const fetchAllVitals = async (page = 1, limit = 10, filters?: any) => {
    if (!session) return { data: [], pagination: { total: 0, totalPages: 0 } };
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await fetch(`/api/health-vitals?${params}`);
      if (!response.ok) throw new Error('Failed to fetch vitals');
      return await response.json();
    } catch (err) {
      console.error('Error fetching vitals:', err);
      return { data: [], pagination: { total: 0, totalPages: 0 } };
    }
  };

  const fetchAnalytics = async (period = '30d') => {
    if (!session) return null;
    
    try {
      const response = await fetch(`/api/health-vitals/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return await response.json();
    } catch (err) {
      console.error('Error fetching analytics:', err);
      return null;
    }
  };

  const saveVitals = async (data: Partial<Vitals>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/health-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save vitals');
      }
      
      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchLatestVitals,
    fetchAllVitals,
    fetchAnalytics,
    saveVitals,
    isLoading,
    error,
  };
}

export function useUserProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      const updated = await response.json();
      setProfile(updated.user);
      return updated;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    isLoading,
    updateProfile,
    refetch: fetchProfile,
  };
}