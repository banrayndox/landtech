import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileText, LogOut, Wifi, WifiOff, User } from 'lucide-react';

export const Topbar = ({ pageTitle = 'ড্যাশবোর্ড (Dashboard)' }) => {
  const { user, logout, isOnline } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-[#F42A41]/10 text-[#F42A41] border-[#F42A41]/30';
      case 'CHECKER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MAKER':
      default:
        return 'bg-[#006A4E]/10 text-[#006A4E] border-[#006A4E]/30';
    }
  };

  return (
    <header className="bg-white border-b border-[#E1E8E3] sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Left branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-[#006A4E] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#17211D] text-base tracking-tight">
                BhumiLens AI <span className="text-[#006A4E]">+</span> BhumiGuard
              </span>
              <span className="hidden sm:inline-block bg-[#006A4E]/10 text-[#006A4E] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#006A4E]/20">
                LandTech 2026
              </span>
            </div>
            <p className="text-[11px] text-[#65736C] hidden sm:block">
              Bangla Land Record Digitization & Fraud Prevention
            </p>
          </div>
        </div>

        {/* Center / Page Title */}
        <div className="hidden lg:block text-sm font-semibold text-[#17211D]">
          {pageTitle}
        </div>

        {/* Right user & status controls */}
        <div className="flex items-center space-x-3">
          {/* Online/Offline status pill */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={isOnline ? 'Online mode active' : 'Offline mode active'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* User Profile Pill */}
          {user && (
            <div className="flex items-center space-x-2 pl-2 border-l border-[#E1E8E3]">
              <div className="w-8 h-8 rounded-full bg-[#F5F7F6] border border-[#E1E8E3] flex items-center justify-center text-[#006A4E]">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-medium text-[#17211D] leading-tight">
                  {user.full_name}
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                  <span className="text-[10px] text-[#65736C]">
                    ID: {user.employee_id}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                className="p-1.5 rounded-md text-[#65736C] hover:text-[#F42A41] hover:bg-[#F42A41]/10 transition-colors"
                title="লগআউট (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
