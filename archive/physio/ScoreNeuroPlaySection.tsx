// ARCHIVE — section « Score NeuroPlay » du rapport BEN (extraite telle quelle de app/rapport/[id]/page.tsx, état physio-v1).
// Props : sn = rapport.score_neuroplay (5 dimensions notées /10) ; mission = mission liée (client, type, date).
import React from 'react'

const scoreColor = (s: number) => s >= 7 ? '#16a34a' : s >= 5 ? '#d97706' : '#dc2626'

export function ScoreNeuroPlaySection({ sn, mission }: { sn: any; mission: any }) {
  const scoreGlobal = ((sn.accessibilite + sn.fluidite + sn.clarte + sn.plaisir + sn.performance_commerciale) / 5).toFixed(1)
  return (
    <>
          {/* ─── SCORE NEUROPLAY ─── */}
          <div className="pdf-block" style={{ background: '#fff', borderRadius: '12px', padding: '32px', marginBottom: '32px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700', margin: '0 0 24px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>Score NeuroPlay</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Accessibilité', val: sn.accessibilite },
                { label: 'Fluidité', val: sn.fluidite },
                { label: 'Clarté', val: sn.clarte },
                { label: 'Plaisir', val: sn.plaisir },
                { label: 'Perf. commerciale', val: sn.performance_commerciale },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <div style={{ height: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '28px', background: scoreColor(val), borderRadius: '4px 4px 0 0', height: `${val * 4.8}px` }} />
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: scoreColor(val), margin: 0 }}>{val}</p>
                </div>
              ))}
            </div>
            <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#a6ff00' }} />
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 4px' }}>Score global NeuroPlay</p>
                <p style={{ fontSize: '48px', fontWeight: '700', color: '#a6ff00', margin: 0, lineHeight: 1 }}>{scoreGlobal}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0' }}>/ 10 · Neuroplay Xpériences</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px' }}>Client</p>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 8px' }}>{mission?.clients?.nom}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px' }}>Mission</p>
                <p style={{ color: '#fff', fontSize: '13px', margin: 0 }}>{mission?.type} · {mission?.date_mission}</p>
              </div>
            </div>
          </div>
    </>
  )
}
