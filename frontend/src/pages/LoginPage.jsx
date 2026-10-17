import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export const LoginPage = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isOnline } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!loginId.trim() || !password) {
      setError('অনুগ্রহ করে ইউজার আইডি/ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setLoading(true);
    try {
      await login(loginId.trim(), password, rememberMe);
      navigate('/dashboard/digitization');
    } catch (err) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (email, pass) => {
    setLoginId(email);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner Disclaimer */}
      <div className="max-w-md w-full mx-auto mb-4 px-4 text-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
          <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span>Non-Cloud Offline-First GovTech Land System</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Branding */}
        <div className="text-center">
          <div className="w-12 h-12 bg-[#006A4E] text-white rounded-lg mx-auto flex items-center justify-center shadow-md">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-[#17211D]">
            BhumiLens AI <span className="text-[#F42A41]">+</span> BhumiGuard
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#65736C]">
            বাংলাদেশ ডিজিটাল ভূমি রেকর্ড ও প্রবঞ্চনা প্রতিরোধ সিস্টেম
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-8 px-4 shadow-sm border border-[#E1E8E3] rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isOnline && (
            <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              সতর্কতা: ইন্টারনেট সংযোগ অফলাইন। লোকাল ব্যাকএন্ড সার্ভার (port 8000) সক্রিয় থাকলে লগইন সম্ভব।
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                এমপ্লয়ী আইডি বা ইমেইল (Employee ID / Email)
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#65736C]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="admin@landtech.gov.bd অথবা EMP_ADMIN_01"
                  className="block w-full pl-9 pr-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] placeholder-[#65736C]/60 focus:outline-none focus:ring-1 focus:ring-[#006A4E] focus:border-[#006A4E]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                পাসওয়ার্ড (Password)
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#65736C]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] placeholder-[#65736C]/60 focus:outline-none focus:ring-1 focus:ring-[#006A4E] focus:border-[#006A4E]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#65736C] hover:text-[#17211D]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-[#65736C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 text-[#006A4E] rounded border-[#E1E8E3] focus:ring-[#006A4E]"
                />
                <span className="ml-2">সেশন মনে রাখুন</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-[#006A4E] hover:bg-[#004D3A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006A4E] shadow-sm disabled:opacity-60 transition-colors"
            >
              {loading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন (Sign In)'}
            </button>
          </form>

          {/* Quick Demo Credentials for Hackathon Judges */}
          <div className="mt-6 pt-5 border-t border-[#E1E8E3]">
            <div className="text-[11px] font-semibold text-[#65736C] mb-2 uppercase tracking-wide">
              হ্যাকথন ডেমো অ্যাকাউন্টস (Quick Demo Fill):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@landtech.gov.bd', 'Admin@LandTech2026!')}
                className="py-1.5 px-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-center text-xs font-semibold text-red-800 transition-colors"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('maker@landtech.gov.bd', 'Maker@LandTech2026!')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-center text-xs font-semibold text-[#006A4E] transition-colors"
              >
                MAKER
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('checker@landtech.gov.bd', 'Checker@LandTech2026!')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-center text-xs font-semibold text-blue-800 transition-colors"
              >
                CHECKER
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/register"
              className="text-xs text-[#006A4E] hover:underline font-medium"
            >
              নতুন অপারেটর অ্যাকাউন্ট নিবন্ধন করতে চান? এখানে ক্লিক করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
