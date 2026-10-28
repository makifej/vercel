# Monetization models for a native iOS + Android Tamagotchi-like virtual pet game (nostalgic adults, Hungarian indie team), as of October 2026

> Research date: 28 October 2026. Method note: in this session, direct page fetches worked only for developer.apple.com. All other sources (RevenueCat, Google Play Help, European Commission, PocketGamer.biz, MobileGamer.biz, Adapty, App Store listings) were read through web-search result summaries, not full-page fetches. Figures from those sources should be re-checked on the original page before going into a final PRD. "Official" means first-party (Apple, Google, European Commission, company statements). "Estimate" means third-party market intelligence (Sensor Tower, AppMagic, Appfigures, AppGoblin, etc.) or vendor/blog figures.

## 1. Comparison of monetization models: conversion, ARPU/ARPPU, retention impact, fit for nostalgic adults

### Takeaway
No single benchmark source covers all models for a pet game aimed at adults. The evidence points toward a **free download + time-limited full trial + paid unlock and/or subscription, with optional real-money-priced cosmetics**. It argues against ad-heavy F2P (the Pou/Talking Tom model, which is built for kids and scale) and against pay-to-revive mechanics. Subscriptions work for pet apps tied to a "utility" (Finch for self-care, Pokémon Sleep for sleep tracking). For pure games, subscription benchmarks are the weakest of any category: gaming has a 25% median trial-to-paid rate and an $11.22 median 1-year realized LTV.

### Cited Findings

