import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'حدث خطأ في العرض' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#080F1A] text-white flex flex-col items-center justify-center p-6 text-center"
        >
          <h2 className="text-lg font-bold text-[#FFD700] mb-2">
            جاري إعادة تنشيط شاشة مجلسنا
          </h2>
          <p className="text-xs text-slate-300 mb-4">{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#FFD700] text-[#080F1A] font-bold text-xs"
          >
            تحديث المعاينة الآن
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <PreviewErrorBoundary>
    <App />
  </PreviewErrorBoundary>
);

