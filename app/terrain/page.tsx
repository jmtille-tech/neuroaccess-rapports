'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const protocole = [
  {
    phase: 'Avant la visite',
    postes: [
      {
        nom: 'Accessibilité',
        questions: [
          "Le site est-il accessible en transport en commun ? L'information est-elle disponible facilement ?",
          'Y a-t-il des aménagements PMR visibles et fonctionnels ?',
          "L'accès est-il indiqué depuis les axes principaux ?",
        ],
        neuro: "Combien d'étapes faut-il pour trouver comment venir ? C'est simple ou stressant ?",
        media: ['Note vocale', 'Photo signalétique routière']
      },
      {
        nom: 'Parking',
        questions: [
          'Le parking est-il facile à trouver et à comprendre ?',
          "La distance entre le parking et l'entrée est-elle clairement indiquée ?",
          "Y a-t-il des places PMR, familles, vélos, bornes électriques ?",
        ],
        neuro: "Combien de décisions à prendre depuis l'arrivée en voiture jusqu'à l'entrée ?",
        media: ['Note vocale', 'Photo entrée parking', 'Drone vue parking']
      },
      {
        nom: 'Signalétique externe',
        questions: [
          'La signalétique est-elle visible, lisible, cohérente depuis la voie publique ?',
          "Y a-t-il une continuité visuelle entre le parking et l'entrée du site ?",
        ],
        neuro: "Y a-t-il un élément visuel fort qui crée de l'excitation avant même d'entrer ?",
        media: ['Photo signalétique', 'Vidéo cheminement']
      },
      {
        nom: 'Digital site web et reservation',
        questions: [
          "Le site est-il lisible sur mobile ? L'achat de billet est-il fluide en moins de 3 minutes ?",
          'Les tarifs, horaires et infos pratiques sont-ils visibles sans chercher ?',
          "Y a-t-il des options de prévente, abonnements, offres famille mises en avant ?",
        ],
        neuro: "Nombre de clics pour acheter un billet ? Y a-t-il des étapes inutiles ou confuses ?",
        media: ['Note vocale parcours achat', 'Screenshot mobile']
      },
    ]
  },
  {
    phase: 'Pendant la visite',
    postes: [
      {
        nom: 'Accueil humain',
        questions: [
          "Le personnel d'accueil est-il identifiable, souriant, proactif ?",
          'Le temps de passage en caisse / contrôle est-il acceptable (< 2 min) ?',
          "Y a-t-il une information de bienvenue claire sur ce qu'il y a à faire/voir ?",
        ],
        neuro: "Y a-t-il un geste d'accueil mémorable ? Quelque chose qui surprend positivement ?",
        media: ["Note vocale 1ère impression", 'Vidéo zone accueil']
      },
      {
        nom: 'Fluidité du parcours',
        questions: [
          'Les zones sont-elles bien délimitées et compréhensibles sans carte ?',
          'Y a-t-il des zones de congestion ou des zones désertes ?',
          "Le visiteur est-il naturellement guidé vers les activités à fort intérêt ?",
        ],
        neuro: "Faut-il réfléchir pour savoir où aller ? Le parcours est-il intuitif ?",
        media: ['Drone flux global', 'Vidéo zones clés']
      },
      {
        nom: 'Comprehension offre et perception prix',
        questions: [
          'Les prix sont-ils affichés clairement aux points de vente ?',
          "Le visiteur comprend-il ce qui est inclus dans son billet vs en supplément ?",
          "Y a-t-il des opportunités de vente additionnelle bien intégrées ?",
        ],
        neuro: "Le visiteur doit-il calculer, comparer, choisir sous pression ?",
        media: ['Photo affichage prix', 'Note vocale perception']
      },
      {
        nom: 'Friction FB',
        questions: [
          'Les points F&B sont-ils visibles et accessibles depuis les zones de forte fréquentation ?',
          "L'offre est-elle lisible ? Les menus sont-ils clairs et attractifs ?",
          "Le temps d'attente F&B est-il raisonnable ?",
          'La qualité perçue est-elle cohérente avec le prix affiché ?',
        ],
        neuro: "Y a-t-il un élément F&B mémorable, signature, qui renforce l'identité du lieu ?",
        media: ['Photo menus et implantation', 'Vidéo flux FB']
      },
    ]
  },
  {
    phase: 'Après la visite',
    postes: [
      {
        nom: 'Sortie',
        questions: [
          'La sortie est-elle clairement indiquée ?',
          'Le visiteur repart-il avec une bonne dernière image ?',
          "Y a-t-il un message de remerciement / au revoir visible ?",
        ],
        neuro: "Y a-t-il un dernier geste fort qui clôt l'expérience de façon mémorable ?",
        media: ['Note vocale impression finale', 'Photo zone sortie']
      },
      {
        nom: 'Souvenir et boutique',
        questions: [
          "Y a-t-il une boutique ou un point souvenir bien placé avant la sortie ?",
          "L'offre souvenir est-elle en cohérence avec l'identité du lieu ?",
          "Y a-t-il une photo souvenir proposée ?",
        ],
        neuro: "Y a-t-il un produit souvenir vraiment original, qu'on ne trouve nulle part ailleurs ?",
        media: ['Photo boutique et offre', 'Note vocale']
      },
      {
        nom: 'Recontact et fidelisation',
        questions: [
          "Y a-t-il une invitation à revenir ? (abonnement, offre fidélité, prochain événement)",
          "Y a-t-il un dispositif de collecte d'avis sur place ?",
          'Le visiteur reçoit-il un email de suivi / enquête satisfaction ?',
          'Les réseaux sociaux sont-ils mis en avant ?',
        ],
        neuro: "Laisser un avis est-il simple et rapide ? Y a-t-il une raison évidente de revenir ?",
        media: ['Photo dispositifs fidelisation', 'Note vocale globale']
      },
    ]
  }
]

