let currentSort = 'rarity';
let currentData = {};

const rarityOrder = { 'Common': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4 };
const sizeOrder = { 'Small': 1, 'Normal Sized': 2, 'Large': 3, 'Massive': 4 };
const upgradeCosts = { 'Common': 5, 'Rare': 4, 'Epic': 2, 'Legendary': 1 };
const apiURL = 'https://script.google.com/macros/s/AKfycbyQU19SL4FVU3IWZpNuAh-DHWXpDETTy8d0daBvj8JULBfznhl_6SFGn7M6OWeKDftm-Q/exec';

const comparisons = {
    rarity: (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity],
    size: (a, b) => sizeOrder[b.size] - sizeOrder[a.size],
    quantity: (a, b) => b.quantity - a.quantity,
    name: (a, b) => a.display.localeCompare(b.display),
};

const sortComparisons = {
    rarity: (a, b) => comparisons.rarity(a, b) || comparisons.quantity(a, b) || comparisons.size(a, b) || comparisons.name(a, b),
    size: (a, b) => comparisons.size(a, b) || comparisons.quantity(a, b) || comparisons.rarity(a, b) || comparisons.name(a, b),
    quantity: (a, b) => comparisons.quantity(a, b) || comparisons.rarity(a, b) || comparisons.size(a, b) || comparisons.name(a, b),
    name: (a, b) => comparisons.name(a, b) || comparisons.rarity(a, b) || comparisons.quantity(a, b) || comparisons.size(a, b),
};

// Main page elements.
const headerTitle = document.getElementById('header-title');
const usernameTitle = document.getElementById('username-title');
const userStats = document.getElementById('user-stats');
const inventoryPanel = document.getElementById('inventory-panel');
const sortButtonContainer = document.querySelector('.sort-buttons');
const refreshButton = document.getElementById('refresh-button');
const searchButton = document.getElementById('search-button');

// New Header Stat Elements.
const equippedTailDisplay = document.getElementById('equipped-tail-display');
const freePullsDisplay = document.getElementById('free-pulls-display');
const pityBar = document.getElementById('pity-bar');
const pityPointsDisplay = document.getElementById('pity-points-display');

// Lifetime Stats Elements.
const lifetimeStatsContainer = document.getElementById('lifetime-stats-container');
const toggleStatsButton = document.getElementById('toggle-stats-button');
const statsUniquePulls = document.getElementById('stats-unique-count');
const statsTotalPulls = document.getElementById('stats-total-pulls');
const statsCommonCount = document.getElementById('stats-common-count');
const statsRareCount = document.getElementById('stats-rare-count');
const statsEpicCount = document.getElementById('stats-epic-count');
const statsLegendaryCount = document.getElementById('stats-legendary-count');
const statsSmallCount = document.getElementById('stats-small-count');
const statsNormalCount = document.getElementById('stats-normal-count');
const statsLargeCount = document.getElementById('stats-large-count');
const statsMassiveCount = document.getElementById('stats-massive-count');
const statsMostCommon = document.getElementById('stats-most-common');
const statsMostRare = document.getElementById('stats-most-rare');
const statsMostEpic = document.getElementById('stats-most-epic');
const statsMostLegendary = document.getElementById('stats-most-legendary');

// Modal elements.
const searchModal = document.getElementById('user-search-modal');
const modalCloseButton = document.getElementById('modal-close-button');
const modalSearchInput = document.getElementById('modal-search-input');
const modalSearchButton = document.getElementById('modal-search-button');

function calculateLifetimeStats(items) {
    const stats = {
        totalPulls: 0,
        rarityCounts: { Common: 0, Rare: 0, Epic: 0, Legendary: 0 },
        sizeCounts: { Small: 0, 'Normal Sized': 0, Large: 0, Massive: 0 },
        mostPulled: {
            Common: { name: 'None', count: 0 },
            Rare: { name: 'None', count: 0 },
            Epic: { name: 'None', count: 0 },
            Legendary: { name: 'None', count: 0 }
        }
    };

    items.forEach(item => {
        // Quantity calculation.
        const sizeRank = sizeOrder[item.size];
        const upgradeCost = upgradeCosts[item.rarity];
        const startingSizeRank = item.rarity === 'Legendary' ? 2 : 1;

        const upgradesMade = Math.max(0, sizeRank - startingSizeRank);
        const tailsConsumedByUpgrades = upgradesMade * upgradeCost;
        const totalPulled = tailsConsumedByUpgrades + item.quantity;
        stats.totalPulls += totalPulled;

        // Increment rarity stats.
        stats.rarityCounts[item.rarity] += totalPulled;

        // Increment size stats.
        if (stats.sizeCounts.hasOwnProperty(item.size)) {
            stats.sizeCounts[item.size]++;
        }

        // Update most pulled stats.
        if (totalPulled > stats.mostPulled[item.rarity].count) {
            stats.mostPulled[item.rarity] = { name: item.display, count: totalPulled };
        }
    });

    return stats;
}

