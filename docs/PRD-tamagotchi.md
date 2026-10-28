# Pixeltojás: termékkövetelmény-dokumentum (PRD)

Valós idejű virtuális kedvenc felnőtt, nosztalgikus játékosoknak, natív iOS és Android platformra.

---

## 1. Dokumentum adatai

| Mező | Érték |
|---|---|
| Termék | Pixeltojás (munkacím; név- és védjegy-ellenőrzés függőben, lásd D9) |
| Dokumentum típusa | Termékkövetelmény-dokumentum (PRD) |
| Verzió | 0.1 |
| Dátum | 2026-10-28 |
| Státusz | Tervezet; a nyitott döntések jóváhagyására vár |
| Tulajdonos | Product owner (név kitöltendő) |
| Hatókör | Natív iOS- és Android-alkalmazás, valamint a meglévő `smartreminderbackend` mintáira épülő új játék-backend |
| Forrásanyag | `research_notes/Tamagotchi játék PRD kutatás/` öt jegyzete (2026-10-28), a repó `api/index.ts`, `package.json` és `vercel.json` fájlja |

**Jelölések a dokumentumban**

- **[JAVASLAT]**: tervezési döntés vagy hangolási érték. Nem a jegyzetekből származó tény; minden ilyen szám kezdeti érték, amelyet játékteszten validálni kell.
- **[ELLENŐRIZENDŐ]**: a jegyzetekben csak keresőtalálat-összefoglalóból, másodlagos vagy rajongói forrásból szereplő adat; döntés előtt az eredeti oldalon igazolandó (összesítve: 19. fejezet).
- **[BECSLÉS]**: harmadik fél piaci becslése (Sensor Tower, AppMagic, Appfigures és hasonlók).
- **[NYITOTT DÖNTÉS Dn]**: a product owner jóváhagyását igénylő pont (lista: 19.1).
- **[JOGI]**: jogi tanácsadó vagy hatóság (NAIH, GVH, NAV) megerősítését igényli.

**Rögzített PO-döntések (nem nyitottak):** natív iOS és Android alkalmazás; felnőtt, nosztalgikus célközönség (millenniumi és X generáció, akiknek 1996-1997-ben Tamagotchijuk volt); mag-premissza, hogy napi gondozás nélkül a kedvenc meghalhat; az üzleti modellt e dokumentum javasolja a kutatás alapján. A mag-premissza teljesítését ez a PRD a Klasszikus módra és a természetes, időskori halálra építi; az alapértelmezett mód értelmezése a D1 nyitott döntés.

**Változásnapló**

| Verzió | Dátum | Változás |
|---|---|---|
| 0.1 | 2026-10-28 | Első teljes tervezet a kutatási jegyzetek alapján |

---

## 2. Összefoglaló és termékvízió

A Pixeltojás az 1996-1997-es Tamagotchi gondozási magját (etetés, játék, takarítás, gyógyítás, villanyoltás, nevelés, gondozási hibákon alapuló elágazó fejlődés) viszi át mobilra, a felnőtt napirendhez igazítva. A jegyzetek szerint a kategória skálázott szereplői két irányba mozdultak: reklámfinanszírozott, gyerekekre szabott gondozási homokozók (Pou, My Talking Tom), illetve valós viselkedéshez kötött előfizetéses társak (Finch, Pokémon Sleep), és mindegyik kivezette a végleges halált. A Bandai a klasszikus, következményekkel járó hurkot csak hardveren és konzolon tartja életben; mobilos címe (Tamagotchi Adventure Kingdom, Apple Arcade) kalandjáték, nem gondozás-szimulátor. Nincs tehát skálázott mobiltermék, amely hiteles tétet kínál reklámmentes, felnőtthöz illő üzleti modellel: ez a piaci rés. A termék ígérete: valódi, de emberséges tét (alapértelmezett Alap mód elhanyagolásos halál nélkül, választható Klasszikus mód valódi halállal), a játékos saját alvásidejéhez és időzónájához igazodó szimuláció, ingyenes szabadság- és napközi-funkció, bűntudatkeltés nélküli értesítések, generációk és emlékkert, valamint egyszeri vásárlással feloldható teljes verzió reklám, virtuális valuta és szerencsejáték-elemek nélkül.

**Kulcsdöntések röviden**

| Terület | Döntés |
|---|---|
| Üzleti modell | Ingyenes letöltés, 7 napos teljes próbaidő, egyszeri „Teljes verzió” feloldás (5,99 EUR [JAVASLAT]), közvetlen valós pénzes árú kozmetikumok. A kedvenc jólléte soha nem függ fizetéstől. Második helyezett: éves előfizetés örökös opcióval (10.7). |
| Módok | Alap (alapértelmezett): elhanyagolásból nincs halál, a kedvencet „Nagyi” veszi magához. Klasszikus (opt-in): valódi halál hosszú, többlépcsős előjelzéssel, egyirányú visszalépéssel Alap módba. |
| Idő és szimuláció | Szerver-autoritatív idő, determinisztikus, lusta (utólag számolt) szimuláció közös TypeScript csomagban; a játékos alvásablaka alatt a szimuláció áll. |
| Kliens | Expo (React Native), iOS widget `expo-widgets`-szel, Android widget natív Glance modullal. |
| Backend | Külön Vercel-projekt ugyanabban a Vercel-teamben, a meglévő Express 5 + Upstash minták (próbaidő, promó, kérés-korlátozás, Gemini-segédek) újrahasznosításával. |
| Értesítések | Elsődlegesen helyi, a szimulációból számolt értesítések; szerverpush csak tartalék a kritikus eseményekre. |

---

## 3. Probléma, piaci lehetőség, versenytársak

### 3.1 Probléma

