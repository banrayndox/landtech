/**
 * Offline & Cloud Demo Fallback Service
 * BhumiLens AI + BhumiGuard
 * LandTech Innovation Hackathon 2026
 *
 * Provides deterministic simulation responses when the backend server
 * or MongoDB is not reachable (e.g. static Vercel cloud deployment).
 */

const DEMO_USERS = {
  'admin@landtech.gov.bd': {
    id: 'usr_demo_admin',
    employee_id: 'EMP_ADMIN_01',
    full_name: 'Dr. Aminul Islam (Admin)',
    email: 'admin@landtech.gov.bd',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: '2026-10-18T00:00:00Z',
    approved_by: 'SYSTEM_BOOTSTRAP',
  },
  'maker@landtech.gov.bd': {
    id: 'usr_demo_maker',
    employee_id: 'EMP_MAKER_01',
    full_name: 'Tania Akter (Maker)',
    email: 'maker@landtech.gov.bd',
    role: 'MAKER',
    status: 'ACTIVE',
    created_at: '2026-10-18T00:00:00Z',
    approved_by: 'EMP_ADMIN_01',
  },
  'checker@landtech.gov.bd': {
    id: 'usr_demo_checker',
    employee_id: 'EMP_CHECKER_01',
    full_name: 'Kazi Farhan (Checker)',
    email: 'checker@landtech.gov.bd',
    role: 'CHECKER',
    status: 'ACTIVE',
    created_at: '2026-10-18T00:00:00Z',
    approved_by: 'EMP_ADMIN_01',
  },
};

