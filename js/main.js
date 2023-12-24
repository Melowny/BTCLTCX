
async function fetchBTCPriceFromBybit() {
    try {
        const url = 'https://api.bybit.com/v2/public/tickers?symbol=BTCUSD';
        const response = await fetch(url);
        const data = await response.json();
        const btcTicker = data.result.find(ticker => ticker.symbol === 'BTCUSD');
        return btcTicker ? btcTicker.last_price : null;
    } catch (error) {
        console.error('Error fetching BTC price from Bybit:', error);
        return null;
    }
}

let timerInterval;
function startTimer() {
    let seconds = 15; // Start from 15 seconds
    timerInterval = setInterval(function() {
        if (seconds > 0) {
            document.getElementById('timer').innerText = `Updating in: ${seconds}sec`;
        } else if (seconds === 0) {
            clearInterval(timerInterval);
            document.getElementById('timer').innerText = 'Updating...';
        }
        seconds--;
    }, 1000);
}



async function updateBTCPriceDisplay() {
    const btcPrice = await fetchBTCPriceFromBybit();
    if (btcPrice) {
        document.getElementById('btcPrice').innerText = btcPrice;
        calculateTargets();
        clearInterval(timerInterval);
        startTimer();
    } else {
        document.getElementById('btcPrice').innerText = 'Unavailable';
    }
}

function updateBTCPricePeriodically() {
    const updateInterval = 15000;
    setInterval(updateBTCPriceDisplay, updateInterval);
}

async function calculateTargets() {
    const btcPrice = await fetchBTCPriceFromBybit();
    if (!btcPrice) {
        document.getElementById('liqPrice').innerText = 'Unavailable';
        document.getElementById('priceDifference').innerText = 'Unavailable';
        return;
    }

    const leverage = parseInt(document.getElementById('leverageSlider').value);
    const positionSize = parseFloat(document.getElementById('positionSizeInput').value) || 100;
    const percentageChanges = [1, 2, 3, 5, 10, 15, 20, 50, 100];
    const tableBody = document.getElementById('priceTableBody');
    tableBody.innerHTML = '';

    // Calculate liquidation price
    const distanceToLiquidation = 100 / leverage;
    const percentageChange = distanceToLiquidation / 100;
    const liquidationPrice = btcPrice * (1 - percentageChange);

    document.getElementById('liqPrice').innerText = '' + liquidationPrice.toFixed(2);

    // Calculate and update the difference between BTC price and liquidation price
    const priceDifference = btcPrice - liquidationPrice;
    document.getElementById('priceDifference').innerText = '' + priceDifference.toFixed(2);

    percentageChanges.forEach(change => {
        const adjustedChange = change / 100;
        const ammIndicator = (adjustedChange / leverage * 100).toFixed(2);
        const targetPriceIncrease = btcPrice * (1 + adjustedChange / leverage);
        const targetPriceDecrease = btcPrice * (1 - adjustedChange / leverage);

        // Gain calculation based on position size and percentage change
        const gain = positionSize * adjustedChange;

        const usdDifference = Math.abs(targetPriceIncrease - btcPrice).toFixed(2);

        const rowHTML = `
                <tr>
                    <td>${change}%</td>
                    <td class="amm-indicator">${ammIndicator}%</td>
                    <td><span class="increase">$${targetPriceIncrease.toFixed(2)}</span> / <span class="decrease">$${targetPriceDecrease.toFixed(2)}</span></td>
                    <td>$${usdDifference}</td>
                    <td>$${gain.toFixed(2)}</td>
                </tr>`;
        tableBody.innerHTML += rowHTML;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await updateBTCPriceDisplay();
    updateBTCPricePeriodically();
});
function updateLeverageValue() {
    const leverageValue = document.getElementById('leverageSlider').value;
    document.getElementById('leverageValue').innerText = leverageValue + 'x';
}

// Call updateLeverageValue on page load to set initial value
document.addEventListener('DOMContentLoaded', async () => {
    updateLeverageValue();
    await updateBTCPriceDisplay();
    updateBTCPricePeriodically();
});