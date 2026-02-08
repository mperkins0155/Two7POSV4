import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';

const client = createClient();

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Choose organization
  const [orgChoice, setOrgChoice] = useState<'existing' | 'new'>('existing');

  // Step 2: User profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'owner' | 'manager' | 'cashier'>('cashier');

  const handleJoinDemoOrg = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // Create user profile for Demo Coffee Shop (organization_id: 1)
      await client.entities.user_profiles.create({
        data: {
          user_id: user.id,
          organization_id: 1,
          role: role,
          first_name: firstName || 'Demo',
          last_name: lastName || 'User',
          is_active: true,
          created_at: now,
          updated_at: now
        }
      });

      await checkAuth();
      navigate('/pos');
    } catch (error) {
      console.error('Failed to create user profile:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to POS System</CardTitle>
          <CardDescription>
            Let's set up your account - Step {step} of 2
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Your Organization</h3>
                <RadioGroup value={orgChoice} onValueChange={(value: any) => setOrgChoice(value)}>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="existing" id="existing" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="existing" className="cursor-pointer font-medium">
                        Join Demo Coffee Shop
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Join the demo organization with sample products and data
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 opacity-50">
                    <RadioGroupItem value="new" id="new" disabled className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="new" className="font-medium">
                        Create New Organization (Coming Soon)
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Set up your own business with custom branding
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Profile</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Your Role</Label>
                    <RadioGroup value={role} onValueChange={(value: any) => setRole(value)}>
                      <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50">
                        <RadioGroupItem value="owner" id="owner" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="owner" className="cursor-pointer font-medium">Owner</Label>
                          <p className="text-sm text-gray-600">Full access to all features</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50">
                        <RadioGroupItem value="manager" id="manager" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="manager" className="cursor-pointer font-medium">Manager</Label>
                          <p className="text-sm text-gray-600">Manage catalog and view reports</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50">
                        <RadioGroupItem value="cashier" id="cashier" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="cashier" className="cursor-pointer font-medium">Cashier</Label>
                          <p className="text-sm text-gray-600">Process orders and sales</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleJoinDemoOrg} disabled={loading} className="flex-1">
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}