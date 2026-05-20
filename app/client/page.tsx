'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const OFFRES = [
  { key: 'neuroaccess', label: 'NeuroAccess', color: '#c8f135', icon: '', desc: 'Diagnostic & parcours visiteur' },
  { key: 'neuroimpact', label: 'NeuroImpact', color: '#7C83FD', icon: '', desc: 'Mesure physiologique EDA/HRV' },
  { key: 'neurotaste', label: 'NeuroTaste', color: '#EF9F27', icon: '', desc: 'Expérience F&B & sensorielle' },
  { key: 'neuroaqua', label: 'NeuroAqua', color: '#60A5FA', icon: '', desc: 'Expérience aquatique & bien-être' },
  { key: 'neuromedia', label: 'NeuroMédia', color: '#F472B6', icon: '', desc: 'Contenu & communication' },
]

const PRESTATIONS = [
  {
    section: '🔍 Diagnostic',
    color: '#7C83FD',
    items: ['Avant la visite', 'Pendant la visite', 'Après la visite']
  },
  {
    section: '🗺️ Parcours',
    color: '#EF9F27',
    items: ['Accessibilité', 'Parking', 'Signalétique externe', 'Digital - Site web & réservation', 'Accueil humain', 'Fluidité du parcours', "Compréhension de l'offre & perception du prix", 'Friction F&B', 'Sortie', 'Souvenir & boutique', 'Recontact & fidélisation']
  },
  {
    section: '📊 Rapport',
    color: '#c8f135',
    items: ['Executive summary', 'Parcours client', 'Analyse cognitive', 'Synthèse stratégique', 'Score NeuroPlay']
  },
]

const statusColor: any = {
  publie: '#c8f135',
  brouillon: 'rgba(255,255,255,0.3)',
  'en cours': '#EF9F27'
}

function mediaIcon(type: string) {
  if (type === 'photo') return '📸'
  if (type === 'audio') return '🎙️'
  if (type === 'drone') return '🚁'
  return '🎥'
}

function mediaBorder(type: string) {
  if (type === 'drone') return '1px solid rgba(139,92,246,0.4)'
  return '1px solid rgba(55,138,221,0.3)'
}

