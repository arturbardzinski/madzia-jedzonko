# madzia-jedzonko

Statyczna aplikacja webowa (vanilla HTML/CSS/JS) — kalkulator/przeglądarka posiłków z makroskładnikami. UI w języku polskim.

## Stack

- Vanilla JS (IIFE, brak bundlera, brak frameworka, brak npm).
- CSS z custom properties + `clamp()` (fluid typography, responsive bez frameworka).
- Material Icons Outlined z Google Fonts (CDN).
- Brak backendu, brak persystencji — stan żyje tylko w DOM-ie.
- Skrypty ładowane `defer`: `meals-data.js` przed `script.js`.

## Struktura plików

- [index.html](index.html) — 4 sekcje `<section class="meal-section" data-section="...">`: ŚNIADANIE, OBIAD, PRZEKĄSKA, KOLACJA. Każda ma tabelę z `<tbody>` wypełnianym dynamicznie. Sticky summary bar (góra) + bottom-menu (dół) + custom modal alert.
- [meals-data.js](meals-data.js) — `window.MEALS_DATA` = obiekt z 4 kluczami (nazwy sekcji wielkimi literami z polskimi znakami). Każdy klucz → tablica obiektów `{name, kcal, protein, carbs, fat}`. ~173 posiłków, ~1221 linii. **To plik z danymi — edycje treści posiłków idą tutaj, nie do script.js.**
- [script.js](script.js) — cała logika w jednym IIFE. Render → cache → event-driven update.
- [style.css](style.css) — zmienne CSS w `:root`, sekcje oznaczone komentarzami `========== NAZWA ==========`. Media queries: mobile <600px, tablet 601–1023px, desktop ≥1024px.

## Architektura (script.js)

1. `renderMealsFromData()` — buduje wiersze z `MEALS_DATA` przez `DocumentFragment`, wstawia `replaceChildren()`.
2. `refreshCaches()` — po renderze cache'uje `mealCheckboxes` i `sectionRows` (NodeList → Array).
3. `updateSummary()` — sumuje makro z zaznaczonych checkboxów (`dataset.kcal/protein/carbs/fat`), woła `updateSectionCounts()`.
4. `updateSectionCounts()` — dopisuje `(N wybrane)` do `<h2>` (oryginał trzymany w `header.dataset.baseTitle`).
5. `filterMeals()` — wyszukiwarka po nazwie (case-insensitive), ukrywa sekcje bez trafień.
6. Nawigacja sekcjami: klik w `<h2>` toggle'uje `.collapsed`, strzałki w `.bottom-menu` przechodzą do prev/next, swipe (touch ±50px) działa tak samo. Reżim: **dokładnie jedna sekcja otwarta na raz** (logika `getOpenSectionIndex()`).
7. Kopiowanie: `copyMeals` → nazwy zaznaczonych przez `\n` do clipboard; `copyMacros` → `K: x kcal, B: y g, W: z g, T: w g`.
8. Custom alert (modal) zamiast natywnego `alert()`. Zamykany klikiem w tło, ESC, lub przyciskiem OK.

## Konwencje

- Nazwy posiłków po polsku, często z gramaturą w nawiasie, np. `"Bajgiel z fetą, pomidorami i dipem (356g)"`.
- Wartości makro jako liczby całkowite (gramy/kcal).
- Klucze sekcji w `MEALS_DATA` MUSZĄ pasować do `data-section` w HTML (wielkie litery, polskie znaki: `ŚNIADANIE`, `OBIAD`, `PRZEKĄSKA`, `KOLACJA`).
- CSS — zmienne kolorów dla każdego makro (`--clr-bg-kcal`, `--clr-text-kcal`, itd.), responsywność przez `clamp()`.
- Brak komentarzy w JS poza nielicznymi HTML-owymi placeholderami (`<!-- rows are rendered dynamically -->`). Nie dodawać komentarzy bez powodu.
- `.gitignore` ignoruje `.DS_Store` i `.idea/`.

## Uruchomienie

Otwórz `index.html` w przeglądarce. Nie ma kroku build. Nie ma testów.

## Częste zadania

- **Dodanie nowego posiłku** → dopisać obiekt do odpowiedniej tablicy w `meals-data.js`.
- **Nowa sekcja** → dodać klucz w `MEALS_DATA`, sekcję `<section data-section="...">` w `index.html` z `<h2>` i pustym `<tbody>`. Sticky offsets w CSS (`top: calc(...)`) mogą wymagać aktualizacji.
- **Zmiana koloru makro** → zmienne `--clr-bg-*` / `--clr-text-*` w `:root`.
- **Zmiana progu mobile/tablet/desktop** → `--bp-sm`, `--bp-md` w `:root` + media queries.

## Pułapki

- Po zmianie DOM-u tabel **trzeba** wołać `refreshCaches()` — `mealCheckboxes` i `sectionRows` są cache'owane.
- `header.dataset.baseTitle` jest ustawiany leniwie przy pierwszym update'cie liczników; nie nadpisywać `<h2>.textContent` ręcznie poza `updateSectionCounts()`.
- Sticky `top` w CSS są wyliczane od `--summary-height` i `--search-height`; zmiana wysokości tych elementów wymaga aktualizacji custom properties, a nie hardcode'u w media queries.
- Brak persystencji — refresh strony resetuje zaznaczenia.
