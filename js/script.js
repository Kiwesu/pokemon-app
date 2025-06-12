/* global axios */ // DO NOT REMOVE: This line tells ESLint that 'axios' is a global variable, preventing 'no-undef' errors.

/**
 * @file script.js
 * @description Manages core Pokémon Tracker functionality: data fetching, search, filtering, and UI display.
 * Utilizes Axios for robust HTTP requests.
 */

// --- Global Configuration and Constants ---

/**
 * @constant {string} POKEAPI_URL - Base URL for PokeAPI v2.
 */
const POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon/";

/**
 * @constant {number} TOTAL_POKEMON - Limits fetched Pokémon to Generation 1 (151).
 */
const TOTAL_POKEMON = 151;

/**
 * @constant {Object.<string, string>} typeColors - Map of Pokémon types to hex color codes for UI styling.
 */
const typeColors = {
    fire: '#ff0000', water: '#1E90FF', electric: '#FFD700',
    grass: '#00FF7F', ice: '#00FFFF', psychic: '#EE82EE', fighting: '#8B0000',
    normal: '#A8A77A', bug: '#A6B91A', poison: '#A33EA1', ground: '#E2BF65',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', steel: '#B7B7CE',
    dark: '#705746', fairy: '#D685AD', flying: '#A98FF3'
};

// --- DOM Element References ---

/** @type {HTMLElement} searchInput - Reference to the Pokémon search input field. */
const searchInput = document.getElementById("pokemon-search");

/** @type {HTMLElement} searchBtn - Reference to the search button. */
const searchBtn = document.getElementById("search-btn");

/** @type {HTMLElement} pokemonContainer - Container for displaying main Pokémon cards. */
const pokemonContainer = document.getElementById("pokemon-container");

/** @type {NodeList} filterButtons - Collection of Pokémon type filter buttons. */
const filterButtons = document.querySelectorAll(".type-filter");

/** @type {HTMLElement} suggestionsContainer - Dynamically created container for search suggestions. */
const suggestionsContainer = document.createElement("div");
suggestionsContainer.classList.add("suggestions-container");

// Correctly insert suggestions container after filters section within the main container.
const mainContainer = document.querySelector('.container');
const filtersSection = document.querySelector('.filters');

if (mainContainer && filtersSection) {
    filtersSection.parentNode.insertBefore(suggestionsContainer, filtersSection.nextSibling);
} else {
    console.error("DOM elements for suggestions insertion not found. Appending to body.");
    document.body.appendChild(suggestionsContainer);
}

/** @type {HTMLElement} refreshBtn - Reference to the refresh/reset button. */
const refreshBtn = document.getElementById("refresh-btn");

// --- Global Application State ---

/**
 * @member {Object.<string, Pokemon>} pokemonCache - Cache for fetched Pokémon data (key: normalized name/ID).
 * Prevents redundant API calls.
 */
const pokemonCache = {};

// --- Pokémon Class Definition ---

/**
 * @class Pokemon
 * @description Represents a Pokémon with its data and UI rendering logic.
 */
class Pokemon {
    /**
     * Creates a Pokemon instance.
     * @param {object} data - Raw Pokémon data from PokeAPI.
     * @param {number} data.id - Pokémon ID.
     * @param {string} data.name - Pokémon name.
     * @param {object} data.sprites - Sprite URLs.
     * @param {Array<object>} data.types - Pokémon types.
     * @param {Array<object>} data.stats - Base stats.
     */
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.sprites = data.sprites;
        this.types = data.types;
        this.stats = data.stats;
        this.hp = data.stats.find(stat => stat.stat.name === 'hp').base_stat;
    }

    /**
     * Generates HTML string for a Pokémon card.
     * @returns {string} HTML for the Pokémon card.
     */
    renderCard() {
        const typeNames = this.types.map(t => t.type.name).join(", ");
        return `
            <div class="card-inner">
                <h3>${this.name}</h3>
                <img src="${this.sprites.front_default}" alt="${this.name}">
                <p>Type: ${typeNames}</p>
                <p>HP: ${this.hp}</p>
            </div>
        `;
    }
}

// --- Core Application Functions ---

