import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  ShoppingCart, 
  Receipt, 
  Activity, 
  PieChart, 
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ClipboardList
} from 'lucide-react';
import AiCopilot from './AiCopilot';

const Layout = () => {
  const { role, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

  // Sync theme with document and localStorage
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Define navigation based on role
  const getNavItems = () => {
    const items = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Procurement Officer', 'Vendor'] },
      { name: 'Vendors', path: '/vendors', icon: Users, roles: ['Admin', 'Manager', 'Procurement Officer'] },
      { name: 'RFQs', path: '/rfq', icon: FileText, roles: ['Admin', 'Manager', 'Procurement Officer', 'Vendor'] },
      { name: 'Quotations', path: '/quotations', icon: ClipboardList, roles: ['Admin', 'Manager', 'Procurement Officer', 'Vendor'] },
      { name: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['Admin', 'Manager', 'Procurement Officer'] },
      { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, roles: ['Admin', 'Manager', 'Procurement Officer', 'Vendor'] }, // Vendors might see their own POs
      { name: 'Invoices', path: '/invoices', icon: Receipt, roles: ['Admin', 'Manager', 'Procurement Officer', 'Vendor'] },
      { name: 'Activity Log', path: '/activity', icon: Activity, roles: ['Admin', 'Manager', 'Procurement Officer'] },
      { name: 'Reports', path: '/reports', icon: PieChart, roles: ['Admin', 'Manager', 'Procurement Officer'] },
    ];
    return items.filter(item => item.roles.includes(role));
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex text-slate-900 dark:text-slate-200">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 liquid-glass-menu transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-white/10">
          <span className="text-3xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 dark:from-emerald-400 dark:via-teal-200 dark:to-emerald-600 drop-shadow-[0_0_12px_rgba(52,211,153,0.2)] dark:drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">Venflow</span>
          <button className="lg:hidden text-gray-500 dark:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="px-4 py-6">
          <div className="mb-6 px-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group ${
                    isActive 
                      ? 'liquid-glass-menu-active text-purple-700 dark:text-emerald-400' 
                      : 'text-slate-600 dark:text-slate-300 border border-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-purple-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-purple-500 dark:text-slate-400 dark:group-hover:text-brand-300'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 liquid-glass-menu flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
          <div className="flex items-center">
            <button className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-white/5 transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link to="/profile" className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-xl transition-colors cursor-pointer group">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{user?.user_metadata?.first_name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{role}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-900/50 flex items-center justify-center text-brand-400 font-bold border border-brand-500/50 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all">
                {user?.user_metadata?.first_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>  
            <button onClick={handleSignOut} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-gray-400 dark:hover:text-red-400 rounded-full transition-colors ml-2" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
        </header>

        {/* Main padding and scroll area */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8 transition-colors duration-200">
          <div className="animate-fade-in animate-slide-up h-full">
            <Outlet />
          </div>
        </main>
        <AiCopilot />
      </div>
    </div>
  );
};

export default Layout;
