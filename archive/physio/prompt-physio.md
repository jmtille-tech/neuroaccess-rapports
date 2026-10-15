# Prompt et schéma physio de BEN (état physio-v1)

Fragments extraits de `app/api/generer-rapport/route.ts` avant retrait.

## Comment ça fonctionnait réellement
Le prompt ne reçoit que les **notes de terrain textuelles** par poste. Aucune donnée de capteur n'entre dans BEN.
Les valeurs EDA/HRV du bloc `neuro_impact` étaient donc **inventées par le modèle** à partir de ces notes,
en s'inspirant des valeurs d'exemple du schéma ci-dessous. À ne pas reproduire : dans la future app,
ces champs doivent être alimentés par les capteurs (EDA + HRV synchronisés par zone) et jamais par le LLM.

## Bloc `neuro_impact` du schéma JSON
```json
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
```

## Bloc `score_neuroplay` du schéma JSON
```json
  "score_neuroplay": {
    "accessibilite": 7,
    "fluidite": 6,
    "clarte": 7,
    "plaisir": 6,
    "performance_commerciale": 5
  }
```
Cinq dimensions notées sur 10 ; le score global est la moyenne des cinq (voir `ScoreNeuroPlaySection.tsx`).

## Colonnes Supabase concernées (table `rapports`)
`neuro_impact` (jsonb) et `score_neuroplay` (jsonb). Elles n'ont pas été supprimées : les anciens rapports les conservent.
