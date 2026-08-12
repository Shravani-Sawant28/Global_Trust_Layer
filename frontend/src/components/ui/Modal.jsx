'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal — accessible dialog with backdrop blur.
 *
 * @param {boolean}  isOpen   - Controls visibility.
 * @param {function} onClose  - Called when backdrop or X is clicked.
 * @param {string}   title    - Modal header text.
 * @param {string}   size     - 'sm' | 'md' (default) | 'lg'
 * @param {ReactNode} children
 */
export default function Modal({ isOpen, onClose, title, size = 'md', children }) {
  const dialogRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative w-full rounded-xl bg-white dark:bg-[#1A1714] shadow-card-lg animate-slide-up border',
          sizes[size]
        )}
        style={{ borderColor: '#F0D9B5' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: '#F0D9B5' }}>
          <h2 id="modal-title" className="text-base font-semibold text-[#1C1410] dark:text-[#F5EDE0]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#C8A87A] dark:text-[#6B5A4A] hover:bg-[#FFF2DB] dark:hover:bg-[#2D2822] hover:text-[#3D2E16] dark:hover:text-[#F5EDE0] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
