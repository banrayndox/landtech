import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react';

export const AdminPanelPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, hRes] = await Promise.all([
        api.get('/users/'),
        api.get('/health/'),
      ]);
      setUsers(uRes);
      setHealth(hRes);
    } catch (err) {
      setError(err.message || 'অ্যাডমিন তথ্য লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.put(`/users/${userId}/status`, { status: newStatus });
      setSuccessMsg(`ব্যবহারকারীর স্ট্যাটাস সফলভাবে '${newStatus}' এ পরিবর্তন করা হয়েছে।`);
      await fetchAdminData();
    } catch (err) {
      setError(err.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setSuccessMsg(`ব্যবহারকারীর ভূমিকা সফলভাবে '${newRole}' এ পরিবর্তন করা হয়েছে।`);
      await fetchAdminData();
    } catch (err) {
      setError(err.message || 'ভূমিকা আপডেট ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded border border-red-200">
              Admin Control
            </span>
            <h1 className="text-base sm:text-lg font-bold text-[#17211D]">
              ইউজার প্রশাসন ও সিস্টেম স্বাস্থ্য ড্যাশবোর্ড (Users & Diagnostics)
            </h1>
          </div>
          <p className="text-xs text-[#65736C] mt-1">
            মঙ্গোডিবি ইউজার অনুমোদন, রোল অ্যাসাইনমেন্ট ও লোকাল এআই/ডাটাবেজ সিস্টেম ডায়াগনস্টিকস।
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="px-3 py-1.5 bg-[#F5F7F6] hover:bg-gray-200 text-[#17211D] border border-[#E1E8E3] rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#006A4E]" />
          <span>রিফ্রেশ করুন</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* System Health Diagnostics Grid */}
      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MongoDB */}
          <div className="bg-white border border-[#E1E8E3] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17211D]">MongoDB Auth DB</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  health.database_mongodb?.status === 'UP'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {health.database_mongodb?.status}
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[#17211D] mt-2">
              v{health.database_mongodb?.version || '7.0'}
            </div>
            <div className="text-[10px] text-[#65736C] mt-1">
              ডাটাবেজ: {health.database_mongodb?.database}
            </div>
          </div>

          {/* SQLite Audit */}
          <div className="bg-white border border-[#E1E8E3] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17211D]">SQLite Audit Ledger</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  health.database_sqlite?.status === 'UP'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {health.database_sqlite?.status}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-[#17211D] mt-2 truncate" title={health.database_sqlite?.path}>
              bhumilens_gov_records.db
            </div>
            <div className="text-[10px] text-[#65736C] mt-1">
              আকার: {(health.database_sqlite?.size_bytes / 1024).toFixed(1)} KB | SHA-256 চেইন সক্রিয়
            </div>
          </div>

          {/* OCR Engines */}
          <div className="bg-white border border-[#E1E8E3] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17211D]">OCR ইঞ্জিনসমূহ</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {health.ocr_engines?.primary_active_engine?.toUpperCase()}
              </span>
            </div>
            <div className="text-xs font-semibold text-gray-800 mt-2">
              RapidOCR: {health.ocr_engines?.rapidocr?.available ? 'সক্রিয় (Active)' : 'অনুপস্থিত'}
            </div>
            <div className="text-[10px] text-[#65736C] mt-1">
              Tesseract: {health.ocr_engines?.tesseract?.available ? 'ইনস্টলড' : 'PATH-এ অনুপস্থিত (Configurable)'}
            </div>
          </div>

          {/* Process Diagnostics */}
          <div className="bg-white border border-[#E1E8E3] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17211D]">র‍্যাম ও পারফরম্যান্স</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                ACTIVE
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[#006A4E] mt-2">
              {health.system_metrics?.python_process_ram_mb} MB
            </div>
            <div className="text-[10px] text-[#65736C] mt-1">
              CPU: {health.system_metrics?.cpu_percent}% | No External Cloud AI
            </div>
          </div>
        </div>
      )}

      {/* User Accounts Management Table */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <h2 className="text-sm font-bold text-[#17211D] mb-3">
          ভূমি অফিস কর্মী ও অপারেটর তালিকা (MongoDB User Accounts)
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E1E8E3] text-left text-xs">
            <thead className="bg-[#F5F7F6] text-[#17211D] font-semibold">
              <tr>
                <th className="py-2.5 px-3">নাম ও আইডি</th>
                <th className="py-2.5 px-3">ইমেইল</th>
                <th className="py-2.5 px-3">ভূমিকা (Role)</th>
                <th className="py-2.5 px-3">অবস্থা (Status)</th>
                <th className="py-2.5 px-3">নিবন্ধন তারিখ</th>
                <th className="py-2.5 px-3">অ্যাডমিন অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E8E3] bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F5F7F6]/60">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[#17211D]">{u.full_name}</div>
                    <div className="text-[10px] font-mono text-[#65736C]">{u.employee_id}</div>
                  </td>
                  <td className="py-2.5 px-3 text-[#65736C]">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      disabled={loading || u.employee_id === user?.employee_id}
                      className="px-2 py-1 text-xs border border-[#E1E8E3] rounded bg-white font-semibold text-[#17211D] focus:ring-1 focus:ring-[#006A4E]"
                    >
                      <option value="MAKER">MAKER</option>
                      <option value="CHECKER">CHECKER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#65736C] text-[10px]">
                    {new Date(u.created_at).toLocaleDateString('bn-BD')}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-1.5">
                      {u.status === 'PENDING_APPROVAL' ? (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>অনুমোদন করুন</span>
                        </button>
                      ) : u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'DEACTIVATED')}
                          disabled={u.employee_id === user?.employee_id}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#F42A41] border border-red-200 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors disabled:opacity-50"
                        >
                          <UserX className="w-3 h-3" />
                          <span>নিষ্ক্রিয়</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-[11px] font-semibold transition-colors"
                        >
                          পুনরায় সক্রিয়
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;
