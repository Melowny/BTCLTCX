let btcPrice = null;
let btcHigh24h = null;
let btcLow24h = null;

async function fetchBTCPriceFromBybit() {
    try {
        const url = 'https://api.bybit.com/v2/public/tickers?symbol=BTCUSD';
        const response = await fetch(url);
        const data = await response.json();
        const btcTicker = data.result.find(ticker => ticker.symbol === 'BTCUSD');
        if (btcTicker) {
            btcPrice = btcTicker.last_price;
            btcHigh24h = btcTicker.high_price_24h;
            btcLow24h = btcTicker.low_price_24h;
        } else {
            btcPrice = null;
            btcHigh24h = null;
            btcLow24h = null;
        }
    } catch (error) {
        console.error('Error fetching BTC price from Bybit:', error);
        btcPrice = null;
        btcHigh24h = null;
        btcLow24h = null;
    }
}

function update24hPricesDisplay() {
    if (btcHigh24h && btcLow24h) {
        document.getElementById('btcHigh24h').innerText = btcHigh24h;
        document.getElementById('btcLow24h').innerText = btcLow24h;
    } else {
        document.getElementById('btcHigh24h').innerText = 'Unavailable';
        document.getElementById('btcLow24h').innerText = 'Unavailable';
    }
}

let timerInterval;
function startTimer() {
    let seconds = 15;
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
    if (btcPrice) {
        const btcPriceElement = document.getElementById('btcPrice');
        btcPriceElement.innerText = btcPrice;
        btcPriceElement.classList.remove('price-up', 'price-down');

        // Change color based on 24-hour high
        if (btcPrice > btcHigh24h) {
            btcPriceElement.classList.add('price-up'); // Green if higher than 24h high
        } else {
            btcPriceElement.classList.add('price-down'); // Red otherwise
        }

        calculateTargets();
        clearInterval(timerInterval);
        startTimer();
    } else {
        document.getElementById('btcPrice').innerText = 'Unavailable';
    }
    update24hPricesDisplay();
}

function updateBTCPricePeriodically() {
    const updateInterval = 15000;
    setInterval(async () => {
        await fetchBTCPriceFromBybit();
        updateBTCPriceDisplay();
    }, updateInterval);
}

async function calculateTargets() {
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

    const distanceToLiquidation = 100 / leverage;
    const percentageChange = distanceToLiquidation / 100;
    const liquidationPrice = btcPrice * (1 - percentageChange);
    document.getElementById('liqPrice').innerText = liquidationPrice.toFixed(2);
    const priceDifference = btcPrice - liquidationPrice;
    document.getElementById('priceDifference').innerText = priceDifference.toFixed(2);

    percentageChanges.forEach(change => {
        const adjustedChange = change / 100;
        const ammIndicator = (adjustedChange / leverage * 100).toFixed(2);
        const targetPriceIncrease = btcPrice * (1 + adjustedChange / leverage);
        const targetPriceDecrease = btcPrice * (1 - adjustedChange / leverage);
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

function updateLeverageValue() {
    const leverageValue = document.getElementById('leverageSlider').value;
    document.getElementById('leverageValue').innerText = leverageValue + 'x';
}

document.addEventListener('DOMContentLoaded', async () => {
    updateLeverageValue();
    await fetchBTCPriceFromBybit();
    updateBTCPriceDisplay();
    updateBTCPricePeriodically();
});
