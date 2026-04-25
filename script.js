;(function() {
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
    const copyMealsBtn    = document.getElementById('copyMealsBtn');
    const copyMacrosBtn   = document.getElementById('copyMacrosBtn');
    const customAlert     = document.getElementById('customAlert');
    const customAlertText = document.getElementById('customAlertText');
    const closeAlertBtn   = document.getElementById('closeAlertBtn');
    const mealsData       = window.MEALS_DATA || {};

    let mealCheckboxes = [];
    let sectionRows = [];

    if (!summaryEl || !searchWrapper) {
        return;
    }

    function createMealRow(meal) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" class="meal"
                       data-kcal="${meal.kcal}"
                       data-protein="${meal.protein}"
                       data-carbs="${meal.carbs}"
                       data-fat="${meal.fat}">
            </td>
            <td>${meal.name}</td>
            <td>${meal.kcal}</td>
            <td>${meal.protein}</td>
            <td>${meal.carbs}</td>
            <td>${meal.fat}</td>
        `;
        return row;
    }

    function refreshCaches() {
        mealCheckboxes = Array.from(document.querySelectorAll('.meal'));
        sectionRows = mealSections.map(section => ({
            section,
            rows: Array.from(section.querySelectorAll('tbody tr'))
        }));
    }

    function renderMealsFromData() {
        mealSections.forEach(section => {
            const sectionName = section.dataset.section || '';
            const meals = mealsData[sectionName] || [];
            const tbody = section.querySelector('tbody');
            if (!tbody) return;

            const fragment = document.createDocumentFragment();
            meals.forEach(meal => {
                fragment.appendChild(createMealRow(meal));
            });

            tbody.replaceChildren(fragment);
        });

        refreshCaches();
    }

    function updateSummary() {
        let kcal = 0, protein = 0, carbs = 0, fat = 0;
        mealCheckboxes.forEach(cb => {
            if (!cb.checked) return;
            kcal    += +(cb.dataset.kcal    || 0);
            protein += +(cb.dataset.protein || 0);
            carbs   += +(cb.dataset.carbs  || 0);
            fat     += +(cb.dataset.fat    || 0);
        });

        totalKcal.textContent    = kcal;
        totalProtein.textContent = protein;
        totalCarbs.textContent   = carbs;
        totalFat.textContent     = fat;

        updateSectionCounts();
    }

    function updateSectionCounts() {
        sectionRows.forEach(({ section, rows }) => {
            const count = rows.reduce((selectedCount, row) => {
                const checkbox = row.querySelector('.meal');
                return selectedCount + (checkbox?.checked ? 1 : 0);
            }, 0);
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

    async function copyMeals() {
        const selectedMeals = Array
            .from(mealCheckboxes)
            .filter(cb => cb.checked)
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

    function showAlert(message) {
        customAlertText.textContent = message;
        customAlert.style.display = 'flex';
        closeAlertBtn?.focus();
    }

    function closeAlert() {
        customAlert.style.display = 'none';
    }

    function filterMeals() {
        const query = (searchInput.value || '').trim().toLowerCase();

        sectionRows.forEach(({ section, rows }) => {
            let foundInSection = false;

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

    function getOpenSectionIndex() {
        for (let i = 0; i < mealSections.length; i++) {
            if (!mealSections[i].classList.contains('collapsed')) {
                return i;
            }
        }
        return -1;
    }

    function toggleSection(header) {
        const section = header.closest('.meal-section');
        if (!section) return;
        section.classList.toggle('collapsed');
    }

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

    function navigateSection(direction) {
        const openIndex = getOpenSectionIndex();
        if (openIndex < 0) return;
        const nextIndex = openIndex + direction;
        if (nextIndex < 0 || nextIndex >= mealSections.length) return;

        mealSections[openIndex].classList.add('collapsed');
        mealSections[nextIndex].classList.remove('collapsed');
        mealSections[nextIndex].scrollIntoView({ behavior: 'smooth' });
    }

    window.addEventListener('load', () => {
        renderMealsFromData();
        updateSummary();
    });

    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('meal') && target.type === 'checkbox') {
            updateSummary();
        }
    });

    mealSections.forEach(section => {
        const header = section.querySelector('h2');
        if (header) {
            header.addEventListener('click', () => toggleSection(header));
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterMeals();
        });
    }

    if (copyMealsBtn) {
        copyMealsBtn.addEventListener('click', copyMeals);
    }

    if (copyMacrosBtn) {
        copyMacrosBtn.addEventListener('click', copyMacros);
    }

    if (closeAlertBtn) {
        closeAlertBtn.addEventListener('click', closeAlert);
    }

    if (customAlert) {
        customAlert.addEventListener('click', (e) => {
            if (e.target === customAlert) {
                closeAlert();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && customAlert?.style.display === 'flex') {
            closeAlert();
        }
    });

    handleSwipeGesture();

    if (prevSectionBtn) {
        prevSectionBtn.addEventListener('click', () => navigateSection(-1));
    }
    if (nextSectionBtn) {
        nextSectionBtn.addEventListener('click', () => navigateSection(1));
    }
})();