function transformData(iniData, username) {
    const userSettings = iniData.UserSettings || {};
    const items = [];
    let equippedTailName = 'None';

    const equippedTailKey = userSettings.CurrentTail;
    if (equippedTailKey && iniData[equippedTailKey] && iniData[equippedTailKey].Display) {
        equippedTailName = iniData[equippedTailKey].Display;
    }

    // Process INI data into an items array.
    for (const key in iniData) {
        if (key === 'UserSettings') continue;

        const itemData = iniData[key];
        // Basic validation to ensure we can display
        if (itemData && itemData.Display && itemData.Quantity && itemData.Rarity && itemData.Size) {
            items.push({
                display: itemData.Display,
                quantity: parseInt(parseFloat(itemData.Quantity)),
                rarity: itemData.Rarity,
                size: itemData.Size,
                cost: upgradeCosts[itemData.Rarity]
            });
        }
    }
    const lifetimeStats = calculateLifetimeStats(items);

    return {
        username: username,
        equippedTail: equippedTailName,
        gachaInfo: {
            freePulls: parseInt(parseFloat(userSettings.FreePull || '0')),
            pity: parseInt(parseFloat(userSettings.Pity || '0'))
        },
        items: items,
        lifetimeStats: lifetimeStats
    };
}

function renderHeaderData(data) {
    if (!data.username) {
        userStats.style.display = 'none';
        return;
    }
    headerTitle.textContent = data.username;
    equippedTailDisplay.textContent = data.equippedTail || 'None';
    freePullsDisplay.textContent = data.gachaInfo.freePulls;

    const pity = data.gachaInfo.pity;
    pityPointsDisplay.textContent = `${pity}/100`;
    pityBar.style.width = '0%';
    setTimeout(() => {
        pityBar.style.width = `${pity}%`;
    }, 100);
}

function renderLifetimeStats(stats) {
    if (!stats) {
        lifetimeStatsContainer.style.display = 'none';
        return;
    }
    lifetimeStatsContainer.style.display = 'block';

    statsUniquePulls.textContent = currentData.items.length;
    statsTotalPulls.textContent = stats.totalPulls;

    statsCommonCount.textContent = stats.rarityCounts.Common;
    statsCommonCount.classList.remove('rarity-common-text');
    if (stats.rarityCounts.Common > 0) statsCommonCount.classList.add('rarity-common-text');

    statsRareCount.textContent = stats.rarityCounts.Rare;
    statsRareCount.classList.remove('rarity-rare-text');
    if (stats.rarityCounts.Rare > 0) statsRareCount.classList.add('rarity-rare-text');

    statsEpicCount.textContent = stats.rarityCounts.Epic;
    statsEpicCount.classList.remove('rarity-epic-text');
    if (stats.rarityCounts.Epic > 0) statsEpicCount.classList.add('rarity-epic-text');

    statsLegendaryCount.textContent = stats.rarityCounts.Legendary;
    statsLegendaryCount.classList.remove('rarity-legendary-text');
    if (stats.rarityCounts.Legendary > 0) statsLegendaryCount.classList.add('rarity-legendary-text');

    statsSmallCount.textContent = stats.sizeCounts.Small;
    statsNormalCount.textContent = stats.sizeCounts['Normal Sized'];
    statsLargeCount.textContent = stats.sizeCounts.Large;
    statsMassiveCount.textContent = stats.sizeCounts.Massive;

    statsMostCommon.textContent = stats.mostPulled.Common.name;
    statsMostCommon.classList.remove('rarity-common-text');
    if (stats.mostPulled.Common.count > 0) statsMostCommon.classList.add('rarity-common-text');

    statsMostRare.textContent = stats.mostPulled.Rare.name;
    statsMostRare.classList.remove('rarity-rare-text');
    if (stats.mostPulled.Rare.count > 0) statsMostRare.classList.add('rarity-rare-text');

    statsMostEpic.textContent = stats.mostPulled.Epic.name;
    statsMostEpic.classList.remove('rarity-epic-text');
    if (stats.mostPulled.Epic.count > 0) statsMostEpic.classList.add('rarity-epic-text');

    statsMostLegendary.textContent = stats.mostPulled.Legendary.name;
    statsMostLegendary.classList.remove('rarity-legendary-text');
    if (stats.mostPulled.Legendary.count > 0) statsMostLegendary.classList.add('rarity-legendary-text');
}

