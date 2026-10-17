import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  Hash,
  Database,
  ArrowRight,
  TrendingDown,
  Lock,
  Layers
} from 'lucide-react';

export const FraudSimulatorPage = () => {
  const { user } = useAuth();
  const plotKey = 'GZ-SDR-JL14-KH402-DAG105';

  const [quota, setQuota] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Custom Form
  const [sellerName, setSellerName] = useState('মোহাম্মদ রফিকুল ইসলাম');
  const [buyerName, setBuyerName] = useState('');
  const [requestedArea, setRequestedArea] = useState('');
  const [claimedMasterArea, setClaimedMasterArea] = useState('30.0');

  useEffect(() => {
    fetchPlotData();
  }, []);

  const fetchPlotData = async () => {
    setLoading(true);
    setError('');
    try {
      const qRes = await api.get(`/fraud/plot-quota/${plotKey}`);
      setQuota(qRes);
      const hRes = await api.get(`/fraud/history/${plotKey}`);
      setHistory(hRes);
    } catch (err) {
      setError(err.message || 'প্লট কোটা তথ্য লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSimulator = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setTxResult(null);
    try {
      await api.post('/fraud/reset-demo');
      await fetchPlotData();
      setSuccessMsg('সিমুলেটর সফলভাবে রিসেট করা হয়েছে। অবশিষ্ট কোটা ৩০.০ শতক।');
    } catch (err) {
      setError(err.message || 'রিসেট ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBenchmarkTx = async (txCode) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/fraud/demo-tx/${txCode}`);
      setTxResult(res);
      await fetchPlotData();
    } catch (err) {
      setError(err.message || 'ট্রানজ্যাকশন সিমুলেশন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTxSubmit = async (e) => {
    e.preventDefault();
    if (!sellerName.trim() || !buyerName.trim() || !requestedArea) {
      setError('দয়া করে সকল প্রয়োজনীয় তথ্য পূরণ করুন।');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/fraud/verify-sale', {
        plot_key: plotKey,
        seller_name: sellerName.trim(),
        buyer_name: buyerName.trim(),
        requested_area: parseFloat(requestedArea),
        claimed_master_area: parseFloat(claimedMasterArea),
      });
      setTxResult(res);
      await fetchPlotData();
      setBuyerName('');
      setRequestedArea('');
    } catch (err) {
      setError(err.message || 'লেনদেন পরীক্ষা ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const benchmarkButtons = [
    {
      code: 'TX_01',
      label: 'TX_01: বৈধ আংশিক বিক্রয় (১৮ শতাংশ)',
      area: '18.0 Dec',
      expected: 'ALLOWED',
      desc: 'মালিক কর্তৃক প্রথম বৈধ বিক্রয়। অবশিষ্ট কোটা হবে ১২.০ শতাংশ।',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
    },
    {
      code: 'TX_02',
      label: 'TX_02: দ্বৈত বিক্রয় ওভারসেল চেষ্টা (২০ শতাংশ)',
      area: '20.0 Dec',
      expected: 'BLOCKED',
      desc: '১২ শতক থাকা অবস্থায় ২০ শতক বিক্রয়ের অপচেষ্টা। লক হবে।',
      color: 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100',
    },
    {
      code: 'TX_03',
      label: 'TX_03: চেইন ব্রেক প্রবঞ্চনা (৫ শতাংশ)',
      area: '5.0 Dec',
      expected: 'BLOCKED',
      desc: 'অননুমোদিত বিক্রেতা (আব্দুল মান্নান) মালিকানা চেইন ব্রেক।',
      color: 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
    },
    {
      code: 'TX_04',
      label: 'TX_04: জাল খতিয়ান মোট জমি প্রবঞ্চনা (১০ শতাংশ)',
      area: '10.0 Dec',
      expected: 'BLOCKED',
      desc: 'দাবি করা খতিয়ান ৪৫ শতাংশ (মূল বালামে ৩০ শতাংশ)।',
      color: 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100',
    },
    {
      code: 'TX_05',
      label: 'TX_05: অবশিষ্ট কোটা বৈধ বিক্রয় (১২ শতাংশ)',
      area: '12.0 Dec',
      expected: 'ALLOWED',
      desc: 'অবশিষ্ট ১২ শতাংশের চূড়ান্ত বৈধ বিক্রয়। কোটা শূন্য হবে।',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded border border-emerald-200">
              P3 UTXO Guard
            </span>
            <h1 className="text-base sm:text-lg font-bold text-[#17211D]">
              দ্বৈত বিক্রয় রোধ ও জমি কোটা সিমুলেটর (UTXO Fraud Simulator)
            </h1>
          </div>
          <p className="text-xs text-[#65736C] mt-1">
            মালিকানা চেইন যাচাই, জাল খতিয়ান প্রতিরোধ ও পারমাণবিক (Atomic) রেজিস্ট্রেশন কোটা সুরক্ষা।
          </p>
        </div>

        <button
          onClick={handleResetSimulator}
          disabled={loading}
          className="px-3 py-1.5 bg-[#F5F7F6] hover:bg-gray-200 text-[#17211D] border border-[#E1E8E3] rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start md:self-auto disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#006A4E]" />
          <span>সিমুলেটর রিসেট করুন (Reset Quota)</span>
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

      {/* Authoritative Master Plot Quota Card */}
      {quota && (
        <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E1E8E3] gap-2">
            <div>
              <div className="text-xs font-bold text-[#17211D] flex items-center space-x-2">
                <span>মাস্টার প্লট কি (Unique Plot Key):</span>
                <span className="font-mono bg-[#006A4E]/10 text-[#006A4E] px-2 py-0.5 rounded text-xs">
                  {quota.plot_key}
                </span>
              </div>
              <div className="text-[11px] text-[#65736C] mt-0.5">
                জেলা: {quota.district} | থানা: {quota.thana} | মৌজা: {quota.mouza} (জেএল: {quota.jl_no}) | খতিয়ান: {quota.khatian_no} | দাগ: {quota.dag_no}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#65736C]">রেকর্ডীয় মালিক:</span>
              <div className="text-xs font-bold text-[#17211D]">{quota.trusted_owner}</div>
              <div className="text-[10px] text-[#65736C] font-mono">NID: {quota.trusted_owner_nid}</div>
            </div>
          </div>

          {/* Formula Display */}
          <div className="mt-3 p-2 bg-[#F5F7F6] rounded border border-[#E1E8E3] text-xs font-mono text-center text-[#17211D]">
            <span className="font-semibold text-[#006A4E]">সূত্র (Formula):</span>{' '}
            Available Quota = Total Master Area ({quota.total_master_area} Dec) - Mutated Sold Area ({quota.mutated_sold_area} Dec) - Pending Locks ({quota.pending_locked_area} Dec)
          </div>

          {/* Area Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-[11px] font-medium text-[#65736C]">মোট মূল জমি (Total Master Area)</div>
              <div className="text-lg font-bold font-mono text-[#17211D] mt-1">
                {quota.total_master_area.toFixed(1)} <span className="text-xs font-normal">শতাংশ</span>
              </div>
              <div className="text-[10px] text-[#65736C] mt-0.5">সরকারি চূড়ান্ত বালাম রেকর্ড</div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
              <div className="text-[11px] font-medium text-amber-800">বিক্রিত/নামজারি জমি (Mutated Sold)</div>
              <div className="text-lg font-bold font-mono text-amber-900 mt-1">
                {quota.mutated_sold_area.toFixed(1)} <span className="text-xs font-normal">শতাংশ</span>
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                ব্যবহার: {quota.utilization_percentage}% সম্পন্ন
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300">
              <div className="text-[11px] font-medium text-[#006A4E]">অবশিষ্ট বিক্রয়যোগ্য কোটা (Available)</div>
              <div className="text-xl font-bold font-mono text-[#006A4E] mt-1">
                {quota.available_quota.toFixed(1)} <span className="text-xs font-normal">শতাংশ</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                পরবর্তী দলিলের জন্য সুরক্ষিত কোটা
              </div>
            </div>
          </div>

          {/* Visual Gauge Bar */}
          <div className="mt-4 pt-3 border-t border-[#E1E8E3]">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-[#17211D]">কোটা ব্যবহারের অগ্রগতি (Quota Utilization)</span>
              <span className="font-mono text-xs font-bold text-[#65736C]">
                {quota.mutated_sold_area} / {quota.total_master_area} শতাংশ
              </span>
            </div>
            <div className="w-full h-3 bg-emerald-100 rounded-full overflow-hidden flex">
              <div
                className="bg-amber-600 h-full transition-all duration-300"
                style={{ width: `${(quota.mutated_sold_area / quota.total_master_area) * 100}%` }}
                title="Sold Area"
              />
              <div
                className="bg-[#006A4E] h-full transition-all duration-300"
                style={{ width: `${(quota.available_quota / quota.total_master_area) * 100}%` }}
                title="Available Quota"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#65736C] mt-1 font-mono">
              <span>০.০ শতক</span>
              <span className="text-amber-800 font-semibold">বিক্রিত: {quota.mutated_sold_area} Dec</span>
              <span className="text-[#006A4E] font-semibold">অবশিষ্ট: {quota.available_quota} Dec</span>
              <span>{quota.total_master_area} শতক</span>
            </div>
          </div>
        </div>
      )}

      {/* 5 One-Click Benchmark Simulator Buttons */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#17211D]">
              ৫টি পরীক্ষিত বেঞ্চমার্ক সিমুলেশন ট্রানজ্যাকশন (5 Benchmark Simulator Cases)
            </h2>
            <p className="text-xs text-[#65736C]">
              এক-ক্লিকে ৩টি প্রবঞ্চনা সনাক্তকরণ ও ২টি বৈধ আংশিক বিক্রয় পরীক্ষা করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {benchmarkButtons.map((btn) => (
            <button
              key={btn.code}
              type="button"
              onClick={() => handleRunBenchmarkTx(btn.code)}
              disabled={loading}
              className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${btn.color} disabled:opacity-50`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs">{btn.code}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      btn.expected === 'ALLOWED'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-red-200 text-red-900'
                    }`}
                  >
                    লক্ষ্য: {btn.expected}
                  </span>
                </div>
                <div className="font-semibold text-xs mt-1 leading-snug">{btn.label}</div>
                <div className="text-[11px] opacity-80 mt-1">{btn.desc}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-semibold">
                <span>পরিমাণ: {btn.area}</span>
                <span className="flex items-center space-x-1">
                  <span>রান করুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Immediate Transaction Decision Banner */}
      {txResult && (
        <div
          className={`p-5 rounded-lg border shadow-xs ${
            txResult.decision === 'ALLOWED'
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {txResult.decision === 'ALLOWED' ? (
                <ShieldCheck className="w-7 h-7 text-[#006A4E] mt-0.5 flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-[#F42A41] mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      txResult.decision === 'ALLOWED'
                        ? 'bg-[#006A4E] text-white'
                        : 'bg-[#F42A41] text-white'
                    }`}
                  >
                    সিদ্ধান্ত: {txResult.decision}
                  </span>
                  <span className="font-mono text-xs text-[#65736C]">
                    কোড: {txResult.reason_code}
                  </span>
                  {txResult.tx_code && (
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border">
                      {txResult.tx_code}
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-[#17211D] mt-2">
                  {txResult.reason_message_bn}
                </div>

                {/* 3 Core Checks Matrix */}
                {txResult.checks && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="bg-white p-2 rounded border flex items-center justify-between">
                      <span>১. চেইন ব্রেক চেক:</span>
                      <span
                        className={`font-bold font-mono ${
                          txResult.checks.chain_break === 'PASS' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {txResult.checks.chain_break}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded border flex items-center justify-between">
                      <span>২. জাল খতিয়ান চেক:</span>
                      <span
                        className={`font-bold font-mono ${
                          txResult.checks.forged_khatian === 'PASS' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {txResult.checks.forged_khatian}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded border flex items-center justify-between">
                      <span>৩. UTXO কোটা লক:</span>
                      <span
                        className={`font-bold font-mono ${
                          txResult.checks.utxo_lock === 'PASS' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {txResult.checks.utxo_lock}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-black/10 text-xs font-mono text-[#65736C] flex flex-wrap items-center justify-between gap-2">
                  <span>লেনদেনের পূর্বে কোটা: {txResult.available_quota_before} Dec</span>
                  <span>লেনদেনের পরে কোটা: {txResult.available_quota_after} Dec</span>
                  <span className="text-[10px] text-gray-500 truncate max-w-xs">
                    Hash: {txResult.audit_hash}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Transaction Form */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <h2 className="text-sm font-bold text-[#17211D] mb-1">
          কাস্টম জমি বিক্রয় প্রস্তাব ও যাচাই (Custom Transaction Submission)
        </h2>
        <p className="text-xs text-[#65736C] mb-4">
          যেকোনো ক্রেতা, বিক্রেতা ও জমির পরিমাণের জন্য ব্যাকএন্ডের পারমাণবিক দ্বৈত-বিক্রয় সুরক্ষা যাচাই করুন।
        </p>

        <form onSubmit={handleCustomTxSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                বিক্রেতার নাম (Seller) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="মোহাম্মদ রফিকুল ইসলাম"
                className="mt-1 block w-full px-3 py-1.5 border border-[#E1E8E3] rounded text-xs text-[#17211D] focus:ring-1 focus:ring-[#006A4E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                ক্রেতার নাম (Buyer) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="যেমন: ফারহানা সুলতানা"
                className="mt-1 block w-full px-3 py-1.5 border border-[#E1E8E3] rounded text-xs text-[#17211D] focus:ring-1 focus:ring-[#006A4E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                প্রস্তাবিত জমি (Area in Decimal) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={requestedArea}
                onChange={(e) => setRequestedArea(e.target.value)}
                placeholder="যেমন: ১০.০"
                className="mt-1 block w-full px-3 py-1.5 border border-[#E1E8E3] rounded text-xs font-mono text-[#17211D] focus:ring-1 focus:ring-[#006A4E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                দাবিকৃত মোট খতিয়ান জমি (Claimed Total)
              </label>
              <input
                type="number"
                step="0.1"
                value={claimedMasterArea}
                onChange={(e) => setClaimedMasterArea(e.target.value)}
                placeholder="30.0"
                className="mt-1 block w-full px-3 py-1.5 border border-[#E1E8E3] rounded text-xs font-mono text-[#17211D] focus:ring-1 focus:ring-[#006A4E]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#006A4E] hover:bg-[#004D3A] rounded shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'যাচাই হচ্ছে...' : 'প্রস্তাবিত লেনদেন পরীক্ষা করুন (Verify Transaction)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Immutable Transaction History Ledger */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <h2 className="text-sm font-bold text-[#17211D] mb-1">
          অপরিবর্তনযোগ্য লেনদেন অডিট লেজার (Immutable Transaction History)
        </h2>
        <p className="text-xs text-[#65736C] mb-3">
          প্রতিটি অনুমোদিত বা অবরুদ্ধ লেনদেন SHA-256 ক্রিপ্টোগ্রাফিক হ্যাশ সহ লেজারে সংরক্ষিত রয়েছে।
        </p>

        {history.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#65736C]">
            কোনো সিমুলেশন লেনদেন এখনো সম্পন্ন হয়নি। উপরের বেঞ্চমার্ক বোতামে ক্লিক করুন।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E1E8E3] text-left text-xs">
              <thead className="bg-[#F5F7F6] text-[#17211D] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">ট্রানজ্যাকশন আইডি</th>
                  <th className="py-2.5 px-3">কেস কোড</th>
                  <th className="py-2.5 px-3">বিক্রেতা ও ক্রেতা</th>
                  <th className="py-2.5 px-3">জমির পরিমাণ</th>
                  <th className="py-2.5 px-3">সিদ্ধান্ত</th>
                  <th className="py-2.5 px-3">কারণ কোড</th>
                  <th className="py-2.5 px-3">অবশিষ্ট কোটা</th>
                  <th className="py-2.5 px-3">SHA-256 হ্যাশ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8E3] bg-white">
                {history.map((tx) => (
                  <tr key={tx.tx_id} className="hover:bg-[#F5F7F6]/60 font-mono text-[11px]">
                    <td className="py-2.5 px-3 font-semibold text-[#17211D]">{tx.tx_id}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 border text-gray-800 font-bold">
                        {tx.tx_code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-medium text-[#17211D]">{tx.seller_name}</div>
                      <div className="text-[#65736C] text-[10px]">ক্রেতা: {tx.buyer_name}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold">{tx.requested_area} Dec</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.decision === 'ALLOWED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.decision}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs">{tx.reason_code}</td>
                    <td className="py-2.5 px-3 font-bold text-[#006A4E]">{tx.available_quota_after} Dec</td>
                    <td className="py-2.5 px-3 text-[10px] text-[#65736C] truncate max-w-[130px]" title={tx.audit_hash}>
                      {tx.audit_hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudSimulatorPage;
