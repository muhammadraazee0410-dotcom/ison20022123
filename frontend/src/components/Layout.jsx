import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  FileText, 
  Settings,
  LogOut,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar" data-testid="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <img src="/hsbc-logo.png" alt="HSBC" className="w-10 h-10 object-contain" />
          <div>
            <span className="font-semibold text-lg text-gray-900">HSBC</span>
            <p className="text-xs text-gray-500">MX Transaction Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 h-auto py-3"
                data-testid="user-menu-trigger"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.department}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Internal Use Only</span>
          </div>
          <div className="confidential-badge">
            <FileText className="w-3 h-3" />
            Confidential
          </div>
        </div>
        
        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  );
}