/**
 * @function fetchPokemon
 * @description Fetches single Pokémon data from PokeAPI or cache.
 * @param {string|number} idOrName - Pokémon ID or name.
 * @returns {Promise<Pokemon|null>} Resolved with Pokemon object or null on failure.
 */
const fetchPokemon = async (idOrName) => {
    const key = String(idOrName).toLowerCase();
    if (pokemonCache[key]) return pokemonCache[key];

    try {
        const response = await axios.get(`${POKEAPI_URL}${key}`);
        const pokemon = new Pokemon(response.data);
        pokemonCache[key] = pokemon;
        return pokemon;
    } catch (error) {
        // Log detailed error information for debugging.
        if (error.response) {
            console.warn(`Fetch error for '${key}': Status ${error.response.status}`, error.response.data);
        } else if (error.request) {
            console.error(`Network error for '${key}': No response received.`, error.request);
        } else {
            console.error(`Axios request setup error for '${key}':`, error.message);
        }
        return null;
    }
};

/**
 * @function fetchSuggestions
 * @description Fetches and displays Pokémon name suggestions based on user input.
 * @param {string} query - Search query string.
 * @returns {Promise<void>}
 */
const fetchSuggestions = async (query) => {
    if (!query) {
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
        suggestionsContainer.classList.remove("visible");
        return;
    }

    try {
        const response = await axios.get(`${POKEAPI_URL}?limit=${TOTAL_POKEMON}&offset=0`);
        const matchingNames = response.data.results.filter(pokemon =>
            pokemon.name.toLowerCase().includes(query.toLowerCase())
        );

        const detailedSuggestions = await Promise.all(
            matchingNames.map(suggestion => fetchPokemon(suggestion.name))
        );
        const validSuggestions = detailedSuggestions.filter(pokemon => pokemon instanceof Pokemon);

        displaySuggestions(validSuggestions);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        suggestionsContainer.innerHTML = "<p>Error loading suggestions.</p>";
        suggestionsContainer.style.display = "flex";
        suggestionsContainer.classList.add("visible");
    }
};

/**
 * @function displaySuggestions
 * @description Clears and displays Pokémon cards as interactive suggestions.
 * @param {Pokemon[]} suggestions - Array of Pokemon objects for suggestions.
 * @returns {void}
 */
const displaySuggestions = (suggestions) => {
    suggestionsContainer.innerHTML = "";

    if (suggestions.length === 0) {
        suggestionsContainer.style.display = "none";
        suggestionsContainer.classList.remove("visible");
        return;
    }

    suggestionsContainer.style.display = "flex";
    suggestionsContainer.classList.add("visible");

    const fragment = document.createDocumentFragment();
    suggestions.forEach(pokemon => {
        const card = document.createElement("div");
        card.className = "pokemon-card";
        card.innerHTML = pokemon.renderCard();

        card.addEventListener("click", () => {
            searchInput.value = pokemon.name;
            searchPokemons(pokemon.name);
            suggestionsContainer.innerHTML = "";
            suggestionsContainer.style.display = "none";
            suggestionsContainer.classList.remove("visible");
        });
        fragment.appendChild(card);
    });

    suggestionsContainer.appendChild(fragment);
    pokemonContainer.style.display = "none";
    pokemonContainer.classList.remove("visible");
};

/**
 * @function displayPokemon
 * @description Clears and displays Pokémon cards in the main container.
 * @param {Pokemon[]} list - Array of Pokemon objects to display.
 * @returns {void}
 */
const displayPokemon = (list) => {
    if (!pokemonContainer) return;

    pokemonContainer.innerHTML = "";
    pokemonContainer.style.display = "flex";
    pokemonContainer.classList.add("visible");

    const fragment = document.createDocumentFragment();
    list.forEach(pokemon => {
        const card = document.createElement("div");
        card.className = "pokemon-card";
        card.innerHTML = pokemon.renderCard();
        fragment.appendChild(card);
    });

    pokemonContainer.appendChild(fragment);

    suggestionsContainer.innerHTML = "";
    suggestionsContainer.style.display = "none";
    suggestionsContainer.classList.remove("visible");
};

/**
 * @function searchPokemons
 * @description Initiates Pokémon search, displaying results or error messages.
 * @param {string} [searchQuery] - Pokémon name or ID. Defaults to search input value.
 * @returns {Promise<void>}
 */
