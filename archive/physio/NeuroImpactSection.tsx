// ARCHIVE — section « NeuroImpact » du rapport BEN (extraite telle quelle de app/rapport/[id]/page.tsx, état physio-v1).
// Props : ni = rapport.neuro_impact ; interpColor / interpLabel = tables de correspondance ci-dessous.
// ⚠️ Dans BEN, ces valeurs EDA/HRV n'étaient PAS mesurées : elles étaient générées par le LLM (voir prompt-physio.md).
// Dans la future app « Parcours des émotions », elles devront venir des capteurs, synchronisées par zone.
import React from 'react'

export const interpColor: any = {
  flow: '#16a34a', waouh: '#16a34a', stress_modere: '#d97706', confusion: '#d97706', stress_fort: '#dc2626'
}
export const interpLabel: any = {
  flow: 'Flow', waouh: 'Waouh', stress_modere: 'Stress modéré', confusion: 'Confusion', stress_fort: 'Stress fort'
}

export function NeuroImpactSection({ ni }: { ni: any }) {
  return (
    <>
          {/* ─── NEUROIMPACT ─── */}
          {ni.protocole && (
            <div className="pdf-block" style={{ background: '#0f172a', borderRadius: '12px', padding: '32px', marginBottom: '24px' }}>
              <h2 style={{ color: '#a6ff00', fontSize: '16px', fontWeight: '700', margin: '0 0 8px' }}>NeuroImpact</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 24px' }}>{ni.protocole}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                {[
                  { title: 'EDA — Réponse électrodermale', data: ni.eda, unit: 'µS', keys: ['moyenne', 'pic_max', 'pic_min', 'zones_stress'], labels: ['Niveau moyen', 'Pic maximal', 'Pic minimal', 'Zones de stress'] },
                  { title: 'HRV — Variabilité cardiaque', data: ni.hrv, unit: 'ms', keys: ['moyenne', 'minimum', 'maximum', 'zones_flow'], labels: ['HRV moyen', 'HRV minimum', 'HRV maximum', 'Zones de flow'] },
                ].map(({ title, data, unit, keys, labels }) => (
                  <div key={title} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>{title}</p>
                    {keys.map((k, i) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{labels[i]}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{data?.[k]} {k.includes('zone') ? 'détectées' : unit}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Corrélation zones · signaux</p>
              {(ni.zones || []).map((z: any) => (
                <div key={z.nom} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: interpColor[z.interpretation], flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', flex: 1 }}>{z.nom}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>EDA {z.eda} µS · HRV {z.hrv} ms</span>
                  <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: `${interpColor[z.interpretation]}22`, color: interpColor[z.interpretation], fontWeight: '600' }}>{interpLabel[z.interpretation]}</span>
                </div>
              ))}
            </div>
          )}
    </>
  )
}
