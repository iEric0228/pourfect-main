'use client';

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  
  const navItems = [
    { name: "Feed", path: "/feed" },
    { name: "AI Scanner", path: "/ingredient-analyzer" },
    { name: "Events", path: "/events" },
    { name: "Create", path: "/create" },
    { name: "Messages", path: "/messages" },
    { name: "Profile", path: "/profile" },
  ];

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Top Bar - Desktop */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo/Brand - Left */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Pourfect
            </div>
          </div>
          
          {/* Navigation - Center/Right */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-white hover:bg-red-500/20"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pt-16 pb-20 md:pb-8">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/90 border-t border-white/5">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive(item.path)
                  ? "text-purple-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
          
          {/* Mobile Logout */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all text-gray-500 hover:text-red-400"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
