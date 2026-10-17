import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner = () => {
  return (
    <div className="bg-[#FFF4E5] border-b border-[#FFE2B8] px-4 py-2 text-xs text-[#663C00] flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 text-[#B76E00] flex-shrink-0" />
        <span>
          <strong className="font-semibold text-[#8A4B00]">আইনগত সতর্কতা (LEGAL DISCLAIMER):</strong>{' '}
          NON-GOAL COMPLIANCE: Digitized record for search/indexing only. Does NOT establish legal title.
        </span>
      </div>
      <span className="hidden md:inline-block bg-[#FFE2B8] px-2 py-0.5 rounded text-[10px] font-mono font-medium text-[#663C00]">
        GOVTECH DEMO
      </span>
    </div>
  );
};

export default DisclaimerBanner;
