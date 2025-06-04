;(function() {
    // -----------------------------
    // 1. CACHE’UJEMY ELEMENTY
    // -----------------------------
    const summaryEl       = document.querySelector('.summary');
    const searchWrapper   = document.querySelector('.search-wrapper');
    const mealSections    = Array.from(document.querySelectorAll('.meal-section'));
    const totalKcal       = document.getElementById('totalKcal');
    const totalProtein    = document.getElementById('totalProtein');
    const totalCarbs      = document.getElementById('totalCarbs');
    const totalFat        = document.getElementById('totalFat');
    const searchInput     = document.getElementById('searchInput');
    const prevSectionBtn  = document.getElementById('prevSection');
    const nextSectionBtn  = document.getElementById('nextSection');
    const customAlert     = document.getElementById('customAlert');
    const customAlertText = document.getElementById('customAlertText');

    if (!summaryEl || !searchWrapper) {
        // Jeśli nie ma wymaganych elementów, nie kontynuujemy.
        return;
    }

    // -----------------------------
    // 2. POMOCNICZE FUNKCJE
    // -----------------------------

    // Debounce dla resize
    let resizeTimeout = null;
    function debounceResize(fn, delay = 100) {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(fn, delay);
    }

    // Aktualizuje pozycje elementów "sticky"
    function updateStickyOffsets() {
        // Zabezpieczenie przed wywołaniem gdy elementy już nie istnieją
        if (!summaryEl || !searchWrapper) return;

        const summaryHeight = summaryEl.getBoundingClientRect().height;
        const searchHeight  = searchWrapper.getBoundingClientRect().height;

        // Ustawiamy top dla .search-wrapper
        searchWrapper.style.top = summaryHeight + 'px';

        // Dla każdej sekcji posiłków: ustawiamy top dla nagłówka <h2> i nagłówka tabeli <th>
        mealSections.forEach(section => {
            const header = section.querySelector('h2');
            if (!header) return;

            const h2Height = header.getBoundingClientRect().height;
            header.style.top = (summaryHeight + searchHeight) + 'px';

            const thead = section.querySelector('thead');
            if (!thead) return;

            const totalOffset = summaryHeight + searchHeight + h2Height;
            thead.querySelectorAll('th').forEach(th => {
                th.style.top = totalOffset + 'px';
            });
        });
    }

    // Przydatne do przywracania scrolla
    function withScrollRestoration(callback) {
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        callback();
        // Odroczone przywrócenie, żeby DOM zdążył się przerysować
        requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    }

    // Aktualizuje sumę makroskładników
    function updateSummary() {
        let kcal = 0, protein = 0, carbs = 0, fat = 0;

        // Pobieramy wszystkie zaznaczone checkboxy .meal
        const checkedBoxes = document.querySelectorAll('.meal:checked');

        checkedBoxes.forEach(cb => {
            // Używamy od razu parseInt z podstawną walidacją
            kcal    += +(cb.dataset.kcal    || 0);
            protein += +(cb.dataset.protein|| 0);
            carbs   += +(cb.dataset.carbs  || 0);
            fat     += +(cb.dataset.fat    || 0);
        });

        // Nadpisujemy wartości w podsumowaniu
        totalKcal.textContent    = kcal;
        totalProtein.textContent = protein;
        totalCarbs.textContent   = carbs;
        totalFat.textContent     = fat;

        // Aktualizujemy licznik zaznaczonych w każdej sekcji
        updateSectionCounts();
    }

    // Zlicza zaznaczone .meal w każdej sekcji i aktualizuje nagłówek <h2>
    function updateSectionCounts() {
        mealSections.forEach(section => {
            // Ile zaznaczonych w sekcji
            const count = section.querySelectorAll('.meal:checked').length;
            const header = section.querySelector('h2');
            if (!header) return;

            // Jeżeli nie zapisaliśmy bazowej treści tytułu — bierzemy wszystko przed nawiasem
            let baseName = header.dataset.baseTitle;
            if (!baseName) {
                baseName = header.textContent.split('(')[0].trim();
                header.dataset.baseTitle = baseName;
            }

            header.textContent = count > 0
                ? `${baseName} (${count} wybrane)`
                : baseName;
        });
    }

    // Kopiuje nazwy zaznaczonych posiłków do schowka
    async function copyMeals() {
        const selectedMeals = Array
            .from(document.querySelectorAll('.meal:checked'))
            .map(cb => {
                const td = cb.closest('tr')?.querySelector('td:nth-child(2)');
                return td ? td.textContent.trim() : '';
            })
            .filter(text => text !== '')
            .join('\n');

        if (selectedMeals) {
            await navigator.clipboard.writeText(selectedMeals);
            showAlert('Nazwy posiłków skopiowane do schowka!');
        } else {
            showAlert('Nie zaznaczono żadnych posiłków.');
        }
    }

    // Kopiuje podsumowanie makroskładników do schowka
    async function copyMacros() {
        const kcal    = totalKcal.textContent;
        const protein = totalProtein.textContent;
        const carbs   = totalCarbs.textContent;
        const fat     = totalFat.textContent;

        if (kcal === "0" && protein === "0" && carbs === "0" && fat === "0") {
            showAlert('Nie wybrano posiłków!');
            return;
        }

        const summary = `K: ${kcal} kcal, B: ${protein} g, W: ${carbs} g, T: ${fat} g`;
        await navigator.clipboard.writeText(summary);
        showAlert('Podsumowanie makro skopiowane do schowka!');
    }

    // Pokazuje niestandardowy alert
    function showAlert(message) {
        customAlertText.textContent = message;
        customAlert.style.display = 'flex';
    }

    // Ukrywa niestandardowy alert
    function closeAlert() {
        customAlert.style.display = 'none';
    }

    // Filtrowanie posiłków po nazwie/składniku
    function filterMeals() {
        const query = searchInput.value.trim().toLowerCase();

        mealSections.forEach(section => {
            let foundInSection = false;
            const rows = section.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const mealName = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
                const match = mealName.includes(query);
                row.style.display = match ? '' : 'none';
                if (match) foundInSection = true;
            });

            // Jeśli w sekcji nic nie pasuje i są wpisane znaki — chowamy całą sekcję
            section.style.display = (foundInSection || query === '') ? '' : 'none';
        });

        // Po ukryciu/odkryciu ponownie odświeżamy liczniki w nagłówkach
        updateSectionCounts();
    }

    // Przełączanie (zwinięcie/rozwinięcie) danej sekcji
    function toggleSection(header) {
        // Przed zmianą informujemy o bieżącym scrollu
        withScrollRestoration(() => {
            const section = header.closest('.meal-section');
            if (section) {
                section.classList.toggle('collapsed');
            }
        });
    }

    // Obsługa gestów swipe (tylko na dotykowych urządzeniach)
    let touchStartX = 0;
    let touchEndX   = 0;

    function handleSwipeGesture() {
        // Tablica widocznych sekcji w kolejności
        const sectionsVisible = mealSections.filter(sec => !sec.classList.contains('collapsed'));
        // Znajdź index pierwszej (i jedynej) otwartej sekcji
        let openIndex = -1;
        mealSections.forEach((sec, idx) => {
            if (!sec.classList.contains('collapsed')) {
                openIndex = idx;
            }
        });

        if (openIndex < 0) return;

        if (touchEndX < touchStartX - 50 && openIndex < mealSections.length - 1) {
            // Swipe w lewo → idziemy do następnej sekcji
            withScrollRestoration(() => {
                mealSections[openIndex].classList.add('collapsed');
                mealSections[openIndex + 1].classList.remove('collapsed');
                mealSections[openIndex + 1].scrollIntoView({ behavior: 'smooth' });
            });
        }

        if (touchEndX > touchStartX + 50 && openIndex > 0) {
            // Swipe w prawo → idziemy do poprzedniej sekcji
            withScrollRestoration(() => {
                mealSections[openIndex].classList.add('collapsed');
                mealSections[openIndex - 1].classList.remove('collapsed');
                mealSections[openIndex - 1].scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    // Nawigacja strzałkami w bottom-menu
    function navigateSection(direction) {
        let openIndex = -1;
        mealSections.forEach((sec, idx) => {
            if (!sec.classList.contains('collapsed')) {
                openIndex = idx;
            }
        });
        const nextIndex = openIndex + direction;
        if (nextIndex >= 0 && nextIndex < mealSections.length) {
            withScrollRestoration(() => {
                mealSections[openIndex].classList.add('collapsed');
                mealSections[nextIndex].classList.remove('collapsed');
                mealSections[nextIndex].scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    // -----------------------------
    // 3. PODPINAMY LISTENERY
    // -----------------------------
    // 3.1. Po załadowaniu i przy resize: odpalamy updateStickyOffsets (z debounce)
    window.addEventListener('load', updateStickyOffsets);
    window.addEventListener('resize', () => debounceResize(updateStickyOffsets, 100));

    // 3.2. Event delegation: nasłuchujemy na zmiany checkboxów .meal
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('meal') && target.type === 'checkbox') {
            // Przy zaznaczeniu/odznaczeniu checkboxa: aktualizujemy sumę, ale przywracamy też scroll
            withScrollRestoration(updateSummary);
        }
    });

    // 3.3. Kliknięcie w nagłówek <h2> sekcji → toggle collapse
    mealSections.forEach(section => {
        const header = section.querySelector('h2');
        if (header) {
            header.addEventListener('click', () => toggleSection(header));
        }
    });

    // 3.4. Filtrowanie posiłków przy wpisywaniu w input
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            // Przyćmienie scrolla podczas filtrowania bardzo rzadko będzie widoczne,
            // ale zachowujemy spójność w użytkowaniu z przywracaniem scrolla.
            withScrollRestoration(filterMeals);
        });
    }

    // 3.5. Kopiowanie nazw posiłków (załóż, że masz przycisk lub inny element wywołujący copyMeals)
    const copyMealsBtn = document.getElementById('copyMealsBtn');
    if (copyMealsBtn) {
        copyMealsBtn.addEventListener('click', copyMeals);
    }

    // 3.6. Kopiowanie makroskładników (analogicznie)
    const copyMacrosBtn = document.getElementById('copyMacrosBtn');
    if (copyMacrosBtn) {
        copyMacrosBtn.addEventListener('click', copyMacros);
    }

    // 3.7. Zamknięcie alertu
    const alertCloseBtn = document.getElementById('customAlertClose');
    if (alertCloseBtn) {
        alertCloseBtn.addEventListener('click', closeAlert);
    }


    // 3.9. Nawigacja w bottom-menu
    if (prevSectionBtn) {
        prevSectionBtn.addEventListener('click', () => navigateSection(-1));
    }
    if (nextSectionBtn) {
        nextSectionBtn.addEventListener('click', () => navigateSection(1));
    }

    // 3.10. Inicjalne odświeżenie sum i nagłówków (gdy ktoś wstępnie ma już zaznaczone checkboxy)
    updateSummary();
    updateStickyOffsets();
})();