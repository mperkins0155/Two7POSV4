import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart } from 'lucide-react';

export default function Login() {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/pos');
    }
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-full">
              <ShoppingCart className="h-12 w-12" />
            </div>
          </div>
          <CardTitle className="text-3xl">POS System</CardTitle>
          <CardDescription>
            Multi-tenant Point of Sale platform for small businesses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={login} className="w-full h-12 text-lg">
            Sign In
          </Button>
          <p className="text-center text-sm text-gray-600 mt-4">
            Secure authentication powered by Atoms Cloud
          </p>
        </CardContent>
      </Card>
    </div>
  );
}