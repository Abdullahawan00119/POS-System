import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, PackagePlus, Box, 
  Menu, X, LogOut, Settings, 
  Zap, ChevronRight, 
  Store
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../Config/Firebaseconfig";
import { useDispatch } from "react-redux";
import { logout } from '../../Redux/Slice/AuthSlice';

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Add Product", path: "/dashboard/addproduct", icon: <PackagePlus size={20} /> },
    { name: "Inventory", path: "/dashboard/inventory", icon: <Box size={20} /> },
    { name: "Create Branch", path: "/dashboard/createbranch", icon: <Store size={20}/> },
    { name: "Branches", path: "/dashboard/allbranches", icon: <Store size={20}/> },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
        try {
            await signOut(auth);
            dispatch(logout());
            navigate("/");
        } catch (error) { console.error("Logout failed", error); }
    };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* --- MOBILE OVERLAY --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- SIDEBAR / DRAWER --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/60 
        transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full p-6">
          {/* LOGO AREA */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Admin</h1>
              <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Terminal v2.0</span>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setIsOpen(false)}>
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Main Menu</p>
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 group
                  ${isActive(item.path) 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                </div>
                {isActive(item.path) && <ChevronRight size={16} className="opacity-50" />}
              </Link>
            ))}
          </nav>

          {/* BOTTOM SECTION */}
          <div className="pt-6 border-t border-slate-100 space-y-2">
            <button 
              className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all font-bold text-sm"
              onClick={handleLogout}
              >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* MOBILE HEADER */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200/60 lg:hidden">
            <div className="flex items-center gap-2">
                <Zap size={18} className="text-blue-600" fill="currentColor"/>
                <span className="font-black text-sm tracking-tighter">Terminal</span>
            </div>
            <button 
                onClick={() => setIsOpen(true)}
                className="p-2 bg-slate-50 rounded-xl border border-slate-200"
            >
                <Menu size={20} />
            </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;