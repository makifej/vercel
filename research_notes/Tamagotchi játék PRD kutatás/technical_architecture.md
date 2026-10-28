# Technical Architecture: Native Mobile Real-Time Virtual Pet (iOS + Android), as of October 2026

_Sourcing note (2026-10-28): In this research session, vercel.com, upstash.com, ai.google.dev, expo.dev and docs.expo.dev could not be fetched directly (blocked by the session's network allowlist). Figures for those vendors come from search-engine summaries of their official pages plus third-party aggregators. Each one is marked "(via search summary)" and should be re-checked on the live page before it goes into a PRD. developer.apple.com (the `.md` doc variants) and developer.android.com were fetched directly and are quoted verbatim where possible._

_Existing backend context, read from the repo (`/home/user/vercel/api/index.ts`, `package.json`, `vercel.json`): Express 5 + TypeScript in a single Vercel function behind a catch-all rewrite to `/api`. It calls Upstash Redis through the REST API with axios (`INCR`/`EXPIRE`/`SET NX`/`GET`), accepting either `KV_REST_API_*` or `UPSTASH_REDIS_REST_*` env vars. It calls Gemini through raw REST `generateContent`; the default model is `gemini-2.5-flash` and it is env-overridable via `GEMINI_MODEL`. Promo codes are claimed atomically with `SET NX promo:used:<code>`, and the 7-day trial is keyed as `trial:start:<device fingerprint>`._

---

## 1. Simulation model: real-time decay while the app is closed, clocks/time zones, anti time-travel

### Takeaway
Both platforms forbid background ticks (see §4), so the industry pattern is lazy, deterministic catch-up: store `(state, lastUpdatedAt)`, compute `state(now)` analytically on open, and cap and validate the elapsed time. For a pet that can die, the authoritative `now` should be server time. The device clock is only an offline fallback, guarded by monotonic-clock jump detection and clamping.

### Cited Findings
- Offline earnings in idle and clicker games are normally computed from elapsed time, and the device clock is the obvious but untrusted source because players can change it freely — [bugnet.io: idle offline progress](https://bugnet.io/blog/how-to-fix-idle-game-offline-progress-wrong); [bugnet.io: clicker bug tracking](https://bugnet.io/blog/bug-tracking-for-clicker-and-tap-games)
- Standard mitigations from developer write-ups (not authoritative engineering references):
  - get the timestamp from a server rather than the device ([Unity Discussions](https://discussions.unity.com/t/simple-anti-time-cheating-on-android-ios/674418))
  - compare a monotonic timer against wall-clock changes to detect jumps, and defer rewards while offline ([bugnet.io: daily reward rewind](https://bugnet.io/blog/how-to-fix-daily-reward-claimed-repeatedly-by-rewinding-clock))
  - cap the maximum offline duration ([bugnet.io](https://bugnet.io/blog/how-to-fix-idle-game-offline-progress-wrong))
- Offline-first games such as Candy Crush-style "lives" systems knowingly accept device-time cheating as "a compromise they had to make for the game to work offline" — [Unity Discussions](https://discussions.unity.com/t/how-can-i-detect-the-passage-of-time-even-when-the-game-is-closed/1692831); [LootLocker lives system](https://lootlocker.com/blog/how-to-create-a-simple-lives-system)
- Server-tethered idle games can only approximate offline progress with a delta calculation on reopen — [HostedGG](https://hostedgg.com/blog/signaldecay-offline-first-idle-games)
- Animal Crossing: New Horizons runs in real time, one in-game day equals one real day, and it reads the Switch's system clock and calendar, so changing the console date changes the in-game date ("time travel"). Nintendo tolerates this rather than blocking it — [How-To Geek](https://www.howtogeek.com/664199/how-to-time-travel-in-animal-crossing-new-horizons); [Animal Crossing World](https://animalcrossingworld.com/2020/03/yes-you-can-time-travel-and-change-the-clock-in-animal-crossing-new-horizons/)
- One (low-quality) source states that the town is updated when the game is loaded, not while the console sleeps, which is the lazy catch-up pattern — [worldcoffeeresearch FAQ page](https://support.worldcoffeeresearch.org/excel-index/can-you-play-animal-crossing-offline)
- Neko Atsume trusts the device clock. A widely published tip is to set the phone clock back a few hours so the game "adds a few more hours onto the food depletion time" — [TechRadar](https://www.techradar.com/how-to/gaming/neko-atsume-tips-and-tricks-1318716)
- Apple's own WidgetKit documentation uses a game example with this exact model: health recovers at 25%/hour, and the provider precomputes future timeline entries from current state plus rate. That shows analytic projection is the platform-endorsed approach for "stat changes over time" — [Apple: Keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)
- Play Integrity (Android) and App Attest (iOS) can verify that requests come from a genuine app on a certified device. Google says to use them "alongside other signals… not as your sole anti-abuse mechanism", to request verdicts close to the protected action, and to use server-issued one-time nonces against replay — [Android: Play Integrity overview](https://developer.android.com/google/play/integrity/overview); [Android codelab](https://developer.android.com/codelabs/add-play-integrity?hl=en)
- Expo ships an `app-integrity` module (in docs for SDK 57/58) that wraps Play Integrity on Android and App Attest on iOS, with a server one-time challenge against replay — [Expo docs: app-integrity](https://docs.expo.dev/versions/latest/sdk/app-integrity/) (via search summary)
- Firebase App Check can front DeviceCheck/App Attest, subject to Apple-imposed quotas — [Firebase App Check](https://firebase.google.com/docs/app-check)

### Inferences
- **Recommended model: an event-sourced snapshot plus a closed-form projection.** Per pet, store `{hunger, happiness, energy, hygiene, health, stage, lastTs (server epoch ms), rngSeed, tz}`. Each stat follows a piecewise-linear (or exponential) decay function `f(stat0, rate, dt, modifiers)`. Modifiers include sleep windows (lower decay at night in the user's local time zone), sickness thresholds and the death condition, for example health at 0 continuously for more than X hours. Compute `projected = simulate(snapshot, now)` with a deterministic function written once in TypeScript and shared between the RN client and the Express backend. This is a strong argument for a TS client (see §2).
- **Closed form beats a fixed tick loop.** Because decay is analytic, the client can also solve for future threshold times ("hungry at T1", "sick at T2", "dies at T3"). Those times feed local notification scheduling (§3), widget timelines (§5) and server push scheduling (§6) from the same function. If the simulation needs randomness (random events or illness), use a seeded PRNG keyed by `(petId, hourBucket)` so client and server agree.
- **Server-authoritative time.** Every mutating action (feed, clean, play, medicine) goes to the backend. The server stamps it with its own `Date.now()`, applies `simulate(snapshot, serverNow)` and then the action, and returns the new snapshot and `serverNow`. The client stores `serverOffset = serverNow - deviceNow` and the monotonic time at that sync. Offline, the client estimates `now = lastServerNow + (monotonicNow - monotonicAtSync)`.
  - On Android, `SystemClock.elapsedRealtime()` includes deep sleep and is monotonic. On iOS, the equivalent is a continuous clock (`mach_continuous_time`, `ContinuousClock`). Both reset on reboot, so after a reboot fall back to the wall clock and flag the result as untrusted. These API semantics are general knowledge; the Android reference page could not be read in full this session, so verify them.
- **Offline-action policy.** Option A: allow actions offline optimistically, queue them with monotonic-derived timestamps, and have the server re-validate them on sync. Reject or clamp any action timestamp earlier than `lastServerTs` or later than `serverNow`. Option B (simpler): require connectivity for care actions and show read-only projected state offline. For a 1–2 person team, Option B plus a short grace period is far less error-prone.
- **Clamp and soften.** Cap catch-up, for example at most 72 h of simulated neglect per sync, and/or add a "pet ran away / went to grandma's" state instead of irreversible death when the gap is very long. This limits both cheating payoff and harsh outcomes caused by real-world clock bugs.
- **Clock-jump detection.** On each foreground, compare `Δwall` against `Δmonotonic`. If `|Δwall − Δmonotonic| > 5 min` and the boot session is the same, treat it as manipulation and discard the local projection in favor of server time.
- **Time zones and DST.** Keep all simulation math in UTC epoch milliseconds. Store the user's IANA time zone (e.g., `Europe/Budapest`) server-side and use it only for calendar concepts: the daily care window, sleep hours, quiet hours, and "daily streak" boundaries. Re-read the TZ on each app open so travel is handled, and compute day boundaries with a TZ-aware library so DST days of 23 or 25 hours do not double- or skip-decay.
- **Anti-cheat tiering.** Clock tampering is the main threat for a single-player pet. Server time removes most of it, so App Attest / Play Integrity is only worth adding later if there are leaderboards, trading, or paid currency at stake.

### Gaps
- No primary GDC talk or official engineering blog on Tamagotchi, Neko Atsume, or Animal Crossing time handling was found. The evidence is fan, press and developer-forum material.
- Apple's and Google's exact monotonic-clock API docs (iOS `ContinuousClock`/`mach_continuous_time`; Android `SystemClock`) were not verified this session: the Android reference fetch was truncated and Apple's was not attempted.
- No quantitative data found on how many players cheat with device time in casual pet games.

---

## 2. Client framework comparison (Expo/React Native, Flutter, native, Unity, Godot) for this use case in 2026

### Takeaway
For a 1–2 person team that already writes TypeScript, React Native with Expo (SDK 58, React Native 0.88, released October 2026) is the strongest fit. It shares the simulation and validation code with the Express backend, has first-party iOS widgets and Live Activities (`expo-widgets`, stable since SDK 56), and mature notification, IAP and integrity modules. Flutter is a close second for graphics-heavy pixel art but forces Dart and still needs native widget code. Unity and Godot are overkill for a mostly-2D UI-driven pet and weak at widgets, notifications and other OS integrations.

### Cited Findings
- **Expo version timeline** (via search summaries of expo.dev changelog pages):
  - SDK 55 shipped React Native 0.83 and React 19.2, removed the Legacy Architecture entirely, and aligned all Expo package majors to the SDK version — [Expo changelog SDK 55](https://expo.dev/changelog/sdk-55); [Expo: upgrading to SDK 55](https://expo.dev/blog/upgrading-to-sdk-55)
  - SDK 56 moved to RN 0.85; SDK 57 moved to RN 0.86 with React 19.2 — [Expo SDK 56 beta](https://expo.dev/changelog/sdk-56-beta); [Expo changelog SDK 57](https://expo.dev/changelog/sdk-57)
  - SDK 58 beta was announced 2026-09-15 on an RN 0.88 release candidate. An Expo blog post dated 2026-10-21 says "SDK 58 is out" with iOS 27 support and React Native 0.88 — [Expo SDK 58 beta](https://expo.dev/changelog/sdk-58-beta); [Expo: How to upgrade to SDK 58](https://expo.dev/blog/how-to-upgrade-to-sdk-58). **Flag: very recent. Check the exact stable date and native module compatibility before committing.**
- **`expo-widgets`** builds iOS home-screen widgets and Live Activities with Expo UI components and no hand-written native code. A config plugin generates the Widget Extension target and App Group at prebuild, and React Native is not involved in rendering the widget. It went alpha in March 2026 and is stable from SDK 56 (Expo post, June 2026). It does not run in Expo Go, so a development build is needed. Widgets can include buttons and toggles on iOS 17+ — [Expo blog: home screen widgets and Live Activities in Expo](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo); [Expo docs: widgets](https://docs.expo.dev/versions/latest/sdk/widgets/); [Expo: Live Activities end-to-end](https://expo.dev/blog/live-activities-with-expo-end-to-end-client-and-backend) (via search summary)
- **Flutter.** Quarterly stable cadence in 2026: 3.41 (Feb), 3.44 (May), 3.47 (Aug), 3.50 targeted for November 2026 — [Flutter SDK archive](https://docs.flutter.dev/install/archive). A third-party source says 3.47 reached stable on 2026-08-12 — [Ecorpit](https://ecorpit.com/flutter-app-development-company/). The Flutter roadmap lists completing the Impeller migration on Android as a 2026 goal — [Flutter roadmap](https://flutter.googlesource.com/mirrors/flutter/+/02c6c7593e75ca6d0a6c6150155ec2ec8fce5c94/docs/roadmap/Roadmap.md)
- **Flutter widgets.** `home_widget` (latest 0.9.1, April 2026) does not let you write widgets in Flutter: "It still requires writing the Widgets with native code", with shared storage via UserDefaults/SharedPreferences. `home_widget_generator` offers a Dart DSL, and `widgets_kit` can render a Flutter widget to an image — [FlutterGems: home_widget](https://fluttergems.dev/packages/home_widget/); [Google codelab: Flutter home screen widgets](https://codelabs.developers.google.com/flutter-home-screen-widgets); [pub.dev widgets_kit](https://pub.dev/packages/widgets_kit)
- **Unity.** The per-install Runtime Fee announced in Sept 2023 was cancelled in Sept 2024 and remains cancelled for Unity 6. Personal stays free below about $200K trailing revenue, and Pro is reported at $2,310/seat/year after a Jan 2025 increase (third-party; verify on unity.com) — [StraySpark](https://www.strayspark.studio/blog/unity-engine-2026-state-comeback-runtime-fee-aftermath); [Tech Insider](https://tech-insider.org/godot-vs-unity-engine-2026/)
- **Godot** is MIT-licensed with no royalties or revenue caps. Sources disagree on the current 4.x minor version — [GamineAI](https://gamineai.com/blog/unity-6-1-vs-godot-4-3-which-engine-won-2026-indie-devs)
- **RevenueCat** is free until $2,500 Monthly Tracked Revenue (MTR, which includes non-subscription purchases), then 1% of MTR. The official example: $2,600 MTR → $26 — [RevenueCat docs: account management](https://www.revenuecat.com/docs/welcome/set-up-revenuecat/account-management); [RevenueCat: why RevenueCat](https://www.revenuecat.com/why-revenuecat.md). Third-party sites instead claim 1% of only the excess over $2,500 — [Costbench](https://costbench.com/software/subscription-billing/revenuecat/). Official wording wins.
- **iOS Live Activities and widgets require WidgetKit/SwiftUI in a widget extension** regardless of the app framework. React Native or Flutter only supply data — [Apple: Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)

### Inferences
- **Decision matrix (1–2 devs, TS backend, 2D pixel pet, widgets, notifications, IAP):**

  | Criterion | Expo/RN | Flutter | Native Swift+Kotlin | Unity | Godot |
  |---|---|---|---|---|---|
  | TS sharing with the Express backend | ✅ full (sim, types, zod schemas) | ❌ Dart | ❌ | ❌ C# | ❌ GDScript/C# |
  | Codebases | 1 | 1 | 2 | 1 | 1 |
  | iOS widgets / Live Activities | ✅ `expo-widgets` (stable SDK 56+) | ⚠️ native Swift + `home_widget` bridge | ✅ best | ⚠️ native plugin | ⚠️ native plugin |
  | Android widgets | ⚠️ no first-party Expo module found; third-party or native Glance | ⚠️ native Kotlin/Glance + `home_widget` | ✅ Glance | ⚠️ | ⚠️ |
  | 2D sprite animation | ✅ adequate (sprite sheets via Reanimated/Skia) | ✅ strong (Flame, Impeller) | ✅ SpriteKit / Compose Canvas | ✅ best tooling | ✅ strong |
  | Notifications / IAP / integrity modules | ✅ expo-notifications, RevenueCat RN SDK, expo app-integrity | ✅ flutter_local_notifications, RevenueCat Flutter | ✅ | ⚠️ plugins | ⚠️ plugins |
  | OTA JS updates for balancing | ✅ EAS Update | ⚠️ (Shorebird, third-party) | ❌ | ❌ | ❌ |
  | Licensing | free | free | free | Personal free under ~$200K | MIT |

- A Tamagotchi is mostly UI: stats bars, buttons, menus, and a single animated sprite. Game-engine strengths (physics, scene graphs) are unused, while OS-integration weaknesses (widgets, Live Activities, notifications, background) dominate. That favors RN/Flutter/native over Unity/Godot.
- **Recommended stack:** Expo SDK 58 (or 57 if 58-compatible libraries lag), plus:
  - `expo-notifications` for local notifications and push tokens
  - `expo-widgets` for iOS widgets and Live Activities
  - a small native Kotlin Glance module via an Expo config plugin or Expo Modules API for the Android widget
  - `react-native-purchases` (RevenueCat)
  - a shared `@pet/sim` TS package consumed by both the app and `/api`
  - pixel art rendered from sprite sheets with nearest-neighbor scaling.
- The widget extension cannot run RN or Flutter. The pet's appearance in the widget must therefore come from pre-rendered images or SwiftUI/Glance drawing, plus timeline entries computed from the shared sim and written into the App Group or SharedPreferences.

### Gaps
- I could not verify the exact Expo SDK 58 stable release date, or whether `expo-widgets` gained Android support. No Android support was found, so assume iOS-only.
- No 2026 primary source was found on Flame engine versions or on RN sprite-animation performance (react-native-skia / Reanimated).
- Unity and Godot pricing and versions come from third-party blogs only.
- The App Store / Play Billing fee structure (15% Small Business Program, etc.) was not researched in this pass.

---

## 3. Notifications: local vs remote push, platform limits, permissions, interruption levels, quiet hours

### Takeaway
Use local notifications as the primary channel. They are free, work offline, and their fire times come straight from the deterministic sim. Schedule only the next few threshold events and re-plan on every app open or sync. Add server push (APNs/FCM, optionally through Expo Push) as a backstop for the "about to die" alert and for multi-device consistency.
- iOS keeps only the 64 soonest-firing pending requests.
- Android 13+ needs the POST_NOTIFICATIONS runtime permission.
- A virtual pet game will not qualify for USE_EXACT_ALARM on Google Play and should not depend on SCHEDULE_EXACT_ALARM. Design for roughly ±1 hour Android delivery slack.

### Cited Findings
- **iOS cap:** "An app can have only a limited number of scheduled notifications; the system keeps the soonest-firing 64 notifications (with automatically rescheduled notifications counting as a single notification) and discards the rest." — [Apple: UILocalNotification](https://developer.apple.com/documentation/uikit/uilocalnotification). An Apple engineer confirmed the 64 cap for pending `UNNotificationRequest`s per app and said there is no workaround — [Apple Developer Forums 811171](https://developer.apple.com/forums/thread/811171); [Apple Developer Forums 765490](https://developer.apple.com/forums/thread/765490). Discarding is silent, with no log or warning — [Apple Developer Forums 682509](https://developer.apple.com/forums/thread/682509)
- **iOS time-sensitive:** requires the Time Sensitive Notifications capability/entitlement plus `interruption-level: time-sensitive` in the payload (`UNNotificationInterruptionLevel.timeSensitive` for local). It breaks through Focus and the Scheduled Summary only if the user allows it, and the user can revoke it per app — [Apple Developer Forums 683630](https://developer.apple.com/forums/thread/683630); [Marigold: iOS interruption levels](https://sdkdevelopers.meetmarigold.com/docs/ios-interruption-levels); [Batch: iOS 15 time sensitive](https://help.batch.com/en/articles/5543431-understanding-and-managing-ios-15-time-sensitive-interruption-level)
- **Android 13+ POST_NOTIFICATIONS:** notifications are off by default for new installs. Apps targeting SDK 33+ choose when to show the prompt. Apps targeting 12L or lower get an automatic prompt, and if the user taps "Don't allow" even once they are not prompted again until reinstall or a retarget. Google recommends delaying the prompt until the user has context, showing a rationale when `shouldShowRequestPermissionRationale()` is true, and checking `areNotificationsEnabled()` — [Android: Notification runtime permission](https://developer.android.com/develop/ui/views/notifications/notification-permission)
- **Android exact alarms** — [Android: Schedule alarms](https://developer.android.com/develop/background-work/services/alarms/schedule):
  - Android 12+ requires an "Alarms & reminders" permission for exact alarms, or `SecurityException` is thrown.
  - On Android 13+ the options are `SCHEDULE_EXACT_ALARM` (user-granted, revocable) or `USE_EXACT_ALARM` (auto-granted, not revocable, "limited" use cases, subject to Play policy).
  - On Android 14, `SCHEDULE_EXACT_ALARM` is not pre-granted to fresh installs of apps targeting 13+, and it is denied after backup-restore to a new device.
  - Check `canScheduleExactAlarms()` first and listen for `ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED`.
- **Google Play policy:** `USE_EXACT_ALARM` is limited to alarm/clock apps and calendar apps that notify upcoming events. Releases that declare it without qualifying are halted, which is a common failure when a library injects the permission — [Android: Schedule alarms](https://developer.android.com/training/scheduling/alarms); [Esper](https://www.esper.io/blog/android-13-exact-alarm-api-restrictions); [TechNetExperts](https://www.technetexperts.com/android-play-store-permissions/) (secondary for the declaration-form details)
- **Android inexact alarms:** `set()`, `setInexactRepeating()` and `setAndAllowWhileIdle()` never fire early and on Android 12+ fire "within one hour of the trigger time unless battery saver or Doze is in effect". The minimum window for `setWindow()` is 10 minutes. Alarms are cleared on reboot, so re-register them on `BOOT_COMPLETED` — [Android: Schedule alarms](https://developer.android.com/develop/background-work/services/alarms/schedule)
- "Neither setAndAllowWhileIdle() nor setExactAndAllowWhileIdle() can fire alarms more than once per nine minutes, per app." `setAlarmClock()` alarms fire normally in Doze — [Android: Doze and App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby)
- **FCM in Doze:** FCM is the recommended way to reach the app. `RemoteNotification` messages (user-visible) are delivered in Doze/Standby with temporary network access, while `BackgroundSync` data messages "may be delayed or throttled" — [Android: Doze and App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby)
- **Expo Push Service** always uses FCM HTTP v1 since 2024-06-20 — [Expo blog: migrating to FCM v1](https://expo.dev/blog/expo-push-notifications-migrating-to-fcm-v1). Expo recommends at most 100 messages per request and says it has no SLA — [Expo docs: sending notifications](https://docs.expo.dev/push-notifications/sending-notifications); [Expo forums](https://forums.expo.dev/t/push-notifications-limits/9945) (via search summary)
- The FCM default quota is reportedly 600,000 requests/minute per Firebase project (third-party) — [Batch blog](https://batch.com/blog/posts/android-push-updates-fcm-api); [Netcore docs](https://cedocs.netcorecloud.com/docs/migrate-to-http-v1-api)
- **expo-notifications triggers:** the date trigger form is `{ type: 'date', date }`, and the bare-Date form is deprecated — [unpkg expo-notifications 57.0.3 source](https://app.unpkg.com/expo-notifications@57.0.3/files/src/scheduleNotificationAsync.ts)

### Inferences
- **Notification plan per pet** (comfortably under iOS's 64):
  - at most 3–6 local notifications for the next 24–48 h, e.g. "hungry", "very hungry", "sick", "critical (time-sensitive)", "morning check-in", taken from the analytic threshold times
  - cancel and recompute them all on every state change
  - drop or shift any that fall inside the user's local quiet hours (e.g., 22:00–08:00), except an optional critical alert if the user opted in
- **Death rule must tolerate Android slack.** Inexact alarms can be up to about 1 h late, or deferred further in Doze. Make the grace period between "critical" and "dead" at least 2–4 h so a late notification is never the reason a pet died.
- **Server push backstop.** The server knows each pet's `criticalAt` time (stored in a Redis sorted set). A scheduler (§6) sends one APNs/FCM push if the user hasn't synced since. This covers users who disabled local scheduling, reinstalled, or switched devices.
- **Permission UX.** Ask for notification permission after the first care loop ("I'll tell you when Pixel gets hungry"), not at launch. On Android, target the latest SDK so the app controls prompt timing.
- **Do not declare `USE_EXACT_ALARM`.** Make sure no library adds `SCHEDULE_EXACT_ALARM` unintentionally. Audit the merged manifest.
- `setAlarmClock()` is exempt from Doze, but it shows an alarm-clock icon and is semantically for user-set alarms. Using it for a pet game would be a policy and UX risk.

### Gaps
- I could not verify from Expo's own docs whether `expo-notifications` date triggers use exact or inexact alarms on Android, or whether it adds `SCHEDULE_EXACT_ALARM` automatically. docs.expo.dev was unreachable. Check the merged AndroidManifest in a dev build.
- No official Expo Push Service rate limit or free quota was found. A "1M notifications/month" free claim appeared only on a third-party listing ([Rhumb](https://rhumb.dev/service/expo-notifications)) and is unverified.
- The current Apple App Review rules on notification use for marketing (guideline 4.5.4) were not re-checked.

---

## 4. Background execution limits (iOS BGTaskScheduler, Android WorkManager/Doze): why background ticks are not viable

### Takeaway
Neither OS gives a closed app predictable periodic CPU time:
- **iOS:** `BGAppRefreshTask` gets roughly 30 s at times the system chooses, possibly never.
- **Android:** WorkManager's floor is 15 minutes and is not exact, and Doze defers jobs, alarms and network.

The simulation therefore has to be lazy and deterministic (§1). Background capacity should only be used for opportunistic refreshes such as widget updates and notification re-plans.

### Cited Findings
- **iOS `BGAppRefreshTask`:** about 30 seconds of runtime. `earliestBeginDate` is only a lower bound, and the system may run the task later or never, based on learned usage patterns. `BGProcessingTask` gives minutes, typically overnight while charging — [WWDC19 707 notes](https://wwdcnotes.com/documentation/wwdc19-707-advances-in-app-background-execution/); [Mert Bulan: don't rely on BGAppRefreshTask](https://mertbulan.com/dont-rely-on-bgapprefreshtask-for-your-apps-business-logic/) (secondary; Apple's BackgroundTasks docs not fetched)
- **WorkManager:** "The minimum repeat interval that can be defined is 15 minutes (same as the JobScheduler API)… The exact time that the worker is going to be executed depends on the constraints… and on the optimizations performed by the system." Constraint failures can delay or skip runs. Expedited work is subject to a per-app quota based on standby bucket — [Android: Define work requests](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work)
- **Doze:** suspends network, ignores wake locks, defers `setExact()`/`setWindow()` alarms to maintenance windows, and stops JobScheduler and therefore WorkManager. Maintenance windows become less frequent over time. In App Standby, idle apps get network access "about once a day" — [Android: Doze and App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby)
- Google Play prohibits requesting a battery-optimization exemption "unless the core function of the app is adversely affected", and even exempt apps don't get regular alarms during Doze — [Android: Doze and App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby)

### Inferences
- A Tamagotchi's "tick" should never run on device. Use background windows (BGAppRefresh, WorkManager) only to:
  1. re-pull server state when it may have changed on another device
  2. refresh the widget timeline
  3. re-plan local notifications

  The game must be correct even if none of these ever run.
- Silent/background pushes (iOS `content-available`, Android data messages) are also throttled or deferred (BackgroundSync), so they cannot be used as server ticks either. Only user-visible pushes are reliable.

### Gaps
- The official Apple BackgroundTasks page was not fetched. The 30-s figure comes from WWDC notes and developer write-ups, not a current Apple doc quote.
- Android App Standby Bucket quotas (Active/Working set/Frequent/Rare/Restricted job and alarm limits) were not collected numerically.

---

## 5. Home-screen widgets, Live Activities, watch complications (the modern "keychain")

### Takeaway
Widgets are the closest modern equivalent of the Tamagotchi keychain. Because the sim is deterministic, the widget does not need live data:
- **iOS:** precompute a 24 h WidgetKit timeline from the sim. A frequently viewed widget gets about 40–70 reloads a day, and app-in-foreground and button-intent reloads are free.
- **Android:** Glance widgets with a 30-minute minimum periodic update.
- **Live Activities** fit only bounded sessions, up to 8 h active and 12 h on the Lock Screen.
- **Watch:** complications are WidgetKit accessory widgets on watchOS, and "Wear Widgets" (Glance + Remote Compose) on Wear OS 7.

### Cited Findings
- **WidgetKit budget:** "For a widget the user frequently views, a daily budget typically includes from 40 to 70 refreshes. This rate roughly translates to widget reloads every 15 to 60 minutes." The budget is per widget instance over a 24 h window tuned to user patterns. Timeline entries should be "at least about 5 minutes apart" — [Apple: Keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)
- **Budget-exempt reloads** include: the containing app in the foreground, the widget performing an App Intent (button or toggle tap), animations, and locale or accessibility changes. Reload policies are `.atEnd`, `.after(date)` and `.never`, plus `WidgetCenter.reloadTimelines(ofKind:)`. "Displaying dynamic dates" gives live countdowns without reloads, and WidgetKit push notifications are an additional update path — [Apple: Keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)
- Apple warns that `.after(date)` with server fetches can synchronize load spikes across devices — [Apple: Keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)
- **Live Activities** — [Apple: Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities):
  - "A Live Activity can be active for up to eight hours… remains on the Lock Screen… for up to four additional hours… maximum of 12 hours."
  - Static plus dynamic data cannot exceed 4 KB.
  - Live Activities cannot access the network; updates come from the app or ActivityKit push notifications.
  - Starting one normally requires the app in the foreground, or a `LiveActivityIntent`.
  - Buttons and toggles work via App Intents.
  - The device limits how many can be active at once.
- **Android widgets:** `updatePeriodMillis` "doesn't support values of less than 30 minutes". For more frequent or configurable updates, set it to 0 and use WorkManager, with "similar power restrictions". Broadcast receivers have a 10 s limit. Android 17 (API 37) imposes a bitmap memory limit on partial updates. Glance is the Compose-style widget API — [Android: Advanced app widgets](https://developer.android.com/develop/ui/views/appwidgets/advanced)
- **watchOS:** accessory widgets are WidgetKit content shown on the Lock Screen and as Apple Watch complications, and Apple recommends migrating from ClockKit to WidgetKit complications — [Apple: Creating accessory widgets and watch complications](https://developer.apple.com/documentation/widgetkit/creating-accessory-widgets-and-watch-complications); [WWDC22 10050](https://developer.apple.com/wwdc22/10050)
- **Wear OS:** at Google I/O 2026, Tiles were renamed "Wear Widgets" for Wear OS 7, powered by Jetpack Glance + Remote Compose, in sizes 2×1 and 2×2, backward compatible to Wear OS 4+ — [Android: Wear Widgets](https://developer.android.com/training/wearables/widgets); [9to5Google 2026-05-22](https://9to5google.com/2026/05/22/google-explains-new-wear-os-widgets/); [Android Authority](https://www.androidauthority.com/google-wear-os-7-wear-widgets-early-partners-availability-features-3670112/)
- **Framework support:**
  - Expo: `expo-widgets` (iOS widgets and Live Activities, config-plugin-generated extension and App Group; stable SDK 56+) — [Expo blog](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo) (via search summary)
  - Flutter: `home_widget` bridges data, but widgets themselves are native — [FlutterGems](https://fluttergems.dev/packages/home_widget/)

### Inferences
- **iOS widget design.** On each sync, write `{snapshot, lastTs, spriteState}` to the App Group. The TimelineProvider (or `expo-widgets` equivalent) generates entries every 30–60 min for the next 24 h from the same decay formulas, with `.atEnd` reload. That costs about 1 reload/day of budget plus free reloads whenever the app is foregrounded. Interactive "Feed" and "Pet" buttons (iOS 17+) run App Intents, which are budget-exempt, but they must reach the server or queue the action for the server-authoritative model.
- **Android widget.** Glance widget with `updatePeriodMillis` = 30 min or a WorkManager 30–60 min periodic job, computing state locally from the cached snapshot. This needs a Kotlin port of the sim formulas, or keep formulas data-driven (rates in JSON) so the logic stays tiny.
- **Live Activity use cases:** "Pet is sick: give medicine within 6 h" or "Pet is sleeping until 07:30" (with a dynamic-date countdown). Do not use one for permanent 24/7 status, because the system ends them after 8 h.
- **Watch complications** are a nice v2 feature. WidgetKit accessory families reuse the iOS widget code; Wear Widgets need separate Glance code.

### Gaps
- No first-party Expo Android-widget module was found. Third-party options (e.g., `react-native-android-widget`) were not verified.
- The WidgetKit push budget/limits for "Updating widgets with WidgetKit push notifications" were not fetched.
- No data found on Wear OS 7 release timing ("no confirmed release date" per press).

---

## 6. Backend: Vercel limits and pricing, Upstash Redis and QStash, Redis vs Postgres, push-scheduling options

### Takeaway
The existing Vercel + Upstash stack is adequate and very cheap for a pet game, since each user action is one short request doing a few Redis commands. The constraints are:
- **Hobby is not suitable for production.** Its crons run at most once per day with roughly 1 h imprecision, and it is generally restricted to non-commercial use (unverified this session).
- **Pro ($20/month incl. $20 usage credit)** allows per-minute crons.
- **Upstash Redis free:** 256 MB / 500K commands per month. Pay-as-you-go: $0.20 per 100K commands.
- **QStash free:** about 1,000 messages/day; pay-as-you-go $1 per 100K.

Redis is fine for the hot pet state. Add Postgres (Neon free: 0.5 GB, 100 CU-h) only for relational or analytical data: purchases ledger, social graph, history.

### Cited Findings
- **Vercel Cron:** Hobby is "limited to cron jobs that run once per day. Cron expressions that would run more frequently will fail during deployment", and a 1 am job may fire anytime 1:00–1:59 am. Pro supports per-minute schedules. The page was last updated 2026-01-28 — [Vercel docs: Cron usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) (via search summary)
  - Job-count limits conflict: several 2026 sources say 100 per project on all plans since Jan 2026, while older copies list Hobby 2 / Pro 40 — [Crontap](https://crontap.com/blog/vercel-cron-hourly-limit-and-how-to-beat-it); [RunHooks](https://runhooks.app/blog/vercel-hobby-cron-job-limits-explained/); [Vercel limits](https://vercel.com/docs/limits). **Unresolved; verify.**
- **Vercel Functions (Fluid compute):**
  - Hobby: default = max = 300 s
  - Pro: default 300 s, max 800 s, with an extended beta up to 1,800 s for supported Node/Python versions
  - Enterprise: same as Pro

  Sources: [Vercel docs: Fluid compute](https://vercel.com/docs/fluid-compute); [Vercel docs: Functions limitations](https://vercel.com/docs/functions/limitations); [Vercel changelog: higher defaults with Fluid](https://vercel.com/changelog/higher-defaults-and-limits-for-vercel-functions-running-fluid-compute) (via search summary)
- **Vercel plan allowances:**
  - Hobby includes 100 GB Fast Data Transfer, 1M function invocations, 4 h Active CPU and 360 GB-h provisioned memory per month. Hitting a limit pauses the project until next month or an upgrade, and extra usage cannot be bought.
  - Pro is $20/month per deploying seat including $20 usage credit. Overage is about $0.60 per 1M invocations, and Active CPU about $0.128/h (region-dependent up to about $0.221/h).
  - Pro's included Active CPU is disputed (16 h vs 40 h).

  Sources: [Vercel Hobby plan docs](https://examples.vercel.com/docs/plans/hobby); [MakerKit: Vercel cost 2026](https://makerkit.dev/blog/saas/vercel-cost); [Schematic](https://schematichq.com/blog/vercel-pricing); [temps.sh](https://temps.sh/blog/vercel-pricing-2026-pro-plan-explained) (mostly third-party; verify on vercel.com/pricing)
- **Upstash Redis:**
  - Free: 256 MB data, 500K commands/month, 1 free database per account
  - Pay-as-you-go: $0.20 per 100K requests; first 200 GB bandwidth free, then $0.03/GB
  - Fixed plans: $10–$1,500/month
  - An older free tier of 10K commands/day has been superseded

  Sources: [Upstash docs: Redis pricing](https://upstash.com/docs/redis/overall/pricing); [Upstash pricing: Redis](https://upstash.com/pricing/redis); [Upstash blog: new pricing](https://upstash.com/blog/redis-new-pricing) (via search summary)
- **Upstash QStash:**
  - Free: 1,000 messages/day (raised from 500; one Upstash page still shows 500), 1 MB max message, 50 GB bandwidth
  - Pay-as-you-go: $1 per 100K messages
  - Fixed: from $180/month for 1M/day (conflicting $80 figure on an aggregator)
  - Free-tier "10 active schedules" and "7-day max delay" appear only on third-party trackers

  Sources: [Upstash pricing: QStash](https://upstash.com/pricing/qstash); [Upstash blog: QStash Q&A](https://upstash.com/blog/qstash-qa); [AgentDeals](https://agentdeals.dev/vendor/qstash) (via search summary)
- **Neon free plan:** $0, 100 projects, 100 CU-hours compute per project per month, 0.5 GB storage per project, 5 GB egress per project per month. Compute scales to zero after 5 min idle, and exceeding a limit suspends compute until the next month. Some pages cite 50 CU-h or 1 GB, so use the official docs figures — [Neon docs: plans](https://neon.com/docs/introduction/plans); [Neon pricing](https://neon.com/pricing); [Neon FAQ: free plan limits](https://neon.com/faqs/free-plan-limits-and-quotas)
- **Supabase free:** 2 projects, 500 MB DB per project, projects pause after inactivity and can be restored within 90 days (third-party only) — [Neon FAQ comparison](https://neon.com/faqs/managed-postgres-databases-free-tier)
- The existing backend already accepts Vercel-Marketplace-injected `KV_REST_API_URL/TOKEN` (Vercel KV is now Upstash) and uses atomic `SET NX` for promo codes — [repo: api/index.ts](file:///home/user/vercel/api/index.ts)

### Inferences
- **Data model in Redis (fits the existing REST style):**
  - `pet:{userId}` → JSON snapshot. Use `SET` with a version field and `WATCH` or a Lua script / `SET ... GET` for compare-and-set to avoid lost updates from two devices.
  - `user:{userId}` → profile, tz, push tokens, trial or promo flags.
  - `due:critical` → sorted set `ZADD score=criticalAtMs member=userId` for push scheduling.
  - `rate:{userId}:{minute}` → INCR/EXPIRE rate limits, reusing the existing `redisIncr`.
- **Capacity math (inference).** With 1,000 DAU × 8 syncs/day × about 4 commands = 32K commands/day ≈ 1M/month, which is above the 500K free tier. At $0.20 per 100K that is about $2/month on pay-as-you-go. Storage at 2 KB/pet × 100K pets = 200 MB, which still fits under 256 MB. Redis is not the cost driver.
- **Redis vs Postgres.** Redis alone is adequate for MVP pet state: small per-user documents, single-key access, TTL-friendly. Add Postgres (Neon, Vercel Marketplace) when you need:
  - an immutable purchases/entitlements ledger, though RevenueCat can be the source of truth for IAP
  - a pet history or "graveyard" for retention features
  - analytics queries
  - GDPR export across tables
- **Push scheduling options:**
  - **(A) Vercel Cron (Pro) every 1–5 min.** `ZRANGEBYSCORE due:critical 0 now` sends APNs/FCM pushes in batches. That is 8,640–43,200 invocations/month, which is negligible. This is the simplest option and keeps one code path. It does not work on Hobby (daily only).
  - **(B) QStash per-user delayed messages.** On every sync, publish a delayed message `notBefore = criticalAt` and dedupe by `petId:criticalAt`; QStash calls `/api/push/critical`, which checks staleness and then sends. This is precise to the second and works without Vercel Pro. At 1,000 DAU × about 3 messages/day = 3,000/day it exceeds the 1,000/day free tier, so expect about $0.90/month on pay-as-you-go.
  - **(C) Hybrid.** A QStash schedule (cron-style) hits the existing endpoint every 5 min, replacing Vercel Cron on Hobby. That uses about 288 messages/day, inside the free tier.
- **Sending pushes from Vercel.** Use the Expo Push API (a single HTTPS call handles iOS and Android tokens, up to 100 per request), or call APNs (HTTP/2 + JWT) and FCM v1 (OAuth service account) directly. Expo Push is simplest for an Expo app. Keep the function well under 300 s by batching.
- **Fluid compute only charges Active CPU.** I/O waits on Redis and Gemini are cheap, which suits this I/O-bound API (this follows from the "Active CPU" billing model; exact per-request CPU was not measured).
- **Do not launch commercially on Hobby.** Move to Pro before monetizing (IAP/RevenueCat), for both cron frequency and Vercel's terms (see Gaps).

### Gaps
- **Vercel's Hobby "non-commercial / personal use only" fair-use restriction** is a known Vercel policy (prior knowledge) but could not be re-verified this session because vercel.com was unreachable. Confirm it in the Vercel Fair Use Guidelines.
- Exact Vercel cron job-count limits per plan (100 vs 2/40) and Pro's included Active CPU (16 h vs 40 h) are unresolved conflicts.
- I could not confirm the Upstash per-request size, max record size or bandwidth caps on the free tier, or Upstash durability guarantees (persistence/replication) for "pet death" data.
- QStash max delay, schedule limits and retention per plan were not confirmed from Upstash's own docs.
- Supabase's current free-tier limits are not from an official source.

---

## 7. Auth and data: anonymous accounts, Sign in with Apple, cloud save, account deletion, GDPR basics

### Takeaway
Start every player with an anonymous server account: an install-generated UUID plus a server-issued token, stored in Keychain/Keystore. Offer optional account linking (Sign in with Apple, Google) for cloud save across devices. If a third-party social login is offered on iOS, a privacy-preserving option such as Sign in with Apple must also be offered (Guideline 4.8). Any app that creates accounts must offer in-app account deletion on iOS (5.1.1(v)) and in-app deletion plus a web deletion link on Google Play.

### Cited Findings
- **Apple 5.1.1(v):** "If your app supports account creation, you must also offer account deletion within the app". Enforced for submissions after 2022-06-30. Apple also states that if an app doesn't include significant account-based features, it should let people use it without a login — [Apple: Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app); [App Review Help: 5.1.1 account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion); [Apple Developer Forums 706792](https://developer.apple.com/forums/thread/706792)
- **Apple 4.8 Login Services:** if a third-party or social login sets up the primary account, the app must also offer an equivalent login that limits data collection and allows hiding the email. Sign in with Apple satisfies it. Apps commonly pass 4.8 and then fail 5.1.1(v) for lacking in-app deletion. Third-party guides add that deleting a SIWA account should call Apple's token-revocation endpoint (secondary claim) — [Apple Developer Forums 765145](https://developer.apple.com/forums/thread/765145); [Apple Developer Forums 801768](https://developer.apple.com/forums/thread/801768); [PTKD: 4.8](https://ptkd.com/app-store/guidelines/4-8)
- **Google Play:** apps that allow account creation must provide an in-app path to delete the account and associated data, plus a web link where users can request deletion without reinstalling, and must disclose this in the Data safety form. Deactivating or "freezing" an account does not count. "Accounts that are created and operated offline are not app accounts and do not fall within policy scope" — [Play Console Help: app-account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- The existing backend keys the trial on a hashed device fingerprint (`trial:start:<fingerprint>`) — [repo: api/index.ts](file:///home/user/vercel/api/index.ts)

### Inferences
- **Anonymous flow:**
  1. On first launch the app generates a UUIDv4 and calls `POST /auth/anon`.
  2. The server creates `user:{id}` and returns a signed token (JWT/HMAC with a server secret).
  3. The app stores the token in the iOS Keychain / Android Keystore-backed storage (e.g., `expo-secure-store`).

  The iOS Keychain can survive reinstall, which gives reasonable continuity without login. Then offer "Back up your pet" via SIWA or Google, linking the provider `sub` to the existing `userId`.
- **Tie trial and promo state to `userId`** instead of a raw device fingerprint once accounts exist. Keep the fingerprint only as an abuse signal for trial resets.
- **Because an anonymous server account is still an "account":** add a "Delete my data" button that wipes `pet:*`, `user:*` and push tokens, plus a simple web form or email endpoint for the Play Store web-link requirement.
- **GDPR basics** (general knowledge, not sourced this session):
  - Install IDs, push tokens and IPs are personal data.
  - Need a privacy policy, a lawful basis (contract for gameplay; consent for analytics or marketing pushes), data minimization (no email unless linked), export and deletion on request, and DPAs with processors (Vercel, Upstash, Google/Gemini, RevenueCat, Expo).
  - Pick EU regions for Upstash and Vercel functions if targeting EU users.
  - If the audience could include children, COPPA (US) and the GDPR Art. 8 age of digital consent apply.

### Gaps
- The primary text of App Review Guideline 4.8, including its exemption list, was not fetched. Only forum and third-party summaries were.
- GDPR, children's privacy (COPPA / GDPR Art. 8) and Apple/Google kids-category rules were not researched with primary sources in this pass.
- Expo/Firebase anonymous-auth options (e.g., Firebase Anonymous Auth vs custom tokens) were not compared.

---

## 8. Optional LLM personality with Gemini: models, pricing, latency, safety (as of Oct 2026)

### Takeaway
Gemini is cheap enough for pet "flavor" chatter, at cents per thousand messages on Flash-Lite. Model churn is the main risk. The backend's current default `gemini-2.5-flash` is reported blocked for new projects and scheduled for shutdown around 16 Oct 2026 on the Gemini API, so the game should target a current stable ID (`gemini-3.6-flash` GA 2026-07-21, or `gemini-3.1-flash-lite` / `gemini-3.5-flash-lite` for cost). Keep the model env-configurable, as the repo already does. Treat LLM output as non-blocking, cached, and safety-filtered.

### Cited Findings
- **Repo history** — [repo: api/index.ts](file:///home/user/vercel/api/index.ts) comments:
  - On 2026-07-13, `gemini-2.5-pro` returned 404 "no longer available to new users" on the developer's key.
  - 3.x pro-preview models also returned 404 on that key/tier.
  - `gemini-2.5-flash` was kept as default with `thinkingBudget: 0` for speed.
  - `gemini-3.1-pro-preview` with `thinkingLevel: low` measured about 4 s vs about 10 s at default.
- **Gemini 2.5 Flash shutdown:** some sources give 2026-10-16 (Gemini Developer API) and 2026-10-20 (Vertex AI). Other reports say existing projects are served "until further notice" while new projects get 404 "no longer available to new users". A forum post reported 404s as early as July 9, 2026 — [Google AI forum: 2.5 Flash 404 contradicts Oct 16 date](https://discuss.ai.google.dev/t/gemini-2-5-flash-and-gemini-2-5-flash-lite-returning-404-no-longer-available-today-july-9-contradicts-oct-16-2026-shutdown-date/174267); [Google AI forum: deprecated earlier than shutdown](https://discuss.ai.google.dev/t/gemini-2-5-flash-deprecated-without-warning-earlier-than-shutdown-date/174217); [TokenCost blog](https://tokencost.app/blog/gemini-2-5-shutdown-october-20-migration-cost). **Conflicting. Check ai.google.dev/gemini-api/docs/deprecations.**
- **Current stable models:**
  - `gemini-3.6-flash` is the stable model ID, GA 2026-07-21 together with Gemini 3.5 Flash-Lite
  - `gemini-3.5-flash` is still served with no announced shutdown
  - `gemini-3.1-flash-lite` is stable with shutdown "no earlier than 07.05.2027" (ambiguous date format, likely 7 May 2027)
  - Claims of Gemini 3.7/3.8 Flash are unconfirmed

  Sources: [Google AI: Gemini 3.6 Flash model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash); [TechDevNotes Gemini docs diff 2026-07-21](https://techdevnotes.com/releases/gemini-docs/20260721-160357Z-460ec023aded); [Mezha](https://mezha.ua/en/news/google-predstavila-gemini-3-6-flash-3-5-flash-lite-ta-3-5-flash-cyber-313466/) (via search summary)
- GitHub deprecated Gemini 2.5 Pro and Gemini 3 Flash in Copilot on 2026-07-31, recommending 3.6 Flash. This is GitHub's product deprecation, not necessarily Google's API — [GitHub changelog 2026-07-31](https://github.blog/changelog/2026-07-31-gemini-2-5-pro-and-gemini-3-flash-deprecated)
- **Pricing (paid tier, per 1M tokens; mostly aggregators, verify on ai.google.dev/pricing):**
  - Gemini 3.6 Flash: $1.50 input / $7.50 output, thinking tokens billed as output, cached input $0.15. Conflict: some list $0.75 / $3.75 "through Dec 31, 2026", possibly a promo — [CloudInsight](https://cloudinsight.cc/en/blog/gemini-api-pricing); [VorpLabs](https://vorplabs.com/models/releases/gemini-3-6-flash); [PricePerToken](https://pricepertoken.com/pricing-page/model/google-gemini-3.6-flash)
  - Gemini 3.1 Flash-Lite: $0.25 / $1.50
  - Gemini 3 Flash: $0.50 / $3.00
  - Gemini 3.5 Flash: $1.50 / $9
  - Gemini 3.1 Pro: $2 / $12, rising to $4 / $18 above 200K context

  Sources: [AnotherWrapper: 3.1 Flash-Lite](https://anotherwrapper.com/tools/llm-pricing/gemini-3.1-flash-lite-preview); [AnotherWrapper: 3 Flash](https://anotherwrapper.com/llm-pricing/gemini-3-flash-preview); [BenchLM](https://benchlm.ai/google/api-pricing)
- **Free tier** via AI Studio needs no credit card, but free-tier data may be used by Google to improve products, so it is unsuitable for production or sensitive traffic. Rate limits are per project and tier, and are shown in AI Studio — [DEV Community](https://dev.to/hassann/gemini-36-flash-pricing-what-it-actually-costs-in-2026-59he); [LaoZhang blog](https://blog.laozhang.ai/en/posts/gemini-api-pricing.md)

### Inferences
- **Cost estimate** (pet line ≈ 300 input + 60 output tokens; 1,000 DAU × 5 lines/day ≈ 150K calls/month):
  - Flash-Lite 3.1: about $0.000165/call, about **$25/month**
  - 3.6 Flash: about $0.0009/call, about **$135/month**

  Pre-generate a bank of lines per mood, stage and personality (batch API or offline), then sample from it locally. That cuts live calls by 90%+ and removes latency from the care loop.
- **Latency.** Never block a care action on the LLM. Respond to "feed" instantly with deterministic results, then fetch dialogue asynchronously with a 2–3 s timeout and a canned fallback line. Disable or minimize thinking (thinkingBudget 0 on 2.5-family, `thinkingLevel: low` on 3.x), as the repo already does.
- **Safety and abuse:**
  - keep output short and in-character via a system prompt
  - apply Gemini safety settings at strict thresholds
  - never pass user free-text from minors without moderation
  - rate-limit per user with the existing `redisIncr`
  - keep the API key server-side only, never in the app bundle
  - log model ID and latency (the repo's `LAST_GEMINI_DIAG` pattern)
- **Model choice should be env-driven** (`GEMINI_MODEL`, already implemented). Set an alert on 404 "no longer available" responses, since Google has removed models from new projects ahead of published dates.

### Gaps
- ai.google.dev pricing and deprecation pages could not be fetched directly. All prices and shutdown dates here come from aggregators and forum posts, and several conflict.
- Gemini safety-settings defaults and child-safety policy for consumer games were not researched.
- No first-party latency benchmarks for 3.6 Flash or 3.x Flash-Lite were found. The only latency data is the developer's own measurements in the repo comments.
