'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [missions, setMissions] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [medias, setMedias] = useState<any[]>([])
  const [selectedMissionId, setSelectedMissionId] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [showMedias, setShowMedias] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = '/'
      else setUser(data.user)
    })
    loadMissions()
    loadClients()
    loadMedias()
  }, [])

  async function loadMissions() {
    const { data } = await supabase
      .from('missions')
      .select('*, clients(nom, secteur)')
      .order('created_at', { ascending: false })
    if (data) setMissions(data)
  }

  async function loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, nom, secteur_cible, plan, offres_actives, statut')
      .order('created_at', { ascending: false })
    if (data) setClients(data)
  }

  async function loadMedias() {
    const { data } = await supabase
      .from('medias')
      .select('*, missions(client_id, clients(nom))')
      .order('created_at', { ascending: false })
    if (data) setMedias(data)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !selectedMissionId) return
    setUploading(true)

    const mission = missions.find(m => m.id === selectedMissionId)
    const clientId = mission?.client_id

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${clientId}/${Date.now()}.${ext}`
      const isVideo = file.type.startsWith('video/')

      const { error: uploadError } = await supabase.storage
        .from('medias')
        .upload(path, file)

      if (uploadError) { console.error(uploadError); continue }

      const { data: urlData } = supabase.storage.from('medias').getPublicUrl(path)

      await supabase.from('medias').insert({
        client_id: clientId,
        mission_id: selectedMissionId,
        type: isVideo ? 'video' : 'photo',
        url: urlData.publicUrl,
        nom: file.name,
      })
    }

    await loadMedias()
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDeleteMedia(id: string) {
    await supabase.from('medias').delete().eq('id', id)
    await loadMedias()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const statusColor: any = {
    publie: '#c8f135',
    brouillon: 'rgba(255,255,255,0.3)',
    'en cours': '#EF9F27'
  }

  const offreColor: any = {
    neuroaccess: '#c8f135',
    neurotaste: '#EF9F27',
    neuroimpact: '#7C83FD',
    neuroaqua: '#60A5FA',
    neuromedia: '#F472B6',
  }

  const mediasFiltered = selectedMissionId
    ? medias.filter(m => m.mission_id === selectedMissionId)
    : medias

  return (
    <main style={{ minHeight: '100vh', background: '#0d1520', fontFamily: 'Arial, sans-serif', padding: '32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <h1 style={{ color: '#c8f135', fontSize: '22px', margin: 0 }}>NeuroAccess · Rapports</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px', color: 'rgba(255,255,255,0.5)',
            padding: '6px 14px', fontSize: '13px', cursor: 'pointer'
          }}>Déconnexion</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          ['Clients actifs', clients.filter(c => c.statut === 'actif').length.toString()],
          ['Rapports publiés', missions.filter(m => m.statut === 'publie').length.toString()],
          ['En cours', missions.filter(m => m.statut === 'en cours').length.toString()]
        ].map(([label, val]) => (
          <div key={label} style={{ background: '#1a2540', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 8px' }}>{label}</p>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: '500', margin: 0 }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Bouton Ben */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => window.location.href = '/terrain'} style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          background: 'rgba(200,241,53,0.06)', border: '1px solid rgba(200,241,53,0.25)',
          borderRadius: '14px', padding: '18px 24px',
          cursor: 'pointer', width: '100%', textAlign: 'left'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #c8f135', flexShrink: 0 }}>
            <img src="/ben.jpg" alt="Ben" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <p style={{ color: '#c8f135', fontSize: '15px', fontWeight: '700', margin: '0 0 3px' }}>Démarrer un diagnostic terrain</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Ben te guide poste par poste sur le site →</p>
          </div>
          <div style={{ marginLeft: 'auto', color: '#c8f135', fontSize: '20px' }}>→</div>
        </button>
      </div>

      {/* Bloc Clients */}
      <div style={{ background: '#1a2540', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', marginBottom: '24px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Clients</p>
        {clients.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Aucun client pour l'instant.</p>
        ) : (
          clients.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(200,241,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8f135', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                {c.nom?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '500', margin: '0 0 4px' }}>{c.nom}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>{c.secteur_cible || '—'}</p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {(c.offres_actives || []).map((offre: string) => (
                  <span key={offre} style={{ fontSize: '10px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px', border: `1px solid ${offreColor[offre] || 'rgba(255,255,255,0.2)'}`, color: offreColor[offre] || 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {offre}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
                {c.plan || 'managed'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Missions récentes */}
      <div style={{ background: '#1a2540', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', marginBottom: '24px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 16px' }}>Missions récentes</p>
        {missions.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>Aucune mission pour l'instant.</p>
        ) : (
          missions.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
              onClick={() => window.location.href = `/rapport/${m.id}`}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(200,241,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8f135', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                {m.clients?.nom?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: '500', margin: '0 0 2px' }}>{m.clients?.nom}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{m.type} · {m.date_mission}</p>
              </div>
              <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${statusColor[m.statut]}`, color: statusColor[m.statut] }}>
                {m.statut}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Bloc Médias */}
      <div style={{ background: '#1a2540', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Médias terrain</p>
          <button onClick={() => setShowMedias(!showMedias)} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: 'rgba(255,255,255,0.4)',
            padding: '4px 12px', fontSize: '12px', cursor: 'pointer'
          }}>{showMedias ? '− Réduire' : '+ Afficher'}</button>
        </div>

        {showMedias && (
          <>
            {/* Sélecteur mission + upload */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <select
                value={selectedMissionId}
                onChange={e => setSelectedMissionId(e.target.value)}
                style={{
                  flex: 1, minWidth: '200px', padding: '8px 12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: selectedMissionId ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontSize: '13px', cursor: 'pointer'
                }}>
                <option value="">— Toutes les missions</option>
                {missions.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#1a2540' }}>
                    {m.clients?.nom} · {m.type} · {m.date_mission}
                  </option>
                ))}
              </select>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
              <button
                onClick={() => { if (!selectedMissionId) { alert('Sélectionne une mission d\'abord'); return }; fileInputRef.current?.click() }}
                disabled={uploading}
                style={{
                  background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.3)',
                  borderRadius: '8px', color: '#c8f135', fontSize: '12px', fontWeight: '600',
                  padding: '8px 16px', cursor: uploading ? 'wait' : 'pointer',
                  opacity: uploading ? 0.6 : 1, whiteSpace: 'nowrap'
                }}>
                {uploading ? 'Upload...' : '+ Ajouter des fichiers'}
              </button>
            </div>

            {/* Grille médias */}
            {mediasFiltered.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                Aucun média {selectedMissionId ? 'pour cette mission' : ''}.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {mediasFiltered.map(m => (
                  <div key={m.id} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                    {m.type === 'photo' ? (
                      <img src={m.url} alt={m.nom} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <video src={m.url} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} controls />
                    )}
                    <div style={{ padding: '6px 10px', background: '#111d30' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nom}</p>
                      {m.missions?.clients?.nom && (
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', margin: '2px 0 0' }}>{m.missions.clients.nom}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(m.id)}
                      style={{
                        position: 'absolute', top: '6px', right: '6px',
                        background: 'rgba(226,75,74,0.8)', border: 'none',
                        borderRadius: '4px', color: '#fff', fontSize: '11px',
                        padding: '2px 6px', cursor: 'pointer'
                      }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </main>
  )
}