// Benchmark Document State for DOLIL_2001_20078
let currentDocState = {
  doc_id: 'DOLIL_2001_20078',
  document_type: 'STAMP_DEED_DOLIL',
  classification: 'STAMP_DEED_DOLIL',
  processing_status: 'PROCESSED',
  verification_state: 'DRAFT_RAW_OCR',
  created_by: 'EMP_MAKER_01',
  maker_id: 'EMP_MAKER_01',
  checker_id: null,
  image_stages: {
    stage1_anonymized: {
      title: '১. Anonymized Input / বেনামীকৃত মূল চিত্র',
      url: '/assets/hero.png',
    },
    stage2_shadow_removed: {
      title: '২. Shadow Removed / ছায়া অপসারিত চিত্র',
      url: '/assets/hero.png',
    },
    stage3_clean_binarized: {
      title: '৩. Clean Binarized / পরিষ্কার দ্বিমুখী চিত্র',
      url: '/assets/hero.png',
    },
  },
  seal_status: {
    seal_detected: true,
    seals_count: 1,
    seals: [
      {
        confidence: 0.965,
        type: 'OFFICIAL_CIRCULAR_SEAL',
        center: [720, 1100],
      },
    ],
    status_label: 'OFFICIAL_SEAL_VERIFIED',
  },
  crops: {
    stamp_serial_no: {
      field_name: 'stamp_serial_no',
      label: 'স্ট্যাম্প সিরিয়াল নং (Stamp Serial)',
      raw_ocr_text: 'ন ৪১৪০২৩১',
      normalized_value: 'ন ৪১৪০২৩১',
      confidence: 0.95,
      provenance: 'DEMO_SYNTHETIC_DATA',
      crop_url: '',
    },
    stamp_duty_math: {
      field_name: 'stamp_duty_math',
      label: 'স্ট্যাম্প শুল্ক হিসাব (Stamp Math)',
      raw_ocr_text: '১০০+১০০+১০০+১০০+৫০=৪৫০',
      normalized_value: '১০০+১০০+১০০+১০০+৫০=৪৫০',
      confidence: 0.98,
      provenance: 'DEMO_SYNTHETIC_DATA',
      crop_url: '',
    },
    copy_issue_date: {
      field_name: 'copy_issue_date',
      label: 'নকল সরবরাহের তারিখ (Copy Date)',
      raw_ocr_text: '১১/০৩/২০১০',
      normalized_value: '১১/০৩/২০১০',
      confidence: 0.94,
      provenance: 'DEMO_SYNTHETIC_DATA',
      crop_url: '',
    },
    deed_number_year: {
      field_name: 'deed_number_year',
      label: 'দলিল নম্বর ও সাল (Deed No & Year)',
      raw_ocr_text: '২০০৭৮/২০০১',
      normalized_value: '২০০৭৮/২০০১',
      confidence: 0.96,
      provenance: 'DEMO_SYNTHETIC_DATA',
      crop_url: '',
    },
    deed_type_and_value: {
      field_name: 'deed_type_and_value',
      label: 'দলিলের প্রকৃতি ও মূল্য (Type & Value)',
      raw_ocr_text: 'বেল এওয়াজে হেবা দলিল ৪,০০০ টাকা',
      normalized_value: 'বেল এওয়াজে হেবা দলিল ৪,০০০ টাকা',
      confidence: 0.95,
      provenance: 'LEXICON_NORMALIZED',
      crop_url: '',
    },
    land_area: {
      field_name: 'land_area',
      label: 'জমির পরিমাণ (Land Area)',
      raw_ocr_text: '৩০ শতাংশ',
      normalized_value: '৩০ শতাংশ',
      confidence: 0.94,
      provenance: 'DEMO_SYNTHETIC_DATA',
      crop_url: '',
    },
    location_mouza_thana: {
      field_name: 'location_mouza_thana',
      label: 'মৌজা ও থানা (Location)',
      raw_ocr_text: 'মৌজা: বারেন্ডা, থানা: গাজীপুর সদর',
      normalized_value: 'মৌজা: বারেন্ডা, থানা: গাজীপুর সদর',
      confidence: 0.96,
      provenance: 'LEXICON_NORMALIZED',
      crop_url: '',
    },
    registration_date: {
      field_name: 'registration_date',
      label: 'রেজিস্ট্রেশন তারিখ (Reg Date)',
      raw_ocr_text: '২৮/১০/২০০১',
      normalized_value: '২৮/১০/২০০১',
      confidence: 0.95,
      provenance: 'DEMO_SYNTHETIC_DATA',
      crop_url: '',
    },
  },
  validation_flags: {
    stamp_math: 'PASS',
    chronology: 'PASS',
    missing_tafsil: 'WARNING',
    stamp_math_details: {
      calculated_sum: 450,
      stated_total: 450,
      is_valid: true,
      status: 'PASS',
    },
    chronology_details: {
      registration_date: '28/10/2001',
      copy_issue_date: '11/03/2010',
      is_valid: true,
      status: 'PASS',
    },
  },
  completeness: {
    total_mandatory_fields: 7,
    found_count: 5,
    missing_count: 2,
    completeness_percentage: '71%',
    warning_message_bn:
      'সতর্কবার্তা: ছবিতে ৫টি তথ্য পাওয়া গেছে, কিন্তু ২টি তথ্য (দাগ নম্বর ও খতিয়ান নম্বর) অনুপস্থিত। অনুগ্রহ করে তফসিল পাতা (Page 2) আপলোড করুন অথবা মূল বালাম বহি দেখে ম্যানুয়ালি ইনপুট দিন।',
  },
  audit_hash: '8f4c3a2b1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b',
  legal_disclaimer:
    'NON-GOAL COMPLIANCE: Digitized record for search/indexing only. Does NOT establish legal title.',
};

// Plot Quota State for GZ-SDR-JL14-KH402-DAG105
let plotQuotaState = {
  plot_key: 'GZ-SDR-JL14-KH402-DAG105',
  district: 'গাজীপুর',
  thana: 'গাজীপুর সদর',
  mouza: 'বারেন্ডা',
  jl_no: '14',
  khatian_no: '402',
  dag_no: '105',
  total_master_area: 30.0,
  mutated_sold_area: 0.0,
  pending_locked_area: 0.0,
  available_quota: 30.0,
  utilization_percentage: 0,
  trusted_owner: 'মোহাম্মদ রফিকুল ইসলাম',
  trusted_owner_nid: '19823315024000123',
};

let txHistory = [];