export default function ClientPage() {
  const [client, setClient] = useState<any>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [offresActives, setOffresActives] = useState<string[]>([])
  const [missions, setMissions] = useState<any[]>([])
  const [medias, setMedias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(true)
  const [selectedOffre, setSelectedOffre] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, client_id')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') { window.location.href = '/dashboard'; return }

      if (profile?.client_id) {
        setClientId(profile.client_id)

        const { data: clientData } = await supabase
          .from('clients')
          .select('nom, offres_actives, plan')
          .eq('id', profile.client_id)
          .single()

        if (clientData) {
          setClient(clientData)
          setOffresActives(clientData.offres_actives || [])
        }

        const { data: missionsData } = await supabase
          .from('missions')
          .select('id, type, date_mission, statut')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false })
        if (missionsData) setMissions(missionsData)

        const { data: mediasData } = await supabase
          .from('medias')
          .select('*')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false })
        if (mediasData) setMedias(mediasData)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#0d1520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Arial' }}>Chargement...</p>
    </main>
  )

  const offresVisibles = OFFRES.filter(o => offresActives.includes(o.key))
  const offreSelectionnee = OFFRES.find(o => o.key === selectedOffre)

  const t = dark ? {
    bg: '#0d1520',
    card: '#1a2540',
    border: 'rgba(255,255,255,0.06)',
    borderHeader: 'rgba(255,255,255,0.08)',
    text: 'rgba(255,255,255,0.6)',
    textMuted: 'rgba(255,255,255,0.3)',
    textTitle: '#c8f135',
    toggleBg: 'rgba(255,255,255,0.08)',
    toggleColor: 'rgba(255,255,255,0.5)',
    sectionBg: (color: string) => `linear-gradient(90deg, ${color}18 0%, transparent 60%)`,
  } : {
    bg: '#F0F2F5',
    card: '#FFFFFF',
    border: 'rgba(0,0,0,0.07)',
    borderHeader: 'rgba(0,0,0,0.1)',
    text: '#374151',
    textMuted: '#9CA3AF',
    textTitle: '#111827',
    toggleBg: 'rgba(0,0,0,0.06)',
    toggleColor: '#374151',
    sectionBg: (color: string) => `linear-gradient(90deg, ${color}22 0%, transparent 60%)`,
  }

  // ── VUE MATRICE ──
  if (selectedOffre && offreSelectionnee) {
    return (
      <main style={{ minHeight: '100vh', background: t.bg, fontFamily: 'Arial, sans-serif', padding: '32px', overflowX: 'auto', transition: 'background 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setSelectedOffre(null)} style={{
              background: 'transparent', border: `1px solid ${t.border}`,
              borderRadius: '8px', color: t.textMuted,
              padding: '6px 14px', fontSize: '13px', cursor: 'pointer'
            }}>← Retour</button>
            <div>
              <h1 style={{ color: offreSelectionnee.color, fontSize: '20px', margin: '0 0 2px', fontWeight: '700' }}>
                {offreSelectionnee.label}
              </h1>
              <p style={{ color: t.textMuted, fontSize: '12px', margin: 0 }}>{client?.nom}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setDark(!dark)} style={{
              background: t.toggleBg, border: 'none', borderRadius: '20px',
              padding: '6px 14px', fontSize: '13px', cursor: 'pointer', color: t.toggleColor
            }}>{dark ? '☀️ Clair' : '🌙 Sombre'}</button>
            <button onClick={handleLogout} style={{
              background: 'transparent', border: `1px solid ${t.border}`,
              borderRadius: '8px', color: t.textMuted,
              padding: '6px 14px', fontSize: '13px', cursor: 'pointer'
            }}>Déconnexion</button>
          </div>
        </div>

        <div style={{ background: t.card, borderRadius: '12px', border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: dark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', color: t.textMuted, fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `2px solid ${t.borderHeader}` }}>
                  Prestations
                </th>
                <th style={{ padding: '16px 24px', textAlign: 'center', borderBottom: `2px solid ${t.borderHeader}`, minWidth: '160px' }}>
                  <span style={{ color: offreSelectionnee.color, fontSize: '14px', fontWeight: '700' }}>
                    {offreSelectionnee.label}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PRESTATIONS.map((section, si) => (
                <>
                  <tr key={`section-${si}`}>
                    <td colSpan={2} style={{ padding: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 24px',
                        background: t.sectionBg(section.color),
                        borderTop: si > 0 ? `2px solid ${section.color}40` : 'none',
                        borderBottom: `1px solid ${section.color}30`,
                      }}>
                        <div style={{ width: '4px', height: '20px', borderRadius: '2px', background: section.color, flexShrink: 0 }} />
                        <p style={{ color: section.color, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>{section.section}</p>
                      </div>
                    </td>
                  </tr>
                  {section.items.map((item, ii) => (
                    <tr key={item} style={{
                      borderBottom: ii < section.items.length - 1 ? `1px solid ${section.color}20` : 'none',
                      background: `${section.color}10`
                    }}>
                      <td style={{ padding: '13px 24px 13px 36px', color: t.text, fontSize: '13px' }}>{item}</td>
                      <td style={{ padding: '13px 24px', textAlign: 'center' }}>
                        <span style={{ color: offreSelectionnee.color, fontSize: '16px' }}>✓</span>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    )
  }

  // ── HUB PRINCIPAL ──
  return (
    <main style={{ minHeight: '100vh', background: t.bg, fontFamily: 'Arial, sans-serif', padding: '32px', transition: 'background 0.2s' }}>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, cursor: 'zoom-out'
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }} />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <p style={{ color: t.textMuted, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 4px' }}>NeuroXperiences</p>
          <h1 style={{ color: t.textTitle, fontSize: '22px', margin: '0 0 2px', fontWeight: '700' }}>Bienvenue</h1>
          <p style={{ color: t.text, fontSize: '14px', margin: 0 }}>{client?.nom}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setDark(!dark)} style={{
            background: t.toggleBg, border: 'none', borderRadius: '20px',
            padding: '6px 14px', fontSize: '13px', cursor: 'pointer', color: t.toggleColor
          }}>{dark ? '☀️ Clair' : '🌙 Sombre'}</button>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: `1px solid ${t.border}`,
            borderRadius: '8px', color: t.textMuted,
            padding: '6px 14px', fontSize: '13px', cursor: 'pointer'
          }}>Déconnexion</button>
        </div>
      </div>

      {/* 1 — Bandeau formule */}
      <div style={{
        background: t.card, borderRadius: '10px', border: `1px solid ${t.border}`,
        padding: '12px 20px', marginBottom: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        boxShadow: dark ? 'none' : '0 1px 6px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <p style={{ color: t.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Formule</p>
          <span style={{ color: t.text, fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>{client?.plan || 'Managed'}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {offresVisibles.map(o => (
            <span key={o.key} style={{
              padding: '3px 10px', borderRadius: '20px',
              border: `1px solid ${o.color}`, color: o.color,
              fontSize: '11px', fontWeight: '700', textTransform: 'uppercase'
            }}>{o.label}</span>
          ))}
        </div>
      </div>

      {/* 2 — Offres */}
      <p style={{ color: t.textMuted, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
        Choisissez votre offre
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '36px' }}>
        {OFFRES.map(o => {
          const active = offresActives.includes(o.key)
          return (
            <div key={o.key} onClick={() => active && setSelectedOffre(o.key)}
              style={{
                background: active ? t.card : dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
                border: active ? `1px solid ${o.color}40` : `1px solid ${t.border}`,
                borderRadius: '14px', padding: '20px',
                cursor: active ? 'pointer' : 'not-allowed',
                opacity: active ? 1 : 0.35,
                minHeight: '140px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: active && !dark ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
              }}
              onMouseEnter={e => { if (active) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${o.color}20` } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = active && !dark ? '0 2px 12px rgba(0,0,0,0.06)' : 'none' }}
            >
              <p style={{ color: active ? o.color : t.textMuted, fontSize: '13px', fontWeight: '700', margin: '0 0 4px' }}>{o.label}</p>
              <p style={{ color: t.textMuted, fontSize: '12px', margin: '0 0 14px', lineHeight: 1.4 }}>{o.desc}</p>
              {active ? (
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${o.color}`, color: o.color, fontWeight: '600' }}>Accéder →</span>
              ) : (
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${t.border}`, color: t.textMuted }}>Non souscrit</span>
              )}
            </div>
          )
        })}
      </div>

      {/* 3 — Mes rapports */}
      <p style={{ color: t.textMuted, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
        Mes rapports
      </p>
      <div style={{ background: t.card, borderRadius: '12px', border: `1px solid ${t.border}`, padding: '8px 0', marginBottom: '36px', boxShadow: dark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)' }}>
        {missions.length === 0 ? (
          <p style={{ color: t.textMuted, fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>Aucun rapport disponible pour l'instant.</p>
        ) : (
          missions.map(m => (
            <div key={m.id} onClick={() => window.location.href = `/rapport/${m.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', cursor: 'pointer', borderBottom: '1px solid ' + t.border, transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: dark ? 'rgba(200,241,53,0.08)' : 'rgba(200,241,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: '#c8f135', flexShrink: 0 }}>
                {(m.type || 'D').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: t.text, fontSize: '14px', fontWeight: '500', margin: '0 0 2px' }}>{m.type || 'Diagnostic'}</p>
                <p style={{ color: t.textMuted, fontSize: '12px', margin: 0 }}>{m.date_mission || '—'}</p>
              </div>
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${statusColor[m.statut] || t.border}`, color: statusColor[m.statut] || t.textMuted }}>{m.statut}</span>
              <span style={{ color: t.textMuted, fontSize: '16px' }}>→</span>
            </div>
          ))
        )}
      </div>

      {/* 4 — Mes médias terrain */}
      <p style={{ color: t.textMuted, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
        Mes médias terrain
      </p>
      <div style={{ background: t.card, borderRadius: '12px', border: `1px solid ${t.border}`, padding: '20px', boxShadow: dark ? 'none' : '0 2px 16px rgba(0,0,0,0.06)' }}>
        {medias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: t.textMuted, fontSize: '14px', margin: '0 0 8px' }}>Aucun média pour l'instant.</p>
            <p style={{ color: t.textMuted, fontSize: '12px', margin: 0, opacity: 0.6 }}>Photos, vidéos, notes vocales et vues drone apparaîtront ici.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {medias.map(m => (
              <div key={m.id}
                style={{ borderRadius: '10px', overflow: 'hidden', border: mediaBorder(m.type), cursor: (m.type === 'photo' || m.type === 'drone') ? 'zoom-in' : 'default', position: 'relative' }}
                onClick={() => (m.type === 'photo' || m.type === 'drone') && setLightbox(m.url)}>
                {m.type === 'photo' ? (
                  <img src={m.url} alt={m.nom} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                ) : m.type === 'drone' ? (
                  <div style={{ position: 'relative' }}>
                    <img src={m.url} alt={m.nom} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(139,92,246,0.8)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: '#fff', fontWeight: '600' }}>🚁 DRONE</div>
                  </div>
                ) : m.type === 'audio' ? (
                  <div style={{ width: '100%', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,149,0,0.08)', gap: '10px' }}>
                    <span style={{ fontSize: '32px' }}>🎙️</span>
                    <audio src={m.url} controls style={{ width: '90%' }} />
                  </div>
                ) : (
                  <video src={m.url} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} controls />
                )}
                <div style={{ padding: '8px 10px', background: t.card }}>
                  <p style={{ color: t.textMuted, fontSize: '11px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.poste || m.nom}</p>
                </div>
                <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', color: '#fff' }}>
                  {mediaIcon(m.type)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}
