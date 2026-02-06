'use client';
// Force dynamic rendering for this page since it uses searchParams
export const dynamic = 'force-dynamic'

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const driveLink = searchParams.get('driveLink');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="relative bg-gray-800/90 rounded-2xl shadow-2xl p-12 border border-gray-700 flex flex-col items-center max-w-xl w-full animate-fade-in">
        {/* Animated red checkmark */}
        <div className="mb-8">
          <svg className="w-24 h-24 text-red-500 animate-bounceIn" fill="none" stroke="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="24" r="22" stroke="#ef4444" strokeWidth="4" fill="#2d0707" opacity="0.2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M14 26l7 7 13-13" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold mb-4 text-center text-red-400 drop-shadow-lg">Assets Approved!</h1>
        <p className="text-xl mb-8 text-gray-200 text-center font-medium">Your media assets have been <span className="text-red-400 font-bold">successfully approved</span> and uploaded.</p>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 mb-6 w-full max-w-xs mx-auto text-center shadow border border-gray-700 flex flex-col items-center">
          {driveLink ? (
            <a
              href={driveLink}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-base shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all duration-150 w-full max-w-[180px] mx-auto"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Media
            </a>
          ) : (
            <span className="text-gray-400">No Drive link available.</span>
          )}
        </div>
        <Link href="/" className="mt-2 text-base text-red-300 hover:text-red-400 underline font-semibold transition-colors duration-200">Back to Home</Link>
      </div>
      <style jsx>{`
        .animate-bounceIn {
          animation: bounceIn 1s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }
        @keyframes bounceIn {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 1.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
} 