export const handleMockRequest = async (url, method, data) => {
  const cleanUrl = url.replace(/^\/api/, '');

  // 1. Auth: Login
  if (cleanUrl.includes('/auth/login') && method === 'post') {
    const loginId = data?.login_id?.toLowerCase()?.trim();
    const user =
      DEMO_USERS[loginId] ||
      Object.values(DEMO_USERS).find((u) => u.employee_id.toLowerCase() === loginId) ||
      DEMO_USERS['admin@landtech.gov.bd'];

    return {
      access_token: `mock_jwt_token_${user.role.toLowerCase()}`,
      refresh_token: `mock_refresh_token_${user.role.toLowerCase()}`,
      token_type: 'bearer',
      user,
    };
  }

  // 2. Auth: Me
  if (cleanUrl.includes('/auth/me') && method === 'get') {
    const stored = localStorage.getItem('bhumilens_user');
    return stored ? JSON.parse(stored) : DEMO_USERS['admin@landtech.gov.bd'];
  }

  // 3. Auth: Logout
  if (cleanUrl.includes('/auth/logout')) {
    return { message: 'Logged out' };
  }

  // 4. Processing: Demo sample
  if (cleanUrl.includes('/processing/demo-sample')) {
    return currentDocState;
  }

  // 5. Document Details
  if (cleanUrl.startsWith('/documents/')) {
    return currentDocState;
  }

  // 6. Page 2 Supplement
  if (cleanUrl.includes('/processing/page2')) {
    currentDocState.validation_flags.missing_tafsil = 'PASS';
    currentDocState.completeness.found_count = 7;
    currentDocState.completeness.missing_count = 0;
    currentDocState.completeness.completeness_percentage = '100%';
    currentDocState.completeness.warning_message_bn = null;
    currentDocState.audit_hash = 'a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6';

    return {
      doc_id: currentDocState.doc_id,
      completeness_status: 'READY_FOR_VERIFICATION',
      audit_hash: currentDocState.audit_hash,
      message: 'তফসিল পাতা (Page 2) এর তথ্য সফলভাবে যুক্ত হয়েছে। সকল ৭টি আবশ্যকীয় তথ্য পূর্ণ হয়েছে।',
    };
  }

  // 7. Maker Verification Submit
  if (cleanUrl.includes('/verification/submit-maker')) {
    currentDocState.verification_state = 'MAKER_VERIFIED_PENDING_CHECKER';
    currentDocState.audit_hash = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b';
    return {
      doc_id: currentDocState.doc_id,
      verification_state: 'MAKER_VERIFIED_PENDING_CHECKER',
      audit_hash: currentDocState.audit_hash,
      message: 'রেকর্ড মেকার কর্তৃক যাচাইকৃত হয়েছে এবং চেকার অনুমোদনের অপেক্ষায় রয়েছে।',
    };
  }

  // 8. Checker Review
  if (cleanUrl.includes('/verification/checker-review')) {
    const action = data?.action || 'APPROVE';
    const newState = action === 'APPROVE' ? 'CHECKER_APPROVED_LOCKED' : 'REJECTED_NEEDS_CORRECTION';
    currentDocState.verification_state = newState;
    currentDocState.audit_hash = '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e';
    return {
      doc_id: currentDocState.doc_id,
      verification_state: newState,
      audit_hash: currentDocState.audit_hash,
      message:
        action === 'APPROVE'
          ? 'চেকার কর্তৃক রেকর্ড অনুমোদিত ও লক করা হয়েছে।'
          : 'রেকর্ড সংশোধনের জন্য ফেরত পাঠানো হয়েছে।',
    };
  }

  // 9. Fraud: Plot Quota
  if (cleanUrl.includes('/fraud/plot-quota')) {
    return plotQuotaState;
  }

  // 10. Fraud: Reset Demo
  if (cleanUrl.includes('/fraud/reset-demo')) {
    plotQuotaState.mutated_sold_area = 0.0;
    plotQuotaState.available_quota = 30.0;
    plotQuotaState.utilization_percentage = 0;
    txHistory = [];
    return { message: 'Demo plot quota reset to initial 30.0 Decimal.' };
  }

  // 11. Fraud: Benchmark Transactions (TX_01 to TX_05)
  if (cleanUrl.includes('/fraud/demo-tx/')) {
    const txCode = cleanUrl.split('/').pop().toUpperCase();
    let decision = 'ALLOWED';
    let reason_code = 'PASS';
    let message_bn = 'লেনদেন সম্পূর্ণ বৈধ এবং রেজিস্ট্রেশনের অনুমোদনযোগ্য।';
    let area = 0.0;
    let checks = { chain_break: 'PASS', forged_khatian: 'PASS', utxo_lock: 'PASS' };

    const before = plotQuotaState.available_quota;

    if (txCode === 'TX_01') {
      area = 18.0;
      plotQuotaState.mutated_sold_area = 18.0;
      plotQuotaState.available_quota = 12.0;
      plotQuotaState.utilization_percentage = 60.0;
    } else if (txCode === 'TX_02') {
      area = 20.0;
      decision = 'BLOCKED';
      reason_code = 'UTXO_DOUBLE_SELLING_LOCK';
      message_bn = 'দ্বৈত বিক্রয় বা অতিরিক্ত বিক্রয়ের অপচেষ্টা: প্রস্তাবিত জমি (২০.০ শতাংশ) অবশিষ্ট কোটার (১২.০ শতাংশ) চেয়ে বেশি।';
      checks.utxo_lock = 'FAIL';
    } else if (txCode === 'TX_03') {
      area = 5.0;
      decision = 'BLOCKED';
      reason_code = 'CHAIN_BREAK_CHECK';
      message_bn = "মালিকানা চেইন বিচ্ছিন্নতা: বিক্রেতা 'আব্দুল মান্নান' বালাম অনুযায়ী বর্তমান রেকর্ডীয় মালিক নন।";
      checks.chain_break = 'FAIL';
    } else if (txCode === 'TX_04') {
      area = 10.0;
      decision = 'BLOCKED';
      reason_code = 'FORGED_KHATIAN_CHECK';
      message_bn = 'জাল খতিয়ান শনাক্ত: দাবি করা মোট জমির পরিমাণ (৪৫ শতাংশ) মূল রেকর্ডের (৩০ শতাংশ) সাথে মিলছে না।';
      checks.forged_khatian = 'FAIL';
    } else if (txCode === 'TX_05') {
      area = 12.0;
      plotQuotaState.mutated_sold_area = 30.0;
      plotQuotaState.available_quota = 0.0;
      plotQuotaState.utilization_percentage = 100.0;
    }

    const txItem = {
      tx_id: `TX_${Date.now()}`,
      tx_code: txCode,
      plot_key: plotQuotaState.plot_key,
      seller_name: txCode === 'TX_03' ? 'আব্দুল মান্নান' : 'মোহাম্মদ রফিকুল ইসলাম',
      buyer_name: 'ডেমো ক্রেতা',
      requested_area: area,
      decision,
      reason_code,
      reason_message_bn: message_bn,
      checks,
      available_quota_before: before,
      available_quota_after: plotQuotaState.available_quota,
      audit_hash: `sha256_${Date.now().toString(16)}abcdef1234567890`,
      timestamp: new Date().toISOString(),
    };

    txHistory.unshift(txItem);
    return txItem;
  }

  // 12. Fraud: Verify Custom Sale
  if (cleanUrl.includes('/fraud/verify-sale')) {
    const area = parseFloat(data?.requested_area) || 0;
    const seller = data?.seller_name?.trim();
    const before = plotQuotaState.available_quota;

    let decision = 'ALLOWED';
    let reason_code = 'PASS';
    let message_bn = 'লেনদেন সম্পূর্ণ বৈধ এবং রেজিস্ট্রেশনের অনুমোদনযোগ্য।';
    let checks = { chain_break: 'PASS', forged_khatian: 'PASS', utxo_lock: 'PASS' };

    if (seller !== plotQuotaState.trusted_owner) {
      decision = 'BLOCKED';
      reason_code = 'CHAIN_BREAK_CHECK';
      message_bn = `মালিকানা চেইন বিচ্ছিন্নতা: বিক্রেতা '${seller}' রেকর্ডীয় মালিক নন।`;
      checks.chain_break = 'FAIL';
    } else if (area > before) {
      decision = 'BLOCKED';
      reason_code = 'UTXO_DOUBLE_SELLING_LOCK';
      message_bn = `দ্বৈত বিক্রয়: প্রস্তাবিত জমি (${area} শতাংশ) অবশিষ্ট কোটার (${before} শতাংশ) চেয়ে বেশি।`;
      checks.utxo_lock = 'FAIL';
    } else {
      plotQuotaState.mutated_sold_area += area;
      plotQuotaState.available_quota -= area;
      plotQuotaState.utilization_percentage = Math.round(
        (plotQuotaState.mutated_sold_area / plotQuotaState.total_master_area) * 100
      );
    }

    const txItem = {
      tx_id: `TX_${Date.now()}`,
      tx_code: 'CUSTOM',
      plot_key: plotQuotaState.plot_key,
      seller_name: seller,
      buyer_name: data?.buyer_name || 'ক্রেতা',
      requested_area: area,
      decision,
      reason_code,
      reason_message_bn: message_bn,
      checks,
      available_quota_before: before,
      available_quota_after: plotQuotaState.available_quota,
      audit_hash: `sha256_${Date.now().toString(16)}custom123456789`,
      timestamp: new Date().toISOString(),
    };

    txHistory.unshift(txItem);
    return txItem;
  }

  // 13. Fraud History
  if (cleanUrl.includes('/fraud/history')) {
    return txHistory;
  }

  // 14. Sandbox: Confusion Matrix
  if (cleanUrl.includes('/sandbox/confusion-matrix')) {
    const text = data?.input_text || '';
    const isTarget = text.includes('গাজীপুর মদর') || text.includes('মদর');
    return {
      input_text: text,
      suggested_correction: isTarget ? text.replace('মদর', 'সদর') : text,
      weighted_distance: isTarget ? 0.2 : 0.0,
      confidence: 0.96,
      matched_category: 'thanas',
      is_corrected: isTarget,
      confusion_groups_involved: [['শ', 'ষ', 'স', 'ম']],
    };
  }

  // 15. Sandbox: 16-Ana Calculator
  if (cleanUrl.includes('/sandbox/ana-calculator')) {
    const ana = parseFloat(data?.ana) || 0;
    const gonda = parseFloat(data?.gonda) || 0;
    const kora = parseFloat(data?.kora) || 0;
    const kranti = parseFloat(data?.kranti) || 0;
    const til = parseFloat(data?.til) || 0;

    const s_dec = ana / 16.0 + gonda / 320.0 + kora / 1280.0 + kranti / 3840.0 + til / 76800.0;
    const percentage = s_dec * 100.0;

    return {
      ana,
      gonda,
      kora,
      kranti,
      til,
      share_decimal: Math.round(s_dec * 1000000) / 1000000,
      share_percentage: Math.round(percentage * 10000) / 10000,
      formatted_percentage: `${(Math.round(percentage * 10000) / 10000).toFixed(4)}%`,
      is_valid: true,
    };
  }

  // 16. Search records
  if (cleanUrl.includes('/search/records')) {
    return {
      records: [
        {
          doc_id: 'DOLIL_2001_20078',
          document_type: 'বেল এওয়াজে হেবা দলিল',
          deed_number: '২০০৭৮/২০০১',
          district: 'গাজীপুর',
          thana: 'গাজীপুর সদর',
          mouza: 'বারেন্ডা',
          dag_number: '১০৫',
          khatian_number: '৪০২',
          land_area: 30.0,
          stated_value: 4000.0,
          verification_state: currentDocState.verification_state,
          latest_audit_hash: currentDocState.audit_hash,
          legal_disclaimer:
            'NON-GOAL COMPLIANCE: Digitized record for search/indexing only. Does NOT establish legal title.',
        },
      ],
      total: 1,
      legal_disclaimer:
        'NON-GOAL COMPLIANCE: Digitized record for search/indexing only. Does NOT establish legal title.',
    };
  }

  // 17. Users list
  if (cleanUrl.includes('/users')) {
    return Object.values(DEMO_USERS);
  }

  // 18. Health Check
  if (cleanUrl.includes('/health')) {
    return {
      status: 'HEALTHY',
      service: 'BhumiLens AI + BhumiGuard (Cloud Preview)',
      environment: 'vercel-preview',
      database_mongodb: { status: 'UP', version: '7.0.17', database: 'bhumilens_gov' },
      database_sqlite: { status: 'UP', path: 'outputs/bhumilens_gov_records.db', size_bytes: 32768 },
      ocr_engines: { primary_active_engine: 'RAPIDOCR', rapidocr: { available: true } },
      system_metrics: { python_process_ram_mb: 9.13, cpu_percent: 2.1 },
    };
  }

  return { message: 'Success' };
};
