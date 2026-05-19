import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
 
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
 
function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
 
export async function POST(req: NextRequest) {
  try {
    const { notes, client_nom, mission_id } = await req.json()
 
    const notesTexte = Object.entries(notes)
      .map(([poste, note]) => `## ${poste}\n${note}`)
      .join('\n\n')
 
    const prompt = `Tu es Ben, agent expert en expérience visiteur et neurosciences appliquées pour Neuroplay Xpériences.
 
Tu as effectué un diagnostic terrain et voici tes observations par poste :
 
${notesTexte}
 
Sur la base de ces observations, génère un rapport structuré au format JSON strict.
IMPORTANT : réponds UNIQUEMENT avec le JSON brut, sans aucun texte avant ou après, sans markdown, sans backticks, sans explication. Commence directement par { et termine par }.
 
Le JSON doit avoir exactement cette structure :
{
  "executive_summary": {
    "score_global": 7,
    "frictions": ["friction 1", "friction 2", "friction 3"],
    "opportunites": ["opportunité 1", "opportunité 2", "opportunité 3"],
    "insight": "insight stratégique clé"
  },
  "parcours_scores": {
    "avant": [
      {"label": "Accessibilité & signalétique externe", "score": 7},
      {"label": "Parking & arrivée", "score": 6},
      {"label": "Site web & réservation en ligne", "score": 5}
    ],
    "pendant": [
      {"label": "Accueil & entrée", "score": 7},
      {"label": "Fluidité & orientation", "score": 6},
      {"label": "F&B — friction & perception prix", "score": 5},
      {"label": "Compréhension de l offre & prix", "score": 6}
    ],
    "apres": [
      {"label": "Sortie & dernière impression", "score": 6},
      {"label": "Fidélisation & recontact", "score": 5}
    ]
  },
  "analyse_cognitive": {
    "surcharge": ["observation 1", "observation 2", "observation 3"],
    "doute": ["moment 1", "moment 2", "moment 3"],
    "waouh": ["moment positif 1", "moment positif 2", "moment positif 3"]
  },
  "neuro_impact": {
    "protocole": "EDA + HRV — parcours visiteur complet",
    "eda": {"moyenne": 2.8, "pic_max": 6.8, "pic_min": 1.2, "zones_stress": 3},
    "hrv": {"moyenne": 42, "minimum": 18, "maximum": 68, "zones_flow": 2},
    "zones": [
      {"nom": "Entrée & billetterie", "eda": 4.8, "hrv": 21, "interpretation": "stress_modere"},
      {"nom": "Zone principale", "eda": 2.1, "hrv": 45, "interpretation": "flow"},
      {"nom": "F&B", "eda": 6.8, "hrv": 18, "interpretation": "stress_fort"},
      {"nom": "Sortie", "eda": 2.9, "hrv": 24, "interpretation": "flow"}
    ]
  },
  "synthese": [
    {"type": "critique", "texte": "action critique 1", "poste": "poste", "delai": "délai"},
    {"type": "critique", "texte": "action critique 2", "poste": "poste", "delai": "délai"},
    {"type": "quickwin", "texte": "quick win 1", "poste": "poste", "delai": "délai"},
    {"type": "quickwin", "texte": "quick win 2", "poste": "poste", "delai": "délai"},
    {"type": "optimisation", "texte": "optimisation", "poste": "poste", "delai": "délai"},
    {"type": "long_terme", "texte": "action long terme", "poste": "poste", "delai": "délai"}
  ],
  "score_neuroplay": {
    "accessibilite": 7,
    "fluidite": 6,
    "clarte": 7,
    "plaisir": 6,
    "performance_commerciale": 5
  }
}
 
Remplace toutes les valeurs par celles issues de tes observations. Sois précis et actionnable.`
 
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
 
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const rapportData = JSON.parse(cleaned)
 
    if (mission_id) {
      const { data: existing } = await supabase
        .from('rapports')
        .select('id, share_token')
        .eq('mission_id', mission_id)
        .single()
 
      if (existing) {
        const share_token = existing.share_token || generateShareToken()
        await supabase
          .from('rapports')
          .update({
            executive_summary: rapportData.executive_summary,
            parcours_scores: rapportData.parcours_scores,
            analyse_cognitive: rapportData.analyse_cognitive,
            neuro_impact: rapportData.neuro_impact,
            synthese: rapportData.synthese,
            score_neuroplay: rapportData.score_neuroplay,
            statut: 'publie',
            share_token
          })
          .eq('mission_id', mission_id)
      } else {
        await supabase
          .from('rapports')
          .insert({
            mission_id,
            executive_summary: rapportData.executive_summary,
            parcours_scores: rapportData.parcours_scores,
            analyse_cognitive: rapportData.analyse_cognitive,
            neuro_impact: rapportData.neuro_impact,
            synthese: rapportData.synthese,
            score_neuroplay: rapportData.score_neuroplay,
            statut: 'publie',
            share_token: generateShareToken()
          })
      }
    }
 
    return NextResponse.json({ success: true, rapport: rapportData })
 
  } catch (error: any) {
    console.error('Erreur génération rapport:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}