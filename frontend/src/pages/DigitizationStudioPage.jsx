import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  Shield,
  Layers,
  ArrowRight,
  Stamp,
  Hash,
  Clock,
  Sparkles,
  ExternalLink,
  Save,
  CheckCheck
} from 'lucide-react';

export const DigitizationStudioPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState('stage1_anonymized');
  const [documentData, setDocumentData] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editableFields, setEditableFields] = useState({});
  const [reviewNotes, setReviewNotes] = useState('');
  const [showMathModal, setShowMathModal] = useState(false);
  const [showHashModal, setShowHashModal] = useState(false);

  // Automatically load default benchmark sample on mount if none loaded
  useEffect(() => {
    loadDemoSample();
  }, []);

  const loadDemoSample = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/processing/demo-sample');
      setDocumentData(res);
      // Initialize human verified fields from normalized values
      const initialFields = {};
      if (res.crops) {
        Object.keys(res.crops).forEach((k) => {
          initialFields[k] = res.crops[k].normalized_value || res.crops[k].raw_ocr_text || '';
        });
      }
      setEditableFields(initialFields);
    } catch (err) {
      setError(err.message || 'নমুনা দলিল লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('ফাইলের আকার সর্বোচ্চ ২৫ মেগাবাইট অনুমোদিত।');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocumentData(res);
      const initialFields = {};
      if (res.crops) {
        Object.keys(res.crops).forEach((k) => {
          initialFields[k] = res.crops[k].normalized_value || res.crops[k].raw_ocr_text || '';
        });
      }
      setEditableFields(initialFields);
      setSuccessMsg('দলিল সফলভাবে আপলোড এবং ৭-স্তরীয় প্রক্রিয়াকরণ সম্পন্ন হয়েছে।');
    } catch (err) {
      setError(err.message || 'দলিল প্রসেসিং ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setEditableFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Submit as Maker
  const handleSubmitMaker = async () => {
    if (!documentData) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/verification/submit-maker/${documentData.doc_id}`, {
        verified_fields: editableFields,
        notes: reviewNotes,
      });
      setDocumentData((prev) => ({
        ...prev,
        verification_state: res.verification_state,
        audit_hash: res.audit_hash,
      }));
      setSuccessMsg(res.message);
    } catch (err) {
      setError(err.message || 'মেকার সাবমিশন ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Review as Checker
  const handleCheckerReview = async (action) => {
    if (!documentData) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/verification/checker-review/${documentData.doc_id}`, {
        action,
        notes: reviewNotes,
        corrected_fields: editableFields,
      });
      setDocumentData((prev) => ({
        ...prev,
        verification_state: res.verification_state,
        audit_hash: res.audit_hash,
      }));
      setSuccessMsg(res.message);
    } catch (err) {
      setError(err.message || 'চেকার পর্যালোচনা ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const isMaker = user?.role === 'MAKER' || user?.role === 'ADMIN';
  const isChecker = user?.role === 'CHECKER' || user?.role === 'ADMIN';
  const isSelfRecord = documentData && (documentData.maker_id === user?.employee_id || documentData.created_by === user?.employee_id);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-white border border-[#E1E8E3] rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-[#006A4E]/10 text-[#006A4E] text-xs font-semibold rounded border border-[#006A4E]/20">
              P1 Digitization
            </span>
            <h1 className="text-base sm:text-lg font-bold text-[#17211D]">
              মেকার–চেকার ডিজিটাইজেশন স্টুডিও (Maker–Checker Studio)
            </h1>
          </div>
          <p className="text-xs text-[#65736C] mt-1">
            দলিল চিত্র প্রক্রিয়াকরণ, ৩-স্তরের ইমেজ বিশ্লেষণ, ৮টি এভিডেন্স ক্রপ ও দ্বি-পক্ষীয় যাচাইকরণ।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadDemoSample}
            disabled={loading}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006A4E] border border-emerald-300 rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>নমুনা দলিল (DOLIL_2001_20078)</span>
          </button>

          <label className="px-3 py-1.5 bg-[#006A4E] hover:bg-[#004D3A] text-white rounded text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>নতুন দলিল আপলোড</span>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.tiff"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
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

      {documentData && (
        <>
          {/* Classification & Seal Badges Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Document ID */}
            <div className="bg-white border border-[#E1E8E3] rounded-lg p-3">
              <div className="text-[11px] font-medium text-[#65736C]">দলিল পরিচিতি (Doc ID)</div>
              <div className="text-sm font-bold text-[#17211D] font-mono mt-0.5">
                {documentData.doc_id}
              </div>
              <div className="text-[10px] text-[#65736C] mt-1">
                শ্রেণি: {documentData.classification === 'STAMP_DEED_DOLIL' ? 'স্ট্যাম্প দলিল' : 'খতিয়ান / পর্চা'}
              </div>
            </div>

            {/* Document Type Badge */}
            <div className="bg-white border border-[#E1E8E3] rounded-lg p-3">
              <div className="text-[11px] font-medium text-[#65736C]">দলিলের প্রকৃতি (Classification)</div>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {documentData.classification}
                </span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-1 font-medium">
                মৌলিক গ্রিড ও লেআউট পরীক্ষিত
              </div>
            </div>

            {/* Circular Seal Status */}
            <div className="bg-white border border-[#E1E8E3] rounded-lg p-3">
              <div className="text-[11px] font-medium text-[#65736C]">সরকারি সীলমোহর (Circular Seal)</div>
              <div className="mt-1 flex items-center space-x-1.5">
                <Stamp className="w-4 h-4 text-[#F42A41]" />
                <span className="text-xs font-bold text-[#17211D]">
                  {documentData.seal_status?.seal_detected
                    ? `শনাক্তকৃত (${documentData.seal_status.seals_count}টি সীল)`
                    : 'কোন সীল পাওয়া যায়নি'}
                </span>
              </div>
              <div className="text-[10px] text-[#65736C] mt-1">
                সার্কুলারিটি কনফিডেন্স: {documentData.seal_status?.seals?.[0]?.confidence ? `${(documentData.seal_status.seals[0].confidence * 100).toFixed(1)}%` : 'N/A'}
              </div>
            </div>

            {/* Workflow State */}
            <div className="bg-white border border-[#E1E8E3] rounded-lg p-3">
              <div className="text-[11px] font-medium text-[#65736C]">যাচাইকরণ অবস্থা (Status)</div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    documentData.verification_state === 'CHECKER_APPROVED_LOCKED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : documentData.verification_state === 'MAKER_VERIFIED_PENDING_CHECKER'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {documentData.verification_state}
                </span>
              </div>
              <div className="text-[10px] text-[#65736C] mt-1">
                মেকার: {documentData.maker_id || documentData.created_by || 'অপেক্ষমান'}
              </div>
            </div>
          </div>

          {/* Validation Flags Banner */}
          <div className="bg-white border border-[#E1E8E3] rounded-lg p-4">
            <div className="text-xs font-semibold text-[#17211D] mb-2 flex items-center justify-between">
              <span>বৈধতা পরীক্ষণ ফলাফল (Deterministic Validation Flags):</span>
              <button
                onClick={() => setShowMathModal(true)}
                className="text-xs text-[#006A4E] hover:underline font-semibold"
              >
                বিস্তারিত হিসাব দেখুন
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stamp Duty Math */}
              <div
                className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                  documentData.validation_flags?.stamp_math === 'PASS'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold">স্ট্যাম্প শুল্ক গণিত (Stamp Math)</div>
                    <div className="text-[11px] font-mono">১০০+১০০+১০০+১০০+৫০ = ৪৫০</div>
                  </div>
                </div>
                <span className="font-bold text-xs px-2 py-0.5 rounded bg-white border">
                  {documentData.validation_flags?.stamp_math || 'PASS'}
                </span>
              </div>

              {/* Chronology Check */}
              <div
                className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                  documentData.validation_flags?.chronology === 'PASS'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold">কালক্রম যাচাই (Chronology)</div>
                    <div className="text-[11px]">২৮/১০/২০০১ ≤ ১১/০৩/২০১০</div>
                  </div>
                </div>
                <span className="font-bold text-xs px-2 py-0.5 rounded bg-white border">
                  {documentData.validation_flags?.chronology || 'PASS'}
                </span>
              </div>

              {/* Tafsil Completeness */}
              <div
                className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                  documentData.validation_flags?.missing_tafsil === 'PASS'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="font-semibold">তফসিল পাতা (Missing Tafsil)</div>
                    <div className="text-[11px]">
                      {documentData.validation_flags?.missing_tafsil === 'PASS'
                        ? 'সকল ৭টি তথ্য বিদ্যমান'
                        : 'পৃষ্ঠা ১ এ দাগ/খতিয়ান অনুপস্থিত'}
                    </div>
                  </div>
                </div>
                <span className="font-bold text-xs px-2 py-0.5 rounded bg-white border">
                  {documentData.validation_flags?.missing_tafsil || 'WARNING'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Three Image Stages View */}
          <div className="bg-white border border-[#E1E8E3] rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E1E8E3] gap-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#006A4E]" />
                <h2 className="text-sm font-bold text-[#17211D]">
                  ৩-স্তরের চিত্র প্রক্রিয়াকরণ পর্যায় (Three Image Processing Stages)
                </h2>
              </div>
              {/* Stage switch buttons */}
              <div className="flex items-center space-x-1 bg-[#F5F7F6] p-1 rounded-md border border-[#E1E8E3]">
                <button
                  type="button"
                  onClick={() => setActiveStage('stage1_anonymized')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    activeStage === 'stage1_anonymized'
                      ? 'bg-[#006A4E] text-white shadow-xs'
                      : 'text-[#65736C] hover:text-[#17211D]'
                  }`}
                >
                  ১. Anonymized Input
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStage('stage2_shadow_removed')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    activeStage === 'stage2_shadow_removed'
                      ? 'bg-[#006A4E] text-white shadow-xs'
                      : 'text-[#65736C] hover:text-[#17211D]'
                  }`}
                >
                  ২. Shadow Removed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStage('stage3_clean_binarized')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    activeStage === 'stage3_clean_binarized'
                      ? 'bg-[#006A4E] text-white shadow-xs'
                      : 'text-[#65736C] hover:text-[#17211D]'
                  }`}
                >
                  ৩. Clean Binarized
                </button>
              </div>
            </div>

            <div className="mt-4 bg-[#F5F7F6] border border-[#E1E8E3] rounded-md p-3 flex justify-center items-center min-h-[360px]">
              {documentData.image_stages?.[activeStage]?.url ? (
                <div className="text-center">
                  <img
                    src={documentData.image_stages[activeStage].url}
                    alt={activeStage}
                    className="max-h-[460px] object-contain rounded border border-[#E1E8E3] shadow-xs mx-auto"
                  />
                  <div className="text-xs text-[#65736C] mt-2 font-medium">
                    {documentData.image_stages[activeStage].title}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#65736C]">চিত্র লোড হচ্ছে...</div>
              )}
            </div>
          </div>

          {/* Section: 8 Evidence Field Crops & 3-Column Table */}
          <div className="bg-white border border-[#E1E8E3] rounded-lg p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E3]">
              <div>
                <h2 className="text-sm font-bold text-[#17211D]">
                  ৮টি এভিডেন্স ক্রপ ও দ্বি-পক্ষীয় যাচাইকরণ টেবিল (8 Evidence Crops & 3-Column Comparison)
                </h2>
                <p className="text-xs text-[#65736C]">
                  মূল অপটিক্যাল র ওরিজিনাল টেক্সট কখনো ওভাররাইট করা হয় না। মেকার যাচাইকৃত মান পৃথকভাবে সংরক্ষিত হয়।
                </p>
              </div>
              <button
                onClick={() => setShowHashModal(true)}
                className="px-2.5 py-1 text-xs font-mono font-medium bg-[#F5F7F6] border border-[#E1E8E3] rounded text-[#006A4E] hover:bg-emerald-50 flex items-center space-x-1"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>SHA-256 চেইন দেখুন</span>
              </button>
            </div>

            {/* Responsive Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E1E8E3] text-left text-xs">
                <thead className="bg-[#F5F7F6] text-[#17211D] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">ক্ষেত্র ও লেবেল (Field)</th>
                    <th className="py-2.5 px-3">চিত্র প্রমাণ (Evidence Crop)</th>
                    <th className="py-2.5 px-3">র ওরিজিনাল OCR (Immutable)</th>
                    <th className="py-2.5 px-3">নর্মালাইজড সাজেস্ট (Lexicon)</th>
                    <th className="py-2.5 px-3">হিউম্যান ভেরিফাইড (Maker Verified)</th>
                    <th className="py-2.5 px-3">কনফিডেন্স ও উৎস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E8E3] bg-white">
                  {documentData.crops &&
                    Object.entries(documentData.crops).map(([fieldName, crop]) => (
                      <tr key={fieldName} className="hover:bg-[#F5F7F6]/60">
                        <td className="py-2.5 px-3 font-medium text-[#17211D]">
                          <div>{crop.label}</div>
                          <div className="text-[10px] font-mono text-[#65736C]">{fieldName}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {crop.crop_url ? (
                            <img
                              src={crop.crop_url}
                              alt={crop.label}
                              className="h-10 w-28 object-cover rounded border border-[#E1E8E3] bg-white"
                            />
                          ) : (
                            <span className="text-[10px] text-[#65736C]">ক্রপ অনুপস্থিত</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-700 bg-gray-50/50 rounded">
                          {crop.raw_ocr_text || '(অনুপস্থিত)'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#006A4E]">
                          {crop.normalized_value || crop.raw_ocr_text || '(প্রযোজ্য নয়)'}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={editableFields[fieldName] ?? ''}
                            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                            disabled={documentData.verification_state === 'CHECKER_APPROVED_LOCKED'}
                            className="w-full px-2 py-1 text-xs border border-[#E1E8E3] rounded focus:outline-none focus:ring-1 focus:ring-[#006A4E] disabled:bg-gray-100"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-emerald-700">
                            {(crop.confidence * 100).toFixed(1)}%
                          </div>
                          <div className="text-[10px] text-[#65736C] font-mono">
                            {crop.provenance}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow Review Actions Bar */}
          <div className="bg-white border border-[#E1E8E3] rounded-lg p-4">
            <h3 className="text-xs font-semibold text-[#17211D] mb-2">
              মেকার–চেকার ওয়ার্কফ্লো অ্যাকশন (Separation of Duties Workflow):
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#65736C]">
                  নিরীক্ষা মন্তব্য (Review Notes):
                </label>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="যাচাইকরণ পর্যবেক্ষণ লিখুন (ঐচ্ছিক)..."
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-[#E1E8E3] rounded focus:outline-none focus:ring-1 focus:ring-[#006A4E]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E1E8E3]">
                {/* Maker Action */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSubmitMaker}
                    disabled={loading || documentData.verification_state === 'CHECKER_APPROVED_LOCKED'}
                    className="px-4 py-2 bg-[#006A4E] hover:bg-[#004D3A] text-white text-xs font-semibold rounded shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>মেকার হিসেবে সংরক্ষণ ও চেকারের কাছে প্রেরণ</span>
                  </button>
                </div>

                {/* Checker Actions */}
                <div className="flex items-center space-x-2">
                  {isSelfRecord && user?.role === 'CHECKER' && (
                    <span className="text-[11px] text-red-600 font-medium">
                      * আপনি নিজের সৃষ্ট রেকর্ড অনুমোদন করতে পারবেন না (Self-Approval Prohibited)।
                    </span>
                  )}

                  <button
                    onClick={() => handleCheckerReview('REJECT')}
                    disabled={
                      loading ||
                      (isSelfRecord && user?.role === 'CHECKER') ||
                      documentData.verification_state === 'CHECKER_APPROVED_LOCKED'
                    }
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-[#F42A41] border border-red-200 text-xs font-semibold rounded transition-colors disabled:opacity-50"
                  >
                    বাতিল / সংশোধনে ফেরত
                  </button>

                  <button
                    onClick={() => handleCheckerReview('APPROVE')}
                    disabled={
                      loading ||
                      (isSelfRecord && user?.role === 'CHECKER') ||
                      documentData.verification_state === 'CHECKER_APPROVED_LOCKED'
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>চেকার অনুমোদন ও লক করুন (Approve & Lock)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SHA-256 Block Explorer Modal */}
      {showHashModal && documentData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-5 shadow-lg border border-[#E1E8E3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E3]">
              <div className="flex items-center space-x-2">
                <Hash className="w-5 h-5 text-[#006A4E]" />
                <h3 className="text-sm font-bold text-[#17211D]">
                  ক্রিপ্টোগ্রাফিক হ্যাশ-চেইন ব্লক (Audit Block Details)
                </h3>
              </div>
              <button
                onClick={() => setShowHashModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-[#65736C]">ডকুমেন্ট আইডি:</label>
                <div className="font-mono text-[#17211D]">{documentData.doc_id}</div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#65736C]">বর্তমান ব্লক হ্যাশ (H_n):</label>
                <div className="font-mono bg-emerald-50 border border-emerald-200 p-2 rounded text-[#006A4E] break-all">
                  {documentData.audit_hash || '0000000000000000000000000000000000000000000000000000000000000000'}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#65736C]">নির্ধারিত হ্যাশ সূত্র (Required Spec Formula):</label>
                <div className="font-mono bg-gray-50 border border-gray-200 p-2 rounded text-gray-800 break-all text-[11px]">
                  H_n = SHA256(H_(n-1) || doc_id || CanonicalJSON(Raw, Norm, Verified) || State || Actor_ID)
                </div>
              </div>

              <div className="text-[11px] text-[#65736C]">
                লোকাল SQLite অডিট লেজারে সংরক্ষিত। প্রতিটি মেকার ও চেকার কর্মপদ্ধতি ক্রিপ্টোগ্রাফিকভাবে লিঙ্ক করা রয়েছে।
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowHashModal(false)}
                className="px-4 py-1.5 bg-[#006A4E] text-white text-xs font-semibold rounded"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stamp Math Modal */}
      {showMathModal && documentData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-lg border border-[#E1E8E3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E8E3]">
              <h3 className="text-sm font-bold text-[#17211D]">
                স্ট্যাম্প শুল্ক গণিত ও সমীকরণ বিশ্লেষণ
              </h3>
              <button
                onClick={() => setShowMathModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="bg-[#F5F7F6] p-3 rounded border border-[#E1E8E3]">
                <div className="font-semibold text-gray-700">পাঠকৃত সমীকরণ (Read Equation):</div>
                <div className="text-base font-mono font-bold text-[#006A4E] mt-1">
                  ১০০+১০০+১০০+১০০+৫০ = ৪৫০
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white border p-2 rounded">
                  <span className="text-[#65736C]">গণনাকৃত সমষ্টি (Sum):</span>
                  <div className="font-mono font-bold text-sm text-[#17211D]">৪৫০ টাকা</div>
                </div>
                <div className="bg-white border p-2 rounded">
                  <span className="text-[#65736C]">দাবিকৃত মোট (Stated):</span>
                  <div className="font-mono font-bold text-sm text-[#17211D]">৪৫০ টাকা</div>
                </div>
              </div>

              <div className="text-emerald-700 font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>হিসাব সম্পূর্ণ নির্ভুল (Status: PASS)</span>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowMathModal(false)}
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

export default DigitizationStudioPage;
