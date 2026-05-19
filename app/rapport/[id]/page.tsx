'use client'
import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Rapport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [rapport, setRapport] = useState<any>(null)
  const [mission, setMission] = useState<any>(null)
  const [modeToken, setModeToken] = useState(false) // true = accès par lien partagé, pas de retour plateforme

  useEffect(() => {
    // Récupérer le token dans l'URL
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    if (token) {
      // Mode lien partagé : pas besoin de session, on charge via token
      setModeToken(true)
      loadRapportParToken(token)
    } else {
      // Mode connecté : vérifier la session
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) window.location.href = '/'
      })
      loadRapport()
    }
  }, [])

  async function loadRapport() {
    const { data: m } = await supabase
      .from('missions')
      .select('*, clients(nom, secteur)')
      .eq('id', id)
      .single()
    if (m) setMission(m)
    const { data: r } = await supabase
      .from('rapports')
      .select('*')
      .eq('mission_id', id)
      .single()
    if (r) setRapport(r)
  }

  async function loadRapportParToken(token: string) {
    // Charger le rapport via le share_token (pas besoin de session)
    const { data: r } = await supabase
      .from('rapports')
      .select('*')
      .eq('share_token', token)
      .single()
    if (!r) { window.location.href = '/'; return } // token invalide
    setRapport(r)
    // Charger la mission liée
    const { data: m } = await supabase
      .from('missions')
      .select('*, clients(nom, secteur)')
      .eq('id', r.mission_id)
      .single()
    if (m) setMission(m)
  }

  async function handleRetour() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    window.location.href = profile?.role === 'admin' ? '/dashboard' : '/client'
  }

  function handlePrint() {
    window.print()
  }

  function handleMail() {
    const sujet = encodeURIComponent(`Rapport diagnostic NeuroXperiences — ${mission?.clients?.nom}`)
    // Le lien partagé utilise le share_token, pas l'URL de session
    const token = rapport?.share_token
    const base = window.location.origin
    const lien = token
      ? `${base}/rapport/${id}?token=${token}`
      : window.location.href
    const corps = encodeURIComponent(
`Bonjour,

Veuillez trouver ci-joint le rapport de diagnostic NeuroXperiences réalisé pour ${mission?.clients?.nom}.

Mission : ${mission?.type}
Date : ${mission?.date_mission}
Score global : ${rapport?.executive_summary?.score_global}/10

Vous pouvez consulter le rapport en ligne à l'adresse suivante :
${lien}

Pour télécharger le PDF, ouvrez le lien ci-dessus puis cliquez sur "Télécharger PDF".

Cordialement,
L'équipe NeuroXperiences`
    )
    window.location.href = `mailto:?subject=${sujet}&body=${corps}`
  }

  const scoreColor = (s: number) => s >= 7 ? '#16a34a' : s >= 5 ? '#d97706' : '#dc2626'
  const scoreColorLight = (s: number) => s >= 7 ? '#dcfce7' : s >= 5 ? '#fef3c7' : '#fee2e2'

  const syntheseColor: any = {
    critique: '#dc2626', quickwin: '#16a34a', optimisation: '#2563eb', long_terme: '#6b7280'
  }
  const syntheseLabel: any = {
    critique: 'Friction critique', quickwin: 'Quick win', optimisation: 'Optimisation', long_terme: 'Long terme'
  }
  const syntheseBg: any = {
    critique: '#fee2e2', quickwin: '#dcfce7', optimisation: '#dbeafe', long_terme: '#f3f4f6'
  }
  const interpColor: any = {
    flow: '#16a34a', waouh: '#16a34a', stress_modere: '#d97706', confusion: '#d97706', stress_fort: '#dc2626'
  }
  const interpLabel: any = {
    flow: 'Flow', waouh: 'Waouh', stress_modere: 'Stress modéré', confusion: 'Confusion', stress_fort: 'Stress fort'
  }

  if (!rapport) return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#94a3b8', fontFamily: 'Arial' }}>Chargement...</p>
    </main>
  )

  const ex = rapport.executive_summary || {}
  const parc = rapport.parcours_scores || {}
  const cog = rapport.analyse_cognitive || {}
  const ni = rapport.neuro_impact || {}
  const syn = rapport.synthese || []
  const sn = rapport.score_neuroplay || {}
  const scoreGlobal = ((sn.accessibilite + sn.fluidite + sn.clarte + sn.plaisir + sn.performance_commerciale) / 5).toFixed(1)
  const dateDoc = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })

  // Logo SVG inline (X mark de Neuroplay)
  const XMark = ({ size = 32, color = '#a6ff00' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 210 210" fill="none" style={{ display: 'block' }}>
      <path
        d="M 136 0 L 99 -54 L 68 0 L 3 0 L 67 -99 L 2 -194 L 69 -194 L 106 -141 L 137 -194 L 201 -194 L 136 -96 L 203 0 Z"
        transform="translate(3, 200)"
        fill={color}
      />
    </svg>
  )

  const LogoInline = ({ dark = true, size = 'md' }: { dark?: boolean; size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = { sm: { icon: 22, title: 11, sub: 7 }, md: { icon: 32, title: 15, sub: 9 }, lg: { icon: 44, title: 20, sub: 11 } }
    const s = sizes[size]
    const titleColor = dark ? '#fff' : '#0f172a'
    const subColor = dark ? 'rgba(255,255,255,0.45)' : '#64748b'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <XMark size={s.icon} />
        <div>
          <div style={{ fontSize: s.title, fontWeight: '700', letterSpacing: '0.18em', color: titleColor, lineHeight: 1.1, fontFamily: 'Arial, sans-serif' }}>NEUROPLAY</div>
          <div style={{ fontSize: s.sub, fontWeight: '400', letterSpacing: '0.3em', color: subColor, lineHeight: 1.2, fontFamily: 'Arial, sans-serif' }}>XPERIENCES</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media print {
          .pdf-block { break-inside: avoid; page-break-inside: avoid; }
          .no-print { display: none !important; }
          .print-only { display: flex !important; }
          .print-break { page-break-before: always; }
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0; size: A4; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
        body { margin: 0; }
      `}</style>

      {/* ─── EN-TÊTE PDF ─── */}
      <div className="print-only" style={{
        background: '#0f172a',
        padding: '14px 40px',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #a6ff00'
      }}>
        <LogoInline dark size="sm" />
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#a6ff00', fontSize: '9px', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'Arial' }}>
            🔒 Document confidentiel
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', margin: 0, fontFamily: 'Arial' }}>{mission?.clients?.nom} · {mission?.date_mission}</p>
        </div>
      </div>

      {/* ─── HEADER ÉCRAN ─── */}
      <div className="no-print" style={{
        background: '#fff', padding: '12px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {!modeToken && (
            <button onClick={handleRetour} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>← Retour</button>
          )}
          <div>
            <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: '700', margin: 0, fontFamily: 'Arial' }}>NeuroXperiences · Rapport diagnostic</p>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, fontFamily: 'Arial' }}>{mission?.clients?.nom} · {mission?.type} · {mission?.date_mission}</p>
          </div>
          {!modeToken && <div />}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleMail} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer', fontFamily: 'Arial' }}>
            ✉ {modeToken ? 'Transférer ce rapport' : 'Envoyer par mail'}
          </button>
          <button onClick={handlePrint} style={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 18px', cursor: 'pointer', fontFamily: 'Arial' }}>
            ↓ Télécharger PDF
          </button>
        </div>
      </div>

      <main style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', padding: '40px 32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>

          {/* ─── PAGE DE GARDE ─── */}
          <div className="pdf-block" style={{ background: '#0f172a', borderRadius: '16px', padding: '48px', marginBottom: '32px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#a6ff00' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
              <div>
                {/* Logo en-tête de la page de garde */}
                <div style={{ marginBottom: '24px' }}>
                  <LogoInline dark size="md" />
                </div>
                <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: '700', margin: '0 0 8px', lineHeight: 1.2 }}>Diagnostic Expérience Visiteur</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>{mission?.clients?.nom}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</p>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 20px' }}>{mission?.date_mission}</p>
                {/* Badge confidentiel */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(166,255,0,0.12)', border: '1px solid rgba(166,255,0,0.35)', borderRadius: '20px', padding: '5px 14px' }}>
                  <span style={{ fontSize: '10px' }}>🔒</span>
                  <span style={{ color: '#a6ff00', fontSize: '10px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Document confidentiel</span>
                </div>
              </div>
            </div>

            {/* Score global */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '72px', fontWeight: '700', color: '#a6ff00', margin: 0, lineHeight: 1 }}>{ex.score_global}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score global / 10</p>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '32px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Insight stratégique</p>
                <p style={{ color: '#fff', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>{ex.insight}</p>
              </div>
            </div>
          </div>

          {/* ─── EXECUTIVE SUMMARY ─── */}
          <div className="pdf-block" style={{ background: '#fff', borderRadius: '12px', padding: '32px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700', margin: '0 0 24px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>Executive Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', margin: '0 0 12px' }}>3 Frictions majeures</p>
                {(ex.frictions || []).map((f: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ color: '#374151', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{f}</p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', margin: '0 0 12px' }}>3 Opportunités immédiates</p>
                {(ex.opportunites || []).map((o: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ color: '#374151', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>{o}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── PARCOURS CLIENT ─── */}
          <div className="pdf-block" style={{ background: '#fff', borderRadius: '12px', padding: '32px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700', margin: '0 0 24px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>Parcours client</h2>
            {[
              { label: 'Avant la visite', data: parc.avant || [], color: '#7C83FD' },
              { label: 'Pendant la visite', data: parc.pendant || [], color: '#EF9F27' },
              { label: 'Après la visite', data: parc.apres || [], color: '#16a34a' },
            ].map(({ label, data, color }) => (
              <div key={label} style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: color, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', margin: '0 0 12px' }}>{label}</p>
                {data.map((item: any) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <p style={{ color: '#374151', fontSize: '13px', flex: 1, margin: 0 }}>{item.label}</p>
                    <div style={{ width: '140px', height: '6px', background: '#f1f5f9', borderRadius: '3px', flexShrink: 0 }}>
                      <div style={{ width: `${item.score * 10}%`, height: '6px', background: scoreColor(item.score), borderRadius: '3px' }} />
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: scoreColorLight(item.score), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: scoreColor(item.score), fontSize: '13px', fontWeight: '700' }}>{item.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ─── ANALYSE COGNITIVE ─── */}
          <div className="pdf-block" style={{ background: '#fff', borderRadius: '12px', padding: '32px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700', margin: '0 0 24px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>Analyse cognitive</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { label: 'Surcharge mentale', data: cog.surcharge || [], color: '#dc2626', bg: '#fee2e2', icon: '🧠' },
                { label: 'Moments de doute', data: cog.doute || [], color: '#d97706', bg: '#fef3c7', icon: '😕' },
                { label: 'Moments waouh', data: cog.waouh || [], color: '#16a34a', bg: '#dcfce7', icon: '✨' },
              ].map(({ label, data, color, bg, icon }) => (
                <div key={label} style={{ background: bg, borderRadius: '10px', padding: '16px' }}>
                  <p style={{ fontSize: '11px', color: color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', margin: '0 0 12px' }}>{icon} {label}</p>
                  {data.map((obs: string, i: number) => (
                    <p key={i} style={{ fontSize: '12px', color: '#374151', margin: '0 0 8px', lineHeight: 1.5, paddingLeft: '8px', borderLeft: `2px solid ${color}` }}>{obs}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>

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

          {/* ─── SYNTHÈSE STRATÉGIQUE ─── */}
          <div className="pdf-block" style={{ background: '#fff', borderRadius: '12px', padding: '32px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ color: '#0f172a', fontSize: '16px', fontWeight: '700', margin: '0 0 24px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>Synthèse stratégique</h2>
            {syn.map((r: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', background: syntheseBg[r.type], color: syntheseColor[r.type], flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {syntheseLabel[r.type]}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: '500', margin: '0 0 3px' }}>{r.texte}</p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{r.poste} · {r.delai}</p>
                </div>
              </div>
            ))}
          </div>

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

        </div>
      </main>

      {/* ─── PIED DE PAGE PDF ─── */}
      <div className="print-only" style={{
        background: '#0f172a',
        padding: '14px 40px',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '2px solid #a6ff00'
      }}>
        {/* Logo pied de page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 210 210" fill="none">
            <path d="M 136 0 L 99 -54 L 68 0 L 3 0 L 67 -99 L 2 -194 L 69 -194 L 106 -141 L 137 -194 L 201 -194 L 136 -96 L 203 0 Z"
              transform="translate(3, 200)" fill="#a6ff00" />
          </svg>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.18em', color: '#fff', fontFamily: 'Arial' }}>NEUROPLAY</div>
            <div style={{ fontSize: '6px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)', fontFamily: 'Arial' }}>XPERIENCES</div>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '8px', margin: 0, textAlign: 'center', letterSpacing: '0.06em', fontFamily: 'Arial' }}>
          Document confidentiel — Usage exclusif de {mission?.clients?.nom} — Neuroplay Xpériences © {new Date().getFullYear()}
        </p>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px', margin: 0, textAlign: 'right', fontFamily: 'Arial' }}>
          Généré le {dateDoc}
        </p>
      </div>
    </>
  )
}
