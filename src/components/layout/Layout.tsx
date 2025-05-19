import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const Layout = () => {
  const { t } = useTranslation();
  const { merchant, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/food-items', icon: Package, label: t('nav.foodItems') },
    { to: '/orders', icon: ShoppingBag, label: t('nav.orders') },
    { to: '/profile', icon: User, label: t('nav.profile') },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-16 items-center border-b bg-card px-4 lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mr-4 h-8 w-8 text-muted-foreground"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
        <h1 className="text-lg font-semibold">
          {merchant?.businessName || t('nav.merchantDashboard')}
        </h1>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold">
            {merchant?.businessName || t('nav.merchantDashboard')}
          </h1>
        </div>
        <nav className="space-y-1 p-4">{renderNavItems()}</nav>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden" onClick={closeMobileMenu}>
          <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-card">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <h1 className="text-lg font-semibold">{t('nav.menu')}</h1>
              <button onClick={closeMobileMenu}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="space-y-1 p-4">{renderNavItems()}</nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="min-h-screen p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );

  function renderNavItems() {
    return (
      <>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
              ${isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </button>
      </>
    );
  }
};

export default Layout;