'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useProcessing } from './ProcessingContext';
import { useRouter, useSearchParams } from 'next/navigation';

const tabLabels: Record<string, string> = {
  new: 'Create Podcast',
  avatar: 'Create Avatar Video',
  pending: 'Pending Uploads',
  uploaded: 'Uploaded Videos',
};

const ProcessingToastContent = () => {
  const { isProcessing, message, processedTab, setProcessedTab } = useProcessing();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'new';

  // Only show the toast if processedTab is set and user is NOT on the process tab
  const showToast = processedTab && processedTab !== currentTab;

  // Minimize state
  const [minimized, setMinimized] = useState(false);

  // Debug logging (no window usage)
  console.log('Toast:', { isProcessing, processedTab, currentTab, showToast, minimized });

  // Only clear processedTab if you are on the process tab AND processing is NOT running
  useEffect(() => {
    if (processedTab && processedTab === currentTab && !isProcessing) {
      const timeout = setTimeout(() => {
        setProcessedTab(null);
        setMinimized(false); // Reset minimized state when returning to original tab
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentTab, processedTab, setProcessedTab, isProcessing]);

  // Only show minimized or expanded toast if showToast is true
  if (!showToast) return null;

  // Minimized icon button
  if (minimized) {
    return (
      <button
        aria-label="Expand toast notification"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 10000,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#222',
          border: '2px solid #f87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
        onClick={() => setMinimized(false)}
      >
        {isProcessing ? (
          // Spinner icon
          <svg width="28" height="28" viewBox="0 0 50 50" style={{ display: 'block' }}>
            <circle cx="25" cy="25" r="20" fill="none" stroke="#f87171" strokeWidth="5" opacity="0.2" />
            <circle cx="25" cy="25" r="20" fill="none" stroke="#f87171" strokeWidth="5" strokeDasharray="31.4 125.6" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
        ) : (
          // Modern standalone checkmark icon (no circle, red)
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 13.5 11 18 18 7" style={{ filter: 'drop-shadow(0 1px 2px rgba(248,113,113,0.15))' }} />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 10000,
      background: '#222',
      color: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      minWidth: 280,
      fontWeight: 500,
      fontSize: 16,
      gap: 12,
      border: '2px solid #f87171',
      transition: 'all 0.3s',
      maxWidth: '90vw',
    }}>
      <span style={{ flex: 1 }}>
        {isProcessing ? (
          <>
            <span style={{ fontSize: 22, color: '#f87171', marginRight: 10 }}>●</span>
            Processing on "{tabLabels[processedTab] || processedTab}" tab...
          </>
        ) : (
          <>
            {/* Only one red dot here */}
            <span style={{ fontSize: 22, color: '#f87171', marginRight: 10 }}>●</span>
            Process completed.{' '}
            <span
              style={{
                color: '#f87171',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 600,
                marginLeft: 2
              }}
              onClick={() => {
                // If the completed process was in the pending tab, redirect to uploaded tab
                if (processedTab === 'pending') {
                  router.push('/?tab=uploaded');
                } else {
                  router.push(`/?tab=${processedTab}`);
                }
                setProcessedTab(null);
              }}
            >
              Click here to view
            </span>
          </>
        )}
      </span>
      <button
        aria-label="Minimize toast notification"
        style={{
          marginLeft: 8,
          background: 'transparent',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: 4,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 20,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onClick={() => setMinimized(true)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>
      </button>
    </div>
  );
};

const ProcessingToast = () => {
  return (
    <Suspense fallback={null}>
      <ProcessingToastContent />
    </Suspense>
  );
};

export default ProcessingToast; 