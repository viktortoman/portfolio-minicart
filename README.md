# Marketplace Minicart (Alpine.js + Vite + Express)

Ez a projekt egy **Marketplace típusú kosár (Minicart)** implementációja, amely képes kezelni több bolt termékeit, egyedi szállítási költségeket, csomagajánlatokat és kiegészítő termékeket. A megoldás modern frontend eszközöket és egy szimulált REST API backendet használ a valósághű működés érdekében.

## Ráfordított idő
**Összesen: ~ 3.5 - 4 óra**

* **1 óra:** Projekt setup, architektúra felállítása (Vite + Express integráció), Tailwind konfiguráció.
* **1.5 óra:** Frontend implementáció (Alpine.js komponens, UI felépítése, reaktivitás, hibakezelés).
* **1 óra:** Backend logika megírása (Mock adatbázis, árkalkulációk, `pack_quantity` logika, bolt törlés logika).
* **0.5 óra:** Tesztelés, finomhangolás (race conditions, UX), dokumentáció.

## Technológiai Stack
* **Frontend:** Alpine.js v3 (reaktív állapotkezelés), Tailwind CSS (stílus).
* **Build Tool:** Vite (gyors fejlesztői környezet és HMR).
* **Backend:** Node.js + Express (Mock API, szimulált network latency, szerver oldali árkalkuláció).
* **Eszközök:** `concurrently` (a szerver és a kliens egyidejű futtatásához egyetlen paranccsal).

## Setup és Futtatás

A projekt futtatásához **Node.js** (v18 vagy újabb) szükséges.

1. **Függőségek telepítése:**
   Nyiss egy terminált a projekt mappájában:
   ```bash
   npm install
   ```

2. **Fejlesztői környezet indítása:**
   Ez a parancs elindítja a Backend szervert (port: 3000) és a Frontendet (port: 5173/5174) egyszerre:
   ```bash
   npm run dev
   ```

3. **Megnyitás:**
   Kattints a terminálban megjelenő linkre (pl. `http://localhost:5173`).

## Technikai döntések indoklása

1.  **Vite + Express hibrid környezet:**
    Bár a feladat megoldható lett volna tisztán statikus fájlokkal és mockolt `fetch`-el is, a **Vite + Express** kombináció mellett döntöttem. Ez biztosítja a modern fejlesztői élményt (azonnali stílusfrissítés), miközben az Express szerver valósághű REST API élményt nyújt (hálózati késleltetés szimulálása, aszinkron műveletek).

2.  **Szerver oldali árkalkuláció:**
    A frontend **nem végez matematikai műveleteket** az árakkal (pl. végösszeg számítás). Minden módosításnál (`PATCH`) a szerver számolja újra a kosarat, és küldi vissza a friss állapotot. Ez biztonsági alapkövetelmény egy webshopnál, és megakadályozza a kliens oldali manipulációt.

3.  **UI Struktúra:**
    A kosarat **vertikálisan (egymás alatt)** jelenítem meg boltonként csoportosítva. Marketplace környezetben ez az elvárt minta, mivel a vásárlónak egyben kell látnia az összes felmerülő költséget (pl. többszörös szállítási díj) a végösszeg megértéséhez.

4.  **Race Condition védelem:**
    Gyors kattintásoknál (pl. mennyiség növelés) kritikus, hogy a kérések ne akadjanak össze. Ezért bevezettem egy `updatingItems` (Set) állapotot: amíg egy termék szinkronizálása folyamatban van a szerverrel, a UI letiltja az interakciót az adott terméken, és lokális töltőképernyőt mutat.

5.  **Csomagolási egység (`pack_quantity`) kezelése:**
    A rendszer figyelembe veszi, ha egy termék csak csomagban rendelhető (pl. 3-asával). Ilyenkor a `+` / `-` gombok nem 1-gyel, hanem a csomagolási egységgel növelik/csökkentik a mennyiséget, és a minimum rendelhető mennyiség is ehhez igazodik.

## Megvalósított funkciók

* **Dinamikus adatbetöltés:** `GET /api/cart` hívás induláskor loading state-tel.
* **Shoponkénti bontás:** Külön szállítási díjak és részösszegek kezelése.
* **Intelligens törlés:** Ha egy boltból töröljük az utolsó terméket, a szerver automatikusan eltávolítja a boltot (és a hozzá tartozó fix szállítási díjat) a kosárból.
* **Mennyiség kezelés:** Validáció (min/max), csomagolási egység (pack), aszinkron mentés.
* **Biztonságos megjelenítés:** Optional chaining (`?.`) használata a renderelésnél, hibaállapotok (Error/Empty) kezelése.
* **Lokalizáció:** Magyar pénznem formázás (`Intl.NumberFormat`) és ezres tagolás.