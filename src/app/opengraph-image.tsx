import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'ShaRecon AI — Explainable Reconciliation & Financial Control';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#070a10',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(113, 104, 255, 0.25) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 40%)',
          padding: '64px',
          fontFamily: 'sans-serif',
          color: '#f7f8fc',
        }}
      >
        {/* Top Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#141b2b',
              border: '1px solid rgba(113, 104, 255, 0.4)',
              borderRadius: '9999px',
              padding: '8px 18px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#a5b4fc',
              letterSpacing: '0.05em',
            }}
          >
            RAZORPAY AI BUILDATHON • TRACK 4: AI FINANCE CONTROLLER
          </div>
        </div>

        {/* Center Title & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              lineHeight: 1.1,
            }}
          >
            ShaRecon AI
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: '#94a3b8',
              maxWidth: '900px',
              lineHeight: 1.4,
            }}
          >
            Explainable Three-Way Reconciliation Controller for Razorpay Payments,
            Settlement Batches, and Bank Credits with Integer-Paise Arithmetic.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#10b981',
            }}
          >
            Deterministic Integer Arithmetic
          </div>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(113, 104, 255, 0.12)',
              border: '1px solid rgba(113, 104, 255, 0.3)',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#a5b4fc',
            }}
          >
            Tamper-Evident SHA-256 Ledger
          </div>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fbbf24',
            }}
          >
            Zero Server Storage / In-Memory
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
