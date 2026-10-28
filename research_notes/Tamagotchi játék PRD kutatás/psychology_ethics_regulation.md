# Psychology, Game Design and Ethics of Daily-Care Virtual Pet Mechanics (with EU/US/App-Store Regulatory Boundaries) — research notes, as of 28 October 2026

> Scope: native mobile virtual-pet game for nostalgic adults, developer based in Hungary. Notes cover attachment/grief research, daily-engagement mechanics, absence handling, death design, dark patterns, and regulation.
>
> Method note for the report writer: in this research session several hosts could not be fetched (eprs.europarl.europa.eu, ftc.gov, arxiv.org, esportslegal.news, pastemagazine.com were blocked by the sandbox network). Where a finding comes only from a search-engine summary of a page rather than the page itself, it is marked "(via search summary)". The Apple App Store Review Guidelines were read directly. Opinion and commentary pieces are labelled **[opinion]** or **[industry blog]**.

---

## 1. Academic research on the "Tamagotchi effect", attachment to virtual pets, and grief; what drives caring and what causes burnout/abandonment

### Takeaway
There is a modest, uneven academic base. People clearly form real attachments to minimally responsive digital creatures, driven by animism, cuteness, responsiveness and the felt responsibility that care mechanics create. Losing a digital companion can be experienced as real grief (best evidence comes from AI-companion and robot-pet loss, not from virtual-pet games directly). Burnout comes from obligation: when engagement mechanics feel like a chore or a job, and when the pet's needs exceed what a player can sustain (the original Tamagotchi could die within about half a day).

