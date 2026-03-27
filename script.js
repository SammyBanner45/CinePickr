const API_KEY = '23dc7de6';
const BASE_URL = 'https://www.omdbapi.com/';
const searchInput = document.getElementById('search-input');
const moviesContainer = document.getElementById('movies-container');


const modalBody = document.getElementById('modal-body');

let searchResults = [];
let watchlist = JSON.parse(localStorage.getItem('cinepickr_watchlist')) || [];

let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length === 0) {
            showEmptyState('Explore movies', 'Type a movie name to search.');
            searchResults = [];
            return;
        }

        debounceTimer = setTimeout(() => {
            fetchMovies(query);
        }, 500);
    });


async function openMovieDetails(imdbID) {
    modalBody.innerHTML = `
        <div style="padding: 40px; width: 100%; text-align: center; color: var(--text-secondary);">
            <ion-icon name="sync-outline" style="animation: spin 1s linear infinite; font-size: 32px; color: var(--accent-color);"></ion-icon>
            <p>Loading details...</p>
        </div>
    `;
    movieModal.classList.remove('hidden');

    try {
        const response = await fetch(`${BASE_URL}?i=${imdbID}&plot=full&apikey=${API_KEY}`);
        const data = await response.json();

        if (data.Response === "True") {
            const isAdded = watchlist.filter(item => item.imdbID === data.imdbID).length > 0;

            modalBody.innerHTML = `
                <img src="${data.Poster !== "N/A" ? data.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}" alt="${data.Title}" class="modal-poster">
                <div class="modal-info">
                    <h2 class="modal-title">${data.Title}</h2>
                    <div class="modal-meta-row">
                        <span class="modal-meta-badge"><ion-icon name="calendar-outline"></ion-icon> ${data.Year}</span>
                        <span class="modal-meta-badge"><ion-icon name="time-outline"></ion-icon> ${data.Runtime}</span>
                        <span class="modal-meta-badge"><ion-icon name="star"></ion-icon> ${data.imdbRating}</span>
                        ${data.BoxOffice && data.BoxOffice !== "N/A" ? `<span class="modal-meta-badge"><ion-icon name="cash-outline"></ion-icon> ${data.BoxOffice}</span>` : ''}
                    </div>
                    <p class="modal-plot">${data.Plot}</p>
                    <div class="modal-details">
                        <div class="details-row"><span>Genre:</span> ${data.Genre}</div>
                        <div class="details-row"><span>Director:</span> ${data.Director}</div>
                        <div class="details-row"><span>Actors:</span> ${data.Actors}</div>
                        ${data.Metascore && data.Metascore !== "N/A" ? `<div class="details-row"><span>Metascore:</span> ${data.Metascore}</div>` : ''}
                    </div>
                    <button id="modal-add-btn" class="action-btn ${isAdded ? 'secondary-btn' : 'primary-btn'}" style="margin-top: 15px; width: max-content; padding: 12px 24px;">
                        <ion-icon name="${isAdded ? 'checkmark-outline' : 'add-outline'}"></ion-icon>
                        ${isAdded ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </button>
                </div>
            `;

            const modalAddBtn = document.getElementById('modal-add-btn');
            modalAddBtn.addEventListener('click', () => {
                toggleWatchlist({
                    imdbID: data.imdbID,
                    Title: data.Title,
                    Year: data.Year,
                    Type: data.Type,
                    Poster: data.Poster
                });

                const nowAdded = watchlist.filter(item => item.imdbID === data.imdbID).length > 0;
                modalAddBtn.className = `action-btn ${nowAdded ? 'secondary-btn' : 'primary-btn'}`;
                modalAddBtn.innerHTML = `
                    <ion-icon name="${nowAdded ? 'checkmark-outline' : 'add-outline'}"></ion-icon>
                    ${nowAdded ? 'Remove from Watchlist' : 'Add to Watchlist'}
                `;
            });

        } else {
            modalBody.innerHTML = `<div style="padding: 40px; text-align: center;">Error loading details.</div>`;
        }
    } catch (err) {
        console.error(err);
        modalBody.innerHTML = `<div style="padding: 40px; text-align: center;">Network error.</div>`;
    }
}
async function fetchMovies(query) {
    showLoadingState();
    try {
        const response = await fetch(`${BASE_URL}?s=${encodeURIComponent(query)}&apikey=${API_KEY}`);
        const data = await response.json();

        if (data.Response === "True") {
            searchResults = data.Search.map(movie => ({
                imdbID: movie.imdbID,
                Title: movie.Title,
                Year: movie.Year,
                Type: movie.Type,
                Poster: movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'
            }));
            updateDisplays();
        } else {
            searchResults = [];
            showEmptyState('No results found', data.Error || 'Try another search term.');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        showEmptyState('Error', 'Failed to fetch movies. Please try again later.');
        searchResults = [];
    }
}

function renderMovies(movies) {
    if (movies.length === 0) {
        showEmptyState('No matches', 'No movies match your current filters.');
        return;
    }

    moviesContainer.innerHTML = '';

    const cardElements = movies.map(movie => {
        const isAdded = watchlist.filter(item => item.imdbID === movie.imdbID).length > 0;

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster" loading="lazy">
            <div class="badge-year"><ion-icon name="calendar-outline"></ion-icon> ${movie.Year}</div>
            <div class="movie-info">
                <div class="movie-title" title="${movie.Title}">${movie.Title}</div>
                <div class="movie-meta">
                    <span style="text-transform: capitalize;">${movie.Type}</span>
                    <button class="add-btn ${isAdded ? 'added' : ''}" data-id="${movie.imdbID}">
                        <ion-icon name="${isAdded ? 'checkmark-outline' : 'add-outline'}"></ion-icon>
                    </button>
                </div>
            </div>
        `;

        const addBtn = card.querySelector('.add-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(movie);
        });

        card.addEventListener('click', () => {
            openMovieDetails(movie.imdbID);
        });
        card.style.cursor = 'pointer';

        return card;
    });

    cardElements.map(node => moviesContainer.appendChild(node));
}