**Subscription (monthly/yearly, with or without free trial)**
- RevenueCat 2026 (data year 2025; 115K apps, $16B+ revenue): hard-paywall apps have a median Day-35 download-to-paid rate of **10.7%**, versus **2.1%** for freemium apps. The hard-paywall figure was **12.1% in 2025**. — [RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps); [RevenueCat blog: SOSA 2026 in 10 minutes](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026)
- Retention is nearly the same for hard-paywall and freemium apps: **28% vs 27%** (RevenueCat headline: "Paywall choice doesn't impact retention"). — [RevenueCat on X, 2026](https://x.com/RevenueCat/status/2041501258167845261)
- **Gaming category** (RevenueCat 2026 gaming cut, 2025 data): median trial-to-paid is **25.0%**, top quartile **>39.8%**. Gaming and Photo & Video "lag significantly" behind Travel and Health & Fitness. Gaming's median Day-35 download-to-paid is about **one-third** of Health & Fitness's **2.9%** median, so roughly 1% (the exact gaming value was not visible). Gaming's median 1-year realized LTV is **$11.22**, versus **$35.64** for Health & Fitness. — [RevenueCat SOSA 2026 Gaming](https://www.revenuecat.com/state-of-subscription-apps-2026-gaming)
- **Hybrid subscription + IAP**: in RevenueCat's 2025 report, 35% of apps mixed subscriptions with consumables or lifetime purchases. The share in **gaming was 61.7%**. — [Singular summary of RevenueCat SOSA 2025](https://www.singular.net/blog/subscription-apps/); [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025)
- Higher-priced apps had a median download-to-trial rate of **9.8%**, versus **4.3%** for low-priced apps (RevenueCat 2025). — [RevenueCat SOSA 2025](https://www.revenuecat.com/state-of-subscription-apps-2025)

**Cosmetic IAP, consumables, and general F2P payer rates**
- Unity says spenders are "typically 2 to 5%" of players. — [Unity IAP guide](https://unity.com/resources/in-app-purchases-guide)
- GameAnalytics daily payer conversion for the top 15% of games was about 0.8–1.2% (RPG ~3%, strategy up to 2.5%). This is **old data (June 2018–May 2019)**, cited secondhand. — [Playio blog on ARPPU](https://blog.playio.co/arppu-mobile-games)
- A secondary blog attributes casual-puzzle ARPPU of **$8–15/month** to GameAnalytics 2025 data. The attribution is unverified and conflicts with other sources. — [Playio blog](https://blog.playio.co/arppu-mobile-games)
- Casual ARPDAU estimates differ by source: $0.05–0.50 (one blog); $0.01–0.05 for ads-only casual and $0.08–0.25 for casual/puzzle with light IAP (another). These are secondary estimates, not primary GameAnalytics data. — [Juego Studio ARPDAU by genre](https://www.juegostudio.com/blog/arpdau-benchmarks-by-game-genre); [Game Growth Advisor 2026 KPIs](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/)
- Retention context: GameAnalytics' 2025 benchmarks (about 11,600 games) put median D7 retention at **3.42–3.94%**. A 2026 cut cites median D1 near 22% and D30 near 0.7–0.8%. Both are reported secondhand. — [Game Growth Advisor](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/)

**Free + one-time unlock ("full game" IAP)**
- Apple explicitly supports this model. "Non-subscription apps may offer a free time-based trial period before presenting a full unlock option by setting up a Non-Consumable IAP item at Price Tier 0 that follows the naming convention: 'XX-day Trial.'" The app must disclose the trial duration, what becomes inaccessible afterward, and any downstream charges. — [Apple App Review Guidelines 3.1.1](https://developer.apple.com/app-store/review/guidelines/)
- I found no systematic benchmark for demo-to-unlock conversion. Developer forum anecdotes cite "5–10%" in some cases and "super low conversion" in others (anecdotal, old). — [TouchArcade forum: Lite version or IAP upgrade?](https://toucharcade.com/community/threads/lite-version-or-iap-upgrade.188435/); [TouchArcade forum: Why is unlocking the full game via IAP frowned upon?](https://toucharcade.com/community/threads/why-is-unlocking-the-full-game-via-iap-frowned-upon.118730/)

**Premium paid app (one-time price)**
- Free games accounted for **96% of mobile game downloads** (2025). Premium mobile releases rose **77% in 2025** to nearly 750 titles (AppMagic data). — [Pocket Tactics](https://www.pockettactics.com/premium-mobile-games-increase); [detik.com (AppMagic data)](https://inet.detik.com/games-news/d-8570993/game-mobile-premium-bangkit-lagi-jumlah-rilis-melonjak-77-pada-2025)
- Revenue from PC/console ports on premium mobile grew from about $7M (2022) to about $15M (2025). This is an AppMagic estimate, and the total is small. — [Pocket Tactics](https://www.pockettactics.com/premium-mobile-games-increase)

**Rewarded / interstitial ads**
- Rewarded video has the highest eCPM of any format globally. iOS beats Android, especially in North America and Europe (Appodeal Q4 2024). — [Appodeal Q4 2024 eCPM report (PDF)](https://appodeal.com/wp-content/uploads/2025/03/Quarterly_Mobile_eCPM_Report_-_Q4_2024.pdf)
- Western Europe rewarded video averaged **$5.77 eCPM on iOS** and **$2.95 on Android**. The date of this data is unclear. — [GamesBeat](https://gamesbeat.com/?p=166894)
- Rewarded video made up **39% of revenue in casual games** (TopOn H1 2025 data, via Prado). — [Prado](https://prado.co/post/rewarded-video-holds-the-crown-but-interstitial-ads-are-catching-up)
- From iOS 27.2, Apple allows an alternative App Tracking Transparency prompt in the EU. In Germany, France, Italy, Poland and Romania, *only* the alternative prompt is available. Apple's notice does not name Hungary. — [Apple Developer News, 16 Sep 2026](https://developer.apple.com/news/)

**Battle pass**
- GameRefinery reported that the number of games offering a premium battle pass doubled year over year, and that the model is "especially popular with casual games" such as Merge Dragons (article date unclear). — [GameRefinery](https://gamerefinery.com/battle-pass-trend-mobile-games)
- In 2021, up to 30 of the top 100 Google Play games had a battle pass, across Casual and Simulation genres among others. This is dated. — [Google Play Apps & Games (2021)](https://goo.gle/3htI67y)
- Casual passes are typically short and cheap. Gardenscapes' premium pass costs about **$5**. — [Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/battle-pass); [GameAnalytics on battle passes](https://www.gameanalytics.com/blog/battle-passes-mobile-gaming)

**Apple Arcade / Google Play Pass**
- Apple Arcade costs **$6.99/month** in the US with a one-month free trial (January 2024). A 2026 comparison also lists a $49.99/year plan; that comes from one secondary source. — [Apple Newsroom, Jan 2024](https://apple.com/newsroom/2024/01/tamagotchi-adventure-kingdom-and-cornsweeper-launch-on-apple-arcade); [Tech Insider 2026 comparison](https://tech-insider.org/apple-arcade-vs-google-play-pass-vs-netflix-games-2026/)
- Arcade deal terms are not public. In 2019 the FT reported a budget of over $500M, "several million dollars each" for 100+ games, and exclusivity conditions: no Google Play release and no other subscription services. — [9to5Mac 2019](https://9to5mac.com/2019/04/14/arcade-500-million/)
- Google Play Pass pays developers a royalty based on usage, and the revenue-share terms are undisclosed. Pricing is about $4.99/month in the US (secondary). — [RevenueCat docs: Google Play Pass](https://www.revenuecat.com/docs/google-play-pass); [Tech Insider 2026](https://tech-insider.org/apple-arcade-vs-google-play-pass-vs-netflix-games-2026/)

**Hybrid trend**
- AppsFlyer (2024 data, published July 2025): in-app ad revenue grew +7% in gaming. Casual game IAP revenue fell 5%. Casual games took 64% of gaming ad spend. — [AppsFlyer press release](https://www.appsflyer.com/company/newsroom/pr/top-5-data-trends/)
- AppsFlyer Q3 2024 (North America and Tier-1 West): pure IAP remained the most profitable casual model. Casual IAP-only titles reached **215% D90 ROAS on iOS**. Hybrid was the only casual model on Android that broke even near D30. — [GameDev Reports summary of AppsFlyer](https://gamedevreports.substack.com/p/appsflyer-mobile-game-monetization?open=false)
- Liftoff/Singular's 2025 Casual Gaming Apps Report (Feb 2024–Feb 2025 data) names hybrid monetization as a key driver of the 2025 outlook. — [Liftoff 2025 Casual Gaming Apps Report](https://liftoff.ai/es/?p=34267%2F)

**Audience fit (nostalgic adults)**
- Age 25–44 is the largest player group, at 49% of players (ESA Global Video Games Report 2025). — [GameDev Reports summary of ESA 2025](https://gamedevreports.substack.com/p/esa-global-video-games-report-2025)
- CivicScience (undated) said Millennials "seem particularly stingy" about in-game purchases, while women made up about 4 in 5 of those spending $5+/month in-game. — [CivicScience](https://civicscience.com/when-it-comes-to-mobile-gaming-women-are-the-bigger-spenders/)
- Tamagotchi passed **100M units** shipped cumulatively by end of July 2025, and its 30th anniversary is in November 2026 (Bandai Namco, official). Bandai attributes the boom partly to "kidults" and the "Heisei Retro" trend. Circana data cited by the Globe and Mail shows **18%** of toy buyers in H1 2025 were 18 or older. — [Bandai Namco IR newsletter](https://www.bandainamco.co.jp/en/ir/library/newsletter82_special.html); [Globe and Mail](https://www.theglobeandmail.com/life/article-tamagotchi-toy-nostalgia-club); [Malay Mail, Jan 2026](https://malaymail.com/news/life/2026/01/07/still-hungry-after-30-years-tamagotchi-proves-retro-pets-never-go-out-of-style/204577)

### Inferences
- **Model comparison summary** (synthesized from the findings above; directional, not measured for this genre):

| Model | Payer conversion evidence | Revenue-per-user evidence | Retention impact | Fit for nostalgic adults / small EU team |
|---|---|---|---|---|
| Premium paid (one-time) | All install volume is lost to the 96% free-download default | One-time only; Balatro mobile shows the upside for a hit | Neutral (no monetization friction after purchase) | Matches the "buy a Tamagotchi once" mental model, but discovery without a free tier is hard for an unknown indie |
| Free + one-time unlock (after 7-day trial) | No reliable benchmark; anecdotally single-digit % | Price anchored to a toy (Bitzee about $30, see Q3) or small app price | Trial creates a natural "does my pet matter to me" test | **Strong fit.** Apple explicitly supports the "XX-day Trial" pattern, so it maps directly onto the existing 7-day-trial backend |
| Subscription (+ trial) | Gaming 25% trial-to-paid; about 1% D35 download-to-paid | Gaming median 1-year LTV $11.22 | Annual cohort retention about 27–28% after year 1 | Works when there is ongoing "utility" value (Finch, Pokémon Sleep). For a pure pet game, "subscription to keep my pet alive" risks backlash |
| Cosmetic IAP | 2–5% spenders typical | Small packs ($0.99–3.99, as in Neko Atsume) | Positive if purely optional | Good secondary layer. Virtual currencies fall under the CPC principles (Q5), so direct real-money pricing is simpler |
| Rewarded/interstitial ads | N/A (reach-based) | Casual ad ARPDAU roughly $0.01–0.05 | Interstitials hurt UX | Poor fit. Low revenue at indie DAU scale, consent friction (ATT plus EU consent), and the Pou/Talking Tom model targets kids |
| Battle pass | — | Casual passes about $5 | Requires a constant seasonal content cadence | Weak fit for a small team; conflicts with a "calm" nostalgia tone |
| Apple Arcade / Play Pass | — | Arcade: upfront deal (opaque). Play Pass: usage royalty | — | Opportunistic. Bandai already occupies the Tamagotchi slot on Arcade; exclusivity limits Android |

- Based on the evidence, the strongest candidates for the PRD are: (A) **free download → 7-day full trial → one-time "Forever" unlock**, plus optional real-money cosmetic packs; or (B) **free → 7-day trial → annual subscription with a lifetime option**. Option B is a better fit only if the product adds ongoing "utility" value (habit or self-care, as Finch does), or a live-content cadence that justifies recurring billing.

### Gaps
- I found no benchmark for "free + unlock" conversion in games, and nothing for virtual-pet apps specifically.
- I found no 2025–2026 primary GameAnalytics payer-rate or ARPDAU data for casual or simulation games. All ARPDAU and ARPPU ranges above are secondary.
- I found no data on what share of top-grossing cozy or casual games use battle passes in 2025–2026.
- RevenueCat's trial-to-paid figure for 5–9-day trials (which would cover the 7-day trial) was not visible in the summaries. Only the <4-day (25.5%) and 17–32-day (42.5%) buckets were found (see Q2).

## 2. Benchmarks: subscription conversion and trial-to-paid, paywall placement, casual-game IAP/ads, premium game performance

### Takeaway
RevenueCat's 2026 data shows that longer trials convert better (42.5% median for 17–32-day trials vs 25.5% for trials under 4 days), and that a hard paywall converts about 5× better than freemium at Day 35 with similar retention. Most trial starts and conversions happen on Day 0, so placing the paywall during onboarding is critical. For games specifically, subscription benchmarks are the weakest of any category. Mobile game IAP is flat overall ($81.75B in 2025, +1.3%), and premium mobile is small but growing.

### Cited Findings

**Subscription and trial benchmarks (RevenueCat)**
- Trials of **17–32 days** reached a median **42.5%** trial-to-paid rate, versus **25.5%** for trials **under 4 days**. Even so, **46%** of apps are moving to trials of 4 days or less. A RevenueCat podcast summary notes this may be correlation rather than causation. — [RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps); [Sub Club podcast: 2026 SOSA](https://podcasts.apple.com/us/podcast/the-2026-state-of-subscription-apps-report/id1538057974?i=1000753649170)
- **55%** of all 3-day trial cancellations happen on Day 0. — [RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps)
- Hard paywall vs freemium, median Day-35 download-to-paid: **10.7% vs 2.1%**. — [RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps)
- Search summaries of the 2026 report state that yearly plans renew at **83.4%** overall, and that "Month 1 accounts for 35% of all annual cancellations." This could not be verified on the source page and seems to conflict with the 27–28% retention figure (the denominators probably differ). — [RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps)
- Annual subscribers rarely come back after cancelling: annual reactivation is about **5%**, and monthly subscribers return at about 4× that rate (May 2026). — [9to5Mac, 27 May 2026](https://9to5mac.com/2026/05/27/new-report-shows-annual-app-subscribers-rarely-return-after-they-cancel/)
- On Google Play, involuntary billing failures cause **32%+** of cancellations, more than double the App Store's share. — [RevenueCat SOSA 2026](https://www.revenuecat.com/state-of-subscription-apps)
- Gaming: median trial-to-paid **25.0%** (top quartile >39.8%); 1-year realized LTV **$11.22**. — [RevenueCat SOSA 2026 Gaming](https://www.revenuecat.com/state-of-subscription-apps-2026-gaming)

**Paywall placement**
- RevenueCat's paywall guide says the onboarding paywall "is often where most conversions happen". At Mojo, onboarding accounts for about **50% of trial starts**, and other apps report similar or higher shares. — [RevenueCat guide to mobile paywalls](https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps.md)
- Secondary summaries of RevenueCat data: **>80% of trial starts** happen in the first session (2025). The 2026 report summary says **50% of paid conversions** happen on Day 0. For business apps, 85% of trials and 82% of all paid conversions start on Day 0. — [SaaStr: top 10 learnings from SOSA](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth); [SaaStr: % of trials start on Day 0](https://www.saastr.com/of-trials-start-on-day-0-dont-waste-your-shot)

**Market size and IAP context**
- Sensor Tower State of Gaming 2026: 2025 mobile game IAP revenue was **$81.75B (+1.3% YoY)**. Downloads were **50.41B (−7.2%)**. Steam premium revenue was about $12B. — [Sensor Tower press release via Morningstar, 25 Feb 2026](https://www.morningstar.com/news/pr-newswire/20260225sf94109/sensor-tower-state-of-gaming-gaming-drove-94-billion-in-revenue-in-2025-downloads-reached-52-billion); [GameDev Reports summary](https://gamedevreports.substack.com/p/sensor-tower-state-of-gaming-2026)
- The App Store generated **$52.5B** in game revenue in 2025, versus about **$30B** on Google Play. Google Play had about 81% of game installs and the App Store about 15% (Sensor Tower estimates). — [9to5Mac, 25 Feb 2026](https://9to5mac.com/2026/02/25/app-store-gaming-revenue-hit-52-5b-in-2025-topping-google-play-and-steam-combined-report/)
- A newer AppsFlyer report (2025 to March 2026) says paid installs account for **59%** of gaming IAP revenue, and many apps combining all three models (IAP, subscriptions, ads) are games. This is a secondary summary. — [GameDev Reports weekly recap, June 2026](https://gamedevreports.substack.com/p/weekly-gaming-reports-recap-june-e95)

**Premium mobile performance**
- Balatro mobile (premium) earned more than $500K in its first 5 days, about $4.4M by late November 2024, and over $9M by January 2025 (AppMagic estimates). — [Shacknews](https://shacknews.com/article/142371/balatro-mobile-4-million); [GameDev Reports Games & Numbers, Jan 2025](https://gamedevreports.substack.com/p/games-and-numbers-january-8-january)
- Playstack (Balatro's publisher) said its mobile version ranked among the top-performing premium titles of the year. — [PocketGamer.biz](https://www.pocketgamer.biz/playstack-profit-jumps-59-as-balatro-and-abiotic-factor-drive-record-sales)

### Inferences
- The existing **7-day trial** sits between RevenueCat's reported buckets. The data suggests it should convert better than a 3-day trial, and that testing a longer trial (14 days, or "until the pet's first life stage completes") could improve trial-to-paid. Treat this as correlational.
- Because Day-0 conversions dominate, the paywall/unlock offer should appear during onboarding (for example, right after the egg hatches), not only when the trial expires.
- For subscriptions in games, a planning baseline is about 25% trial-to-paid and about 1% Day-35 download-to-paid (gaming medians). Illustration: 100K installs × ~1% ≈ 1,000 payers. At the gaming median 1-year realized LTV of $11.22 (assuming that figure is per payer), first-year gross is about $11K before store fees and VAT. This illustrates the median case, not a forecast.
- Premium-paid success stories (Balatro) depend on an established PC hit and press coverage. A new indie IP should not assume that discoverability.

### Gaps
- RevenueCat's full tables (median prices, refund rates, 5–9-day trial bucket, gaming D35 exact value) could not be read directly (domain blocked in this session).
- I found no 2025–2026 data on premium mobile *simulation/pet* games, and no Stardew Valley mobile sales figure.
- I found no Sensor Tower or Liftoff breakdown of payer conversion for "simulation/pet" games in Europe.

## 3. How competitors monetize (prices, revenue data)

### Takeaway
Kid-focused mass-market pets (Pou, My Talking Tom) rely on ads plus currency IAP at huge scale. Adult-skewing "cozy" pets use either light cosmetic IAP (Neko Atsume) or a subscription built on real-life utility (Finch at about $70/yr; Pokémon Sleep at $9.99/mo). Bandai put its own modern Tamagotchi game behind Apple Arcade (no IAP, no ads). Physical digital pets (Bitzee, Tamagotchi) anchor a one-time price of about $30 / €30.

### Cited Findings

**Finch: Self-Care Pet (Finch Care PBC)**
- Free with a **Finch Plus** subscription: **$9.99/month or $69.99/year** (US). — [Headway Finch review](https://makeheadway.com/blog/finch-app-review/)
- UK: **£70.99/year with a 7-day free trial**. — [Internet Matters](https://www.internetmatters.org/advice/apps-and-platforms/wellbeing/finch/)
- Aggregators show multiple price points ($39.99–$69.99/yr, $5.99 or $9.99/mo, a $7.99/mo "Guardian" tier), suggesting price testing. App Store IAPs range from $7.99 to $39.99. — [App Pricing Lab](https://apppricinglab.com/app/apple/1528595748); [App Store listing](https://apps.apple.com/app/id1528595748)
- Revenue is a **third-party estimate only**: about **$1M/month** and about 600K monthly downloads. Rating 4.9 from 656.5K App Store reviews. — [App Pricing Lab](https://apppricinglab.com/app/apple/1528595748); [Gerald article (2026)](https://joingerald.com/learn/financial-wellness/finch-app-cost-breakdown)

**Pokémon Sleep (The Pokémon Company / SELECT BUTTON)**
- F2P with a **Premium Pass**: **$9.99 for 1 month, $49.99 for 6 months** (US); £7.99/month or £39.99 for 6 months (UK). A two-week trial is reported. The pass unlocks full sleep-history data; without it, only the last 30 days are visible. — [App Store listing](https://apps.apple.com/app/id1579464667); [SeekingTech](https://seekingtech.com/what-are-the-benefits-of-the-pokemon-sleep-premium-pass/)
- Revenue estimate: **$234.9M lifetime** by its 3rd anniversary (July 2026). The best month in year 3 was December at about $6.7M. The source is likely AppMagic; this is an estimate. — [PocketGamer.biz](https://www.pocketgamer.biz/pokmon-sleep-surpasses-230m-in-three-years/)
- Sensor Tower, year 1 (July 2023–July 2024): Japan accounted for **37% of downloads and 70% of revenue**. — [Sensor Tower JP blog](https://sensortower.com/ja/blog/pokemon-sleep-1st-anniversary); [Nintendo Life](https://nintendolife.com/news/2024/09/pokemon-sleep-has-double-the-number-of-monthly-users-in-japan-than-the-us)
- Limited-time Legendary events drive spikes. In September 2025, daily spending rose 67% to $281K and peaked at $378K (estimate). — [PocketGamer.biz](https://www.pocketgamer.biz/pokmon-sleeps-top-revenue-strategy-returns-with-first-legendary-event-of-2025)

**Neko Atsume / Neko Atsume 2 (Hit-Point)**
- Free with **gold fish** currency packs: **70 = $0.99, 170 = $1.99, 270 = $2.99, 400 = $3.99** (US). Neko Atsume 2 uses identical pack sizes and prices. Gold fish can also be earned in play, and 250 silver fish exchange for 10 gold fish in NA2. — [App Store: Neko Atsume](https://apps.apple.com/us/app/-/id923917775); [App Pricing Lab (Apr 2026 snapshot)](https://apppricinglab.com/iap/apple/923917775); [App Store: Neko Atsume 2](https://apps.apple.com/app/id6499131935); [Siliconera guide](https://www.siliconera.com/?p=1059839)

**Pou (Zakeh)**
- Free, "Contains Advertising", coin IAP (for example, **125,000 coins for $24.99** US). Potions can be bought with coins or earned by watching ads. — [App Store listing](https://apps.apple.com/app/575154654); [Screenwise](https://screenwiseapp.com/media/pou-app)
- Downloads were estimated at **100M+** across platforms (Wikipedia; higher claims are unverified). A sequel, **Pou 3D**, launched in December 2025. — [Wikipedia: Pou](https://en.wikipedia.org/wiki/Pou_(video_game))
- AppGoblin estimates under $10K/month in revenue and 100% IAP. This contradicts the ad-heavy model and is likely unreliable. — [AppGoblin](https://appgoblin.info/apps/575154654)

**My Talking Tom (Outfit7)**
- Ads plus IAP. MobileGamer.biz reports that My Talking Angela is the top earner by lifetime IAP, but **much of Outfit7's income comes from ads**. The franchise has about **470M monthly players** (per the article title). — [MobileGamer.biz](https://mobilegamer.biz/outfit7s-talking-tom-series-has-quietly-become-a-colossal-media-empire/); [VirtualPetList thread quoting the article](https://www.virtualpetlist.com/threads/outfit7%E2%80%99s-talking-tom-series-has-quietly-become-a-colossal-media-empire-with-470-million-monthly-players.1070)
- **25B+** brand downloads (Outfit7, official). Revenue was **$130M in 2020**, per Wikipedia; this is the latest figure found and is unverified. — [Outfit7 blog](https://outfit7.com/blog/news/outfit7-goes-all-in-inside-our-boldest-year-yet); [Wikipedia: Outfit7](https://en.wikipedia.org/wiki/Outfit7)

**Tamagotchi Adventure Kingdom (Bandai Namco)**
- An **Apple Arcade exclusive** launched on **4 January 2024** for iPhone, iPad, Mac and Apple TV. It is included in Apple Arcade ($6.99/month US, one-month free trial), with no separate IAP or ads. It has Animal Crossing-style decorating and dress-up and about 300 characters. — [Apple Newsroom](https://apple.com/newsroom/2024/01/tamagotchi-adventure-kingdom-and-cornsweeper-launch-on-apple-arcade); [Pocket Gamer](https://www.pocketgamer.co.uk/tamagotchi-adventure-kingdom/launch/)

**Precedent: My Tamagotchi Forever (Bandai Namco / Paladin, 2018)**
- F2P with ads and microtransactions; Diamonds let players skip waits such as sleep. Android Police criticized it as "a casual game with an endless monetization scheme" that degraded the core pet gameplay. The last tracked version was July 2022 (Softpedia); whether the game has ended service is unconfirmed. — [Android Police](https://www.androidpolice.com/2018/01/04/hands-tamagotchi-forever-everything-love-original-digital-pet-toy-mixed-many-free-play-mechanics/); [TechCrunch 2018](https://techcrunch.com/2018/03/15/my-tamagotchi-forever-brings-the-90s-to-your-smartphone); [Softpedia](https://mobile.softpedia.com/apk/my-tamagotchi-forever/)

**Bitzee (Spin Master), physical**
- A one-time toy purchase. Bitzee Magicals: **$29.99** (Walmart), **£34.95** (Harrods), **£34.99** (M&S), about **€29.90** (Italy). Prices are retail and fluctuate. — [Walmart](https://www.walmart.com/ip/5316030976); [Harrods](https://harrods.com/en-gb/p/bitzee-bitzee-magicals-interactive-toy-000000000007612847); [Marks & Spencer](https://www.marksandspencer.com/disney-bitzee-magicals-5-yrs-/p/hbp22593142); [Tom's Hardware Italia](https://www.tomshw.it/altro/altro-che-tamagotchi-prenditi-cura-di-bitzee-lologramma-da-accudire-e-in-super-sconto-6L5)

### Inferences
- Adult-skewing pet apps that earn well (Finch, Pokémon Sleep) both charge about **$10/month or $50–70 per 6–12 months**, and both justify the price with *real-life benefit* (self-care habits, sleep tracking), not with pet survival.
- Neko Atsume shows that a calm, no-pressure pet game can monetize with small, cheap currency packs ($0.99–3.99) that can also be earned in play.
- Bandai's own mobile F2P attempt (My Tamagotchi Forever) drew criticism for over-monetization. Its newer flagship moved to Arcade, which is a signal that "Tamagotchi + aggressive F2P" is a known risk.
- The physical-toy anchor (about €30 for Bitzee/Tamagotchi) suggests that nostalgic adults will accept a **one-time price well above typical app prices**, plausibly in the €4.99–9.99 range for a digital unlock. This is a hypothesis to test.

### Gaps
- I found no official revenue data for Finch, Pou, Neko Atsume, or Tamagotchi Adventure Kingdom. All figures are third-party estimates or missing.
- I found no Sensor Tower or AppMagic revenue estimate for Neko Atsume 2 or Pou 3D.
- Whether My Tamagotchi Forever is still live in 2026 is unconfirmed.
- I found no current official Tamagotchi Uni or Paradise MSRP (retail listings conflict).

## 4. Store economics as of October 2026 (Apple, Google, DMA, US anti-steering) and implications for a Hungarian developer

### Takeaway
For a Hungarian developer earning under $1M a year, the **effective store cut on EU sales is about 15% on both stores** as of October 2026:
- **Apple:** a 15% reduced In-App Purchase rate under the unified EU terms effective **1 Oct 2026**.
- **Google:** a 10% service fee plus a 5% Play Billing fee under the new structure effective in the EEA from **30 June 2026**.

Alternative payments or link-outs save only a few points in the EU (Apple: 10% reduced alternative payment processing rate or link-out commission; Google: no 5% billing fee), and add PSP fees and VAT/OSS obligations. In the US, link-outs are currently commission-free on iOS, but Apple's proposed 15%/10%/5% rates are pending court approval.

### Cited Findings

**Apple, EU (official)**
- The updated Developer Program License Agreement (**18 Aug 2026**) adds **Attachment 14**, which moves all EU developers to one set of terms **effective 1 October 2026**. It supersedes the Alternative Terms Addendum and the StoreKit External Purchase Link Entitlement (EU) Addendum. — [Apple: Changes for apps in the EU](https://developer.apple.com/support/apps-in-the-eu/); [Apple Developer News](https://developer.apple.com/news/)
- EU rates under the unified terms:
  - **Apple IAP commission:** 26% standard; 15% reduced for the Small Business Program, the Mini Apps or Video Partner programs, and **auto-renewable subscriptions after their first year**.
  - **Alternative in-app payment processing:** 20% standard; 10% reduced.
  - **Store services commission on out-of-app (link) offers:** 15% standard; 10% reduced. It applies only to sales within 7 days of the link tap.
  - **Core Technology Commission (CTC):** 5%, only for apps distributed *outside* the App Store (alternative marketplaces, Web Distribution).

  — [Apple: Changes for apps in the EU](https://developer.apple.com/support/apps-in-the-eu/)
- The Core Technology Fee (per install), Initial Acquisition Fee and Store Services Fee are eliminated. Apps can offer alternative payment options alongside Apple IAP, with added child-safety protections. Developers who offer a payment option must maintain it for 12 months. With an alternative PSP, the developer collects and remits taxes and must file monthly reports. — [Apple Developer News, 18 Aug 2026](https://developer.apple.com/news/); [Apple: Changes for apps in the EU](https://developer.apple.com/support/apps-in-the-eu/)
- History: the June 2025 plan was to move to the CTC by 1 January 2026. The final date became 1 October 2026. — [RevenueCat blog, June 2025](https://www.revenuecat.com/blog/growth/apple-eu-dma-update-june-2025); [Mobile Marketing Reads](https://www.mobilemarketingreads.com/apple-replaces-eu-core-technology-fee-with-5-commission-as-new-app-store-terms-take-effect-october-1/)
- Small Business Program (global): **15%** commission on paid apps and IAP for developers with ≤$1M proceeds in the prior calendar year, and for developers new to the App Store. The standard rate applies after crossing $1M within the year. The SBP page also says EU developers "on the alternative terms" in the SBP, and subscriptions after year one, get "a further reduced commission of 10%". This line appears to reflect the pre-October 2026 EU terms and conflicts with the new Attachment 14 table. — [Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- Other 2026 Apple changes: **monthly subscriptions with a 12-month commitment** (27 Apr 2026; not available in the US or Singapore). App Review Guidelines were updated on 16 Oct 2026, including stronger rules against "bait-and-switch apps". The China storefront commission dropped from 30% to 25% (and 15% to 12%) on 15 Mar 2026. — [Apple Developer News](https://developer.apple.com/news/)

**Apple, US (Epic v. Apple)**
- On **30 April 2025**, the district court found Apple in contempt and barred any commission on US link-out purchases. On **11 December 2025**, the Ninth Circuit largely affirmed. It held that Apple may charge a commission based on costs "genuinely and reasonably necessary" for coordinating external links, "but no more", and remanded the rate question. It also held that Apple can require link styling no more prominent than its own IAP button. — [Justia: 9th Cir. No. 25-2935](https://law.justia.com/cases/federal/appellate-courts/ca9/25-2935/25-2935-2025-12-11.html); [Fenwick](https://www.fenwick.com/insights/publications/ninth-circuit-largely-upholds-ruling-in-epic-v-apple)
- Rehearing en banc was denied on 30 March 2026. A report says the US Supreme Court granted certiorari on the contempt ruling (30 June 2026); I did not verify this independently. — [IPWatchdog, 30 Jun 2026](https://ipwatchdog.com/2026/06/30/high-court-grants-cert-in-apples-challenge-to-ninth-circuit-contempt-ruling-in-app-store-dispute/)
- **13–14 August 2026**: Apple asked the district court to approve link-out commissions of **15% standard, 10%** for partner programs and subscription renewals, and **5% for Small Business Program** members. **None of these is in effect until the court approves.** Epic is contesting. — [TechCrunch, 14 Aug 2026](https://techcrunch.com/2026/08/14/apple-proposes-to-take-a-15-cut-of-purchases-made-outside-the-app-store/); [iClarified](https://www.iclarified.com/101778/apple-seeks-court-approval-for-15-commission-on-external-app-purchases)

**Google Play**
- Epic and Google settled in **March 2026**. Google withdrew its Supreme Court petition. In July 2026 the parties jointly withdrew their motion to modify the injunction (Alphabet 10-Q). — [Alphabet 10-Q, Q2 2026](https://www.sec.gov/Archives/edgar/data/0001652044/000165204426000071/goog-20260630.htm); [Android Developers Blog, Mar 2026](https://android-developers.googleblog.com/2026/03/a-new-era-for-choice-and-openness.html)
- New fee structure (Google Help/Blog, as summarized in search results):
  - **10% service fee on the first $1M** of annual earnings.
  - **10% on all auto-renewing subscriptions.**
  - Other purchases: **20% for new installs / 25% for existing installs** (15%/20% in the new Apps & Games programs).
  - **Plus a 5% billing fee only when Google Play Billing is used** (US, UK, EEA). The billing fee does not apply to alternative billing or external web links.
  - **Rollout:** US, EEA and UK on **30 June 2026**; Australia and Japan on 30 Sep 2026; South Korea on 31 Dec 2026; rest of world by **30 Sep 2027**.

  — [Play Console Help: Understanding Google Play's lower service fees](https://support.google.com/googleplay/android-developer/answer/16954621?hl=en); [Android Developers Blog, June 2026](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html)
- Secondary sources conflict on details (for example, whether existing-install rates are 20% or 25%, and the exact link-out rate). Google's Help pages are authoritative and should be re-checked. — [ecorpit breakdown](https://ecorpit.com/google-play-service-fee-split-2026-app-economics/); [SecNews](https://www.secnews.gr/en/717379/google-chreoseis-play-store-pliromes/); [Slashdot/Ars Technica, 25 Jun 2026](https://tech.slashdot.org/story/26/06/25/0554234/)
- Previous regime (2021–mid-2026): 15% on the first $1M, then 30%. — [Game Developer, 2021](https://www.gamedeveloper.com/game-platforms/google-play-halves-its-fee-to-15-for-devs-first-1m-revenue-per-year)

### Inferences
- **Effective store take for a small Hungarian developer on EU storefronts (Oct 2026):** Apple IAP 15% (SBP); Google 10% + 5% = 15% with Play Billing; Google with alternative billing is 10% plus PSP fees. For a sub-$1M indie, alternative billing or link-outs save little in the EU, because Apple's reduced alternative-payment rate is 10% vs 15% IAP and PSP fees of roughly 2–4% offset most of the difference. They also add VAT/OSS compliance, refund handling and a 12-month commitment on Apple. **Recommendation basis: use native IAP / Play Billing at launch.**
- **US storefront:** today a link-out to web checkout carries no Apple commission, but this could change soon (pending court decision; possibly 5% for SBP). A web-checkout path could be a later optimization for US annual plans or lifetime unlocks. It is not a launch requirement.
- **Subscription after year 1:** on Apple EU and Google, subscription fees are already at the reduced levels (15% / 10% + 5%). The "after year 1" benefit matters only for developers above $1M on Apple.
- Rules changed four times in 18 months. The PRD should treat store fees as a **configurable assumption** and avoid hard-coding pricing logic to any one fee regime.

### Gaps
- The full Attachment 14 text was not read. Whether an SBP member's auto-renewable subscriptions in the EU drop below 15% after year one is unclear, because the SBP page and the EU page conflict.
- I could not fetch Google's Play Console Help pages directly. Whether the 10%-on-first-$1M tier applies to one-time IAP in all cases, and the exact external-link fees in the EEA, should be confirmed there.
- The Supreme Court's handling of Epic v. Apple (cert grant vs. denial of stay) and the district court's ruling on Apple's proposed rates were unresolved or unverified as of 28 Oct 2026.

## 5. Ethical and regulatory constraints in a pet-care game (pay-to-revive, virtual currencies, loot boxes, price transparency, Hungarian VAT)

### Takeaway
EU consumer authorities (the CPC Network's March 2025 Key Principles) and Apple's rules push toward **real-money price transparency, a single (or no) premium currency, no pressure or urgency tactics, and extra care for minors**. The Digital Fairness Act proposal (expected around November 2026, not in force before about 2028) may go further. Paid randomized items carry gambling risk in Belgium. Selling "revival" of a pet that died from neglect is not explicitly banned anywhere I found, but it combines the guilt and pressure dynamics regulators are targeting. It also has precedent for backlash, so the safe design choice is to keep revival free.

### Cited Findings
- **CPC Network Key Principles on in-game virtual currencies** (21 March 2025; non-binding; led by the Dutch and Norwegian authorities):
  - Clear, transparent pricing; showing the real-money price.
  - Avoid hiding real costs.
  - Avoid multiple currencies or multiple exchange steps.
  - No pressure to buy currency.
  - Respect withdrawal rights. These cannot be waived, but they lapse once the currency is used during the withdrawal period.
  - Protect vulnerable consumers, especially children.

  Currencies that can only be earned through play (not bought) are out of scope. — [CPC Key Principles PDF (European Commission)](https://commission.europa.eu/document/download/8af13e88-6540-436c-b137-9853e7fe866a_en?filename=Key+principles+on+in-game+virtual+currencies.pdf); [Baker McKenzie](https://connectontech.bakermckenzie.com/european-consumer-protection-network-issues-new-key-principles-on-in-game-virtual-currencies-impact-for-gaming-and-gambling-entities-in-belgium-the-eu-and-beyond/); [Bird & Bird](https://www.twobirds.com/en/insights/2025/european-move-towards-protecting-users-from-harmful-practices-in-video-games-eu-consumer-protection)
- The principles were published alongside a CPC action on **Star Stable Online**, which flagged "pressuring techniques" such as time-limited offers aimed at children, and fixed currency bundles that don't match item prices (leaving leftover balances). The Commission hosted a stakeholder workshop on **3 June 2025**. — [EC press release IP/25/831](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_25_831/IP_25_831_EN.pdf); [CPC Common Position on Star Stable (PDF)](https://commission.europa.eu/document/download/030ff1d8-526e-4807-8a7e-1505f9e235d9_en?filename=Common+Position+on+Star+Stable+Online+.pdf); [EC news, 3 Jun 2025](https://commission.europa.eu/news-and-media/news/european-commission-hosts-stakeholders-talks-application-cpc-networks-key-principles-games-virtual-2025-06-03_en)
- The industry bodies EGDF and Video Games Europe criticized the lack of consultation. — [Reed Smith Q&A](https://www.reedsmith.com/articles/qas-on-the-eu-consumer-protection-authorities-joint-guidance-paper/)
- **Digital Fairness Act (pending):** the Commission proposal is expected in **Q4 2026** (indicatively on the **11 Nov 2026** College agenda, which is "indicative"). It is expected to address dark patterns, addictive design, subscription traps, and possibly loot boxes and in-game currencies. Enforcement is unlikely **before end-2028**. BEUC wants bans on premium virtual currencies, paid loot boxes and pay-to-win; Video Games Europe opposes them. **No draft is public.** — [EPRS briefing, Oct 2026](https://eprs.europarl.europa.eu/contents/publications/EPRS/2026/10/EPRS_BRI(2026)791529.html); [CMS](https://cms.law/en/nld/legal-updates/inside-the-eu-s-planned-digital-fairness-act-digital-design-subscription-traps-and-influencer-marketing); [Wisevoter, 15 Oct 2026](https://wisevoter.com/world/2026/10/15/european-commission-propose-digital-fairness-act); [VGTimes](https://vgtimes.com/articles/172316-eu-gaming-law-plans.html)
- **Loot boxes:**
  - **Belgium** has treated paid loot boxes as games of chance since 2018. A January 2025 Antwerp court ruling reportedly upheld this, with criminal penalties of up to €800,000 and 6 months–5 years' imprisonment. These details come from secondary law-firm and compliance blogs and are partly unconfirmed. Enforcement has been uneven: a 2023 study found 82% of the top-100 grossing iPhone games in Belgium still offered paid loot boxes.
  - **Netherlands:** the Council of State (March 2022, EA/FIFA) held that the packs were not a separate game of chance, so there is **no blanket ban**. A private member's bill was reportedly in committee as of May 2026.

  — [Promise Legal 2026](https://blog.promise.legal/lootbox-regulation-2026-game-studios/); [Promise Legal by jurisdiction](https://blog.promise.legal/loot-box-laws-by-jurisdiction-indie-game-studios/); [Coredo comparative analysis](https://coredo.eu/comparative-analysis-of-loot-box-legislation-in-different-countries/)
- **Apple rules:**
  - Loot boxes must "disclose the odds of receiving each type of item to customers prior to purchase".
  - "Any credits or in-game currencies purchased via in-app purchase may not expire".
  - Auto-renewable subscriptions must provide "ongoing value" and last at least 7 days.
  - Bait-and-switch subscription practices lead to removal.
  - Kids Category apps cannot have purchases outside a parental gate, or third-party ads/analytics.

  — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Pay-to-revive or skip-neglect precedent:** My Tamagotchi Forever sold Diamonds to skip waits and was criticized for an "endless monetization scheme". Pet-community forum discussions debate paid revival costs; some argue neglect-death adds realism, with revival as a compromise. I found **no specific regulatory action** against pay-to-revive. — [Android Police](https://www.androidpolice.com/2018/01/04/hands-tamagotchi-forever-everything-love-original-digital-pet-toy-mixed-many-free-play-mechanics/); [VirtualPetList forum](https://www.virtualpetlist.com/threads/pets-dying-with-revival-for-points.1866/)
- **Hungarian VAT:** the standard rate is **27%** (the highest in the EU), and it applies to electronically supplied services. Sources are vendor guides; confirm with NAV. — [Vatstack](https://vatstack.com/rates/hungary); [Fonoa](https://www.fonoa.com/resources/country-tax-guides/hungary/tax-on-digital-services)
- App Store prices include VAT, and developer proceeds are calculated after VAT is deducted. With alternative PSPs in the EU, the developer must collect and remit taxes. — [Apple: Upcoming tax and price changes](https://developer.apple.com/news/?id=3g0zsfvn); [Apple: Changes for apps in the EU](https://developer.apple.com/support/apps-in-the-eu/)

### Inferences
- **VAT math (illustrative):**
  - A **€4.99** unlock sold to a Hungarian buyer → €3.93 net of 27% VAT → **€3.34** after a 15% store commission (67% of the sticker price).
  - The same €4.99 to a German buyer (19% VAT) → €4.19 → **€3.56**.
  - A **€29.99/yr** subscription in Hungary → €23.61 net of VAT → **€20.07** after 15%.

  VAT depends on the **buyer's country**, not the developer's. Hungary's 27% therefore mainly affects domestic sales and the local price perception of HUF tiers. Under native IAP, Apple and Google handle VAT. Under web or alternative billing, the Hungarian developer (or a merchant of record) must handle EU OSS.
- **Design guardrails for the PRD,** derived from the CPC principles, Apple's rules and the DFA direction:
  - Price cosmetics directly in real money, or at most use one currency with pack sizes that match item prices.
  - No countdown or "limited-time" pressure offers tied to pet welfare.
  - No paid randomized items (avoids Belgian gambling risk and odds-disclosure work).
  - Revival or neglect recovery must be achievable for free, through care or a time-based mechanic. Optional cosmetic "memorial" or "new egg" items are lower risk than paid revival.
  - Make trial end, renewal and cancellation terms explicit (Apple's 3.1.1 trial-disclosure rule; DFA subscription-trap focus).
- Many nostalgic adults are parents, and child-appealing pet art may attract minors. Even with an adult target, the CPC's emphasis on children and age-assurance trends support avoiding pressure mechanics.

### Gaps
- I could not read the full CPC principles text directly (the europa.eu domain was blocked in this session). The exact wording of all seven principles should be pulled from the PDF.
- I found no Hungary-specific consumer-authority (GVH or Fogyasztóvédelem) guidance on in-game currencies.
- I found no confirmation of Hungary storefront currency details (HUF vs EUR price points) or of current Apple/Google HUF price tiers.
- The DFA text is not yet published, so the scope for games is unconfirmed.

## 6. Tools: RevenueCat vs native StoreKit 2 / Play Billing, Superwall/Adapty paywalls; pricing tiers in HUF/EUR/USD

### Takeaway
RevenueCat is free up to $2.5K monthly tracked revenue, then 1% of MTR. Superwall charges 1% of paywall-attributed revenue, with its subscription infrastructure free. With trials and promo codes already in the backend, a small team can launch on native StoreKit 2 / Play Billing plus its own server, or add RevenueCat for cross-platform entitlements and benchmarks at low cost. Concrete HUF tier data was not found.

### Cited Findings
- **RevenueCat:** free up to **$2,500 MTR**, then **1% of MTR**; Enterprise is custom. The 1% is calculated on gross MTR before store commission (pricing page as re-checked by a third party on 15 Jun 2026). — [Costbench: RevenueCat free plan](https://costbench.com/software/subscription-billing/revenuecat/free-plan/)
- RevenueCat moved its Paywalls add-on into a self-serve Pro tier in Q2 2026 (third-party pricing-diff tracker). — [PricingSaaS: RevenueCat 2026Q2](https://pricingsaas.com/companies/revenuecat/diffs/2026Q2)
- **Superwall:** subscription infrastructure is free at any scale. The paywall product costs **1% of paywall-attributed revenue**, with no tracked-revenue threshold (official pricing page). Third parties list fixed tier fees ($49 or $199/month) that may be outdated. — [Superwall pricing](https://superwall.com/pricing.md); [Superwall pricing FAQ](https://superwall.com/docs/support/faq/2801653905-how-does-superwalls-pricing-work); [PulseSignal comparison](https://getpulsesignal.com/compare/revenuecat-vs-superwall)
- RevenueCat notes that Google Play Pass revenue may not be tracked accurately because developers are paid by royalty. — [RevenueCat docs: Google Play Pass](https://www.revenuecat.com/docs/google-play-pass)
- **Apple native trial options:** subscription free trials via introductory offers in App Store Connect, or a non-consumable "XX-day Trial" at Price Tier 0 for non-subscription unlocks. — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Price reference points (USD):**
  - Finch Plus $9.99/mo or $69.99/yr
  - Pokémon Sleep $9.99/mo or $49.99 per 6 months
  - Neko Atsume packs $0.99–3.99
  - Apple Arcade $6.99/mo
  - Bitzee about $29.99

  — see Q3 sources: [Headway](https://makeheadway.com/blog/finch-app-review/); [App Store: Pokémon Sleep](https://apps.apple.com/app/id1579464667); [App Store: Neko Atsume](https://apps.apple.com/us/app/-/id923917775); [Apple Newsroom](https://apple.com/newsroom/2024/01/tamagotchi-adventure-kingdom-and-cornsweeper-launch-on-apple-arcade); [Walmart](https://www.walmart.com/ip/5316030976)

### Inferences
- **Tool choice:** for a sub-$1M indie with an existing backend (trial and promo codes), RevenueCat's cost is small: 1% of revenue above $2.5K MTR. It buys cross-platform entitlement sync, receipt validation, and comparable benchmark charts. Superwall only adds value if paywall A/B testing at scale is planned. Native StoreKit 2 plus Play Billing with an in-house backend has zero vendor fees but more maintenance, including the Google billing-failure handling (32%+ of Play cancellations, Q2).
- **Promo codes:** Apple offer codes and Google promo codes are native. The existing backend promo system should map to store-native offer codes for anything sold through IAP, because custom codes cannot unlock IAP content outside the store rules (inferred from store policies; not verified in this research).
- **Candidate price points to test** (inferred from comparables, not benchmarked):
  - One-time unlock: €4.99–€7.99 / $4.99–$7.99.
  - Subscription (if chosen): about €2.99–3.99/mo, or €19.99–29.99/yr. This is below Finch, reflecting a game-only value proposition and gaming's lower LTV.
  - Cosmetic items: €0.99–2.99, priced directly.

  HUF price points should come from Apple's and Google's auto-generated equalized tiers and then be adjusted for local purchasing power.

### Gaps
- I could not verify Adapty's 2026 pricing from a primary source (only one unverified secondary claim of a $5K MTR free tier was seen).
- I found no current Apple or Google HUF price-tier tables (for example, what €4.99 maps to in HUF), and could not confirm whether Hungarian App Store prices are shown in HUF.
- I found no data comparing conversion with RevenueCat or Superwall paywalls versus custom native paywalls.
- Blocked domains in this session (fetch failed): revenuecat.com, support.google.com, android-developers.googleblog.com, commission.europa.eu, eprs.europarl.europa.eu, adapty.io, mobilegamer.biz, pocketgamer.biz, macrumors.com, apps.apple.com. These need allowlisting for full verification.