function renderInventory(items) {
    if (!items || items.length === 0) {
        if (!currentData.username) return;

        headerTitle.style.display = 'none';
        lifetimeStatsContainer.style.display = 'none';
        inventoryPanel.innerHTML = `<p style="text-align: center; font-size: 1.2rem; padding: 2rem;">No inventory data. Trigger a redeem on stream to pull a tail!</p>`;
        return;
    }
    inventoryPanel.innerHTML = '';

    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
        const itemCard = document.createElement('div');
        itemCard.className = `item-card rarity-${item.rarity.toLowerCase()}`;
        itemCard.style.animationDelay = `${0.3 + index * 0.05}s`;

        if (item.display === currentData.equippedTail) {
            itemCard.classList.add('equipped');
        }

        const quantityDisplay = item.quantity > 99 ? '99+' : item.quantity;

        itemCard.innerHTML = `
            <div class="item-header">
                <div class="item-display-group">
                    <div class="item-quantity-box">${quantityDisplay}</div>
                    <div class="rarity-tag">${item.rarity.toUpperCase()}</div>
                    <div class="item-name-container">
                        <span class="item-display" title="${item.display}">${item.display}</span><span class="small-item-quantity-box">x ${quantityDisplay}</span>
                    </div>
                </div>
                <div class="item-right-group">
                    <span class="item-size size-${item.size.toLowerCase()}">${item.size}</span>
                    <div class="expand-icon">+</div>
                </div>
            </div>
            <div class="item-details">
                <div class="item-details-content">
                    <ul>
                        <li><strong>Name:</strong><span>${item.display}</span></li>
                        <li><strong>Rarity:</strong><span>${item.rarity}</span></li>
                        <li><strong>Size:</strong><span>${item.size}</span></li>
                        <li><strong>Quantity:</strong><span>${item.quantity} Owned</span></li>
                        <li><strong>Upgrade Cost:</strong><span>${item.cost} tail${item.cost === 1 ? '' : 's'}</span></li>
                    </ul>
                    <div class="item-details-commands">
                        <span><strong>Click &amp; Copy:</strong></span>
                        <pre><code data-copy="!settail ${item.display}">!settail ${item.display}</code></pre>
                        ${item.quantity > upgradeCosts[item.rarity] && item.size !== 'Massive' ? '<pre><code data-copy="!upgrade">!upgrade</code></pre>' : ''}
                        ${item.rarity === 'Epic' ? '<pre><code data-copy="!epicaction">!epicaction</code></pre>' : ''}
                        ${currentData.gachaInfo.freePulls > 0 ? `<pre><code data-copy="!freepull ${Math.min(10, currentData.gachaInfo.freePulls)}">!freepull ${Math.min(10, currentData.gachaInfo.freePulls)}</code></pre>` : ''}
                        </div>
                </div>
            </div>
          `;
        fragment.appendChild(itemCard);
    });
    inventoryPanel.appendChild(fragment);
}

function sortAndRender() {
    sortButtonContainer.querySelector('.active')?.classList.remove('active');
    const newActiveButton = sortButtonContainer.querySelector(`[data-sort="${currentSort}"]`);
    if (newActiveButton) {
        newActiveButton.classList.add('active');
    }

    if (!currentData || !currentData.items) {
        renderInventory([]);
        return;
    }

    const itemsToSort = [...currentData.items];
    itemsToSort.sort((a, b) => {
        if (currentSort in sortComparisons) return sortComparisons[currentSort](a, b);
        return 0;
    });
    renderInventory(itemsToSort);
}