const searchPokemons = async (searchQuery = searchInput.value.trim().toLowerCase()) => {
    if (!searchQuery) {
        pokemonContainer.innerHTML = "<p style='color: red; margin-top: 15px; text-align: center;'>Please type a Pokémon name or ID to search.</p>";
        pokemonContainer.style.display = "flex";
        pokemonContainer.classList.add("visible");
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
        suggestionsContainer.classList.remove("visible");
        return;
    }

    const pokemon = await fetchPokemon(searchQuery);
    if (pokemon) {
        displayPokemon([pokemon]);
    } else {
        pokemonContainer.innerHTML = "<p style='color: red; margin-top: 15px; text-align: center;'>Pokémon not found!</p>";
        pokemonContainer.style.display = "flex";
        pokemonContainer.classList.add("visible");
    }

    suggestionsContainer.innerHTML = "";
    suggestionsContainer.style.display = "none";
    suggestionsContainer.classList.remove("visible");
};

// --- Helper Function ---

/**
 * @function resetSearch
 * @description Resets search input, clears and hides displayed Pokémon and suggestions.
 * @returns {void}
 */
const resetSearch = () => {
    searchInput.value = "";
    pokemonContainer.innerHTML = "";
    pokemonContainer.style.display = "none";
    pokemonContainer.classList.remove("visible");
    suggestionsContainer.innerHTML = "";
    suggestionsContainer.style.display = "none";
    suggestionsContainer.classList.remove("visible");
};

// --- Event Listeners Section ---

/**
 * @description Attaches event listeners to interactive UI elements.
 */

// Type filter buttons: fetch and display Pokémon of selected type.
filterButtons.forEach(btn => {
    btn.addEventListener("click", async (event) => {
        const type = event.currentTarget.dataset.type;
        searchInput.value = "";
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
        suggestionsContainer.classList.remove("visible");

        try {
            const response = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
            const pokemonNamesForType = response.data.pokemon
                .map(p => p.pokemon.name)
                .filter((name, index) => index < TOTAL_POKEMON);

            const detailedPokemons = await Promise.all(
                pokemonNamesForType.map(pokemonName => fetchPokemon(pokemonName))
            );
            const filteredPokemons = detailedPokemons.filter(pokemon => pokemon instanceof Pokemon);

            if (filteredPokemons.length > 0) {
                displayPokemon(filteredPokemons);
            } else {
                pokemonContainer.innerHTML = `<p class='text-white mt-5'>No Pokémon found for type: ${type}.</p>`;
                pokemonContainer.style.display = "flex";
                pokemonContainer.classList.add("visible");
            }
        } catch (error) {
            if (error.response) {
                console.error(`Fetch error for type '${type}': Status ${error.response.status}`, error.response.data);
            } else if (error.request) {
                console.error(`Network error for type '${type}': No response received.`, error.request);
            } else {
                console.error(`Axios request setup error for type '${type}':`, error.message);
            }
            pokemonContainer.innerHTML = "<p class='text-white mt-5'>Error loading Pokémon for this type.</p>";
            pokemonContainer.style.display = "flex";
            pokemonContainer.classList.add("visible");
        }
    });

    // Hover effects for type filter buttons.
    btn.addEventListener("mouseenter", (event) => {
        const type = event.currentTarget.dataset.type;
        event.currentTarget.style.backgroundColor = typeColors[type] || '#3d7dca';
    });

    btn.addEventListener("mouseleave", (event) => {
        event.currentTarget.style.backgroundColor = '#3d7dca';
    });
});

// Search button click event.
searchBtn.addEventListener("click", () => {
    searchPokemons();
});

// Refresh button click event.
refreshBtn.addEventListener("click", () => {
    resetSearch();
});

// Search input: Enter key triggers search.
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchPokemons();
    }
});

// Search input: dynamic suggestions on input change.
searchInput.addEventListener("input", (event) => {
    const query = event.target.value.trim();
    fetchSuggestions(query);
});

// Initial setup: Hide display containers on page load.
window.addEventListener("DOMContentLoaded", () => {
    pokemonContainer.style.display = "none";
    suggestionsContainer.style.display = "none";
    pokemonContainer.classList.remove("visible");
    suggestionsContainer.classList.remove("visible");
});