Az eredeti eszköz órák alatt megbüntette a figyelmetlenséget: a jegyzetek szerint a kedvenc felügyelet nélkül fél nap alatt elpusztulhatott, szünet nem volt, és 1997-ben iskolák részben emiatt tiltották be. A felnőtt életben (munka, család, alvás, utazás) ez a ritmus nem fenntartható. A modern piaci válasz a tét teljes eltörlése volt (Finch: „We've designed pets to never die because it can be too anxiety-inducing”), ami a nosztalgikus játékos számára éppen a hitelességet veszi el. A reklámalapú kedvenc-játékok tolakodó hirdetésekkel és vásárlási nyomással dolgoznak (Common Sense Media: My Talking Tom 2 „packed full of ads”; CARU-eljárás 2019-ben), a Tamagotchi L.i.f.e. (2013) értesítéseit a sajtó „constant nagging”-ként írta le. A kötelességszerű napi mechanikák a kutatás szerint teherként, „munkaként” élhetők meg (Frommel és Mandryk, 2022).

### 3.2 Piaci lehetőség (dátumozott adatok)

- A Bandai hivatalos adata szerint a Tamagotchi 2025. július végéig összesen 100 millió darabot szállított ki (szállítás, nem aktív felhasználó). A 30. évforduló Japánban 2026. november 23.; a tengerentúli piacok 2027-et számítják 30. évnek (Bandai Namco IR).
- A Tamagotchi Plaza (konzol) első évében 700 ezer feletti példányszámot ért el, a vásárlók súlypontja a sorozatot korábban játszó 20-as éveikben járók (Bandai Namco IR, 2026).
- Az USA-ban a játékvásárlók 18%-a volt 18 év feletti 2025 első félévében (Circana, a Globe and Mail közlése szerint).
- Nincs nyilvános, megbízható „virtuális kedvenc” piacméret: a szindikált jelentések 0,43 és 5 milliárd USD között szórnak 2025-re (alacsony hitelesség). Alulról építkezve a mobilos virtuális kedvenc szegmens évi néhány száz millió USD, mellette az MI-társ alkalmazások 2025-ben 120 millió USD feletti pályán voltak (Appfigures, TechCrunch, 2025. aug.) [BECSLÉS].
- A pénz a hasznossághoz kötött vagy IP-alapú címekben koncentrálódik: Pokémon Sleep 234,9 millió USD élettartam-bevétel 2026 júliusáig (AppMagic) [BECSLÉS]; Finch havi kb. 0,4-2 millió USD, forrásonként ellentmondó [BECSLÉS].
- Az indulási csúcsok gyorsan lecsengenek: a My Talking Tom Friends 2 heti amerikai letöltései kb. 10 hét alatt kb. 92%-kal estek (Sensor Tower, 2025) [BECSLÉS]. A retencióra épülő tervezés fontosabb a felhasználószerzésnél.

### 3.3 Versenytárs-összehasonlítás

| Termék | Platform | Halál elhanyagolásból | Távollét kezelése | Üzleti modell | Lépték (dátummal) |
|---|---|---|---|---|---|
| Pou | iOS, Android | nem dokumentált | igények csökkennek | reklám + érme-IAP | Google Play 1 Mrd+ sáv, 2024. okt. (rajongói forrás) |
| My Talking Tom 2 / Friends 2 | iOS, Android | nem dokumentált | büntetés nem dokumentált | erős reklám + IAP | franchise 26 Mrd letöltés, 2025. nov. (cégközlés) |
| Finch | iOS, Android | nem, szándékosan | nincs büntetés | előfizetés (9,99 USD/hó, 69,99 USD/év, US) | kb. 0,4-2 M USD/hó [BECSLÉS] |
| Pokémon Sleep | iOS, Android | nem | kimaradt éjszaka: nincs jutalom | Premium Pass + IAP | 234,9 M USD élettartam, 2026. júl. [BECSLÉS] |
| Tamagotchi Adventure Kingdom | Apple Arcade | nem gondozás-szimulátor | nem releváns | Arcade-előfizetés (6,99 USD/hó, 2024) | nincs adat |
| Neko Atsume | iOS, Android | nincs kudarcállapot | kevesebb látogató | olcsó valutacsomagok (0,99-3,99 USD) | nincs adat a jegyzetekben |
| Tamagotchi Paradise | hardver | igen (betegség, éhség), „Tama Star” örökség | nincs megerősített szünet | egyszeri vásárlás (6 380 JPY; kb. 45 USD) | a márka egésze: 100 M szállított egység, 2025. júl. |
| Bitzee | hardver | nem | nincs büntetés | egyszeri (29,99 USD) | 2023 legkelendőbb amerikai ifjúsági elektronikus játéka (Circana) [BECSLÉS] |
| Pengu / Friends | iOS, Android | nincs adat | nincs adat | IAP, előfizetés | heti US letöltés 19 ezerről 121 ezerre, 2025 Q4 [BECSLÉS] |
| **Pixeltojás** | iOS, Android | Alap: nem; Klasszikus: igen (opt-in) | ingyenes szabadság, napközi, Nagyi | próbaidő + egyszeri feloldás + kozmetikum | nem releváns |

### 3.4 Differenciálás

1. Hiteles mag: hívások, gondozási hibák, kaki, betegség, villanyoltás, fegyelem, elágazó fejlődés, ahogy a célközönség emlékszik rá.
2. Emberséges tét: a halál választható, előre jelzett és méltó; a kudarc külső narratívát kap (Nagyi), ami a kutatás szerint csökkenti az önhibáztatást.
3. Felnőtt napirendhez igazított idő: saját alvásablak, időzóna, napközi, szabadság.
4. Reklám, valuta, loot box és sürgető ajánlat nélküli üzleti modell; az etikai szabályok ellenőrzőlistaként rögzítve (15. fejezet).
5. A Bandai IP-je nélkül, saját pixelart-stílussal és LCD-hatással versenyez.

---

## 4. Célközönség és personák

### 4.1 Szegmens

Elsődleges szegmens a kb. 28-46 éves felnőtt: az 1996-1998-as hullám akkori gyerekei ma kb. 35-45 évesek, a 2004-2005-ös Connection-hullámé kb. 28-35 évesek (jegyzetek). Az ESA 2025-ös adata szerint a 25-44 évesek a játékosok legnagyobb csoportja (49%). A CivicScience (dátum nélkül) szerint a millenniumi generáció kifejezetten takarékos a játékon belüli vásárlásban, a havonta 5 USD felett költők közül pedig kb. ötből négy nő. Az MI-társ Tolan felhasználóinak becslés szerint több mint 75%-a 26-40 éves nő [BECSLÉS], ami átfedést jelez az „alacsony nyomású, megnyugtató alkalmazást” kereső felnőtt szegmenssel.

A termék nem gyerekeknek szól, de egy aranyos, kedvenc-alapú játékot a fogyasztóvédelmi hatóság a UCPD előreláthatósági tesztje alapján valószínűleg gyerekeket is elérőnek tekint. Ezért a tervezés gyerekbiztos alapértékekkel dolgozik (14. és 15. fejezet), és a termék nem kerül az Apple Kids kategóriájába.

### 4.2 Personák

| | **Kata, 38** | **Bence, 31** | **Andrea, 46** |
|---|---|---|---|
| Háttér | Marketingvezető, két gyerek, Budapest | Szoftverfejlesztő, gyűjtő | Ápoló, váltott műszak, Győr |
| Tamagotchi-múlt | 1997-ben 9 évesen kapta az elsőt; egy kedvence „meghalt” az iskolában | 2004-ben Connection-rajongó, evolúciós táblázatokat bújt | 1997-ben 17 évesen vett egyet; X generáció |
| Napirend | 06:30-23:00, ingázás; benézés reggel, ebédnél, este | Rugalmas; sokszor ránéz a telefonra | Nappalos és éjszakás hetek váltakoznak |
| Motiváció | Nosztalgia, rövid, 2-3 perces nyugodt pillanatok | Kihívás, teljes evolúciós fa, hosszú vérvonal | Társaság, rutin, nem akar „még egy kötelességet” |
| Frusztráció | Reklám, bűntudatkeltő üzenetek, „vegyél most” nyomás | Túl könnyű, „nem lehet elrontani” játék | Merev időzítés, éjszakai értesítés, apró betű |
| Mód | Alap, összesített értesítés, widget | Klasszikus, Legenda forma, vérvonal-jelvény | Alap, napközi és szabadság, műszakonként módosított alvásablak |
| Fizetési hajlandóság (hipotézis) | Egyszeri, ha nincs reklám | Egyszeri, Klasszikusért és családfáért | Csak ha a szabadság és a napközi ingyenes |
| Kulcsigény | Bűntudat nélküli hangnem, widget | Méltányos, de valódi halál; átlátható szabályok | Konfigurálható alvás, időzóna, akadálymentesség |

### 4.3 Nem célzott, de védett csoport

16 év alatti felhasználók: nem célcsoport, de a termék számol velük. Nincs közvetlen vásárlási felszólítás, nincs szabad szöveges MI-beszélgetés, nincs harmadik fél reklámja, az analitika hozzájáruláshoz kötött (14. fejezet).

---

## 5. Célok és nem-célok

### 5.1 Célok

| ID | Cél | Mérhető feltétel |
|---|---|---|
| C1 | Hiteles klasszikus mag | Az 1997-ben Tamagotchit birtokló tesztelő a 7 gondozási műveletet, a hívásokat és az elágazó fejlődést bemutató nélkül felismeri (béta-interjú, legalább 80% igen) [JAVASLAT] |
| C2 | Emberséges tét | Elhanyagolásos halál csak Klasszikus módban, előjelzéssel; KPI-k a 6. fejezetben |
| C3 | Felnőtt napirendhez illő ritmus | Felnőtt szakaszban Alap módban napi 2 benézés (automatikus villanyoltással), Klasszikus módban 3-4 benézés elegendő a gondozási hiba elkerüléséhez |
| C4 | Fenntartható bevétel sötét minták nélkül | 15. fejezet ellenőrzőlistája 100%-ban teljesül; D35 letöltés-fizető arány legalább 4% |
| C5 | Indulás 1-2 fős csapattal | HU és EN nyelven, iOS és Android áruházban kb. 33 héten belül (17. fejezet) |
| C6 | Alacsony üzemeltetési költség | 1 000 DAU-ra kb. 0,03 USD/DAU/hó alatt (13.14) |
| C7 | Szabályozási megfelelés tervezésből | Nincs virtuális valuta, nincs loot box, nincs időkorlátos ajánlat; Apple és Google előírásai teljesülnek |

### 5.2 Nem-célok (MVP)

- Reklám bármilyen formában, beleértve a jutalmazott videót.
- Virtuális valuta, loot box, véletlenszerű fizetős tárgy, battle pass, play-to-earn vagy NFT (a Neopets 2023-as kihátrálása a kripto-irányból ellenjelzés).
- Szabad szöveges MI-beszélgetés a kedvenccel; MI csak előre generált, ellenőrzött szövegként (13.11).
- Nyilvános felhasználói tartalom (galéria, fórum), ami DSA 25. cikk szerinti platformmá tenné az alkalmazást.
- Közös gondozás (co-care), többjátékos funkciók: későbbi kiadásra halasztva.
- Egyszerre több aktív kedvenc.
- Webes vagy asztali változat, Apple Arcade vagy Play Pass kizárólagosság.
- A Bandai bármely IP-eleme (név, karakter, logó, karakternév).

---

## 6. Sikermetrikák

A retenciós benchmarkok módszertana eltér: a GameAnalytics mediánokat közöl, az AppsFlyer-eredetű casual-számok vágott átlagok, ezért magasabbak. A célértékek hipotézisek, amelyeket a napi gondozási hurok és a widget indokol; virtuális kedvenc-specifikus nyilvános benchmark a jegyzetek szerint nincs.

| KPI | Definíció | Cél [JAVASLAT] | Benchmark a jegyzetekből (dátum, státusz) |
|---|---|---|---|
| D1 retenció | Telepítés utáni 1. napon visszatérők | legalább 35% | GameAnalytics medián kb. 22%, felső kvartilis 26-33% (2026-os jelentés, 2025-ös adat; másodlagos összefoglaló) [ELLENŐRIZENDŐ]; casual 28-36% (AppsFlyer-eredetű, másodlagos blogok) |
| D7 retenció | 7. napon visszatérők | legalább 14% | GA medián 4% alatt, felső kvartilis 6-7%; casual 9-17% |
| D30 retenció | 30. napon visszatérők | legalább 6% | GA medián 0,7-0,8%, felső kvartilis 1,6-1,8%; casual 3-7%. A jegyzetek „jó” sávja casual kedvenc-játékra: 30-35% / 10-12% / 4-6% |
| Letöltés-fizető arány D35 | Telepítésből 35 napon belül vásárlók | legalább 4% | RevenueCat SOSA 2026 (2025-ös adat): kemény fizetőfal 10,7%, freemium 2,1%, gaming kb. 1% (előfizetéses appok) [ELLENŐRIZENDŐ] |
| Próbaidő-végi konverzió | A 6-7. napon aktívak közül a 14. napig vásárlók | legalább 20% | Gaming trial-to-paid medián 25,0% (előfizetés, nem közvetlenül összevethető) |
| Új generáció indítása | Természetes halál után 7 napon belül új tojást keltők | legalább 60% | nincs benchmark |
| Értesítés-engedélyezés | iOS engedély, illetve Android 13+ POST_NOTIFICATIONS megadása | iOS legalább 55%, Android legalább 60% | nincs benchmark a jegyzetekben |
| Értesítés visszavonása | Engedélyt 30 napon belül visszavonók | legfeljebb 10% | nincs benchmark |
| Átlagos értesítésszám | Kiküldött értesítés / DAU / nap | legfeljebb 2,5 | nincs benchmark |
| Crash-free munkamenet | Összeomlás nélküli munkamenetek aránya | legalább 99,5% | nincs benchmark a jegyzetekben |
| Elhanyagolásos halál, Klasszikus | Lezárult Klasszikus életek közül elhanyagolás miatt elhunytak | legfeljebb 25% | nincs benchmark |
| Elhanyagolásos halál, összes | Összes lezárult élet közül | legfeljebb 10% | nincs benchmark |
| Nagyi-arány, Alap | Alap kedvencek közül legalább egyszer Nagyinál járók | legfeljebb 30% | nincs benchmark |
| Klasszikusból visszalépés | Klasszikus kedvencek közül Alapra váltók | figyelt mutató; 30% felett a mód túl nehéz | nincs benchmark |
| Visszatérítési arány | Visszatérített vásárlások aránya | legfeljebb 3% | nincs benchmark |
| Jóllét-pulzus | Havi egykérdéses felmérésben „inkább teher” válasz | legfeljebb 15% | nincs benchmark |
| Szerver-válaszidő | Gondozási végpont p95 (szerveroldal) | legfeljebb 300 ms | nem releváns |

Mérési megjegyzés: a kliensoldali analitika csak hozzájárulással fut (14. fejezet), ezért a retenciót kétféleképpen mérjük: hozzájáruló felhasználókon eseményszinten, illetve szerveroldali, nem profilozó aggregált aktivitásszámlálással. Az utóbbi jogalapja [JOGI].

---

## 7. Játékmechanika részletesen

Minden számérték **[JAVASLAT]**: kezdeti hangolási érték, amelyet a zárt bétában validálni kell. Az eredeti P1/P2 eszközre vonatkozó számok rajongói forrásokból származnak és egymásnak is ellentmondanak [ELLENŐRIZENDŐ]; ezeket csak inspirációként használjuk.

### 7.1 Alapelvek és időfogalmak

A szimuláció determinisztikus és eseményalapú: a szerver egy pillanatképből (`lastTs` időbélyeggel) zárt formában számolja ki az aktuális állapotot, háttérben futó „tick” nincs (13.3). Három időfogalmat különböztetünk meg:

- **Életkor-idő:** faliórás idő, a Szabadság mód és a Nagyinál töltött idő kivételével. Ez méri a szakaszok hosszát.
- **Ébrenléti idő:** életkor-idő, a kedvenc alvásablakán kívül. Csak ebben fogynak a jelzők és keletkezik kaki.
- **Számlálható idő:** ébrenléti idő, a csendes órák, a napközi és a bejelentett szolgáltatáskiesés kivételével. Csak ebben telnek a türelmi idők és a Kritikus állapot órája. Egyetlen kivétel a villanyoltás türelmi ideje, amely az elalvástól faliórában telik (7.9).

Ebből következik a méltányossági alapszabály: halál, Nagyi-átadás és gondozási hiba soha nem keletkezik alvás, csendes óra, napközi, szabadság vagy szolgáltatáskiesés alatt. Az egyetlen kivétel az elmulasztott villanyoltás, amely csak a fejlődést és az éjszakai energiatöltést érinti, halálhoz vagy Nagyihoz nem járul hozzá.

### 7.2 Állapotjelzők

| Jelző | Tartomány | Kijelzés | Kezdőérték keltetéskor | Mi növeli |
|---|---|---|---|---|
| Jóllakottság | 0-100 egész | 4 szív (szívek száma = érték/25 felfelé kerekítve) | 50 | Étel +25 |
| Boldogság | 0-100 | 4 szív | 50 | Játék (győzelem +25, vereség +5), Nasi +25, Simogatás +10 |
| Energia | 0-100 | sáv | 100 | alvás |
| Egészség | 0-100 | szöveges állapot: Jó (50-100), Gyengélkedik (1-49), Kritikus (0) | 100 | regeneráció, gyógyulás +10 |
| Fegyelem | 0-100, 25-ös lépésekben | 4 szegmens | 0 | Szidás hiszti közben +25 |
| Súly | gramm, egész | szám | 5 g | Étel +1 g, Nasi +2 g |
| Kaki | 0-4 db | ikonok a képernyő jobb oldalán | 0 | Takarítás nullázza |
| Beteg | igen/nem | koponya-ikon (az eredeti nyomán) | nem | Gyógyszer |
| Kor | „év” = ébredések száma | szám | 0 | minden ébredéskor +1 |
| Gondozási hibák | szakaszonként számlálva, rejtett | csak a napló mutatja | 0 | lejárt türelmi idő |

### 7.3 Életszakaszok

| Szakasz | Időtartam (életkor-idő) | Kakigyakoriság (ébrenléti idő) | Ütemezett betegség | Hiszti-hívások | Megjegyzés |
|---|---|---|---|---|---|
| Tojás | 5 perc | nincs | nincs | nincs | A játékos indítja („melegítés”), felügyelet nélkül nem kel. |
| Bébi | 65 perc (60 ébren + 5 perc szundi) | 20 percenként | nincs | nincs | Az eredeti P1 értéke. Nem halhat meg, nem kerülhet Nagyihoz, gondozási hibái nem számítanak. Szundi után Gyerek. |
| Gyerek | 48 óra | 2 óránként | 1 | 2 | Gondozási hibái döntik el a Kamasz-ágat. |
| Kamasz | 96 óra | 3 óránként | 1 | annyi, amennyi a fegyelem 100%-ra töltéséhez kell (25%-onként egy) | Hibái és fegyelme döntik el a felnőtt formát. |
| Felnőtt | 9-22 nap formától függően (7.11) | 4 óránként | 5 naponként 1 | nincs | A forma meghatározza az élettartamot. |
| Idős | 3-5 nap formától függően | 4 óránként | 2 naponként 1 | nincs | Belépéskor előjelzés a hátralévő napokról; a végén természetes halál. |

Szakaszhatár alvásablakba nem eshet: ha a névleges határ oda esik, az átmenet ébredéskor történik. Ha a keltetés a lefekvési időpont előtti 90 percen belül indulna, az alkalmazás felajánlja a halasztást; ha a játékos mégis kelt, az első éjszakai alvás a bébi szakasz végén kezdődik. A teljes élet a formától függően kb. 18-33 nap.

### 7.4 Fogyási ráták (pont / ébrenléti óra, Alap mód)

| Jelző | Bébi | Gyerek | Kamasz | Felnőtt | Idős |
|---|---|---|---|---|---|
| Jóllakottság | 30 | 16 | 14 | 12 | 13 |
| Boldogság | 25 | 14 | 12 | 10 | 11 |
| Jóllakottság teliből üresig | 3 ó 20 p | 6 ó 15 p | 7 ó 09 p | 8 ó 20 p | 7 ó 42 p |

- **Klasszikus mód:** a jóllakottság és a boldogság fogyása ×1,5 (felnőttnél teliből 5 ó 33 p alatt ürül).
- **Energia:** ébrenlét alatt egyenletesen fogy úgy, hogy lefekvéskor 10 legyen (fogyás = 90 / ébrenléti órák száma); minden játék -5. Alvás alatt ébredésig lineárisan 100-ra töltődik, de csak feleakkora sebességgel, ha a villany égve maradt. 15 alatt a kedvenc nem játszik; 0-n 30 perces szundit tart (játék nem lehetséges, a fogyás közben normál).
- **Kaki 4 darabnál:** a boldogság fogyása ×1,5.
- **Betegség alatt:** a boldogság fogyása ×1,5, játék nem lehetséges.
- **Személyiségjegyek** (7.14) legfeljebb ±10%-kal módosítják a rátákat.

### 7.5 Gondozási műveletek

| Művelet | Hatás | Korlát, szabály |
|---|---|---|
| Étel | jóllakottság +25, súly +1 g | 100-as jóllakottságnál a kedvenc elutasítja (nincs hatás) |
| Nasi | boldogság +25, súly +2 g | a napi 5. nasitól boldogság csak +12, súly +3 g |
| Játék (minijáték) | győzelem: boldogság +25; vereség: +5; mindkettő: súly -1 g, energia -5 | energia 15 alatt nem elérhető; beteg kedvenccel nem elérhető |
| Simogatás | boldogság +10 | óránként legfeljebb 3; akadálymentes alternatíva a minijátékra |
| Takarítás | kaki = 0 | |
| Gyógyszer | 1 adag; a szükséges adagszám elérésekor gyógyulás, egészség +10 | Alap: 1 adag, Klasszikus: 2 adag, az adagok között legalább 1 perc |
| Szidás | hiszti közben: fegyelem +25 | hiszti nélkül: boldogság -10 |
| Villanyoltás | alváshoz szükséges | lásd 7.9 |

A súly ébrenléti 12 óránként természetesen 1 g-mal csökken, a szakasz alapsúlya alá legfeljebb 5 g-mal. Alapsúly: Bébi 5 g, Gyerek 10 g, Kamasz 20 g, Felnőtt 30 g, Idős 28 g.

### 7.6 Hívások, türelmi idő, gondozási hiba

Az eredeti szabály szerint gondozási hiba keletkezik, ha az üres jóllakottság vagy boldogság 15 percen belül nem kap választ, illetve ha a villany az elalvás után 15 percig égve marad (rajongói források, legalább kettő egyezik) [ELLENŐRIZENDŐ]. A felnőtt élethez igazítva a türelmi idő Alap módban az eredeti tizenkétszerese, Klasszikus módban négyszerese, és csak számlálható időben telik.

| Hívás | Kiváltó | Helyes válasz | Türelmi idő, Alap | Türelmi idő, Klasszikus | Ha lejár |
|---|---|---|---|---|---|
| Éhség | jóllakottság = 0 | Étel | 180 perc | 60 perc | +1 gondozási hiba; ha a jelző még 0, a hívás 6 számlálható óra múlva újraindul |
| Boldogság | boldogság = 0 | Játék, Nasi vagy Simogatás | 180 perc | 60 perc | ugyanígy |
| Álmosság | a kedvenc elalszik (7.9) | Villanyoltás | 120 perc vagy automatikus villanyoltás | 30 perc, automatikus nincs | +1 gondozási hiba (csak a fejlődést érinti), feleakkora energiatöltés |
| Hiszti | ütemezett, ok nélküli hívás | Szidás | 240 perc | 120 perc | nincs gondozási hiba, csak elmaradt fegyelem (az eredeti P1 szerint) |
| Betegség | betegség kezdete | Gyógyszer | néma hívás (koponya-ikon), értesítés 2 óra után | ugyanígy | egészségromlás (7.8) |
| Kaki | ürülési időpont | Takarítás | néma, nincs hívás | néma | betegség (7.7) |

**Távolléti plafon:** Alap módban egyetlen összefüggő távollét (két alkalmazásmegnyitás között) legfeljebb 3 gondozási hibát okozhat; Klasszikus módban nincs plafon. A hiszti-hívások időpontját a szakasz kezdetekor a szerver sorsolja ki (seedelt PRNG), legalább 4 óra távolsággal, csak számlálható időre, és a pillanatképben rögzíti.

### 7.7 Kaki és betegség

**Kaki:** a 7.3 szerinti gyakorisággal keletkezik ébrenléti időben, legfeljebb 4 darab látszik. A kedvenc nem hív miatta (az eredeti nyomán). Ha a legrégebbi takarítatlan kaki Alap módban 4, Klasszikus módban 2 ébrenléti órája van a képernyőn, a kedvenc megbetegszik.

**Betegség kiváltói:**

1. Ütemezett betegség a 7.3 szerint (az eredetiben szakaszonként egy betegség volt), a szakasz kezdetén sorsolt időpontban, számlálható időre ütemezve.
2. Kaki-szabály (fent).
3. Súly legalább alapsúly + 25 g.
4. Egészség 30 alá csökken.

**Kezelés:** Alap módban 1, Klasszikus módban 2 adag gyógyszer (az eredeti bébi 2 adagot igényelt). Kezeletlen betegség óránként rontja az egészséget (7.8).

**Klasszikus többletszabály** (a Tamagotchi Paradise mintájára, ahol 5 betegség egy szakaszon belül végzetes): egy életszakaszon belül az 5. betegség azonnal Kritikus állapotot indít. Ez nem azonnali halál, csak a 12 órás Kritikus óra kezdete.

### 7.8 Egészség és küszöbök

Egészségváltozás ébrenléti óránként; Klasszikus módban az alábbi értékek érvényesek, Alap módban ×0,5:

| Feltétel | Hatás / óra |
|---|---|
| Jóllakottság = 0 | -6 |
| Boldogság = 0 | -2 |
| Beteg | -3 |
| Kaki legalább 3 | -1 |
| Túlsúly (súly legalább alapsúly + 15 g) | -1 |
| Egyik feltétel sem áll fenn | +4 regeneráció (mindkét módban), legfeljebb 100-ig |

| Küszöb | Érték | Következmény |
|---|---|---|
| „Éhes” arc | jóllakottság legfeljebb 25 | csak vizuális jelzés |
| Hívás | jelző = 0 | 7.6 |
| Gyengélkedik | egészség 50 alatt | állapotjelzés, értesítés (Klasszikus) |
| Kritikus | egészség = 0, vagy Klasszikus módban az 5. betegség egy szakaszon belül | 12 számlálható órás Kritikus óra indul; +2 gondozási hiba |
| Kritikus vége (mentés) | minden negatív feltétel megszűnt | egészség azonnal 20, 12 órás Lábadozás: a boldogságnövelő műveletek hatása felére csökken |
| Kritikus óra lejár | 12 számlálható óra | Alap: Nagyi (8.3); Klasszikus: halál (7.13) |

### 7.9 Alvás, napirend, időzóna

- **Alvásablak:** a játékos saját lefekvési és ébredési időpontja (alapérték 23:00-07:00), hossza 7-11 óra. A kedvenc a lefekvés előtt 30 perccel elálmosodik és elalszik; a kedvenc alvásablaka tehát a lefekvés előtti 30. perctől az ébredésig tart.
- **Alvás alatt** a szimuláció áll: nincs fogyás, kaki, betegség, hívás, gondozási hiba; az energia töltődik.
- **Villanyoltás:** az elalvástól faliórában számolt türelmi idő (Alap 120 perc vagy automatikus villanyoltás beállítás, Klasszikus 30 perc). Klasszikus módban tehát a villanyt legkésőbb a játékos lefekvési időpontjáig le kell oltani.
- **Ébredés:** a játékos ébredési időpontjában, kor +1 év (az eredeti nyomán).
- **Csendes órák:** alapértéke megegyezik az alvásablakkal; azon kívül legfeljebb napi 3 órával bővíthető.
- **Módosítás:** az alvásablak és a csendes órák 24 óránként legfeljebb egyszer módosíthatók, és a következő ébredéstől érvényesek (az aznapi éjszaka még a régi napirend szerint telik). Ez kizárja, hogy a játékos a fogyás elkerülésére menet közben „elaltassa” a kedvencet.
- **Időzóna:** a szerver az IANA-időzónát tárolja (például `Europe/Budapest`), minden megnyitáskor újraolvassa. Időzónaváltásnál az alkalmazás felajánlja a napirend igazítását, ami a következő ébredéstől érvényes. A nyári időszámítás miatti 23 és 25 órás napokon a számítás időzóna-tudatos könyvtárral történik, így nincs dupla vagy kimaradó fogyás.

### 7.10 Fejlődés

A minta az eredetiből: két rejtett változó (gondozási hibák száma és fegyelem) a szakaszhatáron mintavételezve, kis táblázattal ágakra képezve. A formák nevei munkanevek, a végleges neveket és megjelenést a grafikai terv adja.

**Bébi → Gyerek:** mindig („Gömböc”).

**Gyerek → Kamasz** (a Gyerek szakasz gondozási hibái alapján):

| Gyerek-hibák | Kamasz |
|---|---|
| 0-2 | A ág: „Csillagszemű” |
| 3 vagy több | B ág: „Kópé” |

**Kamasz → Felnőtt** (H = a Kamasz szakasz gondozási hibái, F = fegyelem a Kamasz szakasz végén):

| Kamasz | Feltétel | Felnőtt forma |
|---|---|---|
| A | Klasszikus mód, Gyerek és Kamasz együtt 0 hiba, F = 100, és legalább 10 megnyert minijáték a Kamasz szakaszban | „Legenda” (titkos, csak Klasszikus) |
| A | H legfeljebb 2, F legalább 75 | „Ragyogó” |
| A | H legfeljebb 2, F legfeljebb 50 | „Kiegyensúlyozott” |
| A | H legalább 3, F legalább 75 | „Jószívű” |
| A | H legalább 3, F legfeljebb 50 | „Durcás” |
| B | H legfeljebb 4 | „Mókamester” |
| B | H legalább 5 | „Nyűgös” |

A fegyelem a Gyerek szakaszból öröklődik; a Kamasz szakasz pontosan annyi hiszti-hívást kap, amennyi a 100%-hoz kell (az eredetiben a kedvenc „pontosan annyiszor rosszalkodik”, amennyi a fegyelem feltöltéséhez szükséges).

### 7.11 Élettartam

| Felnőtt forma | Felnőtt szakasz | Idős szakasz | Teljes élet kb. (6 nap fiatalkorral) |
|---|---|---|---|
| Legenda | 22 nap | 5 nap | 33 nap |
| Ragyogó | 20 nap | 5 nap | 31 nap |
| Kiegyensúlyozott | 18 nap | 5 nap | 29 nap |
| Jószívű | 16 nap | 4 nap | 26 nap |
| Mókamester | 14 nap | 4 nap | 24 nap |
| Durcás | 12 nap | 4 nap | 22 nap |
| Nyűgös | 9 nap | 3 nap | 18 nap |

Összevetésül: a rajongói források szerint az eredeti felnőtt formák 3-4 naptól (legrosszabb gondozás) 15-16 napig éltek [ELLENŐRIZENDŐ]; a jobb gondozás hosszabb életet adott. Ezt a csatolást megtartjuk, a felnőtt napirendhez nyújtott időkkel.

**Módosítók:** Alap módban minden Nagyi-látogatás -1 nap (életenként legfeljebb -3). Klasszikus módban a Felnőtt szakasz minden 5. gondozási hibája -1 nap (legfeljebb -4). A Felnőtt szakasz legalább 6 nap.

### 7.12 A két mód: Alap és Klasszikus

A kutatás szerint a permadeath alapértelmezettként stresszt okoz, opt-in „hardcore” módként viszont működik; a sikeres modern kedvenc-játékok mind kivezették az elhanyagolásos halált. Ezért az alapértelmezett mód emberséges, a valódi halál pedig tájékozott választás.

| Szempont | Alap (alapértelmezett) | Klasszikus (opt-in) |
|---|---|---|
| Elérhetőség | mindenkinek, ingyenes | Teljes verzió vagy próbaidő; csak új tojásnál választható |
| Fogyási szorzó | 1,0 | 1,5 |
| Egészségromlási szorzó | 0,5 | 1,0 |
| Türelmi idő (éhség, boldogság) | 180 perc | 60 perc |
| Villanyoltás | 120 perc vagy automatikus | 30 perc, automatikus nincs |
| Hiszti válaszablak | 240 perc | 120 perc |
| Kaki → betegség | 4 óra | 2 óra |
| Gyógyszeradag | 1 | 2 |
| Gondozási hiba plafon távollétenként | 3 | nincs |
| 5. betegség egy szakaszon belül | nincs külön hatás | Kritikus állapot |
| Kritikus óra lejárta (12 számlálható óra) | Nagyi magához veszi (8.3) | halál |
| Napközi | napi legfeljebb 10 óra, betegséget kezel | napi legfeljebb 8 óra, betegséget nem kezel |
| Szabadság | 14 nap/alkalom, 30 nap/gördülő 90 nap | 7 nap/alkalom, 14 nap/90 nap; beteg, Kritikus vagy 0-s jelzőjű kedvenccel nem indítható |
| Értesítések alapértéke | összesített mód (napi 3) | eseményalapú, napi legfeljebb 4 + kritikus |
| Időérzékeny (time-sensitive) értesítés | nincs | Kritikus állapothoz, ha a játékos engedélyezi |
| Módváltás | Klasszikusra csak új tojásnál | Alapra bármikor, Kritikus állapotban is, egyirányúan |
| Legenda forma | nem érhető el | elérhető |
| Vérvonal-jelvény | nincs | „Klasszikus vérvonal”: egymást követő Klasszikus generációk természetes halállal |
| Elhanyagolásos halál | kizárt | lehetséges (7.13) |
| Természetes, időskori halál | igen | igen |
| Újraélesztés | nincs, nem is szükséges | semmilyen formában (sem fizetős, sem ingyenes) |

**Klasszikus opt-in képernyő** (kötelező tartalom): a halál feltételei egyszerű nyelven; a jellemző idővonal (az első figyelmeztetéstől a halálig kb. 20-21 számlálható óra); hogy alvás, csendes óra, szabadság és szolgáltatáskiesés alatt nem következhet be; hogy az értesítések nem kötelezőek, ám nélkülük a gondozási hibák elkerüléséhez ébrenlét alatt kb. 5 óránként, a halál elkerüléséhez legalább naponta egyszer érdemes benézni; hogy a visszalépés Alap módba bármikor lehetséges. A két gomb felirata egyenrangú és semleges („Klasszikus móddal kezdem”, „Alap móddal kezdem”).

**[NYITOTT DÖNTÉS D1]:** a PO mag-premisszája szerint napi gondozás nélkül a kedvenc meghalhat. Ez a PRD ezt a Klasszikus módra és az időskori halálra korlátozza, mert a jegyzetekben szereplő kutatás (bűntudat, szorongás, a piac egyöntetű iránya) az alapértelmezett elhanyagolásos halál ellen szól. B változat, ha a PO az Alap módban is valódi halált akar: az Alap mód Kritikus órája 48 számlálható óra, és lejártakor Nagyi helyett halál következik, minden más Alap-paraméter változatlan. A döntés hatása: Alap halálarány KPI, áruházi leírás, Klasszikus mód értékajánlata.

### 7.13 Halálfeltételek és idővonal

**Klasszikus mód halálfeltételei:**

1. A Kritikus állapot 12 számlálható órán át megszakítás nélkül fennáll → halál. Az ok „Elhanyagolás”, vagy „Betegség”, ha a Kritikus állapotot betegség (5. betegség, illetve túlnyomóan betegség okozta egészségromlás) indította.
2. Öregkor: az Idős szakasz vége → természetes halál.

**Alap mód:** csak öregkori halál; a lejárt Kritikus óra Nagyi-átadást jelent.

**Nem halálok egyik módban sem:** alvásablak, csendes órák, napközi, szabadság, szolgáltatáskiesés; Tojás és Bébi szakasz.

**Garanciák:** a Kritikus óra rögzített 12 számlálható óra, és mindig megelőzi legalább egy hívás vagy állapotjelzés. Az Android-riasztások kb. 1 órás pontatlanságánál a 12 órás ablak nagyságrenddel hosszabb, így késve érkező értesítés nem lehet a halál oka. A halál tényét kizárólag a szerver állapítja meg, szerveridő alapján.

**Idővonal 1: Klasszikus, Felnőtt** (utolsó gondozás t = 0, minden jelző 100, napközi nélkül; számlálható idő)

| t | Esemény |
|---|---|
| 0:00 | utolsó gondozás |
| 4:00 | 1. kaki (néma) |
| 5:33 | éhség-hívás: **1. figyelmeztetés** (értesítés) |
| 6:00 | betegség (a kaki 2 órája a képernyőn) |
| 6:33 | gondozási hiba (éhség) |
| 6:40 | boldogság-hívás; 7:40 gondozási hiba (a megválaszolatlan hívások ezután 6 óránként ismétlődnek, újabb hibákkal) |
| 8:00 | 2. kaki; egészség-értesítés (a betegség 2 órája kezeletlen) |
| 10:25 | egészség 50 alatt, „Gyengélkedik” (értesítés) |
| 12:00 | 3. kaki |
| 14:43 | egészség = 0: **Kritikus** (időérzékeny értesítés, ha engedélyezett; szerverpush tartalék) |
| 22:43 | emlékeztető: kb. 4 óra van hátra |
| 25:43 | utolsó emlékeztető: kb. 1 óra van hátra |
| 26:43 | halál |

Első figyelmeztetéstől a halálig 21 óra 10 perc számlálható idő. Faliórás példa: utolsó gondozás 07:00-kor, a kedvenc alvásablaka és a csendes órák 23:00-07:00 → Kritikus az 1. nap 21:43-kor, halál a 2. nap 17:43-kor (az első figyelmeztetéstől 29 óra 10 perc faliórában).

**Idővonal 2: Klasszikus, Gyerek** (ugyanilyen feltételekkel): éhség-hívás 4:10, Kritikus 12:43, halál 24:43; első figyelmeztetéstől kb. 20,5 számlálható óra.

**Idővonal 3: Alap, Felnőtt** (ugyanilyen feltételekkel)

| t | Esemény |
|---|---|
| 0:00 | utolsó gondozás |
| 4:00 | 1. kaki |
| 8:00 | 2. kaki; betegség (a kaki 4 órája a képernyőn) |
| 8:20 | éhség-hívás: **1. figyelmeztetés** (a következő összesített értesítésben) |
| 10:00 | boldogság-hívás |
| 11:20, 13:00, 17:20 | gondozási hibák (éhség, boldogság, ismételt éhség); a távolléti plafon (3) elérve |
| 12:00 | 3. kaki |
| 17:10 | „Gyengélkedik” |
| 25:30 | **Kritikus** (értesítés) |
| 37:30 | Nagyi magához veszi (értesítés) |

Első figyelmeztetéstől a Nagyi-átadásig 29 óra 10 perc számlálható idő. Faliórás példa (07:00 utolsó gondozás, a kedvenc alvásablaka 23:00-07:00): Kritikus a 2. nap 16:30-kor, Nagyi a 3. nap 12:30-kor.

Ezek az idővonalak a szimulációs csomag kötelező tesztesetei (FR-07).

### 7.14 Természetes halál, generációk, emlékkert

**Természetes halál:** az Idős szakaszba lépéskor a játékos alkalmazáson belüli előjelzést kap a hátralévő napok számáról (a kutatás szerint az előzetes figyelmeztetés csökkenti a veszteségérzetet), opcionálisan egy értesítést is. Az utolsó napon a kedvenc „búcsú” állapotban van. Az élet a kedvenc elalvásakor zárul; a búcsúképernyő a következő megnyitáskor jelenik meg. Természetes halálról push-értesítést nem küldünk.

**Megjelenítés:** alapértelmezésben a kedvenc csillaggá válik (kulturálisan semleges); a beállításokban választható a „klasszikus sírkő” ábrázolás. Az eredetiben a japán változat szellemet és sírkövet, a nemzetközi angyalt vagy UFO-t mutatott, ami precedens a halálábrázolás lokalizálására.

**Utód és generációk:** természetes halálkor a kedvenc tojást hagy (a 2004-es Connection óta a generációváltás a sorozat fő „életvég” mintája). Öröklődés (Teljes verzió funkció):

| Elem | Szabály |
|---|---|
| Színpaletta | 8 paletta; 70% eséllyel a szülőé, 30% eséllyel véletlen (seedelt) |
| Személyiségjegy | 6 jegyből egy: Falánk (jóllakottság-fogyás ×1,1), Játékos (boldogság-fogyás ×1,1, minijáték-győzelem +5), Álmos (energiafogyás ×1,1), Rendes (kakigyakoriság +30 perc), Bújós (Simogatás +5), Kíváncsi (hiszti-ablak +30 perc); 50% öröklött, 50% véletlen |
| Örökségbónusz | Ragyogó, Kiegyensúlyozott vagy Legenda szülő után az utód 25% fegyelemmel indul |
| Családnév, generációszám | öröklődik, generáció +1 |
| Klasszikus vérvonal | a számláló csak Klasszikus módban élt és természetes halállal zárult generációkon nő |

Klasszikus módú elhanyagolásos halálnál nincs utód: a vérvonal megszakad, a következő tojás új ágat indít ugyanabban a családfában. Teljes verzió nélkül az új tojás öröklődés nélküli, a családfa-nézet zárolt, de az adatok megmaradnak és vásárlás után visszaállnak. Az új tojás csak a játékos indítására kel.

**Emlékkert (mindenkinek ingyenes):** minden elhunyt vagy Nagyinál maradt kedvenc bejegyzést kap: név, generáció, forma, élettartam napokban, ok (Öregkor, Elhanyagolás, Betegség, Nagyinál él), dátumok, gondozási összegzés, a játékos által írt sírfelirat (legfeljebb 140 karakter, csak a játékos látja, analitikába nem kerül), napi egy ingyenes virág. A kutatás szerint a rituálé (AIBO-temetések, online Tamagotchi-temetők) segíti a veszteség feldolgozását. Az emlékkertben nincs fizetős elem és nincs fizetési felület.

**Őrző csillag [JAVASLAT, v1.2, Could]:** a Paradise mintájára (30 év feletti „békés halál” egy későbbi kedvencet egyszer megment) a Ragyogó vagy Legenda formában, Klasszikus módban természetes halállal zárult élet egy csillagot hagy, amely egy leszármazottat egyszer automatikusan kiment a Kritikus állapotból. Kizárólag gondozással szerezhető, nem vásárolható.

### 7.15 Minijátékok

| Játék | Szabály | Elérhetőség |
|---|---|---|
| „Merre fordul?” | 5 kör, a kedvenc balra vagy jobbra néz; legalább 3 találat = győzelem | ingyenes (MVP) |
| „Nagyobb vagy kisebb?” | 5 kör számtippelés; legalább 3 találat = győzelem | Teljes verzió (MVP) |
| Simogatás | egy koppintás, időzítés nélkül | ingyenes; akadálymentes alternatíva |

A minijátékok seedelt véletlent használnak; a szerver a seed és a lépések alapján validál. A gondozás soha nem igényel gyors reakciót vagy finommotoros ügyességet.

### 7.16 Paraméterkezelés

- Minden szám egy verziózott paraméterkészletben él (`cfg:params:{v}`, 13.6); a kliens és a szerver ugyanazt a készletet használja.
- **A kedvenc a létrehozásakor érvényes paraméterverzióhoz kötött.** Hangolás csak új tojásokra vonatkozik, kivéve, ha a változás a játékos számára szigorúan kedvezőbb (például hosszabb türelmi idő). Élő Klasszikus kedvenc szabályait visszamenőleg szigorítani tilos.
- Fejlesztői és béta-tesztfiókokon időgyorsítás (például ×60) engedélyezhető a teljes életciklus gyors bejárására; éles fiókon nem.

---

## 8. Távollét kezelése

A jegyzetek szerinti eszköztár (szünet, napközi, utólag számolt fogyás, nem halálos következmény) minden elemét ingyenesen adjuk, mert a fizetős védelem a mechanika által keltett szorongást pénzesítené („pay to avoid loss”).

### 8.1 Szabadság mód

Teljes fagyasztás: nincs öregedés, fogyás, esemény; a szakaszórák állnak (az eredeti óra-trükk nyomán a szünet egy az egyben eltolja a fejlődést). Vizuálisan a kedvenc üdül.

| Szabály | Alap | Klasszikus |
|---|---|---|
| Egy alkalom leghosszabb | 14 nap | 7 nap |
| Keret gördülő 90 napra | 30 nap | 14 nap |
| Minimális elszámolás alkalmanként | 12 óra | 12 óra |
| Indítható beteg, Kritikus vagy 0-s jelzőjű kedvenccel | igen | nem |
| Két szabadság között aktív gondozás | nincs előírás | legalább 24 óra |
| Előre ütemezhető | igen, legfeljebb 30 nappal előre | igen |
| Visszadátumozható | nem (szerveridő) | nem |
| Lejárat előtti értesítés | 24 órával | 24 és 2 órával |
| Lejárat után | a szimuláció folytatódik; tartós elhanyagolásnál Nagyi | a szimuláció folytatódik; a teljes halál-idővonal érvényes |

Kézi befejezés bármikor; a lejárat bármikor meghosszabbítható a keret erejéig.

### 8.2 Napközi

Ismétlődő, a játékos által ütemezett napi ablak (például hétköznap 08:30-17:00), a Tamagotchi Pix ingyenes 7 és 19 óra közötti dadája nyomán.

| Szabály | Alap | Klasszikus |
|---|---|---|
| Napi leghosszabb | 10 óra | 8 óra |
| Jóllakottság és boldogság | nem csökken 25 (1 szív) alá | ugyanígy |
| Kaki | a napközi végén takarítva | ugyanígy |
| Betegség | 1 adaggal kezeli | nem kezeli |
| Hívás, hiszti, gondozási hiba | nincs (nem számlálható idő) | ugyanígy |
| Fejlődési hatás | nincs pozitív hatás (a boldogság nem nő) | ugyanígy |
| Ára | ingyenes | ingyenes |

### 8.3 Nagyi (csak Alap mód)

Ha az Alap kedvenc Kritikus órája lejár, Nagyi magához veszi. A kutatás szerint a kudarc külső narratívája („elment Nagyihoz”) mérsékli az önhibáztatást, és a következmény feloldódik, nem marad tartós szenvedés (a Neopets ellenpéldája).

- Nagyinál a szimuláció fagyasztva van (nincs öregedés, nincs természetes halál).
- Hazahozás egy koppintással, ingyenesen, bármikor. Visszatéréskor: jóllakottság 50, boldogság 50, egészség 60, kaki 0, nem beteg.
- Következmény: +2 gondozási hiba az aktuális szakaszban; Felnőtt vagy Idős korban -1 nap élettartam (életenként legfeljebb -3).
- 30 napnál hosszabb Nagyinál töltött idő után a játékos választhat: hazahozza, vagy a kedvenc Nagyinál marad (az emlékkertbe „Nagyinál él” bejegyzéssel kerül), és új tojás indul ugyanabban a családfában, új ágon.

### 8.4 Utólagos számítás visszatéréskor

Az Animal Crossing mintája szerint a szerver a visszatéréskor egy lépésben alkalmazza a távollét hatását. Az algoritmus a `lastTs` és a szerveridő közötti szakaszt határpontokra bontja (alvásablak, csendes órák, napközi, szabadság, kiesés, szakaszhatár, ütemezett esemény, küszöbátlépés), szakaszonként lineárisan számol, és eseményeket bocsát ki (hívás, gondozási hiba, kaki, betegség, Kritikus, Nagyi, halál). A számítást a Nagyi-fagyasztás, a halál és a szabadság természetesen korlátozza; biztonsági okból 10 000 szakaszos felső korlát is érvényes.

**Visszatérési összefoglaló:** megnyitáskor a játékos tárgyszerű összefoglalót lát („Távollétedben: 2 kaki, egy betegség, 1 gondozási hiba”), szemrehányó szöveg nélkül.

### 8.5 Utazás, eszközcsere, kiesés

- **Időzóna-váltás:** 7.9 szerint; a napirend a következő ébredéstől igazodik, így utazással nem nyerhető többlet-alvásidő.
- **Repülés, térerő nélküli időszak:** a gondozási művelet hálózatot igényel (13.4); hosszabb offline időszakra a Szabadság mód szolgál.
- **Eszközcsere, újratelepítés:** a fiók a szerveren él; Apple- vagy Google-fiókkal összekapcsolva másik eszközön is folytatható (13.9).
- **Szolgáltatáskiesés-jóváírás:** a szerver a `sys:incidents` listában rögzíti a kieséseket (automatikus állapotfigyelés vagy kézi bejegyzés). A szimuláció ezeket fagyasztott intervallumként kezeli: Kritikus óra, türelmi idő, gondozási hiba nem telik, illetve nem keletkezik.

---

## 9. Értesítési stratégia

### 9.1 Elvek

- Az alkalmazás értesítések nélkül is teljes értékűen játszható (Apple 4.5.4). A főképernyő és a widget mindig mutatja a „következő ellenőrzés legkésőbb” időpontot, amit a szimuláció számol.
- **Elsődleges csatorna: helyi értesítés**, amelynek időpontjait a determinisztikus szimuláció adja (13.3). Ingyenes, offline is működik.
- **Tartalék csatorna: szerverpush** (Expo Push, APNs/FCM) csak a Klasszikus Kritikus állapot kezdetére és a szabadság lejáratára, és csak akkor, ha a küszöb kiszámítása óta nem volt szinkronizálás (13.8).
- Promóciós vagy marketing-push az MVP-ben nincs. Ha később lesz, csak külön, kifejezett hozzájárulással és alkalmazáson belüli leiratkozással (Apple 4.5.4).
- **Hangnem:** tárgyszerű, informatív, barátságos; bűntudatkeltés, sürgetés, felkiáltójeles nyomás, síró kedvenc tilos.

### 9.2 Platformkorlátok és következményeik

| Korlát | Forrás | Következmény a termékben |
|---|---|---|
| iOS: legfeljebb 64 függő helyi értesítés; a többit a rendszer csendben eldobja | Apple dokumentáció és fejlesztői fórum | Egyszerre legfeljebb 8 függő értesítés (kedvencenként 6 + szabadság-lejárat + tartalék). Minden állapotváltozáskor, megnyitáskor és szinkronkor törlés és újratervezés. |
| iOS time-sensitive szint | külön entitlement és felhasználói engedély | Csak a Klasszikus Kritikus állapothoz, ha a játékos engedélyezi |
| Android 13+: POST_NOTIFICATIONS futásidejű engedély | Android Developers | Kérés kontextusban, az első gondozási kör után, magyarázó képernyővel; mindig a legújabb target SDK, hogy az időzítést az alkalmazás döntse el |
| Android: pontos riasztás (`USE_EXACT_ALARM`) csak ébresztő- és naptáralkalmazásoknak; `SCHEDULE_EXACT_ALARM` visszavonható | Android Developers, Play-szabály | Nem deklaráljuk egyiket sem; az egyesített manifestet buildenként auditáljuk, hogy könyvtár se injektálja |
| Android pontatlan riasztás: legfeljebb kb. 1 óra késés Android 12+ alatt, Doze alatt több; újraindításkor törlődik | Android Developers | Minden türelmi idő legalább 60 perc, a Kritikus óra 12 óra; újraindítás után újraütemezés (az `expo-notifications` viselkedése [ELLENŐRIZENDŐ]) |
| Háttérfuttatás nem megbízható (iOS kb. 30 s, nem garantált; WorkManager 15 perces minimum, Doze) | WWDC-jegyzetek, Android Developers | Háttérfutás csak opportunista frissítésre (widget, újratervezés); a játék helyessége nem függ tőle |

### 9.3 Kategóriák, keretek, csendes órák

| Kategória | Alap alapérték | Klasszikus alapérték | Kiváltó |
|---|---|---|---|
| Összesített napi jelentés | be (napi 3, a játékos választja az időpontokat, alapérték 08:00, 12:30, 18:30) | ki | ütemezett, a szimuláció előrejelzéséből számolt tartalommal |
| Étkezés, boldogság | ki (az összesítő tartalmazza) | be | hívás kezdete |
| Egészség | be | be | betegség 2 órája kezeletlen; „Gyengélkedik” |
| Alvás | ki | be | elalvás (villanyoltás) |
| Kritikus | be | be (időérzékeny, ha engedélyezett) | Kritikus kezdete, -4 óra, -1 óra |
| Nagyi | be | nem alkalmazható | Nagyi-átadás |
| Szabadság vége | be | be | 24 órával (Klasszikusban 2 órával is) a lejárat előtt |
| Fejlődés, Idős kor | be | be | szakaszváltás, Idős korba lépés |

- **Napi keret:** nem kritikus értesítésből Alap módban legfeljebb 3, Klasszikus módban legfeljebb 4. A kritikus értesítések nem számítanak bele, de egy Kritikus epizódban legfeljebb 3 lehet.
- **Csendes órák:** alapértelmezésben az alvásablak; ebben az időszakban nem küldünk értesítést. Mivel a Kritikus óra (és így a halál ideje) csendes órában áll, a csendes órák áttörésére kritikus értesítésnél sincs szükség.
- **Automatikus visszavonulás:** 3 egymást követő, megnyitás nélkül maradt nem kritikus értesítés után 7 napig napi 1 összesítőre váltunk. A visszavonulást nem kommentáljuk passzív-agresszív szöveggel; a beállításokban látható és visszaállítható.
- **Engedélykérés:** soha nem induláskor. Az első teljes gondozási kör (etetés és takarítás a bébi szakaszban) után, magyarázattal („Szólhatok, amikor Pötty megéhezik?”), „Igen” és „Most nem” egyenrangú gombokkal. Elutasítás esetén a játék változatlan.
- **Kutatási alap:** a napi háromszori kötegelt értesítés randomizált terepkísérletben javította a figyelmet, a hangulatot és a kontrollérzetet (Fitz és mtsai., 2019, n = 237); a túlzott értesítés a jegyzetek szerint az összes értesítés kikapcsolásához vezet.

### 9.4 Példaszövegek (magyar)

Lokalizációs szabály: a játékos által adott névhez nem fűzünk ragot (a magánhangzó-harmónia hibás ragozást okozna), a név mindig alanyesetben áll. A példákban a kedvenc neve „Pötty”.

| Helyzet | Szöveg |
|---|---|
| Reggeli összesítő | „Pötty felébredt. Jóllakottság: 2 szív, egy kaki vár takarításra.” |
| Déli összesítő | „Pötty jól van. Estig elég, ha egyszer benézel.” |
| Éhség (Klasszikus) | „Pötty megéhezett. Egy-két étel rendbe hozza.” |
| Egészség | „Pötty gyengélkedik. Egy adag gyógyszer segít neki.” |
| Alvás (Klasszikus) | „Pötty elálmosodott. Villanyoltás a lefekvésedig.” |
| Kritikus kezdete (Klasszikus) | „Pötty állapota kritikus. Klasszikus módban kb. 12 óra van hátra, az alvásidő nem számít bele. Ha most nem alkalmas, Alap módra válthatsz.” |
| Kritikus kezdete (Alap) | „Pötty állapota kritikus. Ha a következő órákban nem érsz rá, Nagyi vigyáz rá.” |
| Kritikus, 1 óra van hátra | „Pötty állapota még kritikus. Kb. 1 óra van hátra.” |
| Nagyi | „Pötty átment Nagyihoz, amíg ráérsz. Jól van, és vár.” |
| Szabadság vége | „A szabadság holnap 18:00-kor véget ér. Ha még úton vagy, meghosszabbíthatod.” |
| Idős kor | „Pötty belépett az idős korba. Még nagyjából négy napot tölthettek együtt.” |
| Fejlődés | „Pötty felnőtt lett. Megnézheted, mivé fejlődött.” |

**Tiltott minták** (példák a kódellenőrzési és szövegellenőrzési listához): „Pötty sír, mert elhagytad”, „Ne hagyd éhen halni!”, „Utolsó esély!”, „Pötty azt hiszi, már nem szereted”, „Úgy látszik, nem érdekel”, bármilyen visszaszámlálás vásárlással összekötve, értesítésben vásárlási ajánlat.

---

## 10. Monetizáció

### 10.1 Ajánlás

**Ingyenes letöltés, 7 napos teljes próbaidő, majd egyszeri, nem fogyó „Teljes verzió” feloldás (indulási ár 5,99 EUR [JAVASLAT], tesztsáv 4,99-7,99 EUR), kiegészítve közvetlen, valós pénzben árazott, véletlenszerűség nélküli kozmetikumokkal (0,99-2,99 EUR). A kedvenc jólléte, a gondozás, a szabadság, a napközi, Nagyi, az értesítések, a widgetek és az emlékkert mindenkinek ingyenes. Reklám, virtuális valuta és fizetős újraélesztés nincs.**

### 10.2 Indoklás

1. **Az előfizetés a játékkategóriában a leggyengébb.** A RevenueCat 2026-os jelentése (2025-ös adat) szerint a gaming medián trial-to-paid aránya 25,0%, az egyéves realizált LTV 11,22 USD (Health & Fitness: 35,64 USD), a D35 letöltés-fizető arány kb. 1% [ELLENŐRIZENDŐ]. Előfizetéssel azok a kedvenc-alkalmazások sikeresek, amelyek valós hasznot adnak (Finch: önápolás, Pokémon Sleep: alváskövetés). A „fizess, hogy élhessen a kedvenced” előfizetés visszhangkockázat, és a fizetéssel elkerülhető veszteség mintájába csúszik.
2. **A reklám rossz illeszkedés.** Casual reklám ARPDAU kb. 0,01-0,05 USD (másodlagos becslés), az interstitial rontja az élményt, hozzájárulási súrlódás (ATT, uniós hozzájárulás), és a reklámalapú kedvenc-játékok gyerek-fókusza (CARU-eljárás) ellentétes a pozicionálással.
3. **A fizetős (prémium) letöltés felfedezhetetlen.** 2025-ben a mobiljáték-letöltések 96%-a ingyenes volt; ismeretlen független fejlesztőnél a prémium ár a felfedezést öli meg.
4. **A próbaidő + feloldás modell támogatott és illeszkedik.** Az Apple 3.1.1 kifejezetten lehetővé teszi a nem előfizetéses appnak a „XX-day Trial” nevű, 0-s ársávú nem fogyó IAP-t, majd a teljes feloldást. A modell közvetlenül ráül a meglévő `POST /trial` mintára. A RevenueCat szerint a konverziók döntő része a 0. napon történik, ezért a Teljes verzió bemutatása a keltetés után, nem blokkoló kártyán jelenik meg. A fizikai kedvencek kb. 30 EUR-s ára (Bitzee) arra utal, hogy a nosztalgikus felnőtt elfogadhat egy tipikus appárnál magasabb egyszeri árat (hipotézis).
5. **Áruházi díjak:** 1 millió USD alatti éves bevételnél mindkét áruházban kb. 15%. Apple: a 2026. október 1-jétől hatályos egységes uniós feltételek szerint a Small Business Program 15%-os IAP-jutaléka; Google: 10% szolgáltatási díj + 5% Play Billing díj az EGT-ben 2026. június 30-tól [ELLENŐRIZENDŐ]. Az alternatív fizetés az EU-ban csak néhány százalékpontot spórol, viszont PSP-díjat, ÁFA/OSS-kötelezettséget és visszatérítés-kezelést hoz, ezért induláskor natív IAP és Play Billing.
6. **ÁFA:** a magyar 27% az EU legmagasabb kulcsa; az ÁFA a vevő országa szerint alakul. Natív IAP-nál az áruház kezeli. Magyar vevőnél a bruttó ár kb. 67%-a marad a fejlesztőnél (10.3).
7. **Uniós fogyasztóvédelem:** a CPC-hálózat 2025. márciusi alapelvei (valós pénzes ár, nincs több valuta, nincs vásárlási nyomás, gyerekek védelme) a valuta nélküli modellel nagyrészt eleve teljesülnek. A 2026. szeptemberi CPC-vizsgálat már az „addiktív designt” is vizsgálja, így a szigorúbb mérce most olcsóbb, mint később.
8. **Nincs fizetős újraélesztés:** a halál utáni fizetős visszahozás a gyászt pénzesítené, a UCPD agresszív gyakorlatra vonatkozó szabályainak kockázati zónájába esik, és a jegyzetekben szereplő precedens (My Tamagotchi Forever) visszhangja is negatív.

**Szemléltetés, nem előrejelzés:** 100 000 telepítés × 4% fizető × kb. 4,0-4,3 EUR nettó egységbevétel ≈ 16-17 ezer EUR egyszeri nettó bevétel, kozmetikumok nélkül. Összevetésül a jegyzetek előfizetéses szemléltetése: 100 000 telepítés × kb. 1% × 11,22 USD ≈ 11 ezer USD bruttó első éves bevétel, áruházi díj és ÁFA előtt.

### 10.3 Árak és ÁFA-hatás

HUF-ár-pontok [JAVASLAT]: a tényleges értékeket az Apple és a Google automatikusan kiegyenlített HUF-ársávjai határozzák meg; ezek a jegyzetekben nem szerepelnek, és az euró-forint arányt sem a jegyzetek rögzítik [ELLENŐRIZENDŐ].

| Termék | EUR | HUF (javasolt ár-pont) | Típus |
|---|---|---|---|
| Teljes verzió | 5,99 | 2 490 Ft | nem fogyó (non-consumable) |
| 7 napos próba (iOS) | 0 | 0 Ft | nem fogyó, 0-s ársáv, „7-day Trial” elnevezéssel |
| Kozmetikum, kicsi (egy héj vagy háttér) | 0,99 | 390 Ft | nem fogyó |
| Kozmetikum-csomag | 1,99 | 790 Ft | nem fogyó |
| Kozmetikum-csomag, nagy | 2,99 | 1 190 Ft | nem fogyó |

**ÁFA- és jutalékszámítás** (15% áruházi jutalék az ÁFA nélküli áron; a RevenueCat díja 2 500 USD havi bevétel felett a bevétel 1%-a [ELLENŐRIZENDŐ]):

| Bruttó ár | Vevő | ÁFA | ÁFA nélkül | 15% jutalék után | A bruttó ár arányában |
|---|---|---|---|---|---|
| 5,99 EUR | Magyarország | 27% | 4,72 EUR | 4,01 EUR | 67% |
| 5,99 EUR | Németország | 19% | 5,03 EUR | 4,28 EUR | 71% |
| 4,99 EUR (jegyzetek példája) | Magyarország | 27% | 3,93 EUR | 3,34 EUR | 67% |
| 2 490 Ft | Magyarország | 27% | 1 961 Ft | 1 667 Ft | 67% |
| 1,99 EUR | Magyarország | 27% | 1,57 EUR | 1,33 EUR | 67% |

Az áruházi díjakat konfigurálható feltevésként kezeljük: a jegyzetek szerint a szabályok 18 hónap alatt négyszer változtak.

### 10.4 Ingyenes és fizetős tartalom

| Funkció | Próbaidő alatt | Próbaidő után, vásárlás nélkül | Teljes verzióval |
|---|---|---|---|
| Alap mód, minden gondozási művelet | igen | igen | igen |
| Nagyi, Szabadság, Napközi | igen | igen | igen |
| Értesítések, widgetek, emlékkert, adatexport | igen | igen | igen |
| „Merre fordul?” és Simogatás | igen | igen | igen |
| Klasszikus mód új tojásnál | igen | nem; az élő Klasszikus kedvenc élete végéig Klasszikus marad | igen |
| Öröklődés, családfa, vérvonal-jelvény | igen | nem; az adatok megmaradnak | igen |
| „Nagyobb vagy kisebb?” | igen | nem | igen |
| Fejlődési album (a látott formák gyűjteménye) | igen | zárolt; a gyűjtés a háttérben folytatódik | igen |
| Retro héjcsomag (6 héj, 3 háttér) | igen | alap héj | igen |
| Külön megvásárolható kozmetikumok | megvásárolhatók | megvásárolhatók | megvásárolhatók |

A próbaidő a keltetéskor indul, vége a beállításokban mindig látható. A próbaidő végén egyszer, semleges hangnemű összefoglaló jelenik meg arról, mi marad meg és mi zárolódik (Apple 3.1.1: a próbaidő hossza, a zárolódó tartalom és a későbbi díjak közlése kötelező).

### 10.5 Fizetési felület elhelyezése

| Engedélyezett | Tiltott |
|---|---|
| Nem blokkoló infokártya a keltetés után (0. nap), „Később” gombbal | Halál, búcsú, emlékkert képernyő |
| Bolt / Beállítások menüpont | Betegség, Kritikus, Lábadozás, Nagyi képernyő és értesítés |
| Zárolt funkció megérintésekor (Klasszikus választás új tojásnál, Családfa fül) | Bármilyen push-értesítés |
| Egyszeri próbaidő-végi összefoglaló | Visszaszámlálás, „csak ma” ár, hamis szűkösség |
| | Második személyű felszólítás a vásárlógomb mellett („Vedd meg Pöttynek!”) |

### 10.6 Kifejezetten tiltott monetizáció

- Fizetős újraélesztés vagy halál visszafordítása.
- Az elhanyagolás következményeinek megvásárolható elkerülése: fizetős szabadság, napközi, Nagyi, „biztosítás”, türelmi idő hosszabbítás, sorozatvédelem.
- Loot box, véletlenszerű fizetős tojás vagy tárgy.
- Virtuális valuta bármilyen formában, különösen több valuta, átváltási lépcső, valutacsomag, amely nem illik a tárgyárakhoz.
- Lejáró valuta vagy lejáró megvásárolt tartalom.
- Energia- vagy műveletkorlát fizetős feltöltéssel, fizetős várakozás-átugrás.
- Időkorlátos ajánlat, visszaszámláló, ajánlat a kedvenc rossz állapotához kötve.
- Harmadik fél reklámja, jutalmazott videó.
- Kozmetikum az emlékkertben, gyászhoz kötött termék.

### 10.7 Második helyezett: előfizetés, és mikor váltsunk

**Második helyezett modell:** ingyenes letöltés, 7 napos próbaidő, éves előfizetés (19,99 EUR/év; 7 990 Ft [JAVASLAT]), havi opció (2,99 EUR; 1 190 Ft) és örökös opció (39,99 EUR; 15 990 Ft). A jegyzetek javasolt tesztsávja előfizetésre 19,99-29,99 EUR/év. Magyar vevőnél a 19,99 EUR-s éves díjból ÁFA és 15% jutalék után kb. 13,38 EUR marad. Az alapelvek változatlanok: a kedvenc jólléte ekkor sem függhet az előfizetéstől.

**Váltási feltételek [JAVASLAT]** (bármelyik teljesülése esetén A/B tesztet indítunk):

1. Az indulás után 90 nappal a D35 letöltés-fizető arány 2% alatt van, miközben a D30 retenció legalább 6%: a felhasználók elkötelezettek, de az egyszeri ár nem konvertál.
2. A termék folyamatos tartalmat vagy hasznot kap (havi szezonális események, közös gondozás, MI-napló), amelynek fenntartása ismétlődő bevételt igényel; a jegyzetek szerint az előfizetés ilyenkor illeszkedik.
3. A 12 hónapos kohorszon az egyszeri bevétel nem fedezi az üzemeltetési és tartalomgyártási költséget.

**Váltási szabály:** aki a Teljes verziót megvette, mindent megtart, előfizetés nélkül (jogszerzett állapot). Ez az Apple 2026. októberi „bait-and-switch” szigorítása és a fogyasztói bizalom miatt is kötelező.

**Elvetett modellek:** prémium letöltés (felfedezés), reklám (2. indok), battle pass (folyamatos szezonális tartalmat igényel, ütközik a nyugodt hangnemmel), Apple Arcade vagy Play Pass (a Bandai már Arcade-en van, a kizárólagosság az Androidot zárná ki).

### 10.8 Megvalósítás

- **RevenueCat** a platformok közötti jogosultságra (`full` entitlement, kozmetikum-entitlementek), nyugta-validálásra és webhookra; a RevenueCat app user ID a saját `userId` (13.9).
- **iOS próbaidő:** 0-s ársávú, „7-day Trial” elnevezésű nem fogyó IAP (Apple 3.1.1); a lejárat időpontját a szerver `POST /v1/trial` rekordja adja.
- **Vásárlások visszaállítása** gomb a Beállításokban (kötelező).
- **Promóciós kódok:** IAP-tartalom feloldására az Apple offer code és a Google promo code szolgál; a saját promókód-végpont (a meglévő `SET NX` mintával) csak nem árusított juttatást ad (béta-hozzáférés, „Alapító” kozmetikum). Ennek áruházi megfelelősége [ELLENŐRIZENDŐ].

---

## 11. Funkcionális követelmények

Prioritás: MoSCoW (Must, Should, Could, Won't now). Kiadás: MVP (1.0), 1.1, 1.2, 2.0.

### 11.1 Kiadási terv

| Kiadás | Tartalom |
|---|---|
| MVP (1.0) | Onboarding és napirend; Alap és Klasszikus mód; teljes gondozási hurok; életszakaszok és 7 felnőtt forma; Nagyi, halál, természetes halál, emlékkert, öröklődés; Szabadság és Napközi; helyi értesítések és szerverpush tartalék; iOS widget (kicsi, közepes, zárolási képernyő) és Android widget (kicsi); próbaidő, Teljes verzió, egy kozmetikum-csomag; anonim fiók, összekapcsolás, törlés, export; HU és EN; akadálymentességi alapszint; két minijáték és Simogatás; kézzel írt szövegbank; hozzájárulás-alapú analitika |
| 1.1 (MVP + kb. 8 hét) | Live Activity (betegség, alvás, Kritikus); interaktív widget-gomb (iOS 17+); Gemini-vel előgenerált szövegbank; Android közepes widget; további kozmetikumok |
| 1.2 (MVP + kb. 16 hét) | Őrző csillag; harmadik minijáték; Postgres bevezetése, ha a 13.6 feltételei teljesülnek; korlátozott offline művelet-sor értékelése |
| 2.0 (MVP + 6-9 hónap) | Apple Watch komplikáció (WidgetKit accessory), Wear OS Wear Widget; közös gondozás vizsgálata |

### 11.2 Onboarding és napirend

**FR-01 · Must · MVP · Első indítás.** *Mint új játékos regisztráció nélkül szeretnék kezdeni.*
Elfogadás: (a) az anonim fiók a háttérben jön létre (FR-33); (b) az adatvédelmi tájékoztató és az analitikai hozzájárulás egyenrangú „Elfogadom” és „Nem fogadom el” gombokkal jelenik meg; (c) hozzájárulás előtt semmilyen analitikai SDK nem küld adatot; (d) elutasítással a játék teljes értékű.

**FR-02 · Must · MVP · Napirend beállítása.** *Mint dolgozó felnőtt szeretném, ha a kedvencem az én alvásidőmhöz igazodna.*
Elfogadás: (a) lefekvés és ébredés megadása, 7-11 órás ablak; (b) az időzóna automatikus felismerése és megjelenítése; (c) módosítás 24 óránként egyszer, a következő ébredéstől érvényes, és a felület ezt előre közli; (d) DST-váltás napján a fogyás tesztben pontos.

**FR-03 · Must · MVP · Módválasztás új tojásnál.** *Mint nosztalgikus játékos szeretném tudatosan eldönteni, hogy valódi halállal játszom-e.*
Elfogadás: (a) Alap előre kiválasztva; (b) Klasszikusnál a 7.12 szerinti magyarázó képernyő és semleges megerősítés; (c) a jogosultságot (Teljes verzió vagy próbaidő) a szerver ellenőrzi; (d) Teljes verzió nélkül a Klasszikus opció látható, de zárolt, és a bolt-oldalra vezet.

**FR-04 · Must · MVP · Keltetés és névadás.**
Elfogadás: (a) 5 perces tojás, 65 perces bébi; (b) név 1-12 karakter; (c) lefekvés előtti 90 percen belül halasztási javaslat; (d) a próbaidő a keltetéskor indul; (e) a bébi szakaszban vezetett első etetés és takarítás.

### 11.3 Gondozás és állapot

**FR-05 · Must · MVP · Gondozási műveletek.** *Mint játékos néhány koppintással szeretném ellátni a kedvencem.*
Elfogadás: (a) a 7.5 összes művelete; (b) minden mutációt a szerver bélyegez szerveridővel; (c) az 1,5 másodpercen belüli koppintások egy kérésbe kötegelődnek (legfeljebb 10 művelet); (d) minden művelet idempotens azonosítót kap; (e) végponttól végpontig p95 legfeljebb 800 ms 4G-n; (f) a kliens azonnal optimista animációt mutat, ütközésnél a szerverállapot győz.

**FR-06 · Must · MVP · Állapotkijelzés.**
Elfogadás: (a) 4 szíves kijelzés jóllakottságra és boldogságra, fegyelem 4 szegmensben; (b) „következő ellenőrzés legkésőbb” időpont; (c) offline sáv és utolsó szinkron időpontja; (d) VoiceOver és TalkBack szövegesen felolvassa („Jóllakottság: 3 szív a 4-ből”).

### 11.4 Szimuláció és idő

**FR-07 · Must · MVP · Determinisztikus szimuláció közös csomagban.**
Elfogadás: (a) a `@pixeltojas/sim` csomagot a kliens, a widget-előszámítás és a szerver ugyanúgy használja; (b) a 7.13 idővonalai és további golden fixture-ök a CI-ben Node-on és Hermesen is azonos eredményt adnak; (c) a kedvenc paraméterverziója rögzített (7.16).

**FR-08 · Must · MVP · Szerveridő és óramanipuláció elleni védelem.**
Elfogadás: (a) az állapotot meghatározó időbélyeg mindig szerveridő; (b) ha ugyanabban a rendszerindításban a faliidő és a monoton idő változása 5 percnél többel eltér, a helyi kivetítés elvetődik; (c) újraindítás után a kivetítés „nem megerősített” jelzést kap a következő szinkronig; (d) 72 óránál régebbi szinkron után a felület és a widget elavult állapotot jelez.

### 11.5 Életciklus

**FR-09 · Must · MVP · Életszakaszok és fejlődés** a 7.3, 7.10, 7.11 szerint.
Elfogadás: (a) szakaszváltás nem esik alvásablakba; (b) fejlődési animáció és naplóbejegyzés; (c) Legenda csak Klasszikus módban érhető el.

**FR-10 · Should · MVP · Fejlődési album (Teljes verzió).**
Elfogadás: (a) a látott formák gyűjteménye, feltételek nélkül; (b) zárolt állapotban is gyűjt.

### 11.6 Kudarcállapotok, halál, emlékezés

**FR-11 · Must · MVP · Nagyi (Alap).**
Elfogadás: (a) Kritikus + 12 számlálható óra után átadás; (b) ingyenes, egykoppintásos hazahozás a 8.3 visszatérési értékeivel; (c) 30 nap után választási lehetőség; (d) a következmények a 8.3 szerint.

**FR-12 · Must · MVP · Klasszikus halál és figyelmeztetési lánc.**
Elfogadás: (a) halál csak a 7.13 feltételeivel, kizárólag szerveroldali kiértékeléssel; (b) Kritikus állapot kezdetén, -4 és -1 óránál értesítés, ha az értesítés engedélyezett; (c) halál nem következhet be alvás, csendes óra, napközi, szabadság vagy kiesés alatt (automatizált teszt); (d) a `sys:flags.deathEnabled = false` vészleállító minden halált Kritikus-tartásra vált.

**FR-13 · Must · MVP · Visszalépés Klasszikusból Alapra.**
Elfogadás: (a) legfeljebb két koppintás, Kritikus állapotban is; (b) semleges szöveg; (c) azonnali hatály, a jelvény és a Legenda-esély elvész; (d) visszafordíthatatlan, ezt a felület előre közli.

**FR-14 · Must · MVP · Természetes halál és búcsú.**
Elfogadás: (a) Idős korba lépéskor előjelzés napokban; (b) halálról nincs push; (c) búcsúképernyő a következő megnyitáskor, fizetési felület nélkül; (d) a tojás csak a játékos indítására kel.

**FR-15 · Must · MVP · Emlékkert.**
Elfogadás: (a) minden lezárult élet megjelenik; (b) sírfelirat legfeljebb 140 karakter, analitikába és naplóba nem kerül; (c) csillag vagy sírkő ábrázolás választható; (d) teljesen ingyenes; (e) Should: kép exportálása.

**FR-16 · Must · MVP · Öröklődés és családfa (Teljes verzió).**
Elfogadás: (a) a 7.14 öröklési szabályai seedelten, a szerveren számolva; (b) családfa-nézet generációkkal, okokkal; (c) Teljes verzió nélkül a nézet zárolt, az adatok megmaradnak.

**FR-17 · Could · 1.2 · Őrző csillag** a 7.14 szerint.

### 11.7 Távollét

**FR-18 · Must · MVP · Szabadság mód** a 8.1 szerint.
Elfogadás: (a) azonnali indítás vagy legfeljebb 30 nappal előre ütemezés; (b) a keret és a hátralévő napok láthatók; (c) a Klasszikus-korlátozások szerveroldalon érvényesülnek; (d) lejárat előtti értesítés.

**FR-19 · Must · MVP · Napközi** a 8.2 szerint.
Elfogadás: (a) heti ismétlődő ablakok napokra bontva; (b) a módonkénti napi felső korlát a szerveren érvényesül; (c) a widget és a főképernyő jelzi, hogy a kedvenc napköziben van.

### 11.8 Értesítések

**FR-20 · Must · MVP · Engedélykérés kontextusban** a 9.3 szerint.
Elfogadás: (a) első gondozási kör után; (b) Androidon `shouldShowRequestPermissionRationale()` esetén magyarázó képernyő; (c) elutasítás után a Beállításokból újra kérhető; (d) induláskor soha.

**FR-21 · Must · MVP · Helyi értesítések a szimulációból.**
Elfogadás: (a) legfeljebb 8 függő értesítés; (b) teljes újratervezés minden állapotváltozáskor, megnyitáskor és szinkronkor; (c) csendes órák, napi keret és visszavonulás érvényesül; (d) kategóriánként kapcsolható; (e) az egyesített Android-manifestben nincs `USE_EXACT_ALARM` és `SCHEDULE_EXACT_ALARM` (CI-ellenőrzés).

**FR-22 · Must · MVP · Szerverpush tartalék.**
Elfogadás: (a) csak Klasszikus Kritikus kezdete és szabadság-lejárat; (b) csak ha a küszöb számítása óta nem volt szinkron; (c) deduplikáció kedvenc, eseménytípus és időpont szerint; (d) legfeljebb 5 perc késés az ütemezett időponthoz képest.

**FR-23 · Should · MVP · Összesített mód** (napi 3 időpont, Alap módban alapértelmezett).

### 11.9 Widgetek és kiegészítő felületek

**FR-24 · Must · MVP · iOS widget** (kicsi, közepes, zárolási képernyő kör alakú).
Elfogadás: (a) 24 órás idővonal 30 percenként, a szinkronkor előszámolva; (b) a widget nem hív hálózatot; (c) 72 óránál régebbi adatnál elavult jelzés; (d) kaki, betegség, alvás, napközi, szabadság, Nagyi állapot látszik.

**FR-25 · Must · MVP · Android widget** (Glance, kicsi).
Elfogadás: (a) előszámolt bejegyzésekből renderel, nem futtat szimulációt; (b) legfeljebb 30 percenkénti frissítés; (c) ugyanazok az állapotok, mint iOS-en.

**FR-26 · Could · 1.1 · Interaktív widget-gomb** (iOS 17+, App Intent „Etetés”).
Elfogadás: (a) a művelet a szerverhez megy; (b) hálózat nélkül az alkalmazást nyitja meg.

**FR-27 · Could · 1.1 · Live Activity** (beteg kedvenc, alvás ébredésig, Klasszikus Kritikus visszaszámlálás).
Elfogadás: (a) legfeljebb 8 óra aktív időtartam; (b) az adat legfeljebb 4 KB; (c) csak a játékos kifejezett indítására vagy beállítása szerint.

**FR-28 · Won't now · 2.0 · Apple Watch komplikáció és Wear OS Wear Widget.**

### 11.10 Monetizáció

**FR-29 · Must · MVP · 7 napos próbaidő.**
Elfogadás: (a) szerveroldali rögzítés `userId`-hoz, ujjlenyomat csak visszaélés-jelzésként; (b) iOS-en 0-s ársávú „7-day Trial” nem fogyó IAP; (c) a lejárat időpontja mindig látható; (d) a lejárat után az élő Klasszikus kedvenc Klasszikus marad.

**FR-30 · Must · MVP · Teljes verzió vásárlása és visszaállítása.**
Elfogadás: (a) vásárlás előtt valós pénzes, ÁFÁ-t tartalmazó ár; (b) RevenueCat jogosultság, webhook a szerverre; (c) „Vásárlások visszaállítása”; (d) a 10.5 tiltott helyein nem jelenik meg fizetési felület (UI-teszt).

**FR-31 · Should · MVP · Kozmetikumok közvetlen áron.**
Elfogadás: (a) nem fogyó, véletlenszerűség nélküli tételek; (b) előnézet vásárlás előtt; (c) nincs időkorlát vagy visszaszámlálás.

**FR-32 · Must · MVP · Fizetési felület elhelyezése** a 10.5 szerint.
Elfogadás: (a) automatizált UI-teszt igazolja, hogy halál, búcsú, emlékkert, betegség, Kritikus, Lábadozás és Nagyi képernyőn nincs fizetési elem; (b) push-értesítés nem tartalmaz vásárlási ajánlatot; (c) az onboarding-infokártya „Később” gombja egyenrangú; (d) nincs visszaszámláló vagy időkorlátos ár.

### 11.11 Fiók és adatok

**FR-33 · Must · MVP · Anonim fiók** (13.9).
Elfogadás: (a) a token Keychainben, illetve Keystore-alapú tárolóban; (b) a fiók újratelepítés után iOS-en a Keychain révén megmaradhat.

**FR-34 · Should · MVP · Apple- és Google-összekapcsolás.**
Elfogadás: (a) Sign in with Apple is elérhető, ha Google-belépés van (Apple 4.8); (b) ütközésnél (a szolgáltatói fiókhoz már tartozik kedvenc) a játékos választ, csendes felülírás nincs.

**FR-35 · Must · MVP · Fiók- és adattörlés.**
Elfogadás: (a) alkalmazáson belül a Beállításokból (Apple 5.1.1(v), Google Play); (b) webes törlési útvonal újratelepítés nélkül (Google Play), anonim fióknál az alkalmazásban megjelenített törlési kóddal; (c) Sign in with Apple esetén token-visszavonás [ELLENŐRIZENDŐ]; (d) a RevenueCat-oldali adat törlésének indítása.

**FR-36 · Must · MVP · Adatexport** JSON-ban (kedvencek, emlékkert, beállítások).

### 11.12 Beállítások, lokalizáció, akadálymentesség

**FR-37 · Must · MVP · HU és EN lokalizáció** (12. fejezet).

**FR-38 · Must · MVP · Akadálymentesség** (12. fejezet).

**FR-39 · Should · MVP · Hangok** (retro csipogás) alapértelmezésben kikapcsolva, rezgés opcionális.

### 11.13 Személyiség-szövegek

**FR-40 · Must · MVP · Kézzel írt szövegbank** (nyelvenként kb. 300 sor, hangulat, szakasz és személyiségjegy szerint), az alkalmazásba csomagolva.

**FR-41 · Could · 1.1 · Gemini-vel előgenerált szövegbank** (13.11).
Elfogadás: (a) gondozási művelet soha nem vár MI-válaszra; (b) a bank szinkronkor töltődik, ETag-gel; (c) minden sor emberi ellenőrzésen esik át; (d) az alkalmazás jelzi, hogy a szövegek egy része MI-vel előre generált.

### 11.14 Analitika

**FR-42 · Must · MVP · Hozzájárulás-alapú eseménykövetés** (16. fejezet); szabad szöveg soha nem kerül eseménybe.

**FR-43 · Should · MVP · Jóllét-pulzus:** havonta legfeljebb egy kérdés („A Pixeltojás most inkább öröm, semleges vagy teher?”), kihagyható.

### 11.15 Minijátékok

**FR-44 · Must · MVP · „Merre fordul?” és Simogatás** (7.15), szerveroldali seed-validálással.

**FR-45 · Should · MVP · „Nagyobb vagy kisebb?”** (Teljes verzió).

---

## 12. Nem-funkcionális követelmények

| ID | Kategória | Követelmény [JAVASLAT] | Mérés |
|---|---|---|---|
| NFR-01 | Teljesítmény | Hidegindítás legfeljebb 2,0 s referencia középkategóriás eszközön (iPhone 12, Pixel 6a) | Release build mérés |
| NFR-02 | Teljesítmény | Gondozási végpont szerveroldali p95 legfeljebb 300 ms; végponttól végpontig p95 legfeljebb 800 ms 4G-n | APM, Vercel-napló |
| NFR-03 | Teljesítmény | 48 órás szimulációs előrejelzés legfeljebb 5 ms, 24 órás widget-idővonal legfeljebb 50 ms eszközön | Benchmark a CI-ben |
| NFR-04 | Offline | Hálózat nélkül csak olvasható kivetítés, legfeljebb 72 óráig megbízhatóként jelölve; műveletek hálózatot igényelnek (MVP); minden kérés idempotens és újrapróbálható | E2E teszt repülőgép-üzemmódban |
| NFR-05 | Akkumulátor | Nincs eszközön futó tick; háttérmunka csak opportunista (widget, újratervezés); nincs akkumulátor-optimalizálás alóli mentesség kérése | Energiaprofil (Xcode, Android Studio) |
| NFR-06 | Megbízhatóság | Crash-free munkamenet legalább 99,5%; backend rendelkezésre állás legalább 99,5% havonta, kiesésnél jóváírás (8.5) | Crash-riport, uptime-monitor |
| NFR-07 | Adatintegritás | Optimista zárolás verziószámmal (CAS); ütközésnél 409 és újraszinkron; idempotencia-kulcs 48 órán át | Párhuzamossági teszt két eszközzel |
| NFR-08 | Biztonság | TLS mindenütt; HMAC-aláírt token; titkok csak környezeti változóban (a meglévő repó nyilvános, a promókódokat már most is csak env-ből olvassa); felhasználónkénti és IP-nkénti kérés-korlátozás; sémavalidálás közös zod-sémákkal; RevenueCat-webhook és cron-végpont titkos fejléccel; a Gemini-kulcs csak a szerveren | Biztonsági review, függőség-audit |
| NFR-09 | Adatvédelem | Uniós régió (Vercel-függvény, Upstash); adatminimalizálás (e-mail csak összekapcsolásnál a szolgáltatótól); naplókban nincs személyes adat | DPIA, adatfolyam-térkép [JOGI] |
| NFR-10 | Akadálymentesség | VoiceOver és TalkBack címkék minden vezérlőn; dinamikus betűméret 200%-ig törés nélkül; az állapot nem csak színnel kódolt; „Csökkentett mozgás” tiszteletben tartása; WCAG 2.2 AA kontraszt; legalább 44 × 44 pt (iOS) és 48 × 48 dp (Android) érintési célterület; gondozás időzített reakció nélkül | Akadálymentességi audit, eszközös teszt |
| NFR-11 | Lokalizáció | HU és EN induláskor; ICU üzenetformátum, többes szám; helyi dátum- és időformátum; magyar szövegben a felhasználói névhez nincs rag; a halálábrázolás választható | Nyelvi review, pszeudo-lokalizáció |
| NFR-12 | Méret | Telepítési méret legfeljebb 60 MB | Store-jelentés |
| NFR-13 | Hangolhatóság | Minden játékparaméter szerveroldali, verziózott konfigurációból; alkalmazásfrissítés nélkül módosítható (7.16 korlátaival) | Konfiguráció-diff naplózása |
| NFR-14 | Megfigyelhetőség | Strukturált napló (végpont, latencia, paraméterverzió, modell-ID a Gemini-hívásoknál a meglévő `LAST_GEMINI_DIAG` mintára); riasztás 5xx-arányra, cron-kimaradásra, Gemini 404-re | Dashboard, riasztási szabályok |

---

## 13. Technikai architektúra

### 13.1 Döntések összefoglalója

| Terület | Döntés | Fő indok |
|---|---|---|
| Kliens | Expo SDK 58 (React Native 0.88), visszaesési opció SDK 57 | Közös TypeScript a backenddel; `expo-widgets`; érett értesítési, IAP- és integritásmodulok |
| Szimuláció | `@pixeltojas/sim` tiszta TS csomag, I/O nélkül | Egy implementáció kliensre, widget-előszámításra és szerverre |
| Idő | Szerver-autoritatív, lusta, zárt formájú számítás | A háttérfuttatás egyik OS-en sem megbízható |
| Backend | Külön Vercel-projekt, Express 5 + TS, catch-all rewrite a meglévő mintára | Izoláció a meglévő emlékeztető-szolgáltatástól (13.5) |
| Adat | Upstash Redis (új, uniós régiós adatbázis); Postgres (Neon) később | Kis, kulcs szerinti dokumentumok; olcsó |
| Push-ütemezés | Zárt béta: QStash-ütemezés; indulás: Vercel Cron (Pro), 5 percenként | 13.8 |
| Vásárlás | RevenueCat | Platformközi jogosultság, kis díj |
| MI | Gemini, előre generált és ellenőrzött szövegbank, soha nem blokkoló | Költség, biztonság, modellkivezetési kockázat |

### 13.2 Kliens: Expo és alternatívák

Az Expo SDK 58 a jegyzetek szerint 2026. október 21-én jelent meg (React Native 0.88, iOS 27 támogatás); ez nagyon friss, ezért a natív modulok kompatibilitását ellenőrizni kell, és SDK 57 a visszaesési opció [ELLENŐRIZENDŐ]. A „natív alkalmazás” PO-döntést ez teljesíti: az Expo áruházból telepíthető, natív UI-t renderelő alkalmazást ad, a widgetek pedig natív kiterjesztések.

| Szempont | Expo / React Native | Flutter | Natív Swift + Kotlin | Unity | Godot |
|---|---|---|---|---|---|
| TS-kódmegosztás a backenddel | teljes (szimuláció, típusok, sémák) | nincs (Dart) | nincs | nincs (C#) | nincs |
| Kódbázisok száma | 1 | 1 | 2 | 1 | 1 |
| iOS widget, Live Activity | `expo-widgets` (SDK 56 óta stabil) | natív Swift + `home_widget` híd | legjobb | natív plugin | natív plugin |
| Android widget | első féltől származó Expo-modul nincs; natív Glance modul | natív Kotlin + `home_widget` | Glance | natív plugin | natív plugin |
| 2D sprite-animáció | megfelelő (sprite sheet, Reanimated vagy Skia) | erős | jó | legjobb | erős |
| OTA frissítés | EAS Update | harmadik fél | nincs | nincs | nincs |

**Ajánlott csomagok:** `expo-notifications` (helyi értesítés, push token; dátum-trigger `{ type: 'date', date }` formában), `expo-widgets` (iOS widget és Live Activity), saját Kotlin Glance modul Expo Modules API-val (Android widget), `react-native-purchases` (RevenueCat), `expo-secure-store` (token), később `app-integrity` (Play Integrity, App Attest). Pixelart sprite sheetből, legközelebbi-szomszéd skálázással.

### 13.3 Közös szimulációs modul

**Monorepó-szerkezet [JAVASLAT]** (új, privát repó; a meglévő `smartreminderbackend` változatlan marad):

```
apps/mobile        Expo-alkalmazás
apps/api           Express 5 + TypeScript, Vercel
packages/sim       @pixeltojas/sim: tiszta függvények, nincs I/O, nincs Date.now()
packages/schemas   zod-sémák (API, pillanatkép, paraméterek)
tools/linegen      Gemini batch-szövegbank generátor
```

**Csomag-API:**

```ts
advance(s: PetSnapshot, ctx: SimContext, toMs: number): { state: PetSnapshot; events: SimEvent[] }
applyActions(s: PetSnapshot, ctx: SimContext, actions: Action[], atMs: number): { state; events; rejected: RejectedAction[] }
forecast(s: PetSnapshot, ctx: SimContext, fromMs: number, horizonMs: number): ForecastEvent[]   // hívás, Kritikus, halál, Nagyi, ébredés...
timeline(s: PetSnapshot, ctx: SimContext, fromMs: number, stepMs: number, count: number): WidgetEntry[]
// ctx = { params (verziózott), schedule (alvás, csend, napközi, tz), vacations, incidents }
```

**Szabályok:** minden idő UTC epoch ms; a naptári fogalmakat (alvásablak, csendes órák, napközi) időzóna-tudatos könyvtár (például Luxon vagy Temporal polyfill [JAVASLAT]) alakítja UTC-intervallumokká. A véletlen események (ütemezett betegség, hiszti, öröklés, minijáték-seed) seedelt PRNG-ből jönnek (`petId` és időablak alapján); a szerver a szakasz kezdetén sorsol, és az időpontokat a pillanatképben rögzíti, így a kliens nem számol újra. A küszöbátlépés idejét analitikusan oldjuk meg (t = érték / ráta), ezért ugyanaz a függvény adja az értesítési időpontokat, a widget-idővonalat és a szerverpush időpontját.

**Pillanatkép-séma (vázlat):**

```ts
interface PetSnapshot {
  id: string; userId: string; v: number;                 // CAS-verzió
  paramsVersion: number; simVersion: number;
  mode: "alap" | "klasszikus"; downgradedAt?: number;
  status: "egg" | "alive" | "nagyi" | "vacation" | "dead";
  stage: "egg" | "baby" | "child" | "teen" | "adult" | "senior"; form?: string;
  stageStartedAt: number;
  stats: { hunger: number; happiness: number; energy: number; health: number; discipline: number; weightG: number };
  poops: number[];                                       // megjelenési időpontok
  sick?: { since: number; dosesLeft: number; cause: string };
  lightsOff: boolean;
  openCalls: { type: string; openedAt: number; countedMs: number }[];
  careMistakes: Record<string, number>; sicknessCount: Record<string, number>; absenceMistakes: number;
  critical?: { since: number; countedMs: number; cause: string };
  scheduled: { type: "sickness" | "misbehave"; at: number }[];
  vacation?: { start: number; end: number };
  lifespanAdjDays: number;
  lineageId: string; generation: number; traits: string[]; palette: number;
  rngSeed: string; lastTs: number; ageYears: number; createdAt: number;
}
```

**Tesztelés:** a 7.13 idővonalai golden tesztek; tulajdonságalapú tesztek (például: alvásablakban soha nincs állapotváltozás); keresztfutás Node-on és Hermesen ugyanazzal a fixture-készlettel; DST-napok és időzóna-váltás fixture-jei.

### 13.4 Szerver-autoritatív idő, óramanipuláció, offline plafon

- Minden mutáló művelet a szerverre megy; a szerver `Date.now()`-val bélyegez, `advance()`-szal a szerveridőre lépteti az állapotot, majd alkalmazza a műveletet, és visszaadja az új pillanatképet és a `serverNow` értéket. Ez a meglévő `/trial` végpont elvének kiterjesztése (a válasz ott is a szerver idejét adja, mert a telefon órája visszatekerhető).
- A kliens tárolja a `serverOffset = serverNow - deviceNow` értéket és a szinkronkori monoton időt (Android: `SystemClock.elapsedRealtime()`, iOS: `ContinuousClock`; az API-szemantika [ELLENŐRIZENDŐ]). Offline becslés: `now = lastServerNow + (monotonNow - monotonAtSync)`.
- Előtérbe kerüléskor, ha ugyanabban a rendszerindításban a faliidő és a monoton idő változása 5 percnél többel eltér, a helyi kivetítést elvetjük, és szerveridőre várunk. Újraindítás után a kivetítés megerősítetlen.
- **Offline plafon:** a kivetítés 72 óráig jelölhető megbízhatónak; Alap módban egy távollét legfeljebb 3 gondozási hibát okozhat; a Klasszikus halált kizárólag a szerver állapítja meg.
- **Offline műveletek:** az MVP-ben nincs offline művelet-sor (a jegyzetek „B opciója”, 1-2 fős csapatnak lényegesen kevesebb hibalehetőség). Az 1.2-ben értékeljük a korlátozott sort (monoton időbélyeg, szerveroldali újravalidálás, `lastServerTs` és `serverNow` közé szorítás).
- **Integritás:** App Attest és Play Integrity csak akkor, ha ranglista, kereskedelem vagy fizetős valuta kerül a játékba; egyjátékos kedvencnél a szerveridő a fő védelem.

### 13.5 Backend: külön Vercel-projekt és a meglévő kód újrahasznosítása

**Döntés: külön Vercel-projekt ugyanabban a Vercel-teamben, új, uniós régiós Upstash Redis adatbázissal.** Indokok a meglévő kódból:

1. A meglévő `allowRequest` globális napi plafonja (`RL_GLOBAL_PER_DAY`, alapérték 2000) minden végpontot számol, a `/trial`-t és a `/promo`-t is. Közös projektben a játék szinkronforgalma (1 000 DAU-nál napi kb. 8 000-10 000 kérés) kimerítené, és az emlékeztető-alkalmazás felhasználói 429-et kapnának.
2. Az `api/index.ts` betöltéskor kivételt dob, ha nincs `GEMINI_API_KEY`. A játékban a Gemini opcionális, a hiánya nem állíthatja le a gondozási végpontokat.
3. A `trial:start:<ujjlenyomat>` kulcs közös adatbázisban ütközne: ugyanazon az eszközön a két alkalmazás próbaideje összefonódna.
4. Eltérő kiadási ritmus, hibahatókör és titokkezelés; a meglévő repó nyilvános, a játékkód privát monorepóba kerül.
5. A Vercel Pro díja a jegyzetek szerint telepítő ülőhelyenként értendő, így egy újabb projekt ugyanabban a teamben várhatóan nem jelent újabb alapdíjat [ELLENŐRIZENDŐ].

**Újrahasznosítás:**

| Meglévő elem | Felhasználás a játékban |
|---|---|
| `incrWindow`, `redisIncr`, memória-fallback | Kérés-korlátozó modul, saját kulcsprefixszel; új felhasználónkénti limit (percenként 60 művelet [JAVASLAT]); a globális napi plafon csak a Gemini-végpontokra vonatkozik |
| `redisSetNx` (Upstash REST, az `NX` path-szegmensként, mert a query-forma szintaxishibát ad) és `redisGet` (a hiba és a „nincs kulcs” megkülönböztetésével) | Közvetlen átvétel; kiegészítés Lua-alapú CAS-írással (Upstash REST EVAL-támogatás [ELLENŐRIZENDŐ]) |
| `POST /trial` minta: `SET NX`, lejárat nélküli kulcs, hash-elt ujjlenyomat, `serverNow` a válaszban, Redis-hibánál 503 | `POST /v1/trial`: kulcs `trial:{userId}`, az ujjlenyomat `trial:fp:{sha256}` alatt csak visszaélés-jelzés; a válasz `serverNow` mezője az első időszinkron |
| `POST /promo`, `GET /promo/stats`: atomi `SET NX`, fail-closed 503, kódok csak env-ből, admin-kulcsos statisztika | Ugyanez a minta `pet:`-specifikus kódkészlettel, csak nem árusított juttatásokra (10.8) |
| `generateNormalisedJson`, `parseWithRepair`, `extractJsonRegion`, `THINKING_CONFIG`, `GEMINI_MODEL` env | A `tools/linegen` batch-generátorban; a modell-ID kötelezően frissítendő (13.11) |
| `LAST_GEMINI_DIAG` naplózás | Modell-ID, latencia, tokenszám naplózása megtartva |
| `vercel.json` catch-all rewrite, Express 5 egyetlen függvényben | Ugyanez a szerkezet; plusz `crons` bejegyzés Pro csomagon |

A közös segédeket először másolással, majd egy kis belső csomagba (`@shared/upstash`) kiemelve osztjuk meg [JAVASLAT].

### 13.6 Adatmodell

**Redis-kulcsok** (a játék saját adatbázisában):

| Kulcs | Típus | Lejárat | Tartalom |
|---|---|---|---|
| `u:{userId}` | JSON-string | nincs | profil: locale, tz, napirend (alvás, csend, napközi, autoLights), hozzájárulások időbélyeggel, értesítési beállítások, összekapcsolt szolgáltatók, jogosultság-gyorsítótár, `activePetId`, `v` |
| `auth:{provider}:{sub}` | string | nincs | `userId` |
| `p:{petId}` | JSON-string | nincs | pillanatkép (13.3) |
| `u:{userId}:pets` | lista | nincs | `petId`-k időrendben |
| `mem:{petId}` | JSON-string | nincs | emlékkert-bejegyzés |
| `lin:{lineageId}` | JSON-string | nincs | gének, generációszám, Klasszikus-sorozat |
| `due:push` | rendezett halmaz | nincs | tag: `petId\|eseménytípus\|időpont`, pontszám: időpont (ms) |
| `p:{petId}:due` | halmaz | nincs | a kedvenc aktuális `due:push` tagjai (cseréhez) |
| `push:{userId}` | halmaz | nincs | Expo push tokenek |
| `trial:{userId}` | string (`SET NX`) | szándékosan nincs | próbaidő kezdete (ISO) |
| `trial:fp:{sha256}` | string (`SET NX`) | nincs | első `userId` (visszaélés-jelzés) [JOGI: megőrzés törlés után] |
| `promo:used:{kód}` | string (`SET NX`) | nincs | `userId\|ISO` |
| `act:{petId}:{actionId}` | string (`SET NX`) | 48 óra | idempotencia, a válasz hash-e |
| `rl:u:{userId}:{perc}`, `rl:ip:{ip}:{perc}`, `rl:gemini:d:{nap}` | számláló | 120 s, illetve 25 óra | kérés-korlátozás |
| `cfg:params:{v}` | JSON-string | nincs | szimulációs paraméterkészlet |
| `lines:{bankVersion}:{locale}` | JSON-string | nincs | szövegbank |
| `sys:flags` | hash | nincs | `deathEnabled`, `minAppVersion`, `defaultParamsVersion` |
| `sys:incidents` | rendezett halmaz | nincs | kiesési intervallumok |

**Kapacitás:** kb. 2 KB kedvencenként; 100 000 kedvenc kb. 200 MB (jegyzetek). A Redis nem költségtényező.

**Mikor jön a Postgres (Neon) [JAVASLAT]:** ha (a) az emlékkert és a családfa-történet kedvencenként vagy összesen nagyobb, mint amit kényelmes JSON-dokumentumban tartani (irányérték: 50 000 lezárult élet); (b) közös gondozás vagy más kapcsolati gráf kerül a termékbe; (c) saját vásárlási napló kell a RevenueCat mellett; (d) analitikai lekérdezések vagy táblákon átívelő GDPR-export szükséges; (e) az Upstash tartóssági garanciái a halál- és emlékadatokra nem bizonyulnak elégségesnek (19.2). Addig napi JSON-mentés készül a kedvenc- és emlékkulcsokról [JAVASLAT].

### 13.7 API-végpontok

Alapútvonal `/v1`; hitelesítés `Authorization: Bearer <token>`, kivéve a jelölteket.

| Metódus és útvonal | Leírás | Kiadás |
|---|---|---|
| `POST /v1/auth/anon` | anonim fiók, token, `serverNow` (hitelesítés nélkül) | MVP |
| `POST /v1/auth/link` | Apple- vagy Google-összekapcsolás `idToken`-nel, ütközéskezeléssel | MVP |
| `DELETE /v1/account` | fiók és adatok törlése | MVP |
| `GET /v1/account/export` | JSON-export | MVP |
| `GET /v1/config` | paraméterkészlet, flag-ek, minimális app-verzió | MVP |
| `GET /v1/state` | aktív kedvenc a szerveridőre léptetve, előrejelzés, jogosultságok | MVP |
| `POST /v1/pets` | új tojás (mód, név, lineage) | MVP |
| `POST /v1/pets/{id}/actions` | kötegelt gondozási műveletek | MVP |
| `POST /v1/pets/{id}/minigame` | minijáték-eredmény seed-validálással | MVP |
| `POST /v1/pets/{id}/downgrade` | Klasszikusból Alapra | MVP |
| `POST /v1/pets/{id}/retrieve` | Nagyitól hazahozás vagy Nagyinál hagyás | MVP |
| `PUT /v1/settings/schedule` | alvás, csendes órák, napközi, tz | MVP |
| `PUT /v1/settings/notifications` | kategóriák, összesítő időpontjai | MVP |
| `POST /v1/vacations`, `DELETE /v1/vacations/{id}` | szabadság indítása, ütemezése, befejezése | MVP |
| `GET /v1/memorial`, `PUT /v1/memorial/{petId}` | emlékkert, sírfelirat | MVP |
| `POST /v1/push/tokens` | push token regisztrációja | MVP |
| `POST /v1/trial` | próbaidő (meglévő minta) | MVP |
| `POST /v1/promo`, `GET /v1/promo/stats` | promókód (meglévő minta; a statisztika admin-kulccsal) | MVP |
| `POST /v1/webhooks/revenuecat` | jogosultság-frissítés (webhook-titok) | MVP |
| `POST /v1/cron/tick` | tartalék push kiküldése (cron vagy QStash, aláírással) | MVP |
| `GET /v1/health` | állapotellenőrzés (hitelesítés nélkül) | MVP |
| `GET /delete-account` | webes törlési oldal (Google Play) | MVP |
| `GET /v1/lines` | szövegbank (ETag) | 1.1 |

**Vázlatok:**

```http
POST /v1/auth/anon
{ "installId": "6f1c...", "platform": "ios", "appVersion": "1.0.0", "locale": "hu-HU", "tz": "Europe/Budapest" }

200 { "userId": "u_01J...", "token": "v1.u_01J....sig", "serverNow": "2026-10-28T17:40:02.118Z" }
```

```http
POST /v1/pets/p_8f2c/actions
{ "expectedVersion": 41,
  "actions": [ { "id": "a_01", "type": "feed_meal" }, { "id": "a_02", "type": "feed_meal" }, { "id": "a_03", "type": "clean" } ] }

200 { "serverNow": "2026-10-28T17:42:10.512Z",
      "pet": { "id": "p_8f2c", "v": 42, "mode": "alap", "stage": "adult", "form": "kiegyensulyozott",
               "stats": { "hunger": 75, "happiness": 60, "energy": 48, "health": 92, "discipline": 75, "weightG": 34 },
               "poops": [], "sick": null, "status": "alive", "paramsVersion": 1, "lastTs": 1793295730512 },
      "events": [ { "type": "call_resolved", "call": "hunger" } ],
      "rejected": [],
      "forecast": [ { "type": "sleep", "at": "2026-10-28T21:00:00Z" }, { "type": "wake", "at": "2026-10-29T05:45:00Z" },
                    { "type": "hunger_call", "at": "2026-10-29T08:42:00Z" } ],
      "entitlements": { "full": false, "trialEndsAt": "2026-11-04T16:05:00Z" } }

409 { "error": "version_conflict", "currentVersion": 43 }
```

```http
PUT /v1/settings/schedule
{ "tz": "Europe/Budapest", "sleep": { "start": "22:30", "end": "06:45" },
  "quiet": { "start": "22:00", "end": "07:15" },
  "napkozi": [ { "days": [1,2,3,4,5], "start": "08:30", "end": "17:00" } ], "autoLights": false }

200 { "effectiveFrom": "2026-10-29T06:45:00+01:00", "nextChangeAllowedAt": "2026-10-29T17:45:00Z" }
422 { "error": "napkozi_limit", "maxHours": 10 }
```

```http
POST /v1/vacations
{ "petId": "p_8f2c", "start": "now", "end": "2026-11-06T18:00:00+01:00" }

200 { "vacation": { "id": "vac_1", "start": "...", "end": "..." }, "remainingDays90": 21 }
422 { "error": "klasszikus_pet_not_eligible", "reason": "sick" }
```

### 13.8 Push-ütemezés

Minden szinkronkor a szerver a `forecast()` alapján frissíti a kedvenc `due:push` tagjait (Klasszikus Kritikus kezdete, szabadság lejárata). Az ütemező a `ZRANGEBYSCORE due:push 0 <most>` lekérdezéssel olvas, és csak akkor küld, ha a kedvenc `lastTs` értéke régebbi, mint az esemény kiszámításának ideje. A küldés az Expo Push API-n megy (kérésenként legfeljebb 100 üzenet; az Expo SLA-t nem vállal).

| Opció | Működés | Előny | Hátrány | Költség 1 000 DAU-nál |
|---|---|---|---|---|
| A: Vercel Cron (Pro) | 1-5 percenkénti cron hívja a `/v1/cron/tick`-et | Legegyszerűbb, egy kódút | Hobby csomagon csak napi egyszeri cron (kb. 1 órás pontatlansággal) | elhanyagolható (havi 8 640 hívás 5 percenként) |
| B: QStash késleltetett üzenet kedvencenként | szinkronkor üzenet `notBefore = esemény` értékkel, deduplikálva | másodpercre pontos, Pro nélkül is | több mozgó alkatrész; napi kb. 3 000 üzenet túllépi a napi 1 000-es ingyenes keretet | kb. 0,90 USD/hó |
| C: QStash ütemezés | QStash cron-ütemezés hívja 5 percenként ugyanazt a végpontot | Hobby csomagon is működik | külső függőség | kb. napi 288 üzenet, ingyenes keretben |

**Döntés:** zárt bétában (nem kereskedelmi használat) a C opció; induláskor és a monetizáció bekapcsolásakor Vercel Pro és az A opció, 5 perces ütemezéssel. A Hobby csomag a jegyzetek szerint nem kereskedelmi használatra szól, ezért fizetős termékkel nem indulunk rajta.

**A csomagkorlátok forrása:** az alábbi számok a vercel.com és az upstash.com keresőtalálat-összefoglalóiból és harmadik felektől származnak, az eredeti oldalakat a kutatás nem tudta megnyitni [ELLENŐRIZENDŐ]:

| Szolgáltatás | Adat a jegyzetekben |
|---|---|
| Vercel Cron | Hobby: naponta egyszer, kb. 1 órás pontatlanság; Pro: percenkénti ütemezés; projektenkénti job-szám 100 (2026 óta, több forrás) vagy Hobby 2 / Pro 40 (régebbi forrás), ellentmondó |
| Vercel Pro | 20 USD/hó ülőhelyenként, 20 USD használati kerettel; túllépés kb. 0,60 USD / 1 M hívás; benne foglalt Active CPU vitatott (16 vagy 40 óra) |
| Vercel függvény | Hobby és Pro alapérték 300 s, Pro maximum 800 s |
| Upstash Redis | ingyenes: 256 MB, havi 500 000 parancs, fiókonként 1 adatbázis; pay-as-you-go 0,20 USD / 100 000 parancs |
| Upstash QStash | ingyenes: napi 1 000 üzenet (egy oldal még 500-at mutat); pay-as-you-go 1 USD / 100 000 üzenet |

### 13.9 Fiókok és azonosítás

1. Első indításkor az alkalmazás UUIDv4 telepítési azonosítót generál, és `POST /v1/auth/anon` hívással fiókot kap. A token HMAC-SHA256-tal aláírt, 30 napos gördülő érvényességű [JAVASLAT], az `expo-secure-store`-ban tárolódik.
2. Opcionális összekapcsolás Sign in with Apple-lel vagy Google-lel („Mentsd el a kedvenced”), a Beállításokban és az első fejlődés után egyszer felajánlva. Ha Google-belépés van, Sign in with Apple is kell (Apple 4.8).
3. A próbaidő és a promóció `userId`-hoz kötött; az eszköz-ujjlenyomat csak visszaélés-jelzés.
4. **Törlés:** az anonim szerveroldali fiók is „fiók”, ezért alkalmazáson belüli törlés kötelező (Apple 5.1.1(v), 2022. június 30. óta érvényesítve); Google Playen ezen felül webes törlési útvonal és Data safety nyilatkozat. A deaktiválás nem minősül törlésnek. A törlés a `u:*`, `auth:*`, `p:*`, `mem:*`, `lin:*`, `push:*`, `trial:{userId}` kulcsokat és a `due:push` tagokat érinti; a `trial:fp:*` visszaélés-jelzés megőrzése [JOGI].
5. A RevenueCat app user ID a `userId`; összekapcsolásnál a jogosultságok követik a fiókot.

### 13.10 Vásárlások: RevenueCat

- Díj: havi 2 500 USD követett bevételig ingyenes, felette a hivatalos megfogalmazás szerint a teljes követett bevétel 1%-a (harmadik felek szerint csak a többleté; a hivatalos szöveg az irányadó) [ELLENŐRIZENDŐ].
- Termékek: `full_unlock` (nem fogyó), `trial_7d` (iOS, 0-s ársáv), `cosmetic_*` (nem fogyó). Entitlementek: `full`, `cosmetic_*`.
- A szerver a webhook alapján frissíti a `u:{userId}` jogosultság-gyorsítótárát; a jogosultságot igénylő műveleteket (Klasszikus tojás, öröklés) a szerver ellenőrzi.
- Az áruházi díjak és az ÁFA a kódban nem szerepelnek; minden ilyen érték konfigurációs feltevés.

### 13.11 Opcionális Gemini személyiség-szövegek

- **Modellkockázat:** a meglévő backend alapértelmezett modellje (`gemini-2.5-flash`) a jegyzetek szerint új projekteknek már 404-et ad, és a kivezetése 2026. október 16-ra (Gemini Developer API), illetve 20-ra (Vertex AI) volt jelezve; források ellentmondanak, egy fórumbejegyzés már július 9-én 404-et jelentett [ELLENŐRIZENDŐ]. A játék ezért aktuális stabil modellt céloz: `gemini-3.6-flash` (GA 2026. július 21.) vagy költséghatékonyan `gemini-3.1-flash-lite` (kivezetés legkorábban „07.05.2027”, a dátumformátum kétértelmű) [ELLENŐRIZENDŐ]. A modell a meglévő mintára `GEMINI_MODEL` env-változóból jön. Mellékmegállapítás a PRD hatókörén kívül: ugyanez a kockázat a meglévő emlékeztető-backendet is érinti.
- **Működés:** a `tools/linegen` batch-szkript a meglévő `generateNormalisedJson` és `parseWithRepair` segédekkel generál sorokat (személyiségjegy × hangulat × szakasz × nyelv), szigorú biztonsági beállításokkal, alacsony gondolkodási szinttel (2.5-családnál `thinkingBudget: 0`, 3.x-nél `thinkingLevel: low`, ahogy a repó már teszi). Minden sort ember ellenőriz, a bank verziózva a `lines:{v}:{locale}` kulcsba kerül, a kliens szinkronkor tölti le, és helyben mintavételez.
- **Soha nem blokkoló:** gondozási művelet nem vár MI-re; élő hívás az 1.1-ben nincs. Ha később lesz, 2-3 s időkorláttal és kézi tartaléksorral.
- **Biztonság és megfelelés:** nincs felhasználói szabad szöveges bemenet, így nincs beszélgetés kiskorúval; a kulcs csak a szerveren; az alkalmazás jelzi az MI-vel előre generált szövegeket. A California SB 243 (2026. január 1-jétől hatályos) a tartós érzelmi beszélgetést folytató társ-chatbotokra vonatkozik; a korlátozott, nem beszélgetős használat ezt a kockázatot csökkenti, az EU MI-rendelet alkalmazhatóságát a kutatás nem vizsgálta [JOGI].
- **Ingyenes szint:** az AI Studio ingyenes szintjén a Google a jegyzetek szerint felhasználhatja az adatokat termékfejlesztésre, ezért élesben csak számlázott projekt.
- **Költség:** bankgenerálás 5 000 sorral (kb. 300 bemeneti + 60 kimeneti token soronként) kb. 0,8 USD Flash-Lite 3.1-gyel (0,25 / 1,50 USD per 1 M token) és kb. 4,5 USD 3.6 Flash-sel (1,50 / 7,50 USD per 1 M token) [BECSLÉS, aggregátor-árak, ELLENŐRIZENDŐ]. Összevetésül a jegyzetek élő hívásos becslése 1 000 DAU × napi 5 sorra: kb. 25 USD/hó (Flash-Lite) vagy 135 USD/hó (3.6 Flash).

### 13.12 Widgetek technikai terve

- Minden szinkronkor az alkalmazás a `timeline()` függvénnyel 48 bejegyzést számol (30 percenként, 24 órára): szívek, kaki, betegség, alvás, napközi, szabadság, Nagyi, hangulat, sprite-állapot.
- **iOS:** a bejegyzések az App Groupba kerülnek; a TimelineProvider `.atEnd` újratöltési szabállyal dolgozik. Ez napi kb. egy újratöltést fogyaszt a 40-70-es keretből; az előtérben lévő alkalmazás és az App Intent újratöltése keretmentes. Bejegyzések legalább kb. 5 perc távolságra (Apple ajánlás).
- **Android:** Glance widget, a bejegyzések SharedPreferences-ben; a widget csak kiválasztja az aktuális időhöz tartozó bejegyzést, szimulációt nem futtat (így nincs Kotlin-port és nincs eltérési kockázat). `updatePeriodMillis` legalább 30 perc.
- A widgetben a sprite előre renderelt képkocka; React Native a widgetben nem fut.
- **Live Activity (1.1):** legfeljebb 8 óra aktív és további 4 óra a zárolási képernyőn, legfeljebb 4 KB adat, hálózat nélkül; frissítés az alkalmazásból vagy ActivityKit pushból.
- **Óra (2.0):** watchOS accessory widgetek a WidgetKit-kódból; Wear OS 7 „Wear Widgets” Glance-szel (Wear OS 4+ visszafelé kompatibilis).

### 13.13 Megfigyelhetőség és üzemeltetési biztonság

- **Vészleállító:** `sys:flags.deathEnabled = false` minden Klasszikus halált Kritikus-tartásra vált, amíg vissza nem kapcsoljuk.
- **Kiesés-jóváírás:** `sys:incidents` (8.5).
- **Minimális app-verzió:** `sys:flags.minAppVersion` kényszeríti a frissítést inkompatibilis szimulációs verziónál.
- **Riasztások:** 5xx-arány, cron-kimaradás (több mint 15 perc), Gemini 404 („no longer available”), Redis-hibaarány.

### 13.14 Költségbecslés 1 000 DAU-ra (havi)

| Tétel | Feltevés | Költség (USD/hó) | Megjegyzés |
|---|---|---|---|
| Vercel Pro | 1 ülőhely | 20 | 20 USD használati keretet tartalmaz [ELLENŐRIZENDŐ] |
| Vercel-hívások | napi kb. 10 kérés/DAU + 5 perces cron ≈ havi 310 000 hívás | 0 (keretben) | túllépés kb. 0,60 USD / 1 M |
| Upstash Redis | kérésenként kb. 5 parancs ≈ havi 1,5 M parancs | kb. 3 | 0,20 USD / 100 000 [ELLENŐRIZENDŐ] |
| QStash | csak bétában, ütemezésként | 0 | ingyenes keretben |
| Expo Push | tartalék push | 0 | ingyenes keret nem igazolt [ELLENŐRIZENDŐ] |
| Gemini | havi egy bankfrissítés | kb. 1-5 | élő hívással 25-135 lenne |
| RevenueCat | 2 500 USD havi bevétel alatt | 0 | felette a bevétel 1%-a |
| Neon Postgres | ha bevezetjük, ingyenes csomag | 0 | 0,5 GB, 100 CU-óra [ELLENŐRIZENDŐ] |
| **Összesen** | | **kb. 24-28** | **kb. 0,024-0,028 USD/DAU/hó** [BECSLÉS] |

Nem szerepel: fejlesztői programdíjak, EAS-díjak, domain, crash-riport szolgáltatás (a jegyzetek nem tartalmazzák, ellenőrizendő).

---

## 14. Adatvédelem és jogi megfelelés

Az alábbiak a jegyzetek elemzésén alapulnak, nem jogi tanácsok. A [JOGI] jelölésű pontokhoz jogi tanácsadó, illetve a NAIH, a GVH vagy a NAV megerősítése szükséges.

| Szabály | Követelmény | Megvalósítás | Megerősítés |
|---|---|---|---|
| GDPR + ePrivacy (CNIL 2025-ös mobilalkalmazás-ajánlása) | Az analitikai és SDK-hozzáféréshez hozzájárulás; a közzétevő felel a harmadik féltől származó SDK-kért; jogalapok szétválasztása | Játékmenet: szerződés; analitika és marketing-push: hozzájárulás; egyenrangú gombok; nincs reklám-SDK; uniós régió; adatfeldolgozói szerződések (Vercel, Upstash, Google, RevenueCat, Expo) | [JOGI] |
| EDPB 03/2022 (megtévesztő design) | Tisztességes, átlátható hozzájárulási felület | Semleges szöveg, nincs érzelmi „terelés” | |
| Push token és ePrivacy | Nem tisztázott, hogy a push token az ePrivacy 5. cikk (3) bekezdése szerinti hozzájárulást igényli-e | Az OS-engedély elkülönül a marketing-hozzájárulástól | [JOGI: NAIH] |
| Kiskorúak (GDPR 8. cikk, COPPA) | Ha a közönség gyerekeket is elérhet, a digitális hozzájárulási korhatár releváns | Javaslat: semleges korsáv-kérdés („Elmúltál 16 éves?”) az onboardingban, amely kiskorúnál kikapcsolja az analitikát és a marketing-hozzájárulást | [JOGI: NAIH] |
| Apple 4.5.4 | Az értesítés nem lehet a működés feltétele; promóciós push csak kifejezett hozzájárulással és alkalmazáson belüli leiratkozással | Teljesen játszható értesítés nélkül; MVP-ben nincs promóciós push | |
| Apple 3.1.1 | Feloldás IAP-val; nem előfizetéses próbaidő „XX-day Trial” 0-s ársávú nem fogyó tétellel, a hossz, a zárolódó tartalom és a díjak közlésével; vásárolt valuta nem járhat le; loot boxnál esélyek közlése | Mindez teljesül; valuta és loot box nincs | |
| Apple 3.2.2(x) | Értékelés nem kényszeríthető | Értékelési kérés csak pozitív pillanatban (fejlődés), soha halál vagy betegség után | |
| Apple 5.1.1(ii), (iv), (v); 5.1.2(i) | Adatgyűjtés hozzájárulással; fizetős funkció nem függhet adatmegosztástól; nincs manipulált hozzájárulás; fióktörlés az alkalmazásban; követéshez ATT | Nincs követés, ezért nincs ATT-kérés; törlés az alkalmazásban | |
| Apple 4.8 | Harmadik fél belépése mellett adatvédő alternatíva | Sign in with Apple | |
| Google Play | Fióktörlés az alkalmazásban és weben; Data safety; POST_NOTIFICATIONS; nincs teljes képernyős intent értesítésre; nincs `USE_EXACT_ALARM` | 13.9, 9.2 | |
| CPC Key Principles a játékon belüli valutáról (2025. március, nem kötelező) | Valós pénzes ár; nincs több valuta; nincs vásárlási nyomás; elállási jog; gyerekek védelme | Nincs valuta; valós pénzes ár ÁFÁ-val; nincs időkorlátos ajánlat. Az elállási jog kezelése digitális tartalomnál az áruházi folyamatban | [JOGI: elállás] |
| UCPD (2021-es Bizottsági iránymutatás) | Előreláthatósági teszt: gyerekeket valószínűleg elérő játék; I. melléklet 28. pont: gyerekek közvetlen vásárlásra buzdítása tiltott; agresszív gyakorlat (8-9. cikk) | Nincs második személyű vásárlási felszólítás; nincs ajánlat distresszhez kötve; nincs fizetős újraélesztés | [JOGI] |
| GVH (magyar hatóság) | 2023-as mobiljáték-vizsgálat (30 játék): mesterségesen lassított visszaszámlálók, félrevezető bezárógombok, a valós értéket elfedő bonyolult átváltású valuták, hamis szűkösség; útmutató: mindig a pontos fizetendő összeg | Egyik minta sincs a termékben; a fizetendő összeg mindig látható. 2026 októberében a GVH OECD- és bizottsági szakértőkkel képzést tartott a sötét mintákról | |
| CPC-vizsgálat (2026. szeptember 30.) | Kilenc játékcég vizsgálata, köztük az addiktív design | Értesítési keret, visszavonulás, nincs sorozat-büntetés, jóllét-pulzus | |
| Digital Fairness Act | 2026. október 28-án még nincs benyújtva; az EP Legislative Train szerint Q4 2026 (egyes források szerint indikatívan 2026. november 11.); várható témák: sötét minták, addiktív design, előfizetési csapdák, esetleg valuta és loot box; tárgyalás 2027-ben, alkalmazás aligha 2028 vége előtt | A szigorúbb mércére tervezünk most | Figyelendő |
| DSA 25. cikk | Csak online platformra | Nyilvános felhasználói tartalom nincs, valószínűleg nem alkalmazandó; közös gondozásnál vagy megosztásnál újraértékelendő | [JOGI] |
| Loot box (Belgium) | Fizetős loot box szerencsejáték | Nincs | |
| ÁFA | Magyar 27%, a vevő országa szerint; natív IAP-nál az áruház kezeli | Natív IAP; alternatív fizetésnél OSS | [JOGI: NAV] |
| Életkori besorolás | Apple 2025-ös rendszere: 4+, 9+, 13+, 16+, 18+ (a kérdőív 2026. január 31-ig volt kötelezően megválaszolandó); Google Play: IARC | Őszinte kitöltés. Várhatóan alacsony besorolás (nem grafikus, rajzos halál, erőszak nélkül), „In-game Purchases” jelöléssel; ez következtetés, az IARC-kérdőív dönti el. Nem kerülünk az Apple Kids kategóriájába (ott tilos a harmadik fél analitikája és a szülői kapu nélküli vásárlás). A marketing 18 év feletti közönséget céloz | Kérdőív kitöltése |
| Bandai IP | „Tamagotchi” név, karakternevek, logó, megjelenés | Saját név, karakterek és stílus; a „Tamagotchi” szó áruházi szövegben csak jogi jóváhagyással | [JOGI: védjegy] |

---

## 15. Etikai design-elvek (ellenőrzőlista)

Minden kiadás előtt kötelezően végigvett lista; bármely pont sérülése kiadást blokkoló hiba.

**Alapteszt (jegyzetek):** *Méltányos maradna-e a funkció, ha a játékos nem tudna fizetni és soha nem kapna értesítést?* Ha a kedvenc jólléte pénztől vagy értesítésre adott választól függ, a design kizsákmányoló.

**Pénz és jóllét**
- [ ] A kedvenc jólléte (gondozás, gyógyítás, szabadság, napközi, Nagyi) soha nem függ fizetéstől.
- [ ] Nincs fizetős újraélesztés, sem fizetős „átugrás”, várakozás-rövidítés vagy veszteségvédelem.
- [ ] Nincs virtuális valuta, nincs lejáró tartalom, nincs loot box vagy véletlenszerű fizetős tétel.
- [ ] Minden ár valós pénzben, ÁFÁ-val, a vásárlás előtt látható.
- [ ] Nincs időkorlátos ajánlat, visszaszámláló, hamis szűkösség.
- [ ] Fizetési felület nem jelenik meg halál, búcsú, emlékkert, betegség, Kritikus, Lábadozás, Nagyi kontextusban és push-értesítésben.
- [ ] Nincs második személyű vásárlási felszólítás a vásárlógomb közelében (UCPD I. melléklet 28. pont).
- [ ] Az emlékkert és az adatexport mindenkinek ingyenes, gyászhoz kötött termék nincs.

**Értesítések és figyelem**
- [ ] Az alkalmazás értesítés nélkül teljes értékű; a „következő ellenőrzés” időpontja mindig látható.
- [ ] Értesítési szöveg tárgyszerű; a 9.4 tiltott mintái egyik szövegben sincsenek (szövegreview).
- [ ] Napi keret, csendes órák és automatikus visszavonulás működik, a visszavonulás kommentár nélküli.
- [ ] Az elutasító és leiratkozó gombok felirata semleges (nincs confirmshaming).
- [ ] Nincs napi bejelentkezési jutalomsorozat, amely kihagyáskor nullázódik.

**Halál és veszteség**
- [ ] Elhanyagolásos halál csak tájékozott, explicit Klasszikus opt-in után.
- [ ] A Klasszikusból Alapra visszalépés bármikor, Kritikus állapotban is két koppintással elérhető.
- [ ] Halál, Nagyi-átadás és gondozási hiba nem keletkezik alvás, csendes óra, napközi, szabadság vagy kiesés alatt (kivétel az elmulasztott villanyoltás, amely csak a fejlődést érinti).
- [ ] A halált többlépcsős előjelzés előzi meg; a természetes halált napokkal előre jelezzük.
- [ ] A halál ábrázolása méltó, nem grafikus; választható csillag vagy sírkő.
- [ ] Élő Klasszikus kedvenc szabályai visszamenőleg nem szigorodnak.
- [ ] A kudarc feloldódik (Nagyi, emlékkert, új generáció), nincs tartós „szenvedő” állapot.

**Adat és MI**
- [ ] Analitika csak hozzájárulással; szabad szöveg (név, sírfelirat) soha nem kerül eseménybe.
- [ ] Nincs harmadik fél reklám- vagy követő SDK.
- [ ] MI csak előre generált, emberileg ellenőrzött, nem beszélgetős szöveg, jelölve.
- [ ] A kedvenc személyisége nem változik váratlanul (a Replika-esetből tanulva): szövegbank-frissítés csak a meglévő jegyekkel összhangban.

**Mérés**
- [ ] A jóllét-pulzus „teher” aránya és az értesítés-visszavonási arány a KPI-k között van, és romlásuk kiadási felülvizsgálatot indít.

---

## 16. Analitika és eseménykövetés

Elvek: kliensoldali események csak hozzájárulással; a szimulációs eseményeket (hívás, hiba, betegség, halál) a szerver állítja elő, mert a kliens nem mindig fut. Álnevesített `userId`, uniós tárolás, szabad szöveg nélkül, időtartamok sávokban.

| Esemény | Kiváltó | Fő tulajdonságok | KPI / cél |
|---|---|---|---|
| `app_first_open` | első indítás | platform, locale, app_version | telepítési kohorsz |
| `consent_updated` | hozzájárulás változása | analytics, marketing_push | megfelelés |
| `onboarding_step` | onboarding lépései | step, duration_bucket | onboarding-lemorzsolódás |
| `schedule_set` | napirend mentése | sleep_len_h, quiet_extra_h, napkozi_h, tz_offset | napirend-használat |
| `egg_created` | új tojás | mode, generation, lineage_continued | Klasszikus választási arány, új generáció |
| `pet_hatched` | keltetés | mode | próbaidő kezdete |
| `care_action` | gondozási művelet | type, stage, stat_before_bucket, call_open, minutes_since_call_bucket | gondozási ritmus |
| `call_raised` (szerver) | hívás | call_type, stage, mode | |
| `care_mistake` (szerver) | lejárt türelmi idő | call_type, stage, mode | nehézség-hangolás |
| `sickness_started`, `sickness_cured` (szerver) | betegség | cause, doses, untreated_bucket | |
| `stage_changed` (szerver) | szakaszváltás | from, to, form, mistakes, discipline | formaeloszlás |
| `critical_entered`, `critical_exited` (szerver) | Kritikus | mode, stage, exit_reason (mentés, halál, Nagyi, visszalépés) | halálarány |
| `nagyi_entered`, `nagyi_retrieved` | Nagyi | days_bucket, choice | Nagyi-arány |
| `pet_died` (szerver) | halál | cause, mode, age_days, form | elhanyagolásos halál arány |
| `mode_downgraded` | visszalépés | stage, in_critical | Klasszikus nehézség |
| `vacation_started`, `vacation_ended` | szabadság | planned_days, actual_days, mode, end_reason | távollét-kezelés |
| `napkozi_window_used` (szerver) | napközi ablak vége | hours, mode | |
| `notif_permission_prompted`, `notif_permission_result` | engedélykérés | context, result, platform | opt-in arány |
| `notif_opened` | értesítés megnyitása | category | értesítési hatékonyság |
| `notif_settings_changed` | beállítás | category, enabled, digest_mode | visszavonási arány |
| `notif_backoff_started` | visszavonulás | category_counts | |
| `widget_added`, `widget_removed` | widget | family, platform | widget-hatás a retencióra |
| `live_activity_started` | Live Activity | kind | |
| `paywall_viewed` | fizetési felület | placement | konverzió-tölcsér |
| `purchase_started`, `purchase_completed`, `purchase_failed`, `purchase_restored` | vásárlás | product_id, price_tier, currency, store | D35 fizető arány |
| `trial_started`, `trial_ended` | próbaidő | converted | próbaidő-végi konverzió |
| `refund_received` (webhook) | visszatérítés | product_id | visszatérítési arány |
| `account_linked`, `account_deleted`, `data_exported` | fiók | provider | megfelelés |
| `memorial_viewed` | emlékkert | entries_bucket | gyászfolyamat, nem célzott optimalizálásra |
| `minigame_played` | minijáték | game_id, result | |
| `ai_line_shown` | MI-sor megjelenítése | line_id, bank_version | szövegminőség |
| `wellbeing_pulse` | jóllét-kérdés | answer | jóllét-KPI |
| `session_start`, `session_end` | munkamenet | duration_bucket | retenció |
| `sync_conflict`, `clock_jump_detected` | technikai | delta_bucket | integritás |

---

## 17. Ütemterv és mérföldkövek

1-2 fős csapatra, 2026. novemberi kezdéssel [JAVASLAT]. A teljes életciklus (18-33 nap) valós idejű validálása miatt a zárt béta nem rövidíthető 6 hét alá.

| Fázis | Időtartam | Tartalom | Kilépési feltétel |
|---|---|---|---|
| F0: Prototípus | 6 hét | `@pixeltojas/sim` csomag, CLI-szimulátor, paraméterkészlet v1, golden tesztek; papír- és gyorsított idejű játékteszt; grafikai irány (pixelart, LCD-hatás); névellenőrzés | A 7.13 idővonalai zöldek; 5 tesztelő gyorsított teljes életciklusa; D1, D9 eldöntve |
| F1: MVP-fejlesztés | 16 hét | Expo-alkalmazás, backend, értesítések, widgetek, RevenueCat, fiókkezelés, HU és EN, akadálymentességi alapszint | Minden MVP Must FR kész; belső dogfooding 2 hétig |
| F2: Zárt béta | 8 hét | TestFlight és Play belső tesztelés 50-200 fővel; QStash-ütemezés; legalább egy teljes valós idejű életciklus; hangolás; értesítési szövegek tesztje | D1 legalább 30%, D7 legalább 12% a bétában; crash-free legalább 99,5%; elhanyagolásos halál a 6. fejezet keretein belül |
| F3: Indulás | 3 hét | Vercel Pro, A opció; áruházi beküldés, IARC- és Apple-kérdőív; áruházi listázás HU és EN nyelven; 15. fejezet ellenőrzőlistája | Jóváhagyott áruházi listázás mindkét platformon |
| F4: Indulás utáni | folyamatos | 1.1 (+8 hét), 1.2 (+16 hét), 2.0 (+6-9 hónap); a 10.7 váltási feltételeinek vizsgálata a 90. napon | KPI-felülvizsgálat 30, 60, 90 naponként |

Indulás várhatóan 2027 második negyedévében, a tengerentúli 30. évforduló évében (Bandai Namco IR); a marketing az évfordulóra IP-használat nélkül, a nosztalgiára építhet.

---

## 18. Kockázatok és mitigáció

| # | Kockázat | Valószínűség | Hatás | Mitigáció |
|---|---|---|---|---|
| R1 | Bandai IP- vagy védjegyigény (név, megjelenés, áruházi szöveg) | közepes | magas | Saját név, karakterek, stílus; „Tamagotchi” szó csak jogi jóváhagyással [JOGI] |
| R2 | A Bandai mobilos gondozás-szimulátort ad ki a 30. évforduló körül | közepes | magas | Gyors MVP, felnőtt-fókusz, etikai differenciálás, magyar lokalizáció |
| R3 | Halál miatti negatív visszhang, bűntudat | közepes | magas | Alap mód alapértelmezett, Klasszikus opt-in, előjelzés, visszalépés, emlékkert; jóllét-KPI |
| R4 | Szimulációs hiba tömeges halált vagy Nagyi-átadást okoz | alacsony | nagyon magas | Vészleállító, paraméter-verziózás, golden tesztek, csak szerveroldali halál, kiesés-jóváírás |
| R5 | Gemini-modell kivezetése (2.5-flash) | magas | alacsony | Env-alapú modell, előgenerált bank, riasztás 404-re, MI nem blokkoló |
| R6 | Expo SDK 58 frissessége, `expo-widgets` csak iOS-en | közepes | közepes | SDK 57 visszaesés; natív Glance modul Androidra |
| R7 | Android pontatlan riasztás, értesítés-elutasítás | magas | közepes | Türelmi idők legalább 60 perc, 12 órás Kritikus ablak, szerverpush tartalék, widget, „következő ellenőrzés” kijelzés |
| R8 | Alacsony konverzió (freemium-szint, 2,1%) | közepes | magas | 0. napi infokártya, próbaidő-hossz teszt (D3), 10.7 váltási feltételek |
| R9 | Szabályozási szigorítás (DFA, CPC addiktív design) | közepes | közepes | Szigorúbb mérce most; valuta nincs; értesítési keret |
| R10 | Áruházi díjak változása | magas | alacsony | Konfigurálható feltevés, natív IAP |
| R11 | Óramanipuláció | közepes | alacsony | Szerveridő, monoton óra, ugrásdetektálás |
| R12 | Upstash-tartósság a halál- és emlékadatoknál | alacsony | magas | Napi mentés, Postgres-tükör az 1.2-ben, tartóssági garancia ellenőrzése |
| R13 | Vercel Hobby kereskedelmi tilalma | magas, ha Hobbyn maradnánk | közepes | Pro induláskor |
| R14 | Az indulási csúcs gyors lecsengése | magas | közepes | Retenció-fókusz: widget, generációk, összesített értesítés |
| R15 | 1-2 fős csapat kapacitása, buszfaktor | magas | magas | Szűk MVP, közös TS-kód, dokumentált szimuláció, paraméterek konfigurációban |
| R16 | Áruházi elutasítás (5.1.1(v), 4.5.4, 3.1.1 próbaidő-elnevezés) | közepes | közepes | Beküldés előtti ellenőrzőlista, 14. fejezet |
| R17 | Magyar névragozási és lokalizációs hibák | közepes | alacsony | Rag nélküli szövegezés, nyelvi review |
| R18 | Kiskorú felhasználók adatvédelmi kockázata | közepes | magas | Nincs chat, nincs reklám, hozzájárulás, korsáv-kérdés [JOGI] |
| R19 | A meglévő emlékeztető-backend modellkivezetése (hatókörön kívül, de közös csapat) | magas | közepes | Külön jegy a meglévő termékre |

---

## 19. Nyitott kérdések és ellenőrizendő adatok

### 19.1 Nyitott termékdöntések

| ID | Kérdés | Javaslat |
|---|---|---|
| D1 | Alap módban legyen-e elhanyagolásos halál (PO-premissza kontra kutatás)? | Nem; B változat a 7.12-ben |
| D2 | Teljes verzió ára | 5,99 EUR induló, A/B 4,99-7,99 EUR |
| D3 | Próbaidő hossza: 7 vagy 14 nap? A RevenueCat szerint a hosszabb próbaidő jobban konvertál (17-32 nap: 42,5%, 4 nap alatt: 25,5%), de ez korreláció | 7 nap induláskor (meglévő backend), 14 napos A/B a bétában |
| D4 | Külön Upstash-adatbázis vagy kulcsprefix a meglévőben? | Külön, uniós régiós adatbázis |
| D5 | Klasszikus mód fizetős-e, vagy ingyenes, és más a fizetős tartalom? | Fizetős (a próbaidőben elérhető) |
| D6 | Korsáv-kérdés az onboardingban | Igen, jogi megerősítés után |
| D7 | Alapértelmezett halálábrázolás | Csillag; sírkő választható |
| D8 | Offline művelet-sor | MVP-ben nincs, 1.2-ben értékelés |
| D9 | Végleges terméknév és védjegy-ellenőrzés | „Pixeltojás” munkacím, ellenőrzés az F0-ban |
| D10 | Indulási időzítés a 2027-es tengerentúli évfordulóhoz | 2027 Q2 |

### 19.2 Ellenőrizendő, döntést befolyásoló adatok

A jegyzetek szerint a kutatás során közvetlenül csak a developer.apple.com és a developer.android.com oldalai voltak olvashatók (az App Review Guidelines, a 64-es értesítési korlát, a WidgetKit- és Live Activity-dokumentáció, az Android értesítési és riasztási dokumentáció). Minden más adat keresőtalálat-összefoglalóból, másodlagos vagy rajongói forrásból származik, és döntés előtt az eredeti oldalon ellenőrizni kell.

| ID | Adat | Mire hat | Hol ellenőrizni |
|---|---|---|---|
| V1 | Vercel: Hobby cron napi egyszer, kb. 1 órás pontatlanság; Pro percenkénti cron; job-szám (100 vagy 2/40); Pro 20 USD ülőhelyenként, 20 USD kerettel; Active CPU (16 vagy 40 óra); túllépés 0,60 USD / 1 M; Hobby nem kereskedelmi | 13.8, 13.14 | vercel.com/docs/cron-jobs/usage-and-pricing, vercel.com/pricing, Fair Use Guidelines |
| V2 | Vercel-függvény időkorlátai (300 / 800 s) | cron-kötegek mérete | vercel.com/docs/functions/limitations |
| V3 | Upstash Redis: ingyenes 256 MB és havi 500 000 parancs, 1 ingyenes adatbázis fiókonként; 0,20 USD / 100 000; tartósság (perzisztencia, replikáció); REST EVAL | 13.6, 13.14, D4 | upstash.com/docs/redis/overall/pricing |
| V4 | QStash: napi 1 000 (vagy 500) ingyenes üzenet; 1 USD / 100 000; maximális késleltetés, ütemezés-korlát | 13.8 | upstash.com/pricing/qstash |
| V5 | Neon ingyenes csomag (0,5 GB, 100 CU-óra) | 13.6 | neon.com/docs/introduction/plans |
| V6 | Expo SDK 58 stabil dátuma és RN 0.88; `expo-widgets` stabilitás és Android-támogatás hiánya; `expo-notifications` pontos riasztás és újraindítás utáni viselkedése; Expo Push kvóta és SLA; `app-integrity` | 13.2, 9.2 | expo.dev changelog, docs.expo.dev, egyesített manifest egy dev buildben |
| V7 | Gemini: 2.5-flash kivezetése (2026. október 16. vagy 20.; 404 új projekteknek); 3.6 Flash GA 2026. július 21.; árak (3.6 Flash 1,50 / 7,50 USD vagy promóciós 0,75 / 3,75 USD); 3.1 Flash-Lite ára és kivezetése („07.05.2027”); ingyenes szint adatfelhasználása | 13.11 | ai.google.dev/gemini-api/docs/deprecations, ai.google.dev/pricing |
| V8 | RevenueCat: 2 500 USD-ig ingyenes, felette a teljes bevétel vagy csak a többlet 1%-a | 10.3, 13.10 | revenuecat.com pricing |
| V9 | Apple EU 14. melléklet: 15%-os SBP IAP-jutalék 2026. október 1-jétől; az SBP-oldal 10%-os sorának ellentmondása | 10.2, 10.3 | developer.apple.com/support/apps-in-the-eu |
| V10 | Google Play: 10% az első 1 M USD-re, +5% Play Billing; egyéb vásárlásokra 20/25%; az egyszeri IAP besorolása; bevezetési dátumok | 10.2, 10.3 | support.google.com/googleplay/android-developer/answer/16954621 |
| V11 | Magyar ÁFA 27% (szolgáltatói útmutatókból); HUF-ársávok; euró-forint arány | 10.3 | NAV, App Store Connect, Play Console |
| V12 | CPC Key Principles pontos szövege; DFA benyújtási dátuma; CPC 2026. szeptemberi vizsgálat; EUR-Lex C/2026/3601 és C(2026)4110 tartalma | 14 | commission.europa.eu, eur-lex.europa.eu |
| V13 | Retenciós benchmarkok (GameAnalytics másodlagos összefoglalóból; AppsFlyer casual-számok másodlagos blogokból, esetleg 2022-es adat) | 6 | gameanalytics.com jelentés, AppsFlyer benchmark |
| V14 | RevenueCat SOSA 2026 számai (10,7% / 2,1%; 25,0%; 11,22 USD; 42,5% / 25,5%; 0. napi konverziók) | 6, 10.2, D3 | revenuecat.com/state-of-subscription-apps |
| V15 | Piaci számok: Finch-bevétel, Pokémon Sleep, MI-társ kategória, szindikált piacméretek, MTTF2-lecsengés, Pou-letöltések | 3 | Sensor Tower, AppMagic, Appfigures eredeti közlései |
| V16 | Eredeti Tamagotchi-számok (15 perces szabály, szívfogyás, 65 perces bébi, élettartamok) | 7 (csak inspiráció) | tamagotchi.fandom.com, thaao.net (a kutatás során blokkolva) |
| V17 | Apple korosztályi kérdőív és IARC; a PEGI-kérdőív harmadik fél által tárolt példánya | 14 | App Store Connect, IARC |
| V18 | Wear OS 7 widgetek ütemezése; harmadik féltől származó RN Android-widget könyvtárak | 13.12 | developer.android.com |
| V19 | Sign in with Apple token-visszavonás törléskor (másodlagos állítás); Apple 4.8 elsődleges szövege | 13.9 | developer.apple.com |
| V20 | Push token és ePrivacy 5. cikk (3) bekezdés | 14 | NAIH |
| V21 | Áruházi promókódok és saját kódok viszonya IAP-tartalomnál (következtetés) | 10.8 | App Review Guidelines, Play-szabályzat |
| V22 | Bandai 100 M: szállítás, nem felhasználó; kidult-arányok sajtóközlésből | 3 | Bandai Namco IR, Circana |
| V23 | Monoton óra API-k szemantikája (Android `SystemClock`, iOS `ContinuousClock`) | 13.4 | developer.android.com, developer.apple.com |

---

## 20. Források

A források a kutatási jegyzetekből származnak; a jegyzetek dátuma 2026-10-28.

**Eredeti mechanika és Bandai**
- Tamagotchi Wiki, Tamagotchi (1996 Pet): https://tamagotchi.fandom.com/wiki/Tamagotchi_(1996_Pet)
- Thaao's Tamas, P1 Care Guide: https://thaao.net/tama/p1/
- Tamagotchi Wiki, Care: https://tamagotchi.fandom.com/wiki/Care
- TamaTalk, P1/P2 Evolution Guide: https://www.tamatalk.com/threads/tamagotchi-p1-p2-evolution-guide.200023/
- Tamagotchi Wiki, Grim Gotchi: https://tamagotchi.fandom.com/wiki/Grim_Gotchi
- Tamagotchi Wiki, Tamagotchi Paradise: https://tamagotchi.fandom.com/wiki/Tamagotchi_Paradise
- TamagotchiPet, Dead Tamagotchi: https://tamagotchipet.com/dead-tamagotchi/
- ScienceDesk, How to pause a Tamagotchi: https://sciencedesk.blog/how-to-pause-tamagotchi
- Wikipedia, Tamagotchi: https://en.wikipedia.org/wiki/Tamagotchi
- Bandai Namco IR Newsletter vol. 82: https://www.bandainamco.co.jp/en/ir/library/newsletter82_special.html
- Bandai Namco IR 2026 feature: https://www.bandainamco.co.jp/ir/library/2026_feature_08.html

**Piac és versenytársak**
- Sensor Tower, Q3 2025 virtual pet units (US): https://sensortower.com/blog/2025-q3-unified-top-5-virtual%20pet-units-us-62f83d1bf5dff39390bc09c4
- Finch FAQ: https://befinch.notion.site/Finch-FAQ-474652d0123d4883ac7a0cd6c8f5aa70
- PocketGamer.biz, Pokémon Sleep 230 M USD felett: https://www.pocketgamer.biz/pokmon-sleep-surpasses-230m-in-three-years/
- Apple Newsroom, Tamagotchi Adventure Kingdom: https://apple.com/newsroom/2024/01/tamagotchi-adventure-kingdom-and-cornsweeper-launch-on-apple-arcade
- Globe and Mail, kidult-trend: https://www.theglobeandmail.com/life/article-tamagotchi-toy-nostalgia-club
- TechCrunch, MI-társ alkalmazások (2025. aug. 12.): https://techcrunch.com/2025/08/12/ai-companion-apps-on-track-to-pull-in-120m-in-2025
- 360iResearch, Virtual Pet Simulator Apps: https://www.360iresearch.com/library/intelligence/virtual-pet-simulator-apps
- Common Sense Media, My Talking Tom 2: https://www.commonsensemedia.org/app-reviews/my-talking-tom-2
- TouchArcade, Tamagotchi L.i.f.e. értesítések: https://toucharcade.com/2013/04/05/tamagotchi-l-i-f-e-lets-you-relive-the-iconic-virtual-pets-constant-nagging-with-constant-push-notifications/
- GameAnalytics 2026 Benchmarks: https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks
- InvestGame, Mobile retention benchmarks 2026 (PDF): https://investgame.net/wp-content/uploads/2026/01/2026-01-20-Mobile_retention_benchmarks_2026.pdf
- GameGrowthAdvisor, Mobile game KPIs 2026: https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/

**Pszichológia, etika**
- Dodd, Fowler, Lottridge (2025), Purr-ogrammed love: https://www.sciencedirect.com/science/article/pii/S1875952125000382
- Frommel, Mandryk (2022), Daily Quests or Daily Pests?: https://dl.acm.org/doi/pdf/10.1145/3549489
- Silverman, Barasch (2023), broken streaks: https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions
- Fitz és mtsai. (2019), Batching notifications: https://www.kushlev.com/s/2019-Fitz-Kushlev-etal-2019.pdf
- Banks (2024), AI companion loss, ISPR-összefoglaló: https://ispr.info/2025/02/04/syracuse-professor-jaime-banks-on-the-rise-of-ai-companionship/
- Zagal, Björk, Lewis, Dark Patterns in the Design of Games (összefoglaló): https://www.deceptive.design/articles/dark-patterns-in-the-design-of-games
- Habitica, Rest in the Inn: https://habitica.fandom.com/wiki/Rest_in_the_Inn
- Wikipedia, Tamagotchi effect: https://en.wikipedia.org/wiki/Tamagotchi_effect

**Szabályozás és áruházak**
- Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple, Changes for apps in the EU: https://developer.apple.com/support/apps-in-the-eu/
- Apple Small Business Program: https://developer.apple.com/app-store/small-business-program/
- Apple, Offering account deletion in your app: https://developer.apple.com/support/offering-account-deletion-in-your-app
- Apple, korosztályi besorolás frissítése: https://developer.apple.com/news/?id=ks775ehf
- Google Play, alacsonyabb szolgáltatási díjak: https://support.google.com/googleplay/android-developer/answer/16954621?hl=en
- Google Play, fióktörlési követelmények: https://support.google.com/googleplay/android-developer/answer/13327111
- CPC Key Principles on in-game virtual currencies: https://commission.europa.eu/document/download/8af13e88-6540-436c-b137-9853e7fe866a_en?filename=Key+principles+on+in-game+virtual+currencies.pdf&prefLang=hu
- Európai Bizottság IP/25/831 (Star Stable): https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_25_831/IP_25_831_EN.pdf
- UCPD-iránymutatás (2021): https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A52021XC1229%2805%29
- GVH mobiljáték-vizsgálat (2023): https://www.gvh.hu/pfile/file?path=/en/press_room/press_releases/press-releases-documents/press-releases-2023/sk_2023_06_08_mobiljatek_sweep_a&inline=true
- Bird & Bird, GVH-összefoglaló: https://competitionlawinsights.twobirds.com/post/102loqp/protecting-children-from-misleading-practices-in-mobile-gaming-insights-from-the
- EP Legislative Train, Digital Fairness Act: https://www.europarl.europa.eu/legislative-train/theme-protecting-our-democracy-upholding-our-values/file-digital-fairness-act
- SCL, CPC-vizsgálat kilenc játékcég ellen: https://www.scl.org/eu-consumer-protection-network-launches-action-related-to-nine-video-games/
- CNIL, mobilalkalmazás-ajánlás: https://www.cnil.fr/sites/cnil/files/2025-05/recommendation-mobiles-app.pdf
- BEUC, dark patterns: https://www.beuc.eu/sites/default/files/publications/beuc-x-2022-013_dark_patters_paper.pdf
- Vatstack, magyar ÁFA: https://vatstack.com/rates/hungary
- Promise Legal, loot box szabályozás 2026: https://blog.promise.legal/lootbox-regulation-2026-game-studios/

**Monetizáció**
- RevenueCat State of Subscription Apps 2026: https://www.revenuecat.com/state-of-subscription-apps
- RevenueCat SOSA 2026 Gaming: https://www.revenuecat.com/state-of-subscription-apps-2026-gaming
- RevenueCat, account management (díjak): https://www.revenuecat.com/docs/welcome/set-up-revenuecat/account-management
- Pocket Tactics, prémium mobiljátékok: https://www.pockettactics.com/premium-mobile-games-increase
- Headway, Finch árazás: https://makeheadway.com/blog/finch-app-review/
- App Store, Neko Atsume: https://apps.apple.com/us/app/-/id923917775
- Android Police, My Tamagotchi Forever: https://www.androidpolice.com/2018/01/04/hands-tamagotchi-forever-everything-love-original-digital-pet-toy-mixed-many-free-play-mechanics/
- Walmart, Bitzee: https://www.walmart.com/ip/5316030976

**Technika**
- Apple, UILocalNotification (64-es korlát): https://developer.apple.com/documentation/uikit/uilocalnotification
- Apple, Keeping a widget up to date: https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date
- Apple, Live Activities: https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities
- Android, Notification runtime permission: https://developer.android.com/develop/ui/views/notifications/notification-permission
- Android, Schedule alarms: https://developer.android.com/develop/background-work/services/alarms/schedule
- Android, Doze and App Standby: https://developer.android.com/training/monitoring-device-state/doze-standby
- Android, Advanced app widgets: https://developer.android.com/develop/ui/views/appwidgets/advanced
- Android, Wear Widgets: https://developer.android.com/training/wearables/widgets
- Android, Play Integrity: https://developer.android.com/google/play/integrity/overview
- Expo, Home screen widgets and Live Activities: https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo
- Expo, How to upgrade to SDK 58: https://expo.dev/blog/how-to-upgrade-to-sdk-58
- Vercel, Cron usage and pricing: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Upstash, Redis pricing: https://upstash.com/docs/redis/overall/pricing
- Upstash, QStash pricing: https://upstash.com/pricing/qstash
- Neon, plans: https://neon.com/docs/introduction/plans
- Google AI, Gemini 3.6 Flash: https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash
- Google AI fórum, Gemini 2.5 Flash 404: https://discuss.ai.google.dev/t/gemini-2-5-flash-and-gemini-2-5-flash-lite-returning-404-no-longer-available-today-july-9-contradicts-oct-16-2026-shutdown-date/174267

**Meglévő kód**
- `api/index.ts`, `package.json`, `vercel.json` (smartreminderbackend, Express 5 + TypeScript, Upstash REST, Gemini REST)
