import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import DisclaimerBanner from './DisclaimerBanner';
import { Menu } from 'lucide-react';

export const AppLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.includes('/digitization')) return 'P1 — Digitization & Maker–Checker Studio';
    if (pathname.includes('/missing-fields')) return 'Tab 2 — 7-Field Interactive Gatekeeper';
    if (pathname.includes('/fraud-simulator')) return 'Tab 3 — P3 UTXO Double-Selling & Fraud Simulator';
    if (pathname.includes('/sandbox')) return 'Tab 4 — Scientific Sandbox & Registry Search';
    if (pathname.includes('/admin')) return 'Admin — User Accounts & System Health';
    return 'BhumiLens AI + BhumiGuard';
  };

  return (
    <div className="min-h-screen bg-[#F5F7F6] flex flex-col">
      {/* Required Legal Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Top Application Bar */}
      <Topbar pageTitle={getPageTitle(location.pathname)} />

      {/* Mobile nav toggle bar */}
      <div className="md:hidden bg-white border-b border-[#E1E8E3] px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center space-x-2 text-xs font-semibold text-[#006A4E] py-1 px-2 rounded border border-[#006A4E]/30 bg-[#006A4E]/5"
        >
          <Menu className="w-4 h-4" />
          <span>মেনু ও মডিউলসমূহ (Modules)</span>
        </button>
        <span className="text-xs text-[#65736C] font-medium">
          {getPageTitle(location.pathname).split('—')[0]}
        </span>
      </div>

      {/* Shell Body: Sidebar + Main Area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
