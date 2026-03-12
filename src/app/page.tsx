'use client';

import LTLRatingScreen from '@/components/LTLRatingScreen';

export default function RateShop() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        <LTLRatingScreen />
      </div>
    </div>
  );
}
