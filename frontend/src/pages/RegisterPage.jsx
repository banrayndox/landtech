import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, Lock, User, Mail, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    password: '',
    confirmPassword: '',
    requestedRole: 'MAKER',
    acceptTerms: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setError('পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    if (formData.password.length < 6) {
      setError('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (!formData.acceptTerms) {
      setError('অফিসিয়াল ব্যবহারের শর্তাবলী গ্রহণ করতে হবে।');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        full_name: formData.fullName.trim(),
        employee_id: formData.employeeId.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
        requested_role: formData.requestedRole,
      });

      setSuccessMsg(
        res.message ||
          'নিবন্ধন সফল হয়েছে! আপনার অ্যাকাউন্টটি প্রশাসনিক অনুমোদনের অপেক্ষায় রয়েছে (Pending Approval)।'
      );
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      setError(err.message || 'নিবন্ধন প্রক্রিয়া ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F6] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Branding */}
        <div className="text-center">
          <div className="w-12 h-12 bg-[#006A4E] text-white rounded-lg mx-auto flex items-center justify-center shadow-md">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-[#17211D]">
            ভূমি অফিস অপারেটর নিবন্ধন
          </h2>
          <p className="mt-1 text-xs text-[#65736C]">
            Land Office Operator Account Registration Policy
          </p>
        </div>

        <div className="mt-6 bg-white py-8 px-4 shadow-sm border border-[#E1E8E3] rounded-lg sm:px-10">
          {/* Security Policy Notice */}
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-[#006A4E] mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-semibold text-[#006A4E]">নিরাপত্তা নীতি (Security Policy):</strong>{' '}
              সরকারি বিধি অনুযায়ী স্ব-নিবন্ধিত সকল অ্যাকাউন্ট প্রাথমিক অবস্থায়{' '}
              <span className="font-mono font-semibold">PENDING_APPROVAL</span> অবস্থায় থাকবে। ভূমি অফিসের
              অনুমোদিত অ্যাডমিনিস্ট্রেটর যাচাইকরণের পরই আইডিটি সক্রিয় করা হবে।
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                অপারেটরের পুরো নাম (Full Name)
              </label>
              <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#65736C]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="যেমন: মোঃ কামরুল ইসলাম"
                  className="block w-full pl-9 pr-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] placeholder-[#65736C]/60 focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#17211D]">
                  এমপ্লয়ী আইডি (Employee ID)
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="EMP_12345"
                  className="mt-1 block w-full px-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] placeholder-[#65736C]/60 focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211D]">
                  ইমেইল ঠিকানা (Official Email)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="operator@landtech.gov.bd"
                  className="mt-1 block w-full px-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] placeholder-[#65736C]/60 focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#17211D]">
                  পাসওয়ার্ড (Password)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mt-1 block w-full px-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17211D]">
                  কনফার্ম পাসওয়ার্ড (Confirm)
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mt-1 block w-full px-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                আবেদনকৃত দায়িত্ব (Requested Role Scope)
              </label>
              <select
                name="requestedRole"
                value={formData.requestedRole}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] focus:outline-none focus:ring-1 focus:ring-[#006A4E] bg-white"
              >
                <option value="MAKER">মেকার (Maker — দলিল স্ক্যান ও ডেটা এন্ট্রি)</option>
                <option value="CHECKER">চেকার (Checker — নিরীক্ষা ও অনুমোদন)</option>
              </select>
              <p className="text-[11px] text-[#65736C] mt-1">
                চূড়ান্ত ভূমিকা অ্যাডমিন কর্তৃক নির্ধারিত হবে।
              </p>
            </div>

            <div className="flex items-center text-xs">
              <label className="flex items-center text-[#65736C] cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 text-[#006A4E] rounded border-[#E1E8E3] focus:ring-[#006A4E]"
                />
                <span className="ml-2">
                  আমি নিশ্চিত করছি যে আমি একজন অনুমোদিত সরকারি ভূমি অফিস কর্মী।
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-[#006A4E] hover:bg-[#004D3A] focus:outline-none focus:ring-2 focus:ring-[#006A4E] shadow-sm disabled:opacity-60 transition-colors"
            >
              {loading ? 'প্রক্রিয়াধীন রয়েছে...' : 'নিবন্ধন আবেদন সম্পন্ন করুন'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="text-xs text-[#006A4E] hover:underline font-medium"
            >
              ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন পেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