const allPostes = protocole.flatMap(p => p.postes.map(poste => ({ ...poste, phase: p.phase })))

function sanitize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50)
}

export default function Terrain() {
  const [etape, setEtape] = useState<'selection' | 'intro' | 'terrain' | 'generation' | 'fin'>('selection')
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedMissionId, setSelectedMissionId] = useState<string>('')
  const [missions, setMissions] = useState<any[]>([])
  const [posteIndex, setPosteIndex] = useState(0)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [noteActuelle, setNoteActuelle] = useState('')
  const [rapport, setRapport] = useState<any>(null)
  const [erreur, setErreur] = useState('')
  const [uploadingPoste, setUploadingPoste] = useState(false)
  const [mediasParPoste, setMediasParPoste] = useState<Record<string, any[]>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [enregistrement, setEnregistrement] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('id, nom').eq('statut', 'actif').then(({ data }) => {
      if (data) setClients(data)
    })
  }, [])

  useEffect(() => {
    if (!selectedClientId) return
    supabase.from('missions').select('id, type, date_mission').eq('client_id', selectedClientId).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setMissions(data)
    })
  }, [selectedClientId])

  const poste = allPostes[posteIndex]
  const total = allPostes.length
  const progression = Math.round(((posteIndex) / total) * 100)
  const selectedClient = clients.find(c => c.id === selectedClientId)

  async function handleUploadPoste(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !selectedClientId) return
    setUploadingPoste(true)

    const newMedias: any[] = []
    for (const file of Array.from(files)) {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const safePoste = sanitize(poste.nom)
        const safeFile = sanitize(file.name.replace(/\.[^.]+$/, ''))
        const path = `${selectedClientId}/${Date.now()}_${safePoste}_${safeFile}.${ext}`
        const isVideo = file.type.startsWith('video/')

        const { error: uploadError } = await supabase.storage.from('medias').upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        const { data: urlData } = supabase.storage.from('medias').getPublicUrl(path)

        const { data: mediaData, error: insertError } = await supabase.from('medias').insert({
          client_id: selectedClientId,
          mission_id: selectedMissionId || null,
          type: isVideo ? 'video' : 'photo',
          url: urlData.publicUrl,
          nom: file.name,
          poste: poste.nom,
        }).select().single()

        if (insertError) {
          console.error('Insert error:', insertError)
          continue
        }

        if (mediaData) newMedias.push(mediaData)
      } catch (err) {
        console.error('Error processing file:', err)
      }
    }

    setMediasParPoste(prev => ({
      ...prev,
      [poste.nom]: [...(prev[poste.nom] || []), ...newMedias]
    }))

    setUploadingPoste(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function sauvegarderEtContinuer() {
    const nouvellesNotes = { ...notes }
    if (noteActuelle.trim()) {
      nouvellesNotes[poste.nom] = noteActuelle
      setNotes(nouvellesNotes)
    }
    setNoteActuelle('')
    if (posteIndex < total - 1) {
      setPosteIndex(posteIndex + 1)
    } else {
      genererRapport(nouvellesNotes)
    }
  }

  function precedent() {
    if (posteIndex > 0) {
      setNoteActuelle(notes[allPostes[posteIndex - 1].nom] || '')
      setPosteIndex(posteIndex - 1)
    }
  }

  async function genererRapport(notesFinales: Record<string, string>) {
    setEtape('generation')
    setErreur('')
    try {
      const res = await fetch('/api/generer-rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notesFinales,
          client_nom: selectedClient?.nom || 'Diagnostic terrain',
          mission_id: selectedMissionId || null
        })
      })
      const data = await res.json()
      if (data.success) {
        setRapport(data.rapport)
        setEtape('fin')
      } else {
        setErreur(data.error || 'Erreur lors de la génération')
        setEtape('fin')
      }
    } catch (e: any) {
      setErreur(e.message)
      setEtape('fin')
    }
  }

  const scoreColor = (s: number) => s >= 7 ? '#c8f135' : s >= 5 ? '#EF9F27' : '#E24B4A'

  const toggleEnregistrement = async () => {
    if (enregistrement) {
      mediaRecorderRef.current?.stop()
      setEnregistrement(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/mp4' })
        const file = new File([blob], `vocal_${Date.now()}.${mimeType?.includes('mp4') ? 'mp4' : 'webm'}`, { type: 'audio/mp4' })
        setUploadingAudio(true)
        const path = `${selectedClientId}/${sanitize(poste.nom)}_vocal_${Date.now()}.${mimeType?.includes('mp4') ? 'mp4' : 'webm'}`
        const { error: upErr } = await supabase.storage.from('medias').upload(path, file, { upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('medias').getPublicUrl(path)
          const { data: mediaData } = await supabase.from('medias').insert({
            client_id: selectedClientId,
            mission_id: selectedMissionId || null,
            poste: poste.nom,
            type: 'audio',
            url: urlData.publicUrl,
            nom: file.name
          }).select().single()
          if (mediaData) setMediasParPoste(prev => ({ ...prev, [poste.nom]: [...(prev[poste.nom] || []), mediaData] }))
        }
        setUploadingAudio(false)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setEnregistrement(true)
    } catch {
      setErreur('Micro non accessible')
    }
  }

  const mediasPosteActuel = mediasParPoste[poste?.nom] || []

  // ── SÉLECTION CLIENT ──
  if (etape === 'selection') return (
    <main style={{ minHeight: '100vh', background: '#0d1520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #c8f135', marginBottom: '20px' }}>
        <img src="/ben.jpg" alt="Ben" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h1 style={{ color: '#c8f135', fontSize: '22px', fontWeight: '700', margin: '0 0 8px', textAlign: 'center' }}>Pour quel client ?</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', margin: '0 0 32px' }}>
        Sélectionne le client avant de démarrer le diagnostic
      </p>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Client</p>
        <select value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); setSelectedMissionId('') }}
          style={{ width: '100%', padding: '12px 16px', marginBottom: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: selectedClientId ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '14px', cursor: 'pointer', boxSizing: 'border-box' }}>
          <option value="">— Sélectionner un client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id} style={{ background: '#1a2540' }}>{c.nom}</option>
          ))}
        </select>

        {selectedClientId && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Mission (optionnel)</p>
            <select value={selectedMissionId} onChange={e => setSelectedMissionId(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: selectedMissionId ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '14px', cursor: 'pointer', boxSizing: 'border-box' }}>
              <option value="">— Sans mission spécifique</option>
              {missions.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#1a2540' }}>{m.type} · {m.date_mission}</option>
              ))}
            </select>
          </>
        )}

        <button onClick={() => selectedClientId && setEtape('intro')} disabled={!selectedClientId}
          style={{ width: '100%', background: selectedClientId ? '#c8f135' : 'rgba(255,255,255,0.1)', color: selectedClientId ? '#0d1520' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: selectedClientId ? 'pointer' : 'not-allowed' }}>
          Continuer →
        </button>
      </div>
    </main>
  )

  if (etape === 'intro') return (
    <main style={{ minHeight: '100vh', background: '#0d1520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #c8f135', marginBottom: '20px' }}>
        <img src="/ben.jpg" alt="Ben" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h1 style={{ color: '#c8f135', fontSize: '22px', fontWeight: '700', margin: '0 0 8px', textAlign: 'center' }}>Bonjour, je suis Ben</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 4px', textAlign: 'center' }}>
        Diagnostic pour <strong style={{ color: '#fff' }}>{selectedClient?.nom}</strong>
      </p>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6, maxWidth: '320px' }}>
        Je vais te guider poste par poste. On a <strong style={{ color: '#fff' }}>{total} postes</strong> à couvrir. Tu pourras ajouter des photos à chaque poste.
      </p>
      <div style={{ width: '100%', maxWidth: '360px', marginBottom: '24px' }}>
        {protocole.map(p => (
          <div key={p.phase} style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{p.phase}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {p.postes.map(po => (
                <span key={po.nom} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: 'rgba(200,241,53,0.08)', border: '0.5px solid rgba(200,241,53,0.2)', color: 'rgba(255,255,255,0.6)' }}>{po.nom}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setEtape('terrain')} style={{ background: '#c8f135', color: '#0d1520', border: 'none', borderRadius: '12px', padding: '14px 32px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', width: '100%', maxWidth: '360px' }}>
        Commencer le diagnostic →
      </button>
    </main>
  )

  if (etape === 'generation') return (
    <main style={{ minHeight: '100vh', background: '#0d1520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #c8f135', marginBottom: '20px' }}>
        <img src="/ben.jpg" alt="Ben" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h1 style={{ color: '#c8f135', fontSize: '20px', fontWeight: '700', margin: '0 0 12px', textAlign: 'center' }}>Ben analyse tes observations...</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', textAlign: 'center', margin: '0 0 32px' }}>Génération du rapport en cours — 20 à 30 secondes</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c8f135', animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite alternate` }} />
        ))}
      </div>
      <style>{`@keyframes pulse { from { opacity: 0.2; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }`}</style>
    </main>
  )

  if (etape === 'fin') return (
    <main style={{ minHeight: '100vh', background: '#0d1520', fontFamily: 'Arial, sans-serif', padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #c8f135', marginBottom: '16px' }}>
          <img src="/ben.jpg" alt="Ben" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ color: '#c8f135', fontSize: '20px', fontWeight: '700', margin: '0 0 8px', textAlign: 'center' }}>
          {rapport ? 'Rapport généré !' : 'Diagnostic terminé'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', margin: 0 }}>
          {rapport ? `Ben a analysé toutes tes observations pour ${selectedClient?.nom}` : erreur}
        </p>
      </div>
      {rapport && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: '12px' }}>
            <p style={{ fontSize: '48px', fontWeight: '700', color: '#c8f135', margin: '0 0 4px', lineHeight: 1 }}>{rapport.executive_summary?.score_global}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score global / 10</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Frictions</p>
              {(rapport.executive_summary?.frictions || []).map((f: string, i: number) => (
                <p key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: '0 0 6px', paddingLeft: '8px', borderLeft: '2px solid #E24B4A', lineHeight: 1.4 }}>{f}</p>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Opportunités</p>
              {(rapport.executive_summary?.opportunites || []).map((o: string, i: number) => (
                <p key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: '0 0 6px', paddingLeft: '8px', borderLeft: '2px solid #c8f135', lineHeight: 1.4 }}>{o}</p>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Score NeuroPlay</p>
            {Object.entries(rapport.score_neuroplay || {}).map(([key, val]: any) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize', minWidth: '140px' }}>{key.replace('_', ' ')}</span>
                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                  <div style={{ width: `${val * 10}%`, height: '4px', background: scoreColor(val), borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '500', color: scoreColor(val), minWidth: '24px' }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setEtape('selection'); setPosteIndex(0); setNotes({}); setNoteActuelle(''); setRapport(null); setSelectedClientId(''); setSelectedMissionId(''); setMediasParPoste({}) }}
              style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '14px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer' }}>
              Nouveau diagnostic
            </button>
            <button onClick={() => window.location.href = '/dashboard'}
              style={{ flex: 2, background: '#c8f135', color: '#0d1520', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              Dashboard →
            </button>
          </div>
        </div>
      )}
    </main>
  )

  // ── TERRAIN ──
  return (
    <main style={{ minHeight: '100vh', background: '#0d1520', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#111d30', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #c8f135', flexShrink: 0 }}>
          <img src="/ben.jpg" alt="Ben" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#c8f135', fontSize: '13px', fontWeight: '700', margin: 0 }}>Ben · {selectedClient?.nom}</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{poste.phase}</p>
        </div>
       <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{posteIndex + 1}/{total}</span>
        <button onClick={() => { if (window.confirm('Quitter le diagnostic ? Tes notes seront perdues.')) window.location.href = '/dashboard' }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', marginLeft: '8px' }}>✕</button>
      </div>

      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ height: '3px', width: `${progression}%`, background: '#c8f135', transition: 'width 0.3s' }} />
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Poste {posteIndex + 1}</p>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0 }}>{poste.nom}</h2>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Observer & évaluer</p>
          {poste.questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8f135', flexShrink: 0, marginTop: '6px' }} />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>{q}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(200,241,53,0.05)', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '0.5px solid rgba(200,241,53,0.15)' }}>
          <p style={{ fontSize: '11px', color: '#c8f135', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>🧠 Question neuro</p>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>{poste.neuro}</p>
        </div>

        {/* Upload photos/vidéos + vocal */}
        <div style={{ background: 'rgba(55,138,221,0.05)', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '0.5px solid rgba(55,138,221,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mediasPosteActuel.length > 0 ? '12px' : '0' }}>
            <p style={{ fontSize: '11px', color: 'rgba(55,138,221,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              📸 Médias
              {mediasPosteActuel.length > 0 && (
                <span style={{ marginLeft: '8px', background: 'rgba(55,138,221,0.2)', borderRadius: '10px', padding: '1px 7px', fontSize: '10px' }}>
                  {mediasPosteActuel.length}
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleUploadPoste} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPoste}
                style={{ background: 'rgba(55,138,221,0.15)', border: '1px solid rgba(55,138,221,0.3)', borderRadius: '8px', color: 'rgba(55,138,221,0.9)', fontSize: '12px', fontWeight: '600', padding: '5px 12px', cursor: uploadingPoste ? 'wait' : 'pointer', opacity: uploadingPoste ? 0.6 : 1 }}>
                {uploadingPoste ? 'Upload...' : '+ Photo / Vidéo'}
              </button>
              <button
                onClick={toggleEnregistrement}
                disabled={uploadingAudio}
                style={{ background: enregistrement ? 'rgba(255,59,48,0.2)' : 'rgba(255,149,0,0.15)', border: enregistrement ? '1px solid rgba(255,59,48,0.5)' : '1px solid rgba(255,149,0,0.3)', borderRadius: '8px', color: enregistrement ? 'rgb(255,59,48)' : 'rgba(255,149,0,0.9)', fontSize: '12px', fontWeight: '600', padding: '5px 12px', cursor: 'pointer' }}>
                {uploadingAudio ? 'Envoi...' : enregistrement ? '⏹ Stop' : '🎙️ Vocal'}
              </button>
            </div>
          </div>
          {mediasPosteActuel.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {mediasPosteActuel.map(m => (
                <div key={m.id} style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(55,138,221,0.3)' }}>
                  {m.type === 'photo' ? (
                    <img src={m.url} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : m.type === 'audio' ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,149,0,0.1)', fontSize: '24px' }}>🎙️</div>
                  ) : (
                    <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Tes observations</p>
          <textarea value={noteActuelle} onChange={e => setNoteActuelle(e.target.value)} placeholder="Note tes observations ici..." rows={4}
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '14px', resize: 'none', fontFamily: 'Arial', boxSizing: 'border-box', lineHeight: 1.6 }} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {posteIndex > 0 && (
            <button onClick={precedent} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '14px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', cursor: 'pointer' }}>
              ← Précédent
            </button>
          )}
          <button onClick={sauvegarderEtContinuer} style={{ flex: 2, background: '#c8f135', color: '#0d1520', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
            {posteIndex < total - 1 ? 'Suivant →' : 'Générer le rapport ✓'}
          </button>
        </div>
      </div>
    </main>
  )
}
