import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { SessionStorage } from '@/lib/safe-storage';
import { 
  AnalyticsDashboardWrapper, 
  CampaignManagementWrapper, 
  SystemSettingsWrapper,
  preloadAdminComponents 
} from '@/components/admin/lazy-admin-components';

function AdminLogin({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key) {
      setError('Please enter admin key');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: key }),
      });

      if (response.ok) {
        SessionStorage.set('adminKey', key);
        onLogin(key);
      } else {
        setError('Invalid admin key');
      }
    } catch (err) {
      setError('Failed to verify admin key');
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter admin key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [adminKey, setAdminKey] = useState<string | null>(() => {
    const result = SessionStorage.get<string>('adminKey');
    if (result.success) {
      return result.data;
    }
    if (result.error) {
      console.warn('[ADMIN] Failed to load admin key from storage:', result.error);
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState('campaigns');

  const handleLogin = (key: string) => {
    setAdminKey(key);
    // Preload admin components for better performance
    preloadAdminComponents.all();
  };

  const handleLogout = () => {
    const result = SessionStorage.remove('adminKey');
    if (!result.success) {
      console.error('[ADMIN] Failed to remove admin key from storage:', result.error);
      // Continue with logout even if storage removal fails
    }
    setAdminKey(null);
  };

  if (!adminKey) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-navy">
      {/* Header */}
      <header className="bg-navy-800 shadow-lg border-b border-accent-blue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                SouthCoast ProMotion
              </h1>
              <p className="text-sm text-gray-300">
                Admin Dashboard
              </p>
            </div>
            <Button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-accent-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('campaigns')}
              onMouseEnter={() => preloadAdminComponents.campaigns()}
              className={`px-3 py-4 text-sm font-medium transition-colors ${
                activeTab === 'campaigns'
                  ? 'text-white border-b-2 border-white'
                  : 'text-accent-blue-100 hover:text-white'
              }`}
            >
              Campaign Management
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              onMouseEnter={() => preloadAdminComponents.analytics()}
              className={`px-3 py-4 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-white border-b-2 border-white'
                  : 'text-accent-blue-100 hover:text-white'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-4 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-white border-b-2 border-white'
                  : 'text-accent-blue-100 hover:text-white'
              }`}
            >
              System Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'campaigns' && (
            <CampaignManagementWrapper adminKey={adminKey} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboardWrapper />
          )}

          {activeTab === 'settings' && (
            <SystemSettingsWrapper />
          )}
        </div>
      </main>
    </div>
  );
}
