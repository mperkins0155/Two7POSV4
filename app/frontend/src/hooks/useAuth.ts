import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import type { UserProfile, Organization } from '@/types/catalog';

const client = createClient();

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier' | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      );

      const authPromise = client.auth.me();
      
      const response = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (response?.data) {
        setUser(response.data);
        
        // Try to fetch user profile, but don't block if it fails
        try {
          const profileResponse = await client.entities.user_profiles.query({
            query: { user_id: response.data.id },
            limit: 1
          });
          
          if (profileResponse.data.items.length > 0) {
            const profile = profileResponse.data.items[0];
            setUserProfile(profile);
            setRole(profile.role);
            
            // Fetch organization details
            try {
              const orgResponse = await client.entities.organizations.get({
                id: profile.organization_id
              });
              setOrganization(orgResponse.data);
            } catch (orgError) {
              console.error('Failed to fetch organization:', orgError);
            }
          }
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Not authenticated or timeout - this is fine, just show login
      setUser(null);
    } finally {
      // Always set loading to false so the app can render
      setLoading(false);
    }
  };

  const login = () => {
    client.auth.toLogin();
  };

  const logout = async () => {
    await client.auth.logout();
    setUser(null);
    setOrganization(null);
    setUserProfile(null);
    setRole(null);
  };

  return {
    user,
    organization,
    userProfile,
    role,
    loading,
    isAuthenticated: !!user,
    isOwner: role === 'owner',
    isManager: role === 'manager',
    isCashier: role === 'cashier',
    isAdmin: role === 'owner' || role === 'manager',
    login,
    logout,
    checkAuth
  };
}