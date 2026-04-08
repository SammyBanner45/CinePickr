const searchInput = document.getElementById('search-input');
const moviesContainer = document.getElementById('movies-container');
const watchlistContainer = document.getElementById('watchlist-container');
const watchlistCount = document.getElementById('watchlist-count');
const clearWatchlistBtn = document.getElementById('clear-watchlist-btn');
const sortSelect = document.getElementById('sort-select');
const typeFilter = document.getElementById('type-filter');
const randomMovieBtn = document.getElementById('random-movie-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon      = document.getElementById('theme-icon');
const themeText      = document.getElementById('theme-text');
const movieModal = document.getElementById('movie-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalBody = document.getElementById('modal-body');
const viewAllLink = document.getElementById('view-all-link');
const avatarBtn   = document.getElementById('avatar-btn');
const loginForm   = document.getElementById('login-form');
const loginCloseBtn = document.getElementById('login-close-btn');

const SIDEBAR_LIMIT = 3;

avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    loginForm.classList.toggle('active');
});

loginCloseBtn.addEventListener('click', () => {
    loginForm.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!loginForm.contains(e.target) && !avatarBtn.contains(e.target)) {
        loginForm.classList.remove('active');
    }
});

let searchResults = [];
let watchlist = JSON.parse(localStorage.getItem('cinepickr_watchlist')) || [];

searchInput.addEventListener('input', debounce(handleSearch, 500));
sortSelect.addEventListener('change', updateDisplays);
typeFilter.addEventListener('change', updateDisplays);

clearWatchlistBtn.addEventListener('click', () => {
    watchlist = [];
    saveWatchlist();
    renderWatchlist();
    updateDisplays();
});

randomMovieBtn.addEventListener('click', () => {
    if (!watchlist.length) return;
    const random = watchlist[Math.floor(Math.random() * watchlist.length)];
    openMovieDetails(random.imdbID);
});

closeModalBtn.addEventListener('click', () => movieModal.classList.add('hidden'));

function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

async function handleSearch(e) {
    const query = e.target.value.trim();

    if (!query) {
        moviesContainer.innerHTML = `<div class="empty-state"><h2>Search movies</h2></div>`;
        return;
    }

    const res = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=${CONFIG.API_KEY}`);
    const data = await res.json();

    if (data.Response === "True") {
        searchResults = data.Search;
        updateDisplays();
    } else {
        moviesContainer.innerHTML = `<div class="empty-state"><h2>No results</h2></div>`;
    }
}

function updateDisplays() {
    let filtered = searchResults.filter(m => {
        if (typeFilter.value === 'all') return true;
        return m.Type === typeFilter.value;
    });

    filtered.sort((a, b) => {
        const y1 = parseInt(a.Year) || 0;
        const y2 = parseInt(b.Year) || 0;

        switch (sortSelect.value) {
            case 'year-desc': return y2 - y1;
            case 'year-asc': return y1 - y2;
            case 'title-asc': return a.Title.localeCompare(b.Title);
            case 'title-desc': return b.Title.localeCompare(a.Title);
            default: return 0;
        }
    });

    renderMovies(filtered);
}

function renderMovies(movies) {
    if (!movies.length) {
        moviesContainer.innerHTML = `<div class="empty-state"><h2>No matches</h2></div>`;
        return;
    }

    moviesContainer.innerHTML = '';

    movies.forEach(movie => {
        const isAdded = watchlist.some(m => m.imdbID === movie.imdbID);

        const card = document.createElement('div');
        card.className = 'movie-card';

        card.innerHTML = `
            <img src="${movie.Poster}" class="movie-poster">
            <div class="badge-year">${movie.Year}</div>
            <div class="movie-info">
                <div class="movie-title">${movie.Title}</div>
                <div class="movie-meta">
                    <span>${movie.Type}</span>
                    <button class="add-btn ${isAdded ? 'added' : ''}">
                        ${isAdded ? '✓' : '⭐︎'}
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.add-btn').onclick = (e) => {
            e.stopPropagation();
            toggleWatchlist(movie);
        };

        card.onclick = () => openMovieDetails(movie.imdbID);

        moviesContainer.appendChild(card);
    });
}

function toggleWatchlist(movie) {
    const exists = watchlist.some(m => m.imdbID === movie.imdbID);

    if (exists) {
        watchlist = watchlist.filter(m => m.imdbID !== movie.imdbID);
    } else {
        watchlist.push(movie);
    }

    saveWatchlist();
    renderWatchlist();
    updateDisplays();
}

function saveWatchlist() {
    localStorage.setItem('cinepickr_watchlist', JSON.stringify(watchlist));
}

function renderWatchlist() {
    watchlistCount.textContent = watchlist.length;

    if (viewAllLink) {
        viewAllLink.style.display = watchlist.length > SIDEBAR_LIMIT ? 'flex' : 'none';
        const extra = watchlist.length - SIDEBAR_LIMIT;
        viewAllLink.querySelector('ion-icon') && (viewAllLink.title = `+${extra} more`);
    }

    if (!watchlist.length) {
        watchlistContainer.innerHTML = `<div class="empty-watchlist"><p>Your list is empty.</p></div>`;
        return;
    }

    watchlistContainer.innerHTML = '';

    const recent = [...watchlist].reverse().slice(0, SIDEBAR_LIMIT);

    recent.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'watchlist-item';

        const poster = movie.Poster && movie.Poster !== 'N/A'
            ? movie.Poster
            : 'https://via.placeholder.com/40x60?text=?';

        item.innerHTML = `
            <img src="${poster}" class="wl-poster" alt="${movie.Title}">
            <div class="wl-info">
                <div class="wl-title">${movie.Title}</div>
                <div class="wl-meta">${movie.Year}</div>
            </div>
            <button class="wl-remove-btn" title="Remove">✕</button>
        `;

        item.querySelector('.wl-remove-btn').onclick = (e) => {
            e.stopPropagation();
            toggleWatchlist(movie);
        };

        item.onclick = () => openMovieDetails(movie.imdbID);

        watchlistContainer.appendChild(item);
    });
}

async function openMovieDetails(id) {
    movieModal.classList.remove('hidden');
    modalBody.innerHTML = `<p style="padding:20px;">Loading...</p>`;

  const res = await fetch(`https://www.omdbapi.com/?i=${id}&plot=full&apikey=${CONFIG.API_KEY}`);
    const data = await res.json();

    modalBody.innerHTML = `
        <img src="${data.Poster}" class="modal-poster">
        <div class="modal-info">
            <h2 class="modal-title">${data.Title}</h2>
            <p class="modal-plot">${data.Plot}</p>
        </div>
    `;
}

renderWatchlist();



function initTheme() {
    const saved = localStorage.getItem('cinepickr_theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.setAttribute('name', 'sunny-outline');
        themeText.textContent = 'Light Mode';
    }
}
themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('cinepickr_theme', isLight ? 'light' : 'dark');
    themeIcon.setAttribute('name', isLight ? 'sunny-outline' : 'moon-outline');
    themeText.textContent = isLight ? 'Light Mode' : 'Dark Mode';
});
initTheme();