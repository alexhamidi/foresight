import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const WhatsNew = () => {
  return (
    <div className="inline-flex items-center mb-8 group py-1 pl-1 pr-2 border border-gray-200 rounded-xl bg-white shadow-sm">
      <div className="flex items-center text-sm py-1 px-2 border border-gray-200 rounded-lg bg-white">
        <div className="w-2 h-2 rounded-full bg-green-200 flex justify-center items-center">
          <div className="w-1 h-1 rounded-full bg-green-600"></div>
        </div>
        <span className="ml-2 text-slate-500">What's New (3/27) </span>
      </div>
      <span className="flex items-center ml-2 text-sm">
        Implemented daily project updates, added 5000+ sources
      </span>
    </div>
  );
};

export default WhatsNew;
