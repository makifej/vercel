# Pixeltojás (Android prototípus)

Tamagotchi-szerű virtuális háziállat felnőtt, nosztalgiázó játékosoknak. A termékkövetelmények a [`docs/PRD-tamagotchi.md`](../docs/PRD-tamagotchi.md) fájlban, a mögöttük álló kutatás a [`reports/`](../reports/) és a [`research_notes/`](../research_notes/) mappában található.

Ez a build a PRD „játszható offline váz” szelete: a teljes játékmechanika (PRD 7. és 8. fejezet) a telefonon fut, szerver, fiók és fizetés nélkül.

## Telepítés Androidra

A GitHub Actions **Android build** workflow-ja minden PR-re és `main` pushra lefordítja a release APK-t. A futás oldalán az **Artifacts** alatt található `android-apk` csomag tartalmazza az `app-release.apk` fájlt, ez közvetlenül telepíthető (ismeretlen forrásból való telepítést engedélyezni kell). Az APK a debug kulccsal van aláírva, áruházi kiadásra nem alkalmas.

Helyi fordítás Android SDK-val és JDK 17-tel:

```bash
cd mobile
npm ci
npx expo run:android          # fejlesztői build eszközre vagy emulátorra
npx expo prebuild --platform android && (cd android && ./gradlew assembleRelease)
```

## Ellenőrzés

```bash
npm run typecheck
npm test
```

A tesztek a szimuláció golden idővonalait (PRD 7.13), a determinizmust, az alvást, a napközit, a Nagyi-, halál- és öröklési szabályokat, a szabadság kereteit és az értesítési terv korlátait ellenőrzik.

## Ami benne van

| Terület | Állapot |
|---|---|
| Szimuláció (`src/sim`) | Determinisztikus, percrácsos, I/O nélküli TypeScript modul; később közös csomagba emelhető (PRD 13.3) |
| Életciklus | Tojás, bébi, gyerek, kamasz, 7 felnőtt forma, idős kor, természetes halál, generációk, öröklődés |
| Módok | Alap (Nagyi, nincs elhanyagolásos halál) és Klasszikus (valódi halál 12 számlálható óra kritikus állapot után); visszalépés Alapra bármikor |
| Távollét | Szabadság (módonkénti kerettel), napközi, utólagos számítás, visszatérési összefoglaló |
| Értesítések | Helyi, a szimuláció előrejelzéséből; legfeljebb 8 függő, csendes órák, napi keret, kategóriánként kapcsolható; pontos riasztást nem kér |
| Felület | Onboarding, főképernyő LCD-stílusban, két minijáték és simogatás, emlékkert családfával, beállítások, adatexport és törlés |
| Akadálymentesség | Felolvasható állapotleírás, legalább 48 dp érintési célterület, csökkentett mozgás tiszteletben tartása |

## Ami szándékosan hiányzik (későbbi lépés a PRD szerint)

- **Szerver-autoritatív idő és szinkron** (PRD 13.4-13.7): az óra most a telefoné, ezért az előreállítás csalásra alkalmas; visszaállításnál a szimuláció egyszerűen megáll.
- **Szerverpush tartalék** (FR-22), fiók és összekapcsolás (FR-33-35).
- **Próbaidő, Teljes verzió, kozmetikumok** (PRD 10): ebben a buildben minden funkció ingyenesen elérhető.
- **Widgetek** (FR-24-25), angol lokalizáció (FR-37), analitika (FR-42).

## Prototípus: időgyorsítás

A Beállításokban ×10 és ×60 gyorsítás kapcsolható (PRD 7.16: csak tesztelésre). Így egy teljes élet néhány óra alatt bejárható. A játékidő a visszakapcsolás után sem ugrik vissza.
