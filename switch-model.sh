#!/usr/bin/env bash
# Egy-gombos AI-modell váltó a Smart Reminder proxyhoz.
# A GEMINI_MODEL (+ opcionálisan GEMINI_THINKING_LEVEL) production env-változót állítja +
# újradeployol. A kód-alap flash marad, így az env törlésekor gemini-2.5-flash-re esik vissza.
#
# Használat:  ./switch-model.sh <model-id> [thinking-level]
# Bevált beállítások (2026-07-13, a ...Paiw kulccsal):
#   ./switch-model.sh gemini-3.1-pro-preview low   # AJÁNLOTT PRO: okos + megbízható, ~4 mp
#   ./switch-model.sh gemini-3.1-pro-preview        # teljes Pro: legerősebb, DE ~10 mp
#   ./switch-model.sh gemini-3.5-flash              # Flash-középút: ~4-5 mp (néha ParseError)
#   ./switch-model.sh gemini-2.5-flash              # alap: leggyorsabb, leggyengébb
# Megjegyzés: a thinking-level ("low"/"high") CSAK a 3.x Pro-nál értelmes; a Pro budget 0-t
# NEM fogad ("only works in thinking mode"), ezért a "low" a leggyorsabb Pro-mód.
set -euo pipefail
MODEL="${1:?Adj meg egy modell-id-t, pl.: ./switch-model.sh gemini-3.1-pro-preview low}"
LEVEL="${2:-}"
cd "$(dirname "$0")"
echo "→ GEMINI_MODEL = $MODEL${LEVEL:+ , thinkingLevel = $LEVEL}  (Vercel production)"
vercel env rm GEMINI_MODEL production --yes >/dev/null 2>&1 || true
printf "%s" "$MODEL" | vercel env add GEMINI_MODEL production >/dev/null
# A thinking-szintet mindig újraírjuk: ha nincs megadva, TÖRÖLJÜK (flash-nek nem szabad küldeni).
vercel env rm GEMINI_THINKING_LEVEL production --yes >/dev/null 2>&1 || true
if [ -n "$LEVEL" ]; then printf "%s" "$LEVEL" | vercel env add GEMINI_THINKING_LEVEL production >/dev/null; fi
echo "→ deploy folyamatban…"
vercel --prod --yes >/dev/null
echo "✓ Kész — a proxy mostantól: $MODEL${LEVEL:+ (thinking: $LEVEL)}"
