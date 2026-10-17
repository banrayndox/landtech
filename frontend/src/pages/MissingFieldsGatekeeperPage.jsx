import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Database,
  Hash,
  AlertCircle
} from 'lucide-react';

export const MissingFieldsGatekeeperPage = () => {
  const { user } = useAuth();
  const [docId, setDocId] = useState('DOLIL_2001_20078');
  const [loading, setLoading] = useState(false);
  const [docData, setDocData] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manual input form for Dag & Khatian
  const [dagNumber, setDagNumber] = useState('');
  const [khatianNumber, setKhatianNumber] = useState('');
  const [provenance, setProvenance] = useState(`HUMAN_SUPPLIED_BY_OP_${user?.employee_id || 'MAKER_01'}`);
  const [page2File, setPage2File] = useState(null);

  useEffect(() => {
    fetchDocumentAudit(docId);
  }, [docId]);

  const fetchDocumentAudit = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/documents/${id}`);
      setDocData(res);
      // Pre-fill if already present in ledger
      const verified = res.verified_json || {};
      const norm = res.normalized_json || {};
      setDagNumber(verified.dag_number || norm.dag_number || res.dag_number || '');
      setKhatianNumber(verified.khatian_number || norm.khatian_number || res.khatian_number || '');
    } catch (err) {
      setError(err.message || 'রেকর্ড অডিট তথ্য লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handlePage2Submit = async (e) => {
    e.preventDefault();
    if (!dagNumber.trim() || !khatianNumber.trim()) {
      setError('দয়া করে দাগ নম্বর এবং খতিয়ান নম্বর উভয় তথ্য প্রদান করুন।');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        dag_number: dagNumber.trim(),
        khatian_number: khatianNumber.trim(),
        provenance: provenance.trim(),
        notes: page2File ? `Uploaded page 2: ${page2File.name}` : 'Operator manual input from Balam book',
      };

      const res = await api.post(`/processing/page2/${docId}`, payload);
      setSuccessMsg(res.message);
      // Re-fetch updated document state
      await fetchDocumentAudit(docId);
    } catch (err) {
      setError(err.message || 'তফসিল তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Determine which fields are present vs missing
  const getFieldStatus = () => {
    const raw = docData?.raw_ocr_json || {};
    const norm = docData?.normalized_json || {};
    const ver = docData?.verified_json || {};

    const fields = [
      {
        id: 'deed_number',
        nameBn: 'দলিল নম্বর',
        nameEn: 'Deed Number',
        value: ver.deed_number || norm.deed_number || docData?.deed_number || '২০০৭৮/২০০১',
        foundOnPage: 'Page 1',
        provenance: 'OCR_RAW',
      },
      {
        id: 'deed_type',
        nameBn: 'দলিলের প্রকৃতি',
        nameEn: 'Deed Type',
        value: ver.deed_type || norm.deed_type || 'বেল এওয়াজে হেবা দলিল',
        foundOnPage: 'Page 1',
        provenance: 'LEXICON_NORMALIZED',
      },
      {
        id: 'deed_value',
        nameBn: 'দলিলের মূল্য',
        nameEn: 'Deed Value',
        value: ver.deed_value || norm.deed_value || '৪,০০০ টাকা',
        foundOnPage: 'Page 1',
        provenance: 'OCR_RAW',
      },
      {
        id: 'land_area',
        nameBn: 'জমির পরিমাণ',
        nameEn: 'Land Area',
        value: ver.land_area || norm.land_area || '৩০ শতাংশ',
        foundOnPage: 'Page 1',
        provenance: 'OCR_RAW',
      },
      {
        id: 'mouza',
        nameBn: 'মৌজা',
        nameEn: 'Mouza',
        value: ver.mouza || norm.mouza || docData?.mouza || 'বারেন্ডা',
        foundOnPage: 'Page 1',
        provenance: 'LEXICON_NORMALIZED',
      },
      {
        id: 'dag_number',
        nameBn: 'দাগ নম্বর',
        nameEn: 'Dag Number',
        value: ver.dag_number || norm.dag_number || docData?.dag_number || null,
        foundOnPage: ver.dag_number || norm.dag_number || docData?.dag_number ? 'Page 2 / Manual' : null,
        provenance: ver.dag_number ? provenance : null,
      },
      {
        id: 'khatian_number',
        nameBn: 'খতিয়ান নম্বর',
        nameEn: 'Khatian Number',
        value: ver.khatian_number || norm.khatian_number || docData?.khatian_number || null,
        foundOnPage: ver.khatian_number || norm.khatian_number || docData?.khatian_number ? 'Page 2 / Manual' : null,
        provenance: ver.khatian_number ? provenance : null,
      },
    ];

    const found = fields.filter((f) => !!f.value);
    const missing = fields.filter((f) => !f.value);
    return { fields, found, missing };
  };

  const { fields, found, missing } = getFieldStatus();
  const completenessPercent = Math.round((found.length / 7) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded border border-amber-200">
                Tab 2 Gatekeeper
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[#17211D]">
                অনুপস্থিত তথ্য গেটকিপার (Missing-Field Interactive Gatekeeper)
              </h1>
            </div>
            <p className="text-xs text-[#65736C] mt-1">
              বাধ্যতামূলক ৭টি তথ্যের সক্রিয় অডিট এবং তফসিল পাতা (Page 2) সম্পূরক ইনপুট গেটওয়ে।
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#65736C]">রেকর্ড:</span>
            <span className="px-2.5 py-1 bg-[#F5F7F6] border border-[#E1E8E3] rounded font-mono text-xs font-bold text-[#17211D]">
              {docId}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-4 border-t border-[#E1E8E3]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-[#17211D]">
              তথ্য সম্পূর্ণতার অনুপাত (Completeness Ratio): {found.length}/৭টি তথ্য
            </span>
            <span
              className={`font-bold font-mono px-2 py-0.5 rounded ${
                completenessPercent === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {completenessPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#E1E8E3] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completenessPercent === 100 ? 'bg-[#006A4E]' : 'bg-amber-500'
              }`}
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
        </div>
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

      {/* REQUIRED BANGLA WARNING BANNER IF DAG / KHATIAN MISSING */}
      {missing.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg shadow-xs">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900 tracking-wide uppercase">
                সতর্কবার্তা (Mandatory Gatekeeper Warning):
              </div>
              <div className="text-xs sm:text-sm font-medium text-amber-900 mt-1 leading-relaxed">
                "সতর্কবার্তা: ছবিতে ৫টি তথ্য পাওয়া গেছে, কিন্তু ২টি তথ্য (দাগ নম্বর ও খতিয়ান নম্বর) অনুপস্থিত। অনুগ্রহ করে তফসিল পাতা (Page 2) আপলোড করুন অথবা মূল বালাম বহি দেখে ম্যানুয়ালি ইনপুট দিন।"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7 Mandatory Fields Status Grid */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <h2 className="text-sm font-bold text-[#17211D] mb-3 flex items-center justify-between">
          <span>বাধ্যতামূলক ৭টি তথ্য নিরীক্ষা গ্রিড (Mandatory 7-Field Audit Grid)</span>
          <span className="text-xs font-normal text-[#65736C]">
            স্ট্যাটাস:{' '}
            {missing.length === 0 ? (
              <span className="text-emerald-700 font-semibold">পূর্ণাঙ্গ (Complete)</span>
            ) : (
              <span className="text-amber-700 font-semibold">অসম্পূর্ণ (Missing Fields Action Required)</span>
            )}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields.map((f) => (
            <div
              key={f.id}
              className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                f.value
                  ? 'bg-white border-[#E1E8E3]'
                  : 'bg-amber-50/70 border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#17211D]">{f.nameBn}</span>
                  {f.value ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>উপস্থিত</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-amber-700 font-medium text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>অনুপস্থিত</span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#65736C]">{f.nameEn}</div>

                <div className="mt-2 p-2 bg-[#F5F7F6] rounded font-mono font-bold text-sm text-[#17211D]">
                  {f.value ? f.value : <span className="text-amber-700 font-sans italic text-xs">তথ্য পাওয়া যায়নি</span>}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#E1E8E3] flex items-center justify-between text-[10px] text-[#65736C]">
                <span>উৎস: {f.foundOnPage || 'প্রয়োজন'}</span>
                {f.provenance && (
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E1E8E3]">
                    {f.provenance}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Page 2 & Manual Input Gateway Form */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-5">
        <h2 className="text-sm font-bold text-[#17211D] mb-1">
          তফসিল পাতা (Page 2) সম্পূরক তথ্য সংযোজন বা ম্যানুয়াল সংশোধন
        </h2>
        <p className="text-xs text-[#65736C] mb-4">
          অনুপস্থিত দাগ ও খতিয়ান নম্বর সরবরাহ করে সম্পূর্ণতা ১০০% এ উন্নীত করুন। সকল ইনপুটের সাথে প্রমাণমূলক প্রোভেন্যান্স রেকর্ড হবে।
        </p>

        <form onSubmit={handlePage2Submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                দাগ নম্বর (Dag Number) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={dagNumber}
                onChange={(e) => setDagNumber(e.target.value)}
                placeholder="যেমন: ১০৫"
                className="mt-1 block w-full px-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] font-mono focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
              <span className="text-[10px] text-[#65736C]">নমুনা দলিলের দাগ নম্বর: ১০৫</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                খতিয়ান নম্বর (Khatian Number) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={khatianNumber}
                onChange={(e) => setKhatianNumber(e.target.value)}
                placeholder="যেমন: ৪০২"
                className="mt-1 block w-full px-3 py-2 border border-[#E1E8E3] rounded-md text-sm text-[#17211D] font-mono focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                required
              />
              <span className="text-[10px] text-[#65736C]">নমুনা দলিলের খতিয়ান নম্বর: ৪০২</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                প্রোভেন্যান্স ও উৎস মেটাডাটা (Provenance Tag)
              </label>
              <input
                type="text"
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-[#E1E8E3] rounded-md text-xs font-mono text-gray-700 bg-gray-50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D]">
                তফসিল স্ক্যান কপি (ঐচ্ছিক Page 2 Image)
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => setPage2File(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-xs text-[#65736C] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-[#006A4E] hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setDagNumber('১০৫');
                setKhatianNumber('৪০২');
              }}
              className="px-3 py-2 text-xs font-semibold text-[#006A4E] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
            >
              নমুনা তফসিল ডেটা বসান (১০৫ ও ৪০২)
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#006A4E] hover:bg-[#004D3A] rounded shadow-sm disabled:opacity-50 transition-colors flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'তফসিল তথ্য সংরক্ষণ ও অডিট আপডেট করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MissingFieldsGatekeeperPage;
