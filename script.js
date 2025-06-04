;(function() {
    // ---------------------------------------
    // 1. CACHE’UJEMY ELEMENTY
    // ---------------------------------------
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
        return;
    }

    // ---------------------------------------
    // 2. POMOCNICZE FUNKCJE
    // ---------------------------------------

    // Prosty debounce, żeby resize nie wywoływał updateStickyOffsets zbyt często
    let resizeTimeout = null;
    function debounceResize(fn, delay = 100) {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(fn, delay);
    }

    // Ustawia 'top' dla .search-wrapper, nagłówków h2 i nagłówków th w tabelach
    function updateStickyOffsets() {
        if (!summaryEl || !searchWrapper) return;
        const summaryHeight = summaryEl.getBoundingClientRect().height;
        const searchHeight  = searchWrapper.getBoundingClientRect().height;

        searchWrapper.style.top = summaryHeight + 'px';

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

    // Wrapper, który przywraca scroll po zmianach w DOM (bez scrollIntoView)
    function withScrollRestoration(callback) {
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        callback();
        requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    }

    // Oblicza sumę makroskładników z zaznaczonych checkboxów
    function updateSummary() {
        let kcal = 0, protein = 0, carbs = 0, fat = 0;
        const checkedBoxes = document.querySelectorAll('.meal:checked');

        checkedBoxes.forEach(cb => {
            kcal    += +(cb.dataset.kcal    || 0);
            protein += +(cb.dataset.protein|| 0);
            carbs   += +(cb.dataset.carbs  || 0);
            fat     += +(cb.dataset.fat    || 0);
        });

        totalKcal.textContent    = kcal;
        totalProtein.textContent = protein;
        totalCarbs.textContent   = carbs;
        totalFat.textContent     = fat;

        updateSectionCounts();
    }

    // Dla każdej sekcji liczy, ile jest zaznaczonych i aktualizuje nagłówek h2
    function updateSectionCounts() {
        mealSections.forEach(section => {
            const count = section.querySelectorAll('.meal:checked').length;
            const header = section.querySelector('h2');
            if (!header) return;

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

    // Kopiuje nazwy posiłków do schowka
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
            try {
                await navigator.clipboard.writeText(selectedMeals);
                showAlert('Nazwy posiłków skopiowane do schowka!');
            } catch {
                showAlert('Błąd podczas kopiowania nazw posiłków.');
            }
        } else {
            showAlert('Nie zaznaczono żadnych posiłków.');
        }
    }
    // Exponujemy globalnie, by działało onclick="copyMeals()"
    window.copyMeals = copyMeals;

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
        try {
            await navigator.clipboard.writeText(summary);
            showAlert('Podsumowanie makro skopiowane do schowka!');
        } catch {
            showAlert('Błąd podczas kopiowania podsumowania makroskładników.');
        }
    }
    // Exponujemy globalnie, by działało onclick="copyMacros()"
    window.copyMacros = copyMacros;

    // Wyświetla niestandardowy alert
    function showAlert(message) {
        customAlertText.textContent = message;
        customAlert.style.display = 'flex';
    }

    // Ukrywa alert (potrzebne dla onclick="closeAlert()")
    function closeAlert() {
        customAlert.style.display = 'none';
    }
    window.closeAlert = closeAlert;

    // Filtrowanie posiłków: pokazuje/ukrywa wiersze i aktualizuje liczniki
    function filterMeals() {
        const query = (searchInput.value || '').trim().toLowerCase();

        mealSections.forEach(section => {
            let foundInSection = false;
            const rows = section.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const mealName = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
                const match = mealName.includes(query);
                row.style.display = match ? '' : 'none';
                if (match) foundInSection = true;
            });

            section.style.display = (foundInSection || query === '') ? '' : 'none';
        });

        updateSectionCounts();
    }
    // Exponujemy globalnie, bo oninput="filterMeals()"
    window.filterMeals = filterMeals;

    // Zwraca index pierwszej (jedynej) otwartej sekcji
    function getOpenSectionIndex() {
        for (let i = 0; i < mealSections.length; i++) {
            if (!mealSections[i].classList.contains('collapsed')) {
                return i;
            }
        }
        return -1;
    }

    // Toggle collapse danej sekcji (po kliknięciu w h2)
    function toggleSection(header) {
        const section = header.closest('.meal-section');
        if (!section) return;
        // Przy manipulacji DOM chcemy zachować bieżący scroll:
        withScrollRestoration(() => {
            section.classList.toggle('collapsed');
        });
    }

    // Obsługa swipe – bez przywracania scrolla, by scrollIntoView działało
    function handleSwipeGesture() {
        let touchStartX = 0;
        let touchEndX   = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const openIndex = getOpenSectionIndex();
            if (openIndex < 0) return;

            if (touchEndX < touchStartX - 50 && openIndex < mealSections.length - 1) {
                mealSections[openIndex].classList.add('collapsed');
                mealSections[openIndex + 1].classList.remove('collapsed');
                mealSections[openIndex + 1].scrollIntoView({ behavior: 'smooth' });
            }

            if (touchEndX > touchStartX + 50 && openIndex > 0) {
                mealSections[openIndex].classList.add('collapsed');
                mealSections[openIndex - 1].classList.remove('collapsed');
                mealSections[openIndex - 1].scrollIntoView({ behavior: 'smooth' });
            }
        }, false);
    }

    // Nawigacja strzałkami – bez przywracania scrolla
    function navigateSection(direction) {
        const openIndex = getOpenSectionIndex();
        if (openIndex < 0) return;
        const nextIndex = openIndex + direction;
        if (nextIndex < 0 || nextIndex >= mealSections.length) return;

        mealSections[openIndex].classList.add('collapsed');
        mealSections[nextIndex].classList.remove('collapsed');
        mealSections[nextIndex].scrollIntoView({ behavior: 'smooth' });
    }

    // ---------------------------------------
    // 3. PODPINAMY LISTENERY
    // ---------------------------------------

    // 3.1. Po załadowaniu i przy resize: updateStickyOffsets (z debounce)
    window.addEventListener('load', () => {
        updateSummary();
        updateStickyOffsets();
    });
    window.addEventListener('resize', () => debounceResize(updateStickyOffsets, 100));

    // 3.2. Event delegation dla checkboxów .meal
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('meal') && target.type === 'checkbox') {
            withScrollRestoration(updateSummary);
        }
    });

    // 3.3. Kliknięcie w nagłówek h2 sekcji → toggle collapse
    mealSections.forEach(section => {
        const header = section.querySelector('h2');
        if (header) {
            header.addEventListener('click', () => toggleSection(header));
        }
    });

    // 3.4. Filtrowanie posiłków przy wpisywaniu w input (oninput="filterMeals()" też działa)
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            withScrollRestoration(filterMeals);
        });
    }

    // 3.5. Gesty dotykowe
    handleSwipeGesture();

    // 3.6. Nawigacja w bottom-menu (strzałki)
    if (prevSectionBtn) {
        prevSectionBtn.addEventListener('click', () => navigateSection(-1));
    }
    if (nextSectionBtn) {
        nextSectionBtn.addEventListener('click', () => navigateSection(1));
    }
})();