async function fetchAndDisplayUserData(username) {
    if (!username) return;

    headerTitle.style.display = 'block';
    headerTitle.textContent = 'Loading...';
    inventoryPanel.innerHTML = `<p style="text-align: center; font-size: 1.2rem; padding: 2rem;">Loading...</p>`;
    refreshButton.disabled = true;
    searchButton.disabled = true;
    pityBar.style.width = '0%';
    pityPointsDisplay.textContent = '...';
    equippedTailDisplay.textContent = '...';
    freePullsDisplay.textContent = '...';
    lifetimeStatsContainer.style.display = 'none';
    closeStats();

    const normalizedUsername = username.toLowerCase();
    try {
        const response = await fetch(`${apiURL}?fileName=${normalizedUsername}.ini`);

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        const responseText = await response.text();

        // The API returns a JSON error object on failure, and an INI string on success.
        try {
            const errorData = JSON.parse(responseText);
            if (errorData.status === 'error') {
                throw new Error(`User "${normalizedUsername}" not found. If this is you, trigger a redeem on stream to pull a tail!`);
            }
        } catch (e) {
            // This is expected on success, as INI text is not valid JSON.
            // If the error was our specific "User not found" message, re-throw it.
            if (e.message.includes('not found')) throw e;
        }

        const parsedIni = parseIni(responseText);
        currentData = transformData(parsedIni, normalizedUsername);
        history.pushState({ user: normalizedUsername }, `Tails for ${normalizedUsername}`, `?user=${normalizedUsername}`);

        renderHeaderData(currentData);
        renderLifetimeStats(currentData.lifetimeStats);
        sortAndRender();
        headerTitle.style.display = 'block';
    } catch (error) {
        currentData = {};
        headerTitle.textContent = 'Error';
        equippedTailDisplay.textContent = 'N/A';
        freePullsDisplay.textContent = 'N/A';
        pityPointsDisplay.textContent = 'N/A';
        inventoryPanel.innerHTML = `<p style="color: #ff8a8a; font-weight: bold; text-align: center; font-size: 1.2rem; padding: 2rem;">${error.message}</p>`;
    } finally {
        refreshButton.disabled = false;
        searchButton.disabled = false;
    }
}

function openStats() {
    lifetimeStatsContainer.classList.add('expanded');
    toggleStatsButton.textContent = 'Hide Lifetime Stats';
}

function closeStats() {
    lifetimeStatsContainer.classList.remove('expanded');
    toggleStatsButton.textContent = 'Show Lifetime Stats';
}

function openModal() {
    searchModal.classList.add('active');
}

function closeModal() {
    searchModal.classList.remove('active');
}

function performSearch() {
    const userToSearch = modalSearchInput.value.trim().replaceAll(" ", '_');
    if (userToSearch) {
        fetchAndDisplayUserData(userToSearch);
        modalSearchInput.value = '';
    }
    closeModal();
}

// --- Event Listeners ---
sortButtonContainer.addEventListener('click', (e) => {
    const clickedButton = e.target.closest('.sort-btn');
    if (!clickedButton || clickedButton.dataset.sort === currentSort) return;
    currentSort = clickedButton.dataset.sort;
    sortAndRender();
});

inventoryPanel.addEventListener('click', (e) => {
    // Expand/collapse item cards.
    const itemHeader = e.target.closest('.item-header');
    if (itemHeader) {
        itemHeader.parentElement.classList.toggle('expanded');
        return;
    }

    // Copying commands.
    const commandBlock = e.target.closest('.item-details-commands pre');
    if (commandBlock) {
        const clickedPre = e.target.closest('pre');
        const codeNode = clickedPre.querySelector('code');
        const code = codeNode.dataset.copy;
        navigator.clipboard.writeText(code).then(() => {
            codeNode.textContent = 'Copied'.padEnd(code.length);

            setTimeout(() => {
                codeNode.textContent = code;
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            codeNode.textContent = 'Error!';
            setTimeout(() => {
                codeNode.textContent = code;
            }, 1500);
        });
    }
});

refreshButton.addEventListener('click', () => {
    fetchAndDisplayUserData(currentData.username);
});

toggleStatsButton.addEventListener('click', () => {
    if (lifetimeStatsContainer.classList.contains('expanded')) {
        closeStats();
    } else {
        openStats();
    }
});

searchButton.addEventListener('click', openModal);
modalCloseButton.addEventListener('click', closeModal);
searchModal.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'opacity' && searchModal.classList.contains('active')) {
        modalSearchInput.focus();
    }
});
searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
        closeModal();
    }
});
modalSearchButton.addEventListener('click', performSearch);
modalSearchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && searchModal.classList.contains('active')) {
        performSearch();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Initial load
function Initialize() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');

    if (user) {
        fetchAndDisplayUserData(user);
    } else {
        // No user in URL, show a welcome/instruction message.
        headerTitle.style.display = 'none';
        lifetimeStatsContainer.style.display = 'none';
        inventoryPanel.innerHTML = `<p style="text-align: center; font-size: 1.2rem; padding: 2rem;">No user specified. Use the "Search" button.</p>`;
    }
}

Initialize();
