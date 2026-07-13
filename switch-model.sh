#!/usr/bin/env bash
# Egy-gombos AI-modell váltó a Smart Reminder proxyhoz.
# A GEMINI_MODEL production env-változót állítja + újradeployol. A kód-alap flash marad,
# így ha az env-változót töröljük, magától visszaesik gemini-2.5-flash-re.
#
# Használat:  ./switch-model.sh <model-id>
# Bevált modellek (2026-07-13, a ...Paiw kulccsal mind elérhető):
#   ./switch-model.sh gemini-3.5-flash        # AJÁNLOTT: okos + gyors (~3 mp), olcsó
#   ./switch-model.sh gemini-3.1-pro-preview  # PRO: legerősebb, de ~10 mp/kérés + drága
#   ./switch-model.sh gemini-2.5-flash        # alap: leggyorsabb/legolcsóbb, leggyengébb
set -euo pipefail
MODEL="${1:?Adj meg egy modell-id-t, pl.: ./switch-model.sh gemini-3.5-flash}"
cd "$(dirname "$0")"
echo "→ GEMINI_MODEL = $MODEL  (Vercel production)"
vercel env rm GEMINI_MODEL production --yes >/dev/null 2>&1 || true
printf "%s" "$MODEL" | vercel env add GEMINI_MODEL production >/dev/null
echo "→ deploy folyamatban…"
vercel --prod --yes >/dev/null
echo "✓ Kész — a proxy mostantól ezt a modellt használja: $MODEL"
echo "  (Ellenőrzés: curl -s -X POST https://vercel-roan-gamma.vercel.app/chat -H 'Content-Type: application/json' -d '{\"command\":\"holnap 8-kor teszt\"}')"
