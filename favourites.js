
const favContainer   = document.getElementById('fav-movies-container');
const favSearchInput = document.getElementById('fav-search-input');
const favTypeFilter  = document.getElementById('fav-type-filter');
const favSortSelect  = document.getElementById('fav-sort-select');
const favCountLabel  = document.getElementById('fav-count-label');
const favResultsInfo = document.getElementById('fav-results-info');
const randomBtn      = document.getElementById('random-movie-btn-fav');
const movieModal     = document.getElementById('movie-modal');
const closeModalBtn  = document.getElementById('close-modal-btn');
const modalBody      = document.getElementById('modal-body');
const favThemeBtn    = document.getElementById('fav-theme-btn');
const favThemeIcon   = document.getElementById('fav-theme-icon');
const avatarBtn      = document.getElementById('avatar-btn');
const loginForm      = document.getElementById('login-form');
const loginCloseBtn  = document.getElementById('login-close-btn');

let watchlist = JSON.parse(localStorage.getItem('cinepickr_watchlist')) || [];

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


function initTheme() {
    const saved = localStorage.getItem('cinepickr_theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        favThemeIcon.setAttribute('name', 'sunny-outline');
    }
}

favThemeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('cinepickr_theme', isLight ? 'light' : 'dark');
    favThemeIcon.setAttribute('name', isLight ? 'sunny-outline' : 'moon-outline');
});

function getFiltered() {
    const query = favSearchInput.value.trim().toLowerCase();
    const type  = favTypeFilter.value;

    let list = [...watchlist];

    if (type !== 'all') list = list.filter(m => m.Type === type);

    if (query) list = list.filter(m => m.Title.toLowerCase().includes(query));

    const sort = favSortSelect.value;
    list.sort((a, b) => {
        const y1 = parseInt(a.Year) || 0;
        const y2 = parseInt(b.Year) || 0;
        switch (sort) {
            case 'year-desc':  return y2 - y1;
            case 'year-asc':   return y1 - y2;
            case 'title-asc':  return a.Title.localeCompare(b.Title);
            case 'title-desc': return b.Title.localeCompare(a.Title);
            default: return 0; 
        }
    });

    if (sort === 'default') list.reverse();

    return list;
}

function renderFavourites() {
    const list = getFiltered();

    favCountLabel.textContent = `${watchlist.length} title${watchlist.length !== 1 ? 's' : ''} saved`;
    favResultsInfo.textContent = list.length === watchlist.length
        ? `Showing all ${list.length} title${list.length !== 1 ? 's' : ''}`
        : `Showing ${list.length} of ${watchlist.length} titles`;

    if (!watchlist.length) {
        favContainer.innerHTML = `
            <div class="empty-fav-state">
                <ion-icon name="bookmark-outline"></ion-icon>
                <h2>Nothing saved yet</h2>
                <p>Head to the home page and star some movies to build your collection.</p>
                <a href="index.html" style="align-self:center;width:auto;">
                   
                    Home
                </a>
            </div>`;
        return;
    }

    if (!list.length) {
        favContainer.innerHTML = `
            <div class="empty-fav-state">
                <ion-icon name="search-outline"></ion-icon>
                <h2>No matches</h2>
                <p>Try a different search term or filter.</p>
            </div>`;
        return;
    }

    favContainer.innerHTML = '';
    list.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';

        const poster = movie.Poster && movie.Poster !== 'N/A'
            ? movie.Poster
            : 'https://via.placeholder.com/200x300?text=No+Poster';

        card.innerHTML = `
            <img src="${poster}" class="movie-poster" alt="${movie.Title}">
            <div class="badge-year">${movie.Year}</div>
            <div class="movie-info">
                <div class="movie-title">${movie.Title}</div>
                <div class="movie-meta">
                    <span>${movie.Type}</span>
                    <button class="add-btn added" title="Remove from favourites">✓</button>
                </div>
            </div>
        `;

        card.querySelector('.add-btn').addEventListener('click', e => {
            e.stopPropagation();
            removeFromWatchlist(movie);
        });

        card.addEventListener('click', () => openMovieDetails(movie.imdbID));

        favContainer.appendChild(card);
    });
}

function removeFromWatchlist(movie) {
    watchlist = watchlist.filter(m => m.imdbID !== movie.imdbID);
    localStorage.setItem('cinepickr_watchlist', JSON.stringify(watchlist));
    renderFavourites();
}

async function openMovieDetails(id) {
    movieModal.classList.remove('hidden');
    modalBody.innerHTML = `<p style="padding:30px;color:var(--text-primary)">Loading…</p>`;

    const res  = await fetch(`https://www.omdbapi.com/?i=${id}&plot=full&apikey=${CONFIG.API_KEY}`);
    const data = await res.json();

    modalBody.innerHTML = `
        <img src="${data.Poster}" class="modal-poster" alt="${data.Title}">
        <div class="modal-info">
            <h2 class="modal-title">${data.Title}</h2>
            <p class="modal-plot">${data.Plot}</p>
        </div>
    `;
}

closeModalBtn.addEventListener('click', () => movieModal.classList.add('hidden'));
movieModal.addEventListener('click', e => {
    if (e.target === movieModal) movieModal.classList.add('hidden');
});

randomBtn.addEventListener('click', () => {
    if (!watchlist.length) {
        alert('Your favourites list is empty — add some movies first!');
        return;
    }
    const pick = watchlist[Math.floor(Math.random() * watchlist.length)];

    randomBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { randomBtn.style.transform = ''; }, 150);

    openMovieDetails(pick.imdbID);
});

favSearchInput.addEventListener('input', renderFavourites);
favTypeFilter.addEventListener('change', renderFavourites);
favSortSelect.addEventListener('change', renderFavourites);

initTheme();
renderFavourites();
