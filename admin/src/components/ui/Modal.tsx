import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, footer, width = 500 }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(26, 26, 22, 0.4)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: width,
              backgroundColor: 'var(--color-paper)',
              border: '2px solid var(--color-ink)',
              boxShadow: '12px 12px 0px rgba(26, 26, 22, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              borderRadius: '2px',
            }}
          >
            {/* Editorial Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid var(--color-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-aged-stock)',
            }}>
              <div>
                <span style={{ 
                  display: 'block', 
                  fontSize: '9px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.2em', 
                  color: 'var(--color-sepia-mid)',
                  marginBottom: '4px'
                }}>
                  Document Archive / Detail View
                </span>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1.2
                }}>
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-ink)',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '20px',
                  lineHeight: 1,
                  paddingBottom: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-ink)'; e.currentTarget.style.color = 'var(--color-paper)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-ink)'; }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{
              padding: '32px',
              overflowY: 'auto',
              flex: 1,
              backgroundColor: 'white',
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/felt.png")',
            }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{
                padding: '20px 32px',
                borderTop: '1px solid var(--color-warm-gray)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                backgroundColor: 'var(--color-paper)',
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
