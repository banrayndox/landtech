import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Calculator,
  Compass,
  Download,
  CheckCircle2,
  AlertCircle,
  Hash,
  FileSpreadsheet,
  FileCode,
  Layers,
  ArrowRight
} from 'lucide-react';

export const SandboxSearchPage = () => {
  const { user } = useAuth();

  // Tab 4 State: Section A - Confusion Matrix Tester
  const [confusionInput, setConfusionInput] = useState('গাজীপুর মদর');
  const [confusionResult, setConfusionResult] = useState(null);
  const [confusionAccepted, setConfusionAccepted] = useState(null);
  const [confLoading, setConfLoading] = useState(false);

  // Section B - 16-Ana Share Calculator
  const [ana, setAna] = useState(4);
  const [gonda, setGonda] = useState(10);
  const [kora, setKora] = useState(2);
  const [kranti, setKranti] = useState(0);
  const [til, setTil] = useState(0);
  const [anaResult, setAnaResult] = useState(null);
  const [anaLoading, setAnaLoading] = useState(false);

  // Section C - Registry Search & Exports
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [thanaFilter, setThanaFilter] = useState('');
  const [mouzaFilter, setMouzaFilter] = useState('');
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    // Run initial confusion matrix test with spec example
    handleTestConfusion();
    // Run initial 16-Ana calculation with spec example
    handleCalculateAna();
    // Fetch initial registry records
    handleSearchRecords();
  }, []);

  const handleTestConfusion = async () => {
    if (!confusionInput.trim()) return;
    setConfLoading(true);
    setConfusionAccepted(null);
    try {
      const res = await api.post('/sandbox/confusion-matrix', {
        input_text: confusionInput.trim(),
      });
      setConfusionResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setConfLoading(false);
    }
  };

  const handleCalculateAna = async () => {
    setAnaLoading(true);
    try {
      const res = await api.post('/sandbox/ana-calculator', {
        ana: parseFloat(ana) || 0,
        gonda: parseFloat(gonda) || 0,
        kora: parseFloat(kora) || 0,
        kranti: parseFloat(kranti) || 0,
        til: parseFloat(til) || 0,
      });
      setAnaResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnaLoading(false);
    }
  };

  const handleSearchRecords = async () => {
    setSearchLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (districtFilter.trim()) params.district = districtFilter.trim();
      if (thanaFilter.trim()) params.thana = thanaFilter.trim();
      if (mouzaFilter.trim()) params.mouza = mouzaFilter.trim();

      const res = await api.get('/search/records', { params });
      setRecords(res.records || []);
      setTotalRecords(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleExportJson = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('query', searchQuery.trim());
    if (districtFilter.trim()) params.append('district', districtFilter.trim());
    window.open(`/api/exports/json?${params.toString()}`, '_blank');
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('query', searchQuery.trim());
    if (districtFilter.trim()) params.append('district', districtFilter.trim());
    window.open(`/api/exports/csv?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded border border-blue-200">
            Tab 4 Sandbox
          </span>
          <h1 className="text-base sm:text-lg font-bold text-[#17211D]">
            বৈজ্ঞানিক স্যান্ডবক্স ও বালাম রেজিস্ট্রি সার্চ (Scientific Sandbox & Registry)
          </h1>
        </div>
        <p className="text-xs text-[#65736C] mt-1">
          ১৩টি বাংলা কনফিউশন গ্রুপ টেস্টার, ১৬-আনা শেয়ার ক্যালকুলেটর ও অনুমোদিত বালাম অনুসন্ধান।
        </p>
      </div>

      {/* Row: Confusion Matrix + 16-Ana Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Bangla Confusion-Matrix Tester */}
        <div className="bg-white border border-[#E1E8E3] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-[#E1E8E3]">
              <Compass className="w-4 h-4 text-[#006A4E]" />
              <h2 className="text-sm font-bold text-[#17211D]">
                বাংলা কনফিউশন ম্যাট্রিক্স টেস্টার (Bangla Confusion Matrix)
              </h2>
            </div>
            <p className="text-xs text-[#65736C] mt-2">
              ওজনকৃত লেভেনস্টাইন দূরত্বের মাধ্যমে বিভ্রান্তিকর বাংলা হরফ (যেমন: ম/স, ব/র/ক, ণ/ন) সংশোধন।
            </p>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-[#17211D]">
                ইনপুট টেক্সট (পরীক্ষার জন্য 'গাজীপুর মদর' লিখুন):
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  value={confusionInput}
                  onChange={(e) => setConfusionInput(e.target.value)}
                  placeholder="গাজীপুর মদর"
                  className="flex-1 px-3 py-1.5 border border-[#E1E8E3] rounded text-xs text-[#17211D] focus:ring-1 focus:ring-[#006A4E]"
                />
                <button
                  type="button"
                  onClick={handleTestConfusion}
                  disabled={confLoading}
                  className="px-3 py-1.5 bg-[#006A4E] text-white rounded text-xs font-semibold hover:bg-[#004D3A] transition-colors"
                >
                  পরীক্ষা করুন
                </button>
              </div>
            </div>

            {confusionResult && (
              <div className="mt-4 p-3 bg-[#F5F7F6] rounded border border-[#E1E8E3] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#65736C]">মূল ইনপুট (Raw Input):</span>
                  <span className="font-mono font-bold text-[#17211D]">
                    {confusionResult.input_text}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#65736C]">প্রস্তাবিত সংশোধন (Suggestion):</span>
                  <span className="font-bold text-sm text-[#006A4E] bg-white px-2 py-0.5 rounded border border-[#006A4E]/30">
                    {confusionResult.suggested_correction}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E1E8E3] text-[11px]">
                  <div>
                    <span className="text-[#65736C]">ওজনকৃত দূরত্ব: </span>
                    <span className="font-mono font-semibold text-[#17211D]">
                      {confusionResult.weighted_distance}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#65736C]">কনফিডেন্স: </span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {(confusionResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {confusionResult.confusion_groups_involved?.length > 0 && (
                  <div className="text-[10px] text-[#65736C] pt-1">
                    সংশ্লিষ্ট কনফিউশন গ্রুপ:{' '}
                    {confusionResult.confusion_groups_involved
                      .map((g) => `{${g.join(', ')}}`)
                      .join(' ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {confusionResult && (
            <div className="mt-4 pt-3 border-t border-[#E1E8E3] flex items-center justify-between text-xs">
              <span className="text-[#65736C]">ব্যবহারকারীর সিদ্ধান্ত:</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setConfusionAccepted(false)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    confusionAccepted === false
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  প্রত্যাখ্যান
                </button>
                <button
                  type="button"
                  onClick={() => setConfusionAccepted(true)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    confusionAccepted === true
                      ? 'bg-[#006A4E] text-white'
                      : 'bg-emerald-50 text-[#006A4E] border border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  সাজেশন গ্রহণ করুন
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section B: 16-Ana Share Calculator */}
        <div className="bg-white border border-[#E1E8E3] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-[#E1E8E3]">
              <Calculator className="w-4 h-4 text-[#006A4E]" />
              <h2 className="text-sm font-bold text-[#17211D]">
                ১৬-আনা শেয়ার ক্যালকুলেটর (16-Ana Share Calculator)
              </h2>
            </div>

            <div className="mt-2 p-2 bg-[#F5F7F6] rounded border border-[#E1E8E3] text-[11px] font-mono text-center text-[#17211D]">
              <span className="font-semibold text-[#006A4E]">সূত্র:</span> S_dec = Ana/16 + Gonda/320 + Kora/1280 + Kranti/3840
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#17211D]">আনা (0-16)</label>
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={ana}
                  onChange={(e) => setAna(e.target.value)}
                  className="mt-1 block w-full px-2 py-1 border border-[#E1E8E3] rounded text-center font-mono focus:ring-1 focus:ring-[#006A4E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17211D]">গন্ডা (0-19)</label>
                <input
                  type="number"
                  min="0"
                  max="19"
                  value={gonda}
                  onChange={(e) => setGonda(e.target.value)}
                  className="mt-1 block w-full px-2 py-1 border border-[#E1E8E3] rounded text-center font-mono focus:ring-1 focus:ring-[#006A4E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17211D]">কড়া (0-3)</label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={kora}
                  onChange={(e) => setKora(e.target.value)}
                  className="mt-1 block w-full px-2 py-1 border border-[#E1E8E3] rounded text-center font-mono focus:ring-1 focus:ring-[#006A4E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17211D]">ক্রান্তি (0-2)</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  value={kranti}
                  onChange={(e) => setKranti(e.target.value)}
                  className="mt-1 block w-full px-2 py-1 border border-[#E1E8E3] rounded text-center font-mono focus:ring-1 focus:ring-[#006A4E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#17211D]">তিল (0-19)</label>
                <input
                  type="number"
                  min="0"
                  max="19"
                  value={til}
                  onChange={(e) => setTil(e.target.value)}
                  className="mt-1 block w-full px-2 py-1 border border-[#E1E8E3] rounded text-center font-mono focus:ring-1 focus:ring-[#006A4E]"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCalculateAna}
                disabled={anaLoading}
                className="px-4 py-1.5 bg-[#006A4E] text-white rounded text-xs font-semibold hover:bg-[#004D3A] transition-colors"
              >
                হিসাব করুন (Calculate)
              </button>
            </div>

            {anaResult && (
              <div className="mt-4 p-3 bg-emerald-50 rounded border border-emerald-200 text-center">
                <div className="text-xs text-[#006A4E] font-medium">নির্ধারিত মোট শতক/অংশ (Calculated Share):</div>
                <div className="text-2xl font-bold font-mono text-[#006A4E] mt-1">
                  {anaResult.formatted_percentage}
                </div>
                <div className="text-xs font-mono text-emerald-800 mt-1">
                  দশমিক মান (Decimal): {anaResult.share_decimal}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  নমুনা মান (৪ আনা ১০ গন্ডা ২ কড়া ০ ক্রান্তি) = ২৮.২৮১৩%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section C: Registry Search & Exports */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E1E8E3] gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#17211D]">
              বালাম রেজিস্ট্রি সার্চ ও ডাটা এক্সপোর্ট (Registry Search & Data Export)
            </h2>
            <p className="text-xs text-[#65736C]">
              দলিল নম্বর, দাগ নম্বর, খতিয়ান বা মৌজা দিয়ে অনুমোদিত রেকর্ড অনুসন্ধান করুন।
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-[#F5F7F6] hover:bg-gray-200 text-gray-800 border border-[#E1E8E3] rounded text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>JSON Export</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-[#F5F7F6] hover:bg-gray-200 text-gray-800 border border-[#E1E8E3] rounded text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Export</span>
            </button>
          </div>
        </div>

        {/* Search Controls */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="দলিল নম্বর, দাগ, খতিয়ান বা ডক আইডি লিখুন..."
              className="w-full px-3 py-1.5 border border-[#E1E8E3] rounded text-xs focus:ring-1 focus:ring-[#006A4E]"
            />
          </div>

          <div>
            <input
              type="text"
              value={mouzaFilter}
              onChange={(e) => setMouzaFilter(e.target.value)}
              placeholder="মৌজা (যেমন: বারেন্ডা)"
              className="w-full px-3 py-1.5 border border-[#E1E8E3] rounded text-xs focus:ring-1 focus:ring-[#006A4E]"
            />
          </div>

          <div>
            <button
              onClick={handleSearchRecords}
              disabled={searchLoading}
              className="w-full py-1.5 bg-[#006A4E] text-white rounded text-xs font-semibold hover:bg-[#004D3A] transition-colors flex items-center justify-center space-x-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>অনুসন্ধান করুন</span>
            </button>
          </div>
        </div>

        {/* Search Results Table */}
        <div className="mt-4 overflow-x-auto">
          {records.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#65736C]">
              কোনো রেকর্ড খুঁজে পাওয়া যায়নি।
            </div>
          ) : (
            <table className="min-w-full divide-y divide-[#E1E8E3] text-left text-xs">
              <thead className="bg-[#F5F7F6] text-[#17211D] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">ডকুমেন্ট আইডি</th>
                  <th className="py-2.5 px-3">দলিলের নম্বর</th>
                  <th className="py-2.5 px-3">মৌজা ও থানা</th>
                  <th className="py-2.5 px-3">দাগ ও খতিয়ান</th>
                  <th className="py-2.5 px-3">জমির পরিমাণ</th>
                  <th className="py-2.5 px-3">যাচাই অবস্থা</th>
                  <th className="py-2.5 px-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8E3] bg-white">
                {records.map((rec) => (
                  <tr key={rec.doc_id} className="hover:bg-[#F5F7F6]/60">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#17211D]">
                      {rec.doc_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div>{rec.deed_number || '(অনুপস্থিত)'}</div>
                      <div className="text-[10px] text-[#65736C]">{rec.document_type}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div>{rec.mouza || '-'}</div>
                      <div className="text-[10px] text-[#65736C]">{rec.thana}, {rec.district}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      দাগ: {rec.dag_number || '-'} | খতিয়ান: {rec.khatian_number || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono">
                      {rec.land_area ? `${rec.land_area} Dec` : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rec.verification_state === 'CHECKER_APPROVED_LOCKED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.verification_state}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="text-xs text-[#006A4E] hover:underline font-semibold"
                      >
                        বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-5 shadow-lg border border-[#E1E8E3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E3]">
              <h3 className="text-sm font-bold text-[#17211D]">
                রেকর্ড বিস্তারিত: {selectedRecord.doc_id}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-[#65736C]">দলিল নম্বর:</span>
                  <div className="font-semibold text-sm">{selectedRecord.deed_number || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-[#65736C]">দলিলের প্রকৃতি:</span>
                  <div className="font-semibold">{selectedRecord.document_type || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-[#65736C]">দাগ ও খতিয়ান:</span>
                  <div className="font-mono font-semibold">দাগ: {selectedRecord.dag_number || '-'} | খতিয়ান: {selectedRecord.khatian_number || '-'}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-[#65736C]">জমির পরিমাণ ও মূল্য:</span>
                  <div className="font-semibold">{selectedRecord.land_area} শতাংশ | {selectedRecord.stated_value} টাকা</div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#65736C]">সর্বশেষ অডিট হ্যাশ:</label>
                <div className="font-mono bg-emerald-50 text-[#006A4E] p-2 rounded break-all border border-emerald-200">
                  {selectedRecord.latest_audit_hash || '0000000000000000000000000000000000000000000000000000000000000000'}
                </div>
              </div>

              <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-800">
                {selectedRecord.legal_disclaimer}
              </div>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 bg-[#006A4E] text-white text-xs font-semibold rounded"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxSearchPage;
