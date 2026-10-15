# Archive — partie physio de BEN

Contexte : décision d'octobre 2026 (« Architecture BEN · TicketMatch V2 ») — BEN devient 100 % cognitif ;
les onglets **NeuroImpact** et **Score NeuroPlay** quittent BEN et rejoignent l'app dédiée de l'offre
« Parcours des émotions », qui partage la base technique (Supabase, composants de rapport).

## Contenu
| Fichier | Origine dans BEN | Rôle |
|---|---|---|
| `NeuroImpactSection.tsx` | `app/rapport/[id]/page.tsx` | Section EDA / HRV / corrélation par zone du rapport |
| `ScoreNeuroPlaySection.tsx` | `app/rapport/[id]/page.tsx` | Score NeuroPlay (5 dimensions) + score global |
| `terrain-recap-score.txt` | `app/terrain/page.tsx` | Carte « Score NeuroPlay » du récap de fin de diagnostic |
| `prompt-physio.md` | `app/api/generer-rapport/route.ts` | Fragments de prompt/schéma JSON et avertissement |

Ces fichiers sont exclus du build (`tsconfig.json` → `exclude`). Ils sont là pour être repris, pas exécutés.

## Retrouver l'état complet d'avant le retrait
- Branche `archive/physio-v1`
- Tag `physio-v1`

## Point d'attention pour la reprise
Dans BEN, les valeurs EDA/HRV n'étaient pas mesurées mais générées par le modèle (détails dans `prompt-physio.md`).
La future app doit les alimenter par les capteurs.
