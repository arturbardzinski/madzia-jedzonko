// 🔢 Elementy podsumowania
const totalKcal = document.getElementById('totalKcal');
const totalProtein = document.getElementById('totalProtein');
const totalCarbs = document.getElementById('totalCarbs');
const totalFat = document.getElementById('totalFat');

// 🔁 Aktualizacja podsumowania makroskładników
function updateSummary() {
    let kcal = 0, protein = 0, carbs = 0, fat = 0;
    const checkboxes = document.querySelectorAll('.meal');

    checkboxes.forEach(cb => {
        if (cb.checked) {
            kcal += parseInt(cb.dataset.kcal || "0", 10);
            protein += parseInt(cb.dataset.protein || "0", 10);
            carbs += parseInt(cb.dataset.carbs || "0", 10);
            fat += parseInt(cb.dataset.fat || "0", 10);
        }
    });

    totalKcal.textContent = kcal;
    totalProtein.textContent = protein;
    totalCarbs.textContent = carbs;
    totalFat.textContent = fat;

    updateSectionCounts();
}

// 🧮 Liczenie zaznaczonych checkboxów w sekcjach
function updateSectionCounts() {
    document.querySelectorAll(".meal-section").forEach(section => {
        const checkedInSection = section.querySelectorAll(".meal:checked").length;
        const header = section.querySelector("h2");

        const baseName = header.dataset.baseTitle || header.textContent.split("(")[0].trim();
        header.dataset.baseTitle = baseName;

        header.textContent = checkedInSection > 0
            ? `${baseName} (${checkedInSection} wybrane)`
            : baseName;
    });
}

// ✅ Nasłuchiwanie na zmianę checkboxów
document.querySelectorAll('.meal').forEach(cb =>
    cb.addEventListener('change', updateSummary)
);

// 📋 Kopiowanie nazw posiłków
async function copyMeals() {
    const selectedMeals = Array.from(document.querySelectorAll('.meal:checked'))
        .map(cb => cb.closest('tr').querySelector('td:nth-child(2)').textContent.trim())
        .join('\n');

    if (selectedMeals) {
        await navigator.clipboard.writeText(selectedMeals);
        showAlert('Nazwy posiłków skopiowane do schowka!');
    } else {
        showAlert('Nie zaznaczono żadnych posiłków.');
    }
}

// 📋 Kopiowanie makroskładników
async function copyMacros() {
    const kcal = totalKcal.textContent;
    const protein = totalProtein.textContent;
    const carbs = totalCarbs.textContent;
    const fat = totalFat.textContent;

    if (kcal === "0" && protein === "0" && carbs === "0" && fat === "0") {
        showAlert('Nie wybrano posiłków!');
        return;
    }

    const summary = `K: ${kcal} kcal, B: ${protein} g, W: ${carbs} g, T: ${fat} g`;
    await navigator.clipboard.writeText(summary);
    showAlert('Podsumowanie makro skopiowane do schowka!');
}

// 🔔 Alerty
function showAlert(message) {
    document.getElementById('customAlertText').textContent = message;
    document.getElementById('customAlert').style.display = 'flex';
}

function closeAlert() {
    document.getElementById('customAlert').style.display = 'none';
}

// 🔎 Filtrowanie posiłków po nazwie/składniku
function filterMeals() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const sections = document.querySelectorAll("section[data-section]");

    sections.forEach(section => {
        let foundInSection = false;
        const rows = section.querySelectorAll("tbody tr");

        rows.forEach(row => {
            const mealName = row.querySelector("td:nth-child(2)")?.textContent?.toLowerCase() || "";
            const match = mealName.includes(query);
            row.style.display = match ? "" : "none";
            if (match) foundInSection = true;
        });

        section.style.display = foundInSection || query === "" ? "" : "none";
    });

    updateSectionCounts();
}

// ⬇️⬆️ Zwijanie/rozwijanie sekcji
document.querySelectorAll(".meal-section h2").forEach(header => {
    header.addEventListener("click", () => {
        const section = header.closest(".meal-section");
        section.classList.toggle("collapsed");
    });
});

// 👆👉 Gesty swipe (mobile)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
}, false);

function handleSwipeGesture() {
    const sections = Array.from(document.querySelectorAll('.meal-section'));
    const openIndex = sections.findIndex(sec => !sec.classList.contains('collapsed'));

    if (touchEndX < touchStartX - 50 && openIndex < sections.length - 1) {
        sections[openIndex].classList.add('collapsed');
        sections[openIndex + 1].classList.remove('collapsed');
        sections[openIndex + 1].scrollIntoView({ behavior: 'smooth' });
    }

    if (touchEndX > touchStartX + 50 && openIndex > 0) {
        sections[openIndex].classList.add('collapsed');
        sections[openIndex - 1].classList.remove('collapsed');
        sections[openIndex - 1].scrollIntoView({ behavior: 'smooth' });
    }
}

// 🔁 Nawigacja strzałkami w bottom-menu
document.getElementById('prevSection').addEventListener('click', () => {
    navigateSection(-1);
});

document.getElementById('nextSection').addEventListener('click', () => {
    navigateSection(1);
});

function navigateSection(direction) {
    const sections = Array.from(document.querySelectorAll('.meal-section'));
    const openIndex = sections.findIndex(sec => !sec.classList.contains('collapsed'));
    const nextIndex = openIndex + direction;

    if (nextIndex >= 0 && nextIndex < sections.length) {
        sections[openIndex].classList.add('collapsed');
        sections[nextIndex].classList.remove('collapsed');
        sections[nextIndex].scrollIntoView({ behavior: 'smooth' });
    }
}