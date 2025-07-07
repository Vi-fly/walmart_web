
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('admin');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(email, password, role);
    if (!success) {
      setError('Invalid credentials or role mismatch');
    }
  };

  const demoCredentials = [
    { email: 'admin@walmart.com', role: 'admin', name: 'Admin Dashboard' },
    { email: 'supplier@freshproduce.com', role: 'supplier', name: 'Supplier Portal' },
    { email: 'executive@walmart.com', role: 'executive', name: 'Executive View' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-walmart-blue to-walmart-dark-blue p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-walmart-yellow rounded-full mb-4">
            <span className="text-walmart-blue font-bold text-xl">W</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Walmart SORM</h1>
          <p className="text-blue-100">Supplier Optimization & Risk Management</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your dashboard with your credentials
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: User['role']) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Regional Admin</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full gradient-walmart" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="text-xs space-y-1 p-2 bg-muted rounded">
                <div className="font-medium">{cred.name}</div>
                <div className="text-muted-foreground">
                  Email: {cred.email}<br />
                  Password: password<br />
                  Role: {cred.role}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
