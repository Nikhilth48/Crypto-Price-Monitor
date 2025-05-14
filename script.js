const baseURL = "https://api.coingecko.com/api/v3";
const defaultCoins = [
  "bitcoin", "ethereum", "dogecoin", "solana", "shiba-inu", "litecoin", 
  "polygon", "cardano", "polkadot", "binancecoin", "ripple", "chainlink"
];
const localKey = "trackedCoins";
const currencyKey = "selectedCurrency";
let selectedCurrency = localStorage.getItem(currencyKey) || "usd";
let coinsList = [];

// Fetch Prices
async function fetchPrices(coins = null) {
  try {
    if (!coins) {
      const saved = localStorage.getItem(localKey);
      coins = saved ? JSON.parse(saved) : defaultCoins;
    }

    const res = await fetch(`${baseURL}/coins/markets?vs_currency=${selectedCurrency}&ids=${coins.join(",")}`);
    const data = await res.json();
    displayPrices(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Display Prices with Change Indicators
function displayPrices(coins) {
  const currencySymbol = selectedCurrency === "usd" ? "$" : selectedCurrency === "inr" ? "\u20B9" : "\u20AC";
  const container = document.getElementById("crypto-container");
  container.innerHTML = "";

  coins.forEach((coin) => {
    const card = document.createElement("div");
    card.className = "crypto-card";

    // Price Change Indicator
    const priceChangeClass = coin.price_change_percentage_24h > 0 ? "positive" : "negative";
    
    card.innerHTML = `
      <h2>${coin.name} (${coin.symbol.toUpperCase()})</h2>
      <img src="${coin.image}" alt="${coin.name}" />
      <p>Price: ${currencySymbol}${coin.current_price.toLocaleString()}</p>
      <p class="${priceChangeClass}">24h Change: ${coin.price_change_percentage_24h.toFixed(2)}%</p>
    `;
    
    card.addEventListener("click", () => loadChart(coin.id));
    container.appendChild(card);
  });
}

// Search Crypto
async function searchCrypto() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!query) return;

  try {
    const res = await fetch(`${baseURL}/coins/markets?vs_currency=${selectedCurrency}&ids=${query}`);
    const data = await res.json();

    if (data.length === 0) {
      alert("Cryptocurrency not found!");
      return;
    }

    displayPrices(data);
    loadChart(query);

    const existing = localStorage.getItem(localKey);
    let coins = existing ? JSON.parse(existing) : [];

    if (!coins.includes(query)) {
      coins.push(query);
      localStorage.setItem(localKey, JSON.stringify(coins));
    }
  } catch (err) {
    console.error("Search failed:", err);
  }
}

// Autocomplete Search
async function autocompleteCrypto() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const suggestionsBox = document.getElementById("autocomplete-suggestions");

  if (!query) {
    suggestionsBox.innerHTML = "";
    return;
  }

  const res = await fetch(`${baseURL}/coins/list`);
  const allCoins = await res.json();

  const suggestions = allCoins.filter(coin => coin.name.toLowerCase().includes(query));
  suggestionsBox.innerHTML = suggestions.map(coin => 
    `<div onclick="selectCoin('${coin.id}')">${coin.name}</div>`
  ).join('');
}

// Select Coin for Autocomplete
function selectCoin(coinId) {
  document.getElementById("searchInput").value = coinId;
  document.getElementById("autocomplete-suggestions").innerHTML = "";
  searchCrypto();
}

// Change Currency
function changeCurrency() {
  const select = document.getElementById("currencySelect");
  selectedCurrency = select.value;
  localStorage.setItem(currencyKey, selectedCurrency);
  fetchPrices();
}

// Toggle Dark/Light Mode
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
}

// Load Chart for a Coin
async function loadChart(coinId) {
  const res = await fetch(`${baseURL}/coins/${coinId}/market_chart?vs_currency=${selectedCurrency}&days=7`);
  const data = await res.json();

  const labels = data.prices.map(price => {
    const date = new Date(price[0]);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const prices = data.prices.map(price => price[1]);

  const ctx = document.getElementById('priceChart').getContext('2d');
  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${coinId.toUpperCase()} - Last 7 Days (${selectedCurrency.toUpperCase()})`,
        data: prices,
        fill: false,
        borderColor: 'aqua',
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

// Open Modal for Detailed Coin View
function openModal(coinId) {
  const modal = document.getElementById('coinModal');
  modal.style.display = 'block';
  loadDetailedCoin(coinId);
}

// Close Modal
function closeModal() {
  const modal = document.getElementById('coinModal');
  modal.style.display = 'none';
}

// Load Detailed Coin Data
async function loadDetailedCoin(coinId) {
  const res = await fetch(`${baseURL}/coins/${coinId}`);
  const data = await res.json();
  const coin = data;

  document.getElementById('coinName').innerText = coin.name;
  document.getElementById('coinDetails').innerText = `Market Cap: ${coin.market_data.market_cap[selectedCurrency]} \nVolume: ${coin.market_data.total_volume[selectedCurrency]} \nCurrent Price: ${coin.market_data.current_price[selectedCurrency]}`;
}

window.onload = () => {
  fetchPrices();
  const theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  }
};
