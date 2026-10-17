import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck,
  AlertTriangle,
  ShieldCheck,
  Search,
  Users,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    {
      to: '/dashboard/digitization',
      labelBn: 'ডিজিটাইজেশন ও মেকার-চেকার',
      labelEn: 'P1 Digitization & Studio',
      icon: FileCheck,
      badge: 'Tab 1',
    },
    {
      to: '/dashboard/missing-fields',
      labelBn: 'অনুপস্থিত তথ্য গেটকিপার',
      labelEn: '7-Field Gatekeeper',
      icon: AlertTriangle,
      badge: 'Tab 2',
    },
    {
      to: '/dashboard/fraud-simulator',
      labelBn: 'দ্বৈত বিক্রয় রোধ ও সিমুলেটর',
      labelEn: 'P3 UTXO Fraud Simulator',
      icon: ShieldCheck,
      badge: 'Tab 3',
    },
    {
      to: '/dashboard/sandbox',
      labelBn: 'স্যান্ডবক্স ও বালাম সার্চ',
      labelEn: 'Sandbox & Registry Search',
      icon: Search,
      badge: 'Tab 4',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E1E8E3] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#65736C] uppercase">
            প্রধান মডিউলসমূহ (Core Modules)
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#006A4E] text-white shadow-sm'
                    : 'text-[#17211D] hover:bg-[#F5F7F6] hover:text-[#006A4E]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <item.icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-[#65736C]'
                      }`}
                    />
                    <div className="text-left">
                      <div className="font-semibold leading-snug">{item.labelBn}</div>
                      <div
                        className={`text-[10px] ${
                          isActive ? 'text-white/80' : 'text-[#65736C]'
                        }`}
                      >
                        {item.labelEn}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E1E8E3] text-[#65736C]'
                    }`}
                  >
                    {item.badge}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Admin section */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-[#E1E8E3]">
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#65736C] uppercase">
                প্রশাসন ও স্বাস্থ্য (Administration)
              </div>
              <NavLink
                to="/dashboard/admin"
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#004D3A] text-white shadow-sm'
                      : 'text-[#17211D] hover:bg-[#F5F7F6] hover:text-[#004D3A]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Users
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-[#65736C]'
                        }`}
                      />
                      <div className="text-left">
                        <div className="font-semibold leading-snug">ইউজার ও সিস্টেম স্বাস্থ্য</div>
                        <div
                          className={`text-[10px] ${
                            isActive ? 'text-white/80' : 'text-[#65736C]'
                          }`}
                        >
                          Users & System Health
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      Admin
                    </span>
                  </>
                )}
              </NavLink>
            </div>
          )}
        </div>

        {/* Bottom system status card */}
        <div className="p-3 border-t border-[#E1E8E3] bg-[#F5F7F6]">
          <div className="text-[11px] font-medium text-[#17211D] flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-[#006A4E]" />
              <span>Offline Ledger</span>
            </span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              SQLite + SHA256
            </span>
          </div>
          <div className="text-[10px] text-[#65736C] mt-1">
            Local Auth: MongoDB | No Cloud AI
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