### Cited Findings
**What the "Tamagotchi effect" is, and its origins**
- The "Tamagotchi effect" is generally described as people forming emotional bonds with machines, robots or software agents. The original Tamagotchi pet would "die" within about half a day if left unattended, which caused distress and distraction; some schools banned the toy. Newer models added a pause feature. *(encyclopedic source)* — [Wikipedia: Tamagotchi effect](https://en.wikipedia.org/wiki/Tamagotchi_effect)
- A 2017 student-journal paper attributes Tamagotchi attachment to animism, the tendency to attribute life to inanimate objects (citing clinical psychologist Neil Frude), plus kawaii cuteness and the toy's responsiveness to the owner's care, which encouraged attention and emotional investment. — [The iJournal (2017), "Taken by the Tamagotchi"](https://theijournal.ca/index.php/ijournal/article/download/28127/20721)
- Tel Aviv University researchers Linda-Renée Bloch and Dafna Lemish described the Tamagotchi as "a metaphor of our times", representing a blurring between real reciprocal relationships and surrogate one-way imaginary ones (secondary quotation; the original *New Media & Society* article was not retrieved). — [maize.io, "Not your usual toy story"](https://www.maize.io/cultural-factory/tamagotchi-story/)
- 1990s media coverage recorded children grieving when their Tamagotchi "died", including makeshift funerals. **[opinion / commentary newsletter]** — [Use Error, "This time, with feeling!"](https://useerror.substack.com/p/this-time-with-feeling)

**Systematic and empirical work**
- **Key review:** Dodd, Fowler & Lottridge, "Purr-ogrammed love: A narrative review of virtual pets", *Entertainment Computing* vol. 54 (June 2025), DOI 10.1016/j.entcom.2025.100958. It reviewed 45 articles, and reflexive thematic analysis produced six themes: life and death, health and habits, capitalism and consumption, gender, toys and play, and ethics. Its highlights flag concerns about "capitalist design" and **the use of mortality as a design choice**, and they note that virtual pets remain under-researched despite their continued popularity (abstract and highlights only, via search summary). — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1875952125000382)
- Lawson & Chesney, "The Impact of Owner Age on Companionship with Virtual Pets", ECIS 2007, pp. 1922–1928. A related Chesney, Kanoh & Lawson study compared virtual-pet companionship in the UK and Japan using a translated Comfort from Companion Animals Scale. A study of *Nintendogs* found the game provides some companionship, though less than a real dog or cat (findings via search summary; age-effect results not retrieved). — [ResearchGate: Lawson & Chesney 2007](https://www.researchgate.net/publication/221407398_The_Impact_of_Owner_Age_on_Companionship_with_Virtual_Pets); [Interaction Studies 8(2), Chesney & Lawson](https://benjamins.com/catalog/is.8.2.09che)
- A 2026 pilot study (arXiv preprint, not peer-reviewed) describes care mechanics such as feeding, cleaning and attention requirements as strengthening users' emotional attachment and sense of responsibility. — [arXiv 2605.07960](https://arxiv.org/pdf/2605.07960)

**Motivation theory (why caring and playing feel good)**
- Ryan, Rigby & Przybylski (2006), "The Motivational Pull of Video Games: A Self-Determination Theory Approach", *Motivation and Emotion*. Games motivate to the extent players experience **autonomy, competence and relatedness**. These needs independently predicted enjoyment and future play, and perceived in-game autonomy and competence were associated with pre-to-post-play changes in well-being. The work led to the PENS (Player Experience of Need Satisfaction) measure. — [Univ. of Rochester PDF](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf); [selfdeterminationtheory.org PENS](https://selfdeterminationtheory.org/player-experience-of-needs-satisfaction-pens/)
- Przybylski, Rigby & Ryan (2010), "A Motivational Model of Video Game Engagement", *Review of General Psychology*, argues that both the appeal and the well-being effects of games rest on satisfying these basic needs. — [Ewha research portal](https://pure.ewha.ac.kr/en/publications/a-motivational-model-of-video-game-engagement/)

**Grief over loss of a digital companion (closest analogues)**
- Jaime Banks (Syracuse), *Journal of Social and Personal Relationships* (2024), studied users (N = 58; a Syracuse article says about 60) facing the shutdown of the AI companion app Soulmate. Many described the loss "as an actual or metaphorical person-loss", sometimes as a death, and some tried to recreate the companion on another platform. Banks argues these are legitimate loss experiences and calls for **a design ethic that plans for such loss**. A related experiment by Kim et al. found that **forewarning users before ending an immersive AI interaction reduced feelings of loss** compared with sudden termination (via search summary). — [SAGE DOI 10.1177/02654075241269688](https://sage.cnpereading.com/doi/10.1177/02654075241269688); [ISPR summary, Feb 2025](https://ispr.info/2025/02/04/syracuse-professor-jaime-banks-on-the-rise-of-ai-companionship/)
- Robot-pet grief: Kofuku-ji temple in Isumi, Chiba, has held Buddhist funeral rites for retired Sony AIBO robot dogs (114 in one ceremony, about 100 in another reported ceremony), and owners sent letters with them, e.g. "I feel relieved to know there will be a prayer for my AIBO." — [Buddhistdoor Global](https://www.buddhistdoor.net/news/japanese-buddhist-temple-holds-funerals-for-defunct-robot-dogs/); [SCMP](https://www.scmp.com/news/asia/east-asia/article/2097977/rip-aibo-funeral-held-100-japanese-robot-dogs)
- Avatar loss on VRChat: a peer-reviewed interview and observation study of avatar funerals found genuine emotional distress and ritualised remembrance. It notes that avatar loss is under-explored in digital death studies. — [PMC12727626](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12727626/)
- Real-pet grief literature: a 2025 study of 204 young adults found attachment style moderates the link between emotional attachment and prolonged grief after a pet's death. This is relevant as an analogue only. — [PubMed 42643062](https://pubmed.ncbi.nlm.nih.gov/42643062/)

**Burnout and abandonment drivers**
- Frommel & Mandryk, "Daily Quests or Daily Pests? The Benefits and Pitfalls of Engagement Rewards in Games", *Proc. ACM HCI* 6 (CHI PLAY), Oct 2022, DOI 10.1145/3549489. Players experienced engagement rewards (daily logins, repeatable challenges, seasonal items) in two ways. They were motivating and sometimes helpful (e.g., letting free players progress), but also caused FOMO and obligation. Players described them as "a chore", "like a job" and "tedious", worst when rewards **gated progress**, and reported frustration and sadness when missed rewards cost them streaks. — [ACM DL PDF](https://dl.acm.org/doi/pdf/10.1145/3549489); [Utrecht University portal](https://research-portal.uu.nl/en/publications/daily-quests-or-daily-pests-the-benefits-and-pitfalls-of-engageme/); [Deceptive Patterns summary](https://deceptive.design/articles/daily-quests-or-daily-pests-the-benefits-and-pitfalls-of-engagement-rewards-in-games)
- FOMO has been found to mediate the relationship between depression, anxiety and stress and Internet Gaming Disorder (adolescent sample, COVID-19 period). — [PMC8873089](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8873089/)
- A design commentary on the original Tamagotchi notes that "death can happen in just a few hours at any stage", which puts a lot of pressure on the player. **[opinion]** — [maize.io](https://www.maize.io/cultural-factory/tamagotchi-story/)

### Inferences
- Attachment does not need sophistication. Responsiveness, cuteness and felt responsibility are enough, so the design should take player attachment seriously as an ethical responsibility.
- SDT suggests care should feel *chosen* (autonomy), *achievable* (competence) and *reciprocated* (relatedness: the pet visibly responds to and "knows" the player). Care demands that exceed an adult's real schedule (work, sleep, travel) turn autonomy into obligation, which is the burnout pathway Frommel & Mandryk describe.
- Nostalgic adults remember Tamagotchi death as part of the experience. However, the same body of work that explains attachment also predicts guilt and distress when the pet dies from neglect the player could not realistically prevent.
- Forewarning (Kim et al., via Banks) and ritual and memorial practices (AIBO funerals, VRChat) suggest that *how* a loss is staged matters as much as whether it happens.

### Gaps
- No peer-reviewed study was found that directly measures grief or guilt after a **virtual pet game** death in adults; the evidence is analogical (AI companions, robots, avatars, real pets).
- The Bloch & Lemish (*New Media & Society*, ~1999) and Turkle (*Alone Together*) primary texts were not retrieved; claims about them rely on secondary sources.
- The age-effect findings of Lawson & Chesney (2007) could not be read, so it is unknown whether older owners derive more or less companionship.
- No quantitative data on virtual-pet abandonment curves (e.g., typical D30 or D90 retention for pet games) was found.

---

## 2. Design patterns for daily engagement (appointment mechanics, streaks, loss aversion, variable rewards): evidence on retention and wellbeing; case studies (Duolingo, Finch, Animal Crossing, Neko Atsume)

### Takeaway
Streaks and daily rewards reliably raise engagement, and there is peer-reviewed evidence that intact streaks motivate and broken streaks demotivate. The same mechanics create obligation and FOMO, and the damage from a broken streak is worse when people blame themselves and smaller when they can repair it. Duolingo is the strongest industry evidence that streaks plus optimised reminders work commercially, but it is also the clearest example of guilt-based messaging. Finch, Neko Atsume and Animal Crossing show successful low-pressure alternatives.

### Cited Findings
**Streak psychology (peer-reviewed)**
- Silverman & Barasch, "On or Off Track: How (Broken) Streaks Affect Consumer Decisions", *Journal of Consumer Research* 49(6), 2023, pp. 1095–1117 (DOI 10.1093/jcr/ucac029). Across seven studies, intact streaks shown in behavioural logs increased subsequent engagement relative to broken streaks. The effect depends on how behaviour is *represented* in the log, not on actual past behaviour, because people treat a logged streak as a goal in itself. The effect is **amplified when consumers attribute the break to themselves** and **attenuated when they can "repair" a broken streak**. — [CU Boulder](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions); [INSEAD](https://www.insead.edu/faculty-research/publications/journal-articles/or-track-how-broken-streaks-affect-consumer); [Psychology Today summary](https://www.psychologytoday.com/us/blog/ulterior-motives/202306/how-broken-streaks-sap-motivation)
- University of Delaware coverage of Silverman's work says people are strongly motivated by streaks even when the streak is somewhat artificial, including when it can be repaired. — [UDaily, Mar 2024](https://www.udel.edu/udaily/2024/march/power-of-streaks-motivation-jackie-silverman/)

**Notifications and wellbeing (peer-reviewed)**
- Fitz, Kushlev, Jagannathan, Lewis, Paliwal & Ariely (2019), "Batching smartphone notifications can improve well-being", *Computers in Human Behavior* (DOI 10.1016/j.chb.2019.07.016). In a randomised field experiment (n = 237), participants whose notifications were **batched three times a day** felt more attentive and productive, were in a better mood, and felt more in control of their phones than controls. Caveats: the sample was in India and the intervention lasted two weeks. — [Author PDF (kushlev.com)](https://www.kushlev.com/s/2019-Fitz-Kushlev-etal-2019.pdf); [Semantic Scholar](https://www.semanticscholar.org/paper/Batching-smartphone-notifications-can-improve-Fitz-Kushlev/ce19cf66bdc6ced56a2f16d2483d97f9dc59b21d)
- Kushlev, Proulx & Dunn, "'Silence Your Phones': Smartphone Notifications Increase Inattention and Hyperactivity Symptoms", CHI 2016. In a week with interruptions maximised (n = 221), participants reported more inattention and hyperactivity than in a week with interruptions minimised (via search summary). — [Prosocial Design library entry](https://www.prosocialdesign.org/library/batching-notifications)

**Duolingo (case study)**
- Peer-reviewed: Yancey & Settles (Duolingo), "A Sleeping, Recovering Bandit Algorithm for Optimizing Recurring Notifications", ACM SIGKDD 2020. It optimises which reminder template to send, accounting for "recovering" arms (a template's effect depends on time since it was last used, i.e. novelty wears off) and "sleeping" arms (templates not eligible for some users). The reward signal is the user completing a lesson. The released data cover about 200 million practice reminders over 35 days. — [Duolingo Research PDF](https://research.Duolingo.com/papers/yancey.kdd20.pdf); [research.duolingo.com](https://research.duolingo.com/)
- Duolingo's blog says lesson completions rose within weeks of the bandit going live (company claim, not independently verified). — [Duolingo blog, "Hi, it's Duo: the AI behind the meme"](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/)
- Lenny's Podcast (15 Dec 2024) with Jackson Shuttleworth (Group PM, Duolingo retention) describes the streak as the best tool for driving CURR (Current User Retention Rate, Duolingo's main growth metric). It mentions two notification types, practice reminders and "last-chance" streak savers, and an internal debate over whether gem-purchased Streak Freezes should serve monetisation or retention (via search summary). — [Lenny's Newsletter](https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks)
- Duolingo now lets learners equip up to two Streak Freezes at a time. — [Duolingo blog, "How Duolingo streak builds habit"](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- Secondary claims, **unverified**: learners reaching a 7-day streak are 2.4x more likely to return the next day, and a "Streak Wager" A/B test improved Day-7 retention by 14%. **[industry blog]** — [Yu-kai Chou](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term-engagement-and-long-term-success/)
- A 2026 eight-week observational case study (*Int. J. of Mobile Applications and Technologies*, a minor journal) concluded Duolingo is highly effective at driving retention but does **not** cultivate habits that persist independently of the app. — [WR Publishing](https://www.wr-publishing.org/index.php/ijmat/article/view/908)
- Guilt by design: TechTimes, reporting The Verge, says Duolingo's owl and notification design was deliberately meant to guilt-trip users back to lessons. Head of design Tyler Murphy reportedly described the crying owl as part of the strategy to get users attached to the character (secondary report, not verified against The Verge). — [TechTimes, Apr 2022](https://www.techtimes.com/articles/273770/20220401/duolingo-makes-fun-overly-aggressive-owl-mascot-april-fools.htm)
- User accounts describe escalating messages such as "You made Duo sad" with a crying-owl GIF, and passive-aggressive "these reminders don't seem to be working" emails. **[opinion / personal account]** — [Medium, "I reverse-engineered Duolingo's guilt algorithm"](https://medium.com/@milessightings/i-reverse-engineered-duolingos-guilt-algorithm-6ddf598d2a72)

**Daily login rewards / appointment mechanics (industry)**
- Daily login rewards are the most common habit-forming strategy in a study of Korean mobile games (used by 95% of games examined). — [arXiv 2504.10714, "Playing to Pay"](https://arxiv.org/pdf/2504.10714)
- Industry practice: resetting a login streak to day 1 after a miss is often read as punishment. A "more forgiving model often used by top studios" keeps the streak alive, and some games let players recover a missed reward by watching an ad or paying. **[industry blog, ironSource]** — [Medium / ironSource LevelUp](https://medium.com/ironsource-levelup/keeping-players-engaged-common-strategies-for-daily-login-by-top-studios-b20d9b595035)

**Finch (gentle-design case study)**
- Finch is a self-care app built around a virtual bird. Founders Stephanie Yuan and Thomas "Nino" Budi built it after both struggled with anxiety and depression and found self-care hard to stick with. — [Paste Magazine](https://www.pastemagazine.com/tech/finch/finch-app-mental-health-virtual-pet-self-care) (via search summary); [App Store listing](https://apps.apple.com/DE/app/id1528595748)
- Reviews describe the bird as **never dying if you skip a day**, with "no penalty for an off day, only a small companion glad to see you back". This removes the guilt that makes many wellness apps a source of pressure. **[review sites]** — [Selfpause review 2026](https://www.selfpause.com/resources/finch); [Habitbox review](https://habitbox.app/blog/finch-app-review)
- One source describes the company as a Public Benefit Corporation **[low-reliability aggregator]**. A commentary says it avoided paywalling core self-care features **[opinion]**. — [Madeometer](https://madeometer.com/p/698f43a46066d001fbe2c374/Finch-Self-Care-Pet-app); [Medium](https://medium.com/@jashsak/the-12m-mental-health-app-that-broke-every-silicon-valley-rule-bd9d06e725f8)
- A Pratt design critique calls Finch "a digital Tamagotchi" using gamification and personification to build a relationship over time, but criticises its onboarding as overwhelming (it violates progressive disclosure). — [Pratt IXD critique, Feb 2026](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/)

**Animal Crossing (real-time clock case study)**
- Animal Crossing runs on the console's real clock and calendar. On load, the game compares the last-played time with the current time and **applies the difference in one batch** (weeds sprout, mail arrives, and so on) rather than simulating while off. Creator Katsuya Eguchi has spoken of wanting a game reflecting real-life rhythms. — [Cheat Code Central](https://www.cheatcc.com/articles/the-wall-clock-is-the-game-how-animal-crossing-tells-time/); [Wikipedia: Animal Crossing](https://en.wikipedia.org/wiki/Animal_Crossing)
- Absence and time-travel consequences are mild and mostly cosmetic or social. Long gaps produce weeds, unhappy residents and villagers moving away faster. Nintendo has not blocked clock manipulation, and commentators describe the consequences as "light, often manageable". — [StrategyWiki](https://strategywiki.org/wiki/Animal_Crossing:_Wild_World/Time_Traveling); [ACNL wiki](https://acnl.fandom.com/wiki/Time_traveling); [GameRant](https://gamerant.com/pokemon-pokopia-animal-crossing-time-travel-debate/)

**Neko Atsume (no-failure case study)**
- Hit-Point programmer Yutaka Takasaki built Neko Atsume to fill downtime between projects, with a modest download target of about 50,000 a year. — [Nippon.com](https://nippon.com/en/nipponblog/m00083)
- Developers interviewed for the 2024 VR version said the team aimed for a "friendlier, more relaxing" game while keeping the original's world view. — [Meta blog interview](https://www.meta.com/blog/neko-atsume-interview/)
- Core loop (known design): put out food and toys, and cats visit asynchronously. Absence has no punishment other than food running out and fewer visits. — [Wikipedia: Neko Atsume](https://en.wikipedia.org/wiki/Neko_Atsume)

### Inferences
- **Streaks:** Silverman & Barasch support streaks as a motivator but warn about the self-blame break. For a pet game, the analogue of a "repair" is a soft recovery path, and the analogue of an "external attribution" is a narrative such as "your pet went on an adventure". Both reduce the demotivation of a lapse. A design that frames a missed day as the player's moral failure (crying pet, "you abandoned me") maximises the harmful self-attribution effect.
- **Notifications:** Batching evidence supports a small number of user-scheduled care windows (e.g., morning, lunch, evening) rather than many need-triggered pings. Duolingo's bandit approach shows notification *novelty decays*, which explains why apps escalate tone. A fair design caps volume and tone instead of escalating.
- **Contrast between models:** Duolingo optimises for daily return using loss aversion and guilt. Finch, Neko Atsume and Animal Crossing use asynchronous, batch-on-return time with mild consequences. For a nostalgic-adult audience with jobs and families, the batch-on-return model fits better, and the commercial success of Neko Atsume and Finch shows it can work.
- Variable rewards (random visitors, rare events, surprise gifts) can deliver novelty without punishment. The ethical line is crossed when randomness is paired with paid access (loot-box-like mechanics; see Q5/Q6).

### Gaps
- No peer-reviewed study was found that measures the *wellbeing* effect of streak mechanics specifically (as opposed to engagement).
- Duolingo's internal retention numbers come only via secondary sources; the primary Duolingo blog posts on the streak wager and the 2.4x figure were not retrieved.
- No primary interview with Finch founders on the "no death / no punishment" choice was retrieved (the Paste article was blocked).
- No variable-reward (variable-ratio reinforcement) study specific to pet games was found. No relevant GDC Vault talk was located via search.

---

## 3. How games handle player absence fairly: pause/vacation modes, babysitter/daycare, gradual decay vs hard death, revival, forgiveness mechanics; designer commentary

### Takeaway
The genre has converged on a toolkit of forgiveness mechanics:
- explicit pause or "rest" modes (Habitica, newer Tamagotchis)
- paid or earned streak protection (Duolingo Streak Freeze, up to two equipped)
- sitters/nannies (modern Tamagotchis)
- batch-on-return simulation with mild decay (Animal Crossing)
- non-lethal neglect outcomes (Nintendogs dogs run away and return; Neopets pets cannot die)

The evidence base for *which* of these maximises wellbeing is thin. The streak-repair findings and the daily-quests study both point toward recovery options and away from progress-gating punishments.

### Cited Findings
- **Habitica "Rest in the Inn" / "Pause Damage":** a Settings toggle that stops missed Dailies from damaging the player. Dailies still refresh, so users can do some tasks while resting (e.g., during exams). While resting, quest progress (boss damage, item collection) is paused, but the player can still take damage from party members' missed Dailies. — [Habitica Wiki](https://habitica.fandom.com/wiki/Rest_in_the_Inn); [Wikipedia: Habitica](https://en.wikipedia.org/wiki/Habitica)
- **Tamagotchi:** newer models added a pause feature (encyclopedic). A guide site says modern models such as Pix and Uni have no traditional pause; instead the player hires a sitter or nanny via the in-game phone, and time paused on classic models delays evolution by the same amount. **[low-reliability guide; verify against Bandai manuals]** — [Wikipedia: Tamagotchi effect](https://en.wikipedia.org/wiki/Tamagotchi_effect); [ScienceDesk guide](https://sciencedesk.blog/how-to-pause-tamagotchi)
- **Duolingo:** a Streak Freeze covers one missed day, and up to two can be equipped. Duolingo publishes guidance on keeping a streak on vacation. — [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit); [Duolingo blog, vacation](https://blog.duolingo.com/how-to-keep-your-streak-on-vacation); [Duolingo fan wiki](https://duolingo.fandom.com/wiki/Shop/Streak_freeze)
- **Nintendogs:** dogs don't die. Neglected or mistreated dogs get dirty or hungry and can run away, but unlike Tamagotchi and Petz they always return (fan-written sources). — [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Nintendogs); [Tropedia](https://tropedia.fandom.com/wiki/Nintendogs)
- **Neopets:** pets cannot die, reportedly to spare children the heartbreak of returning to a dead pet. A critical essay argues the result is a kind of "permanent suffering", since pets remain in a dying or starving state. **[opinion]** — [Afterlife Art, "Begging for Death"](https://afterlifeart.net/2017/04/26/begging-for-death-the-diary-of-online-pets/)
- **Animal Crossing:** time difference applied in one batch on load; long absences bring weeds, unhappy residents and earlier villager departures, but nothing irreversible to the player's core progress. — [Cheat Code Central](https://www.cheatcc.com/articles/the-wall-clock-is-the-game-how-animal-crossing-tells-time/); [ACNL wiki](https://acnl.fandom.com/wiki/Time_traveling)
- **Login streak forgiveness:** a reset to day 1 is "often interpreted as a punishment", and top studios use forgiving models that keep the streak. Some offer recovery of missed rewards via ad or IAP. **[industry blog]** — [ironSource LevelUp](https://medium.com/ironsource-levelup/keeping-players-engaged-common-strategies-for-daily-login-by-top-studios-b20d9b595035)
- **Grace periods:** one guide recommends 24–36 hour grace periods to accommodate schedule variation. **[low-reliability industry knowledge base]** — [recited.io](https://recited.io/kb/game-monetization-strategies/player-engagement-and-retention/daily-rewards-and-login-bonuses/)
- **Evidence for repair:** being able to repair a broken streak attenuates its demotivating effect (Silverman & Barasch 2023, JCR). — [CU Boulder](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions)
- **Evidence against punishment gating progress:** engagement rewards felt most like "a chore"/"a job" when they gated progress (Frommel & Mandryk 2022). — [ACM DL](https://dl.acm.org/doi/pdf/10.1145/3549489)
- **Notification overload** leads players to disable all notifications. **[opinion / blog]** — [PlayHef](https://www.playhef.com/hidden-mechanics-behind-casual-game-addiction/)

### Inferences
- A defensible absence model for adults could combine the following:
  1. **Free, user-scheduled "vacation/sleep" mode**, Habitica-style, never paywalled.
  2. **Batch-on-return simulation** with gradual decay and a hard floor (the pet gets hungry, dirty, sad or sick, but has a long runway before anything irreversible).
  3. **A narrative sitter or daycare** (an NPC relative or neighbour) that takes over after N days of absence. This reframes the lapse as external (lowering self-blame per Silverman & Barasch) while still giving a mild consequence, e.g., the pet is a bit cooler toward you or missed a milestone.
  4. **Recovery mechanics earned through play**, not purchase.
- The phone's real clock creates fairness problems (time zones, travel, night shifts). Letting players set "awake hours" so needs don't accrue while the player sleeps is a straightforward fairness feature.
- Selling streak or neglect protection (as Duolingo does with gems) is common, but it monetises the anxiety the mechanic creates. In a pet game it also maps onto the "pay to avoid loss" dark pattern (see Q5) and onto EU "aggressive practice" concerns (see Q6).

### Gaps
- No GDC Vault talk or Game Developer (Gamasutra) article specifically on punishing vs forgiving real-time mechanics was located in this session; the designer commentary found is mostly industry blogs.
- Official Bandai documentation on the pause, sitter and death rules of current Tamagotchi models (Uni, Paradise) was not found.
- No controlled study compares pause vs decay vs hard-death outcomes for retention or wellbeing.

---

## 4. Death mechanic design: hard permadeath vs soft consequences, memorial/graveyard features, generational legacy, documented player reactions

### Takeaway
Hard death from neglect is historically authentic (original Tamagotchi) and is what gives classic pets their stakes. However, most successful later pet games deliberately removed lethal neglect (Nintendogs, Neopets, Petz reportedly, Finch, Neko Atsume) or made death cosmetic. Where death exists, players and communities create memorial rituals (online Tamagotchi cemeteries, AIBO funerals). Permadeath elsewhere in games tends to work best as an **opt-in hardcore mode**, not a forced default.

### Cited Findings
- **Original Tamagotchi death:** death was a common fail-state from user error or old age. Depending on version, it showed a ghost and headstone (Japanese releases), an angel (English localisations), or a UFO taking the pet away. Some pets die in different ways depending on prior care. — [Burials & Beyond, "Tamagotchi cemetery"](https://burialsandbeyond.com/2021/03/06/tamagotchi-cemetery/); [VICE, "The Tamagotchi Cemetery"](https://develop.vice.com/en/article/the-tamagotchi-cemetery/)
- **Memorial behaviour:** online Tamagotchi cemeteries let owners post eulogies, ages and causes of death. Many are abandoned, but Tama Talk's memorial page still keeps records. — [Burials & Beyond](https://burialsandbeyond.com/2021/03/06/tamagotchi-cemetery/); [VICE](https://develop.vice.com/en/article/the-tamagotchi-cemetery/)
- **Modern Bandai:** Tamagotchi Uni's "Angel Festival" pays tribute to the 1990s Tamagotchi Angel, but its angel elements are mostly cosmetic (minigame and location) and do not reproduce the original mechanics. — [Siliconera](https://www.siliconera.com/tamagotchi-uni-angel-festival-calls-back-to-the-tamagotchi-angel/)
- **Avoiding death as a product decision:** a forum post attributed to a PF.Magic (Petz) insider says the team "made a marketing decision to not allow death to keep customers happy". The same thread says *Hatch with Fugus* made neglected pets run away instead, which still upset the poster's children. **[anecdotal forum post]** — [Boing Boing BBS](https://bbs.boingboing.net/t/what-happens-when-your-virtual-pets-die/62738)
- **Soft consequences in shipped games:** Nintendogs (run away, always return) — [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Nintendogs); Neopets (cannot die) — [Afterlife Art](https://afterlifeart.net/2017/04/26/begging-for-death-the-diary-of-online-pets/); Finch (bird never dies) — [Selfpause](https://www.selfpause.com/resources/finch).
- **Permadeath as an option:** some games offer a hardcore mode with permadeath rather than making it core. Supporters argue the risk gives actions more significance. — [Wikipedia: Permadeath](https://en.wikipedia.org/wiki/Permadeath)
- Some players say permadeath "would simply fill me with stress and rage". **[forum opinion]** — [ResetEra thread](https://www.resetera.com/threads/does-anyone-play-or-enjoy-permadeath-modes-in-games.1269918/)
- **Academic caution:** the 2025 virtual-pet review flags "the use of mortality as a design choice" as an ethics theme. — [Dodd, Fowler & Lottridge 2025](https://www.sciencedirect.com/science/article/pii/S1875952125000382)
- **Designing for loss:** Banks argues for a design ethic that plans for the loss of digital companions, and forewarning before termination reduced feelings of loss (Kim et al.). — [ISPR summary](https://ispr.info/2025/02/04/syracuse-professor-jaime-banks-on-the-rise-of-ai-companionship/)
- **Ritual helps:** AIBO owners described relief at a prayer for their robot dog. — [Buddhistdoor](https://www.buddhistdoor.net/news/japanese-buddhist-temple-holds-funerals-for-defunct-robot-dogs/). VRChat avatar loss led to ritualised remembrance. — [PMC12727626](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12727626/)

### Inferences
- **Recommended structure (analyst inference):** offer a mode choice at pet creation with clear, upfront explanation:
  - **"Gentle" (default):** the pet cannot die of neglect. It gets sick or sad, or leaves for a sitter/daycare and returns.
  - **"Classic" (opt-in, nostalgia mode):** authentic death is possible, but only after a long, visible decline with several in-game and optional push warnings (forewarning). Death is never caused by the player's sleep hours or a declared vacation.
- **Natural death from old age** (a full life cycle) gives legacy and meaning without blame. It can feed a **generational system** (offspring inherit traits; a family tree) and a **memorial garden or graveyard** with name, age, cause and a player-written epitaph, mirroring what Tamagotchi owners did spontaneously online.
- **Never monetise revival in "Classic" mode.** Paid revival turns the stakes into a toll and invites "aggressive practice" scrutiny under EU law (see Q6). If any revival exists, it should be free or earned and disclosed upfront.
- Neopets' "can't die but suffers forever" is a cautionary example. A soft consequence should resolve (the pet recovers, or leaves for a better place), not keep the player in a guilt loop.

### Gaps
- No systematic dataset of app-store reviews about pet death in mobile pet games was found. Player-reaction evidence is anecdotal (forums, essays).
- No source found on how Tamagotchi Paradise (2025) handles death, or on Bandai's rationale for changing death mechanics over time.
- No empirical study compares opt-in permadeath with default soft-death in a pet game.

---

## 5. Dark patterns specific to this genre (guilt notifications, paid revival, pay-to-avoid-neglect, energy timers, confirmshaming), academic taxonomies, and how to avoid them

### Takeaway
The genre maps directly onto established taxonomies: Zagal, Björk & Lewis's "temporal" patterns (playing by appointment, grinding) and "monetary" patterns (pay to skip), plus emotional "stirring" (EDPB) and confirmshaming. Regulators have already acted against neighbouring practices: the CPC Network against Star Stable (time-limited pressure, direct exhortation to children), the Hungarian GVH sweep (fake countdowns, misleading close buttons, opaque currencies), and the FTC against Epic and HoYoverse. A pet-in-distress plus paid-fix loop sits at the intersection of all of these.

### Cited Findings
**Taxonomies**
- Zagal, Björk & Lewis, "Dark Patterns in the Design of Games" (FDG 2013), define dark game design patterns as patterns a creator uses deliberately to cause negative player experiences that run against players' interests. Secondary sources describe three categories: **temporal** (e.g., grinding, **playing by appointment**), **monetary** (e.g., **pay to skip**) and **social-capital-based** (e.g., social pyramid schemes). — [Chalmers research record](https://research.chalmers.se/en/publication/177148); [Deceptive Patterns summary](https://www.deceptive.design/articles/dark-patterns-in-the-design-of-games)
  - Note: the full per-category list in the original paper (e.g., "pre-delivered content", "monetized rivalries", "impersonation") was not re-verified in this session.
- A DiGRA 2020 paper critiques the Zagal framework as lacking an explicit ethical framework behind its judgements. — [White Rose eprints, DiGRA 2020 paper 189](https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf)
- Later work extends the taxonomy, including a fourth "psychological" category and a large-scale analysis of mobile games (via search summary; full text not accessible). — [arXiv 2412.05039, "Level Up or Game Over: Exploring How Dark Patterns Shape Mobile Games"](https://arxiv.org/abs/2412.05039)
- **EDPB Guidelines 03/2022** on deceptive design patterns (v2.0 adopted 14 Feb 2023). They are formally aimed at social-media interfaces under the GDPR but are widely treated as relevant across digital services. Categories include **Overloading** (e.g., continuous prompting), **Skipping** and **Stirring** (steering choices via emotion or visuals). — [Clifford Chance](https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2023/03/deceptive-design-patterns-and-where-to-find-them-edpb.html); [Headless Law (EDPB text)](https://www.headlesslaw.com/gdpr/level-3/guidelines/edpb-03-2022-deceptive-design-patterns)

**Engagement-reward harms (peer-reviewed)**
- Daily quests and engagement rewards produce FOMO and obligation, and feel like "a chore" or "a job" especially when they gate progress (Frommel & Mandryk 2022). — [ACM DL](https://dl.acm.org/doi/pdf/10.1145/3549489)

**Regulatory findings on concrete patterns**
- **CPC Network vs Star Stable Online (March 2025):** the authorities found practices breaching EU consumer law that could especially harm children, including **direct exhortations to children** to buy and **time-limited purchase pressure**. They also rejected the company's argument that "Star Coins" were not a digital representation of value. — [European Commission press release IP/25/831](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_25_831/IP_25_831_EN.pdf); [CPC Common Position on Star Stable](https://commission.europa.eu/document/download/030ff1d8-526e-4807-8a7e-1505f9e235d9_en?filename=Common+Position+on+Star+Stable+Online+.pdf)
- **Hungarian GVH sweep (May 2023, published 8 June 2023):** 30 popular free children's mobile games were tested for dark patterns.
  - In 24 of 30, in-game purchases were possible.
  - Interstitial ads often promised "rewards" or encouraged purchases or downloads.
  - Half of the games asked children for personal data.
  - Bird & Bird's summary adds: **artificially "slowed down" countdown timers** in ads, **misleading close ("x") buttons**, previews unlike real gameplay, **virtual currencies with complicated conversions that obscure real-world value**, and **limited-time offers creating false scarcity**.
  - The GVH then issued guidance for businesses (e.g., always clearly display the exact amount payable; clearly indicate when gameplay is interrupted by advertising).
  - Sources: [GVH press release (PDF)](https://www.gvh.hu/pfile/file?path=/en/press_room/press_releases/press-releases-documents/press-releases-2023/sk_2023_06_08_mobiljatek_sweep_a&inline=true); [Bird & Bird summary](https://competitionlawinsights.twobirds.com/post/102loqp/protecting-children-from-misleading-practices-in-mobile-gaming-insights-from-the)
- **FTC v. Epic Games (final order March 2023):** Epic paid $245 million in consumer refunds over "dark patterns" that tricked players into unwanted purchases (with a separate $275 million COPPA penalty, $520 million in total). The FTC also alleged Epic **locked accounts of customers who disputed charges**. The order bars charging via dark patterns or without affirmative consent. — [FTC](https://www.ftc.gov/node/80648); [PBS NewsHour](https://www.pbs.org/newshour/amp/nation/fortnite-maker-epic-games-to-settle-ftc-case-pay-520-million-in-penalties-and-refunds); [CBS News](https://www.cbsnews.com/amp/news/epic-games-fortnite-ftc-refund)
- **FTC v. HoYoverse / Genshin Impact (January 2025):** $20 million penalty, a ban on selling loot boxes to under-16s without parental consent, and required disclosure of loot-box odds and virtual-currency exchange rates. Loot boxes may not be sold for virtual currency unless they can also be bought directly with US dollars. The complaint alleged consumers were deceived about the odds and costs of "five-star" prizes. The FTC's consumer-protection director said companies deploying "dark-pattern tactics" will be held accountable for deceiving players about the true costs of in-game transactions. — [FTC business blog, Jan 2025](https://ftc.gov/business-guidance/blog/2025/01/level-tips-businesses-ftcs-settlement-genshin-impact-developer-hoyoverse); [PocketGamer.biz](https://www.pocketgamer.biz/hoyoverse-agrees-to-20-million-settlement-with-ftc-over-loot-boxes/)

**Guilt-based messaging (industry example)**
- Duolingo's crying-owl and "You made Duo sad" notifications were reportedly intended to guilt-trip users back. User accounts describe them as anxiety-inducing or demotivating, while others find them funny and motivating. — [TechTimes](https://www.techtimes.com/articles/273770/20220401/duolingo-makes-fun-overly-aggressive-owl-mascot-april-fools.htm); [Medium **[opinion]**](https://medium.com/@milessightings/i-reverse-engineered-duolingos-guilt-algorithm-6ddf598d2a72)

**Paid recovery of missed rewards**
- Some mobile games let players recover a missed daily reward by watching an ad or paying, a monetised "repair" of a loss the game itself created. **[industry blog]** — [ironSource LevelUp](https://medium.com/ironsource-levelup/keeping-players-engaged-common-strategies-for-daily-login-by-top-studios-b20d9b595035)

### Inferences
Genre-specific dark patterns and safer alternatives (analyst synthesis from the taxonomies and enforcement above):

| Dark pattern (genre form) | Why it is a problem | Safer alternative |
|---|---|---|
| **Guilt notifications** ("Pip is starving and crying, you abandoned him") | Emotional "stirring" and confirmshaming; amplifies self-attribution of lapses (Silverman & Barasch) | Neutral, informative, opt-in reminders at user-chosen times; positive framing ("Pip saved you a seat"); automatic back-off after non-response, without passive-aggressive "we'll stop since you don't care" copy |
| **Paid revival / resurrection** | Monetises grief at a moment of impaired judgement; candidate "aggressive practice" | No paid revival; if any revival exists, it is free or earned and disclosed upfront; memorial and new-generation path instead |
| **Pay-to-avoid-neglect** (paid "insurance", paid sitter, paid pause) | Monetises anxiety the design creates; Zagal "pay to skip"; parallels the gem-bought Streak Freeze monetisation-vs-retention debate | Pause/vacation and sitter free for everyone |
| **Energy timers / care-action limits** with paid refills | Temporal plus monetary dark pattern; "playing by appointment" | Care actions unlimited, or with timers purely for pacing and no paid skip |
| **Urgency offers tied to pet distress** ("medicine 50% off, 10 minutes left!") | Mirrors the Star Stable and GVH findings (time-limited pressure, fake countdowns) | No time-limited offers on care essentials; real-money prices shown |
| **Confirmshaming on opt-out** ("No, I don't love my pet") for notifications or subscriptions | Classic confirmshaming; manipulative consent (Apple 5.1.1(iv)) | Neutral opt-out labels |
| **Opaque premium currency** for care items | CPC Key Principles; GVH findings | Real-money pricing, or no premium currency at all |
| **Loot-box style random pet eggs or accessories for money** | Apple odds disclosure; FTC HoYoverse; EU scrutiny | Avoid entirely, or disclose odds and allow direct purchase |

- A practical test for the team: *would the feature still be fair if the player could not pay and never received a notification?* If the pet's welfare depends on money or on responding to pings, the design is likely exploitative.

### Gaps
- The full text of the Zagal et al. paper and of the arXiv mobile-game dark-pattern study could not be retrieved, so the exact pattern lists were not re-verified.
- No peer-reviewed study specifically on dark patterns in *virtual pet* games was found.
- A reported €1.1 million Dutch fine against Epic Games (Fortnite, pressuring children) appeared only in an aggregator. One summary called it a court ruling; it is believed to be an ACM regulatory decision. It is unverified and should be checked before use.
- Petrovskaya & Zendle's "predatory monetisation" categorisation (thought to be in *Journal of Business Ethics*) could not be located through search in this session.

---

## 6. Regulation: EU (UCPD, CPC virtual-currency principles, DSA Art. 25, Digital Fairness Act status, GDPR/ePrivacy), US (FTC), Apple/Google store rules, age ratings (PEGI/IARC)

### Takeaway
For a Hungary-based developer selling a single-player pet game to EU consumers, the binding framework today is mainly the **UCPD** (enforced in Hungary by the GVH and coordinated EU-wide via the CPC Network), the **CRD** (consumer rights, withdrawal), **GDPR + ePrivacy** (consent for analytics/SDKs), and **app-store rules**.

- **DSA Art. 25** probably does **not** apply unless the app hosts and disseminates user content (i.e., is an "online platform").
- The **Digital Fairness Act** had **not been tabled as of late October 2026**; it is expected in Q4 2026 and would then take a year or more to negotiate.
- The **CPC Key Principles on in-game virtual currencies** (March 2025) are non-binding but show enforcement direction. A new CPC action against nine game companies (reported 30 Sept 2026) explicitly examines **addictive design**.
- In the US, the FTC acts case-by-case under Section 5 and ROSCA; the click-to-cancel rule was vacated in July 2025.
- **Apple 4.5.4** requires explicit opt-in for promotional pushes and forbids making notifications necessary for the app to work.

### Cited Findings
**EU — Unfair Commercial Practices Directive (UCPD) and Commission guidance**
- The Commission's 2021 UCPD Guidance (C/2021/9320, OJ 29 Dec 2021) replaced the 2016 guidance and covers digital content and games. It states that online games likely to concern children or teenagers are usually not *solely* targeted at children, so a foreseeability test applies. It also says prices of virtual items should be displayed. — [EUR-Lex 52021XC1229(05)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A52021XC1229%2805%29); [Wiggin summary](https://www.wiggin.co.uk/insight/new-guidance-for-digital-businesses-on-the-unfair-commercial-practices-directive/)
- **Annex I No. 28** (blacklist, unfair in all circumstances) bans direct exhortations to children to buy, or to persuade adults to buy for them ("pester power"). Assessment is case-by-case, considering design, medium, language, child-appealing characters and direct purchase links. — [EUR-Lex 2021 Guidance](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A52021XC1229%2805%29)
- The 2021 guidance contains a dark-patterns section (4.2.7). Consumer group BEUC stresses that guidance is non-binding and that the UCPD Annex I blacklist does not specifically address digital interfaces. — [Video Games Europe DFA consultation response, Oct 2025](https://www.videogameseurope.eu/wp-content/uploads/2025/10/Video-Games-Europe-response-to-the-public-consultation-and-call-for-evidence-for-the-Digital-Fairness-Act-impact-assessment.pdf); [BEUC dark-patterns paper (2022)](https://www.beuc.eu/sites/default/files/publications/beuc-x-2022-013_dark_patters_paper.pdf)
- The European Parliament adopted a resolution on consumer protection in online video games in January 2023 (P9_TA(2023)0008); its content was not retrieved in this session. — [EUR-Lex 52023IP0008](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A52023IP0008)

**EU — CPC Network Key Principles on in-game virtual currencies (21 March 2025)**
- **Scope:** currencies bought with real money and used for in-game content or services. Currencies obtainable *only through gameplay* and cryptocurrencies are **out of scope**. — [Baker McKenzie](https://connectontech.bakermckenzie.com/european-consumer-protection-network-issues-new-key-principles-on-in-game-virtual-currencies-impact-for-gaming-and-gambling-entities-in-belgium-the-eu-and-beyond/); [Key Principles PDF (Commission)](https://commission.europa.eu/document/download/8af13e88-6540-436c-b137-9853e7fe866a_en?filename=Key+principles+on+in-game+virtual+currencies.pdf&prefLang=hu)
- **Content (seven non-exhaustive principles; led by the Dutch ACM and the Norwegian Consumer Authority):**
  - show prices in real money for both currency and items
  - avoid practices that obscure the cost of content, including mixing multiple currencies or forced exchanges
  - provide pre-contractual information
  - respect withdrawal rights
  - use fair contract terms
  - account for vulnerable consumers, especially children

  Sources: [European Commission IP/25/831](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_25_831/IP_25_831_EN.pdf); [Linklaters](https://techinsights.linklaters.com/post/102k6t4/game-changer-eu-introduces-consumer-protection-guidance-for-in-game-virtual-curr); [Bird & Bird](https://www.twobirds.com/en/insights/2025/european-move-towards-protecting-users-from-harmful-practices-in-video-games-eu-consumer-protection)
- **Status:** not binding. Non-compliance is not automatically unlawful, but the principles indicate how authorities will interpret the law. Industry bodies (EGDF, Video Games Europe) criticised the lack of prior engagement. — [Baker McKenzie](https://connectontech.bakermckenzie.com/european-consumer-protection-network-issues-new-key-principles-on-in-game-virtual-currencies-impact-for-gaming-and-gambling-entities-in-belgium-the-eu-and-beyond/)
- **Follow-up enforcement:** a June 2025 Commission-hosted stakeholder dialogue did not produce satisfactory solutions according to reporting, and enforcement continued. In early 2026 a parallel action was opened against Activision Blizzard over Call of Duty Mobile and Diablo Immortal (dialogue ongoing). — [Commission news, 3 Jun 2025](https://commission.europa.eu/news-and-media/news/european-commission-hosts-stakeholders-talks-application-cpc-networks-key-principles-games-virtual-2025-06-03_en); [Commission coordinated actions page](https://commission.europa.eu/topics/consumers/consumer-rights-and-complaints/enforcement-consumer-protection/coordinated-actions/social-media-online-games-and-search-engines_en)
- **Newest action (reported 30 September 2026):** the CPC Network launched coordinated investigations into nine video game companies. The scope covers the sale of in-game virtual currencies, collection of personal data, **whether games have addictive designs**, default parental-control settings, direct marketing to children, and account blocking. The Commission says this is not a finding of wrongdoing. — [Society for Computers & Law](https://www.scl.org/eu-consumer-protection-network-launches-action-related-to-nine-video-games/); [TLT](https://www.tlt.com/insights-and-events/insight/fair-play-for-gamers-cpc-network-takes-enforcement-action-on-in-game-virtual-currencies)

**EU — Hungary (developer's home authority)**
- The GVH ran a mobile-game dark-pattern sweep (May 2023; 30 games) and published business guidance (findings in Q5). — [GVH press release](https://www.gvh.hu/pfile/file?path=/en/press_room/press_releases/press-releases-documents/press-releases-2023/sk_2023_06_08_mobiljatek_sweep_a&inline=true); [Bird & Bird](https://competitionlawinsights.twobirds.com/post/102loqp/protecting-children-from-misleading-practices-in-mobile-gaming-insights-from-the)
- In October 2026 the GVH hosted OECD and European Commission experts for training in Budapest that reportedly covered dark patterns. — [EuropaWire, 27 Oct 2026](https://news.europawire.eu/hungarian-competition-authority-hosts-oecd-and-european-commission-experts-for-competition-law-training-in-budapest/eu-press-release/2026/10/27/11/37/04/184591/)

**EU — Digital Services Act Art. 25**
- Art. 25(1) bans deceptive or manipulative interface design by **online platforms**. Art. 25(2) excludes practices already covered by the UCPD or the GDPR. BEUC states the DSA does not apply to video games (or to web shops selling only their own products) unless they qualify as intermediary services. — [BEUC dark-patterns paper](https://www.beuc.eu/sites/default/files/publications/beuc-x-2022-013_dark_patters_paper.pdf); [Osborne Clarke](https://www.osborneclarke.com/insights/digital-fairness-act-unpacked-dark-patterns)

**EU — Digital Fairness Act (DFA) status, as of 28 Oct 2026**
- **Not yet tabled.**
  - The EP Legislative Train (as of 1 Aug 2026) lists it as announced, with an indicative Q4 2026 date. — [European Parliament Legislative Train](https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act)
  - Commissioner Michael McGrath has said he will table it before the end of 2026. — [PrivacyLaws](https://www.privacylaws.com/news/eu-proposal-on-digital-fairness-act-expected-by-the-end-of-2026/)
  - An EPRS briefing (Oct 2026) says the proposal is expected in autumn 2026 (via search summary; page blocked). — [EPRS briefing](https://eprs.europarl.europa.eu/contents/publications/EPRS/2026/10/EPRS_BRI(2026)791529.html)
- **Conflicting dates:** some trackers give ~11 November 2026; others say no firm date exists. **[commentary]** — [Lawgent](https://lawgent.se/the-digital-fairness-act-arrives-in-november-most-of-what-it-targets-is-already-unlawful/); [digital-fairness-act.eu timeline](https://digital-fairness-act.eu/timeline/)
- **Expected scope:** dark patterns, influencer marketing, **addictive design of digital products**, unfair personalisation, and (per many stakeholders) in-game currencies, loot boxes and subscriptions. — [Wikipedia: Digital Fairness Act](https://en.wikipedia.org/wiki/Digital_Fairness_Act); [EP Think Tank, Jan 2025](https://epthinktank.eu/2025/01/14/regulating-dark-patterns-in-the-eu-towards-digital-fairness/)
- **Positions:**
  - The Netherlands proposed adding harmful video-game practices to the UCPD Annex I blacklist. — [Dutch non-paper](https://open.overheid.nl/documenten/605d3346-c973-40d7-bf35-0994f777e8aa/file)
  - BEUC's December 2025 position paper pushes for new binding rules. — [BEUC Dec 2025](https://www.beuc.eu/sites/default/files/publications/BEUC-X-2025-110_Towards_the_Digital_Fairness_Act.pdf)
  - Video Games Europe argues existing law suffices and asks for practical guidance with compliant-design examples. — [Video Games Europe response](https://www.videogameseurope.eu/wp-content/uploads/2025/10/Video-Games-Europe-response-to-the-public-consultation-and-call-for-evidence-for-the-Digital-Fairness-Act-impact-assessment.pdf)
- **Timeline after tabling:** Parliament and Council negotiations would likely run well into 2027 or later; possible adoption in late 2027 is speculative. — [The European Post](https://theeuropeanpost.eu/research-analysis/digital-fairness-act-targets-dark-patterns-before-2027/); [digitalfairnessact.com timeline](https://digitalfairnessact.com/historic-timeline)

**EU — GDPR / ePrivacy (analytics, SDKs, notifications)**
- **CNIL Recommendation on mobile applications** (final version; PDF dated 2025):
  - covers both GDPR (personal data) and ePrivacy (device access/trackers)
  - publishers share responsibility for third-party SDKs and should vet them
  - some mobile identifiers used for profiling cannot be used without prior consent
  - legitimate interest, contract and consent should be distinguished as legal bases
  - the CNIL announced increased audits of apps

  Sources: [CNIL recommendation PDF](https://www.cnil.fr/sites/cnil/files/2025-05/recommendation-mobiles-app.pdf); [Privado summary](https://www.privado.ai/post/cnil-publishes-mobile-app-privacy-guidance)
- **EDPB Guidelines 03/2022** (deceptive design patterns, adopted Feb 2023) apply GDPR principles (fairness, transparency) to interface design, including consent flows. — [Clifford Chance](https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2023/03/deceptive-design-patterns-and-where-to-find-them-edpb.html)

**US — FTC**
- **Epic Games:** $245M refunds for dark-pattern purchases, final March 2023. The order requires affirmative consent before charging and bars dark patterns (details in Q5). — [FTC](https://www.ftc.gov/node/80648)
- **HoYoverse (Genshin Impact), Jan 2025:** $20M; loot-box odds and currency exchange-rate disclosure; no loot-box sales to under-16s without parental consent. The proposed order required court approval (final status not confirmed here). — [FTC business blog](https://ftc.gov/business-guidance/blog/2025/01/level-tips-businesses-ftcs-settlement-genshin-impact-developer-hoyoverse)
- **Click-to-cancel:** the Eighth Circuit vacated the FTC's Negative Option Rule on 8 July 2025 (one source says 2 July). The FTC continues enforcing **ROSCA** (clear disclosure of material terms, express informed consent, simple cancellation) and Section 5, and restarted negative-option rulemaking with an advance notice (reported Feb 2026). California's amended auto-renewal law imposes similar requirements. — [Cooley](https://www.cooley.com/news/insight/2025/2025-07-11-click-to-cancel-just-got-cancelled-eighth-circuit-vacates-entirety-of-ftcs-negative-option-rule); [Gibson Dunn](https://www.gibsondunn.com/ftc-restarts-negative-option-rulemaking-after-eighth-circuit-vacatur-enforcement-under-rosca-continues/); [Wiley](https://www.wiley.law/alert-With-Click-to-Cancel-Rule-Now-Vacated-by-8th-Circuit-Whats-Next-for-FTC)

**Apple App Store Review Guidelines (read directly from developer.apple.com, Oct 2026; page shows no last-updated date)**
- **4.5.4 Push Notifications (verbatim):** "Push Notifications must not be required for the app to function, and should not be used to send sensitive personal or confidential information. Push Notifications should not be used for promotions or direct marketing purposes unless customers have explicitly opted in to receive them via consent language displayed in your app's UI, and you provide a method in your app for a user to opt out from receiving such messages. Abuse of these services may result in revocation of your privileges." — [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **3.1.1:**
  - in-game currencies and unlocks must use IAP
  - "Any credits or in-game currencies purchased via in-app purchase may not expire"
  - loot boxes or other randomised paid items must disclose odds before purchase
  - Source: [Apple Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **3.2.2(x):** apps must not force ratings or reviews to access functionality, but may incentivise in-app actions (e.g., completing a level or watching an ad). — [Apple Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **5.1.1(ii)/(iv):** consent is needed for user or usage data collection (even if anonymised). Paid functionality must not depend on granting data access. Consent must be easy to withdraw. Apps "must not attempt to manipulate, trick, or force people to consent to unnecessary data access". **5.1.2(i):** tracking requires ATT permission. — [Apple Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **2.3.6:** answer age-rating questions honestly. Developers are responsible for local rating requirements in each territory. — [Apple Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- **Apple's 2025 age-rating overhaul:**
  - tiers are now 4+, 9+, 13+, 16+, 18+ (12+ and 17+ removed)
  - new required questionnaire items (in-app controls, capabilities, medical/wellness topics)
  - the deadline to answer was 31 Jan 2026, after which updates are blocked until completed
  - secondary sources say cartoon/fantasy violence maps to 9+ (infrequent) or 13+ (frequent)
  - Sources: [Apple Developer News](https://developer.apple.com/news/?id=ks775ehf); [iClarified](https://www.iclarified.com/97995/apple-overhauls-app-store-age-ratings-with-new-13-16-and-18-categories); [ptkd.com explainer](https://ptkd.com/journal/app-store-age-ratings-2025-update)

**Google Play / Android**
- **Android 13+ (API 33):** POST_NOTIFICATIONS is a runtime permission. Google recommends requesting it **in context** and offers the option to wait until users are familiar with the app (e.g., the 3rd or 4th launch), with a rationale screen when `shouldShowRequestPermissionRationale()` is true. — [Android Developers: Notification runtime permission](https://developer.android.com/develop/ui/views/notifications/notification-permission)
- **Play policy:**
  - apps may not use the full-screen-intent permission to force interaction with disruptive ads or notifications (Android 14+ requires a declaration)
  - ads may not mimic system notifications or warnings
  - "disruptive ads" shown in unexpected ways are prohibited
  - apps may not suppress OS or other apps' alerts
  - Sources: [Play Console Help: Ads policy](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en); [Play Console Help: Device and Network Abuse](https://support.google.com/googleplay/android-developer/answer/16559646?hl=en); [Play Developer Program Policy](https://support.google.com/googleplay/android-developer/answer/18258653?hl=en)
- **Ratings:** Google Play uses IARC ratings; content descriptors explain why a rating was assigned. — [Google Play Help: content ratings](https://support.google.com/googleplay/answer/6209544?hl=en)

**Age ratings — PEGI / IARC**
- PEGI's questionnaire treats sustained depictions of death or injury to human-like or animal-like characters under the violence descriptor. Non-graphic violence toward human-looking characters or recognisable animals is associated with PEGI 12 (secondary, school-hosted copy of the PEGI questionnaire). — [PEGI questionnaire (school-hosted copy)](https://rhodesavenue.school/wp-content/uploads/2019/05/PEGI-Descriptors.pdf); [Wikipedia: PEGI](https://en.wikipedia.org/wiki/PEGI)
- A peer-reviewed study found unsatisfactory compliance by game companies with ESRB, PEGI and IARC loot-box warning-label requirements. — [Royal Society Open Science 10(3) 230270](https://royalsocietypublishing.org/rsos/article/10/3/230270/91968/Beneath-the-label-unsatisfactory-compliance-with-ESRB-PEGI-and-IARC-industry-self-regulation-requiring-loot-box-presence-warning-labels-by-video-game-companies)

### Inferences
(Analyst inferences; not legal advice, verify with counsel.)
- **Adult audience is not a safe harbour.** Under the UCPD's foreseeability approach, a cute pet game is "likely to concern" children and teens even if marketed to adults. Annex I No. 28 (no direct exhortation to children) and child-sensitive design remain relevant. Avoid "buy now for your pet" calls to action addressed in the second person near purchase buttons.
- **Pet-in-distress plus paid fix is the highest-risk combination.** It resembles the "time-limited purchase pressure" and "direct exhortation" findings in Star Stable, and arguably the UCPD's aggressive-practice provisions (Arts. 8–9, which cover undue influence and the exploitation of circumstances that impair judgement). This is the analyst's reading; Arts. 8–9 were not re-read in this session.
- **If the game uses a premium currency, comply with the CPC Key Principles now:**
  - real-money price display
  - no currency mixing
  - no forced overbuy (pack sizes matching item prices)
  - CRD withdrawal-right handling
  - Apple's no-expiry rule for purchased currency

  Simplest route: sell care items, cosmetics or a one-time premium unlock directly for money, with no premium currency.
- **The Sept 2026 CPC action names "addictive designs" in scope.** Streak/neglect pressure and notification strategy could be scrutinised in future even for non-currency games, and the DFA, if tabled as expected, is likely to target addictive design explicitly. Designing to the stricter standard now reduces re-work.
- **DSA Art. 25 likely does not apply** to a single-player pet game unless it adds public UGC sharing (e.g., public pet galleries or forums that make it an online platform). If such features are added, reassess.
- **GDPR/ePrivacy:** treat analytics, attribution and ad SDKs as consent-based (CNIL approach), with a neutral (non-guilt) consent UI. Keep the OS notification permission separate from any marketing-push opt-in.
  - Care reminders: requested in context per Android guidance.
  - Promotional pushes: explicit opt-in per Apple 4.5.4, plus an in-app opt-out.
  - The game must remain fully playable without notifications (Apple 4.5.4), which also argues against designs where pet survival effectively requires push notifications.
- **US:** no dedicated dark-pattern statute; FTC Section 5 plus ROSCA (for any subscription), with Epic and HoYoverse as the clearest precedents. Affirmative purchase consent, easy cancellation, and no account penalties for refunds or chargebacks.
- **Age rating:** non-graphic, cartoon pet death from neglect or old age (no violence) would likely not trigger PEGI violence descriptors, or at most low tiers. Including in-game purchases triggers the IARC/PEGI "In-game Purchases" notice. Apple's questionnaire answers drive the rating automatically. This is inferred and should be validated by completing the IARC questionnaire.

### Gaps
- The full Key Principles PDF and the EPRS October 2026 DFA briefing could not be opened (sandbox network blocks). The list of seven principles is reconstructed from Commission and law-firm summaries; exact wording is unverified.
- No authoritative source was found on whether **push notifications themselves** count as "electronic mail" direct marketing under ePrivacy Art. 13, or need ePrivacy Art. 5(3) consent for the push token. Practice relies on OS permission plus Apple 4.5.4 opt-in. Needs counsel or DPA confirmation (e.g., NAIH in Hungary).
- The content of the Commission's 2024 Digital Fairness Fitness Check and the EP's January 2023 video-games resolution was not retrieved.
- Two EUR-Lex documents surfaced in search, a 2026 Commission Communication (OJ C/2026/3601) and C(2026)4110, but their content was not checked. They may be relevant updated guidance and should be verified.
- No GVH *enforcement decision with a fine* against a mobile game was found; only the 2023 sweep and guidance.
- No official PEGI or IARC ruling on virtual-pet death specifically was found. The PEGI questionnaire copy used is a third-party-hosted PDF.
- The court-approval status of the FTC–HoYoverse order and the exact current Google Play policy text on notification content (beyond ads and full-screen intents) were not confirmed.
