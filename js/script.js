/* global axios */ // DO NOT REMOVE: This line tells ESLint that 'axios' is a global variable, preventing 'no-undef' errors. Our ESLint configuration seems to be stubborn in recognising it.

/**
 * @file script.js
 * @description Manages the core functionality of the Pokémon Tracker application,
 * including fetching, searching, filtering, and displaying Pokémon data.
 * This script serves as the main entry point for the application's interactive features,
 * now utilizing Axios for robust HTTP requests.
 */

// --- Global Configuration and Constants ---

/**
 * @constant {string} POKEAPI_URL - The base URL for the PokeAPI v2 endpoint.
 * This URL is used to fetch Pokémon data.
 */
const POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon/";

/**
 * @constant {number} TOTAL_POKEMON - Limits the number of Pokémon to fetch, primarily for filtering and suggestions.
 * Set to 151 to focus on Generation 1 Pokémon.
 */
const TOTAL_POKEMON = 151;

/**
 * @constant {Object.<string, string>} typeColors - A map of Pokémon type names to their corresponding hexadecimal color codes.
 * Used for visual styling of type-related elements, like filter buttons.
 */
const typeColors = {
    fire: '#ff0000', water: '#1E90FF', electric: '#FFD700',
    grass: '#00FF7F', ice: '#00FFFF', psychic: '#EE82EE', fighting: '#8B0000',
    normal: '#A8A77A', bug: '#A6B91A', poison: '#A33EA1', ground: '#E2BF65',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', steel: '#B7B7CE',
    dark: '#705746', fairy: '#D685AD', flying: '#A98FF3'
};

// --- DOM Element References (Members) ---

/**
 * @member {HTMLElement} searchInput - Reference to the Pokémon search input field.
 */
const searchInput = document.getElementById("pokemon-search");

/**
 * @member {HTMLElement} searchBtn - Reference to the search button.
 */
const searchBtn = document.getElementById("search-btn");

/**
 * @member {HTMLElement} pokemonContainer - Reference to the container where Pokémon cards are displayed.
 */
const pokemonContainer = document.getElementById("pokemon-container");

/**
 * @member {NodeList} filterButtons - A collection of all Pokémon type filter buttons.
 */
const filterButtons = document.querySelectorAll(".type-filter");

/**
 * @member {HTMLElement} suggestionsContainer - A dynamically created container for displaying Pokémon search suggestions.
 */
const suggestionsContainer = document.createElement("div");
suggestionsContainer.classList.add("suggestions-container");
suggestionsContainer.classList.add("row", "justify-content-center");
/**
 * Inserts the suggestions container right after the search input's parent.
 * This placement ensures suggestions appear visually close to the search bar.
 */
searchInput.parentNode.insertBefore(suggestionsContainer, searchInput.parentNode.querySelector('.filters'));

/**
 * @member {HTMLElement} refreshBtn - Reference to the refresh/reset button.
 * This button clears the search and displayed Pokémon.
 */
const refreshBtn = document.getElementById("refresh-btn");

// --- Global Application State (Members) ---

/**
 * @member {Object.<string, Pokemon>} pokemonCache - A global cache object to store fetched Pokémon data.
 * This prevents redundant API calls for already retrieved Pokémon, improving performance.
 * Keys are normalized Pokémon names or IDs (lowercase strings), values are `Pokemon` objects.
 */
const pokemonCache = {};

// --- Pokémon Class Definition ---

/**
 * @class Pokemon
 * @description Represents a Pokémon with its properties and methods to render its UI card.
 * This class encapsulates Pokémon data and presentation logic following OOP principles.
 */
class Pokemon {
    /**
     * Creates an instance of Pokemon.
     * @param {Object} data - The raw Pokémon data object received directly from the PokeAPI.
     * @property {number} data.id - The unique ID of the Pokémon.
     * @property {string} data.name - The name of the Pokémon.
     * @property {Object} data.sprites - An object containing various sprite URLs for the Pokémon.
     * @property {Array<Object>} data.types - An array of objects describing the Pokémon's types.
     * @property {Array<Object>} data.stats - An array of objects describing the Pokémon's base stats.
     */
    constructor(data) {
        /**
         * @member {number} Pokemon#id - The unique identifier for the Pokémon.
         */
        this.id = data.id;
        /**
         * @member {string} Pokemon#name - The name of the Pokémon.
         */
        this.name = data.name;
        /**
         * @member {Object} Pokemon#sprites - Contains URLs for different visual representations of the Pokémon.
         */
        this.sprites = data.sprites;
        /**
         * @member {Array<Object>} Pokemon#types - An array detailing the Pokémon's elemental types.
         */
        this.types = data.types;
        /**
         * @member {Array<Object>} Pokemon#stats - An array of the Pokémon's base stats (e.g., HP, attack, defense).
         */
        this.stats = data.stats;
        /**
         * @member {number} Pokemon#hp - The base HP (Hit Points) of the Pokémon.
         */
        this.hp = data.stats.find(stat => stat.stat.name === 'hp').base_stat;
    }

    /**
     * Generates and returns the HTML string for a Pokémon card.
     * This method leverages the Pokémon's properties to construct a displayable card.
     * @returns {string} The HTML string representing the Pokémon card's structure and data.
     */
    renderCard() {
        /**
         * @member {string} typeNames - A comma-separated string of the Pokémon's types.
         * @private
         */
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
 * @description Fetches a single Pokémon's data from PokeAPI using **Axios** or retrieves it from cache if already fetched.
 * This prevents redundant API calls and improves application performance.
 * @param {string|number} idOrName - The ID (e.g., "25") or name (e.g., "pikachu") of the Pokémon to fetch.
 * @returns {Promise<Pokemon|null>} A Promise that resolves to a `Pokemon` object if successful, otherwise `null` if fetching fails or Pokémon is not found.
 */
const fetchPokemon = async (idOrName) => {
    /**
     * @member {string} key - The normalized (lowercase string) identifier used for caching and API requests.
     * @private
     */
    const key = String(idOrName).toLowerCase();

    // Check if the Pokémon data is already in the cache.
    if (pokemonCache[key]) {
        return pokemonCache[key]; // Return cached Pokemon object
    }

    try {
        /**
         * @member {Object} response - The Axios response object from the PokeAPI.
         * @private
         */
        const response = await axios.get(`${POKEAPI_URL}${key}`);
        /**
         * @member {Object} data - The raw Pokémon data directly from `response.data`.
         * @private
         */
        const data = response.data;
        /**
         * @member {Pokemon} pokemon - An instance of the Pokemon class created from the fetched data.
         * @private
         */
        const pokemon = new Pokemon(data);
        pokemonCache[key] = pokemon; // Cache the Pokemon object
        return pokemon;
    } catch (error) {
        // Enhanced Axios error handling for specific scenarios
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx (e.g., 404 Not Found)
            if (error.response.status === 404) {
                console.warn(`Pokémon '${key}' not found (Status: 404).`);
            } else {
                console.error(`Error fetching Pokémon ${key}:`, error.response.status, error.response.data);
            }
        } else if (error.request) {
            // The request was made but no response was received (e.g., network error)
            console.error("No response received from PokeAPI:", error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error setting up Axios request:", error.message);
        }
        return null; // Return null if fetching fails
    }
};

/**
 * @function fetchSuggestions
 * @description Fetches and displays Pokémon name suggestions based on user input in the search bar, using **Axios**.
 * It currently fetches a subset of all Pokémon (Gen 1) and filters locally.
 * @param {string} query - The search query string entered by the user.
 * @returns {Promise<void>} A Promise that resolves when suggestions are fetched and displayed, or an error occurs.
 */
const fetchSuggestions = async (query) => {
    // Hide suggestions if the query is empty.
    if (!query) {
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
        return;
    }

    try {
        // Fetch a broader list or consider a more efficient suggestion API if available
        // For simplicity, fetching first 151 and filtering locally.
        /**
         * @member {Object} response - The Axios response object for the list of Pokémon.
         * @private
         */
        const response = await axios.get(`${POKEAPI_URL}?limit=${TOTAL_POKEMON}&offset=0`);
        /**
         * @member {Object} data - The parsed JSON data containing the list of Pokémon names from `response.data`.
         * @private
         */
        const data = response.data;

        // Filter Pokémon names that include the query.
        /**
         * @member {Array<Object>} matchingNames - An array of Pokémon objects whose names match the query.
         * @private
         */
        const matchingNames = data.results.filter(pokemon =>
            pokemon.name.toLowerCase().includes(query.toLowerCase())
        );

        // Fetch detailed data for each matching suggestion concurrently.
        /**
         * @member {Array<Promise<Pokemon|null>>} detailedSuggestions - An array of Promises, each resolving to a detailed Pokemon object or null.
         * @private
         */
        const detailedSuggestions = await Promise.all(
            matchingNames.map(suggestion => fetchPokemon(suggestion.name))
        );

        // Filter out any null results (Pokémon that couldn't be fetched) to ensure valid Pokemon objects.
        /**
         * @member {Pokemon[]} validSuggestions - An array of valid Pokemon objects for display.
         * @private
         */
        const validSuggestions = detailedSuggestions.filter(pokemon => pokemon instanceof Pokemon);

        displaySuggestions(validSuggestions);
    } catch (error) {
        // Generic error handling for suggestions fetch
        console.error("Error fetching suggestions:", error);
        suggestionsContainer.innerHTML = "<p>Error loading suggestions.</p>";
        suggestionsContainer.style.display = "flex";
    }
};

/**
 * @function displaySuggestions
 * @description Clears existing suggestions and displays a list of Pokémon as interactive cards
 * within the suggestions container.
 * @param {Pokemon[]} suggestions - An array of `Pokemon` objects to display as suggestions.
 * Each object should have a `renderCard()` method.
 * @returns {void}
 */
const displaySuggestions = (suggestions) => {
    suggestionsContainer.innerHTML = ""; // Clear previous suggestions

    // Hide suggestions container if no suggestions are provided.
    if (suggestions.length === 0) {
        suggestionsContainer.style.display = "none";
        return;
    }

    suggestionsContainer.style.display = "flex"; // Show suggestions container using flexbox for layout

    /**
     * @member {DocumentFragment} fragment - A lightweight DOM object used to build the list of cards
     * before appending them to the live DOM, optimizing performance.
     * @private
     */
    const fragment = document.createDocumentFragment();

    suggestions.forEach(pokemon => {
        /**
         * @member {HTMLElement} card - The div element representing a single Pokémon card.
         * @private
         */
        const card = document.createElement("div");
        card.className = "pokemon-card col-auto"; // Add Bootstrap column class for responsiveness
        card.innerHTML = pokemon.renderCard(); // Use the Pokemon object's renderCard method

        // Add a click listener to select the suggested Pokémon.
        card.addEventListener("click", () => {
            searchInput.value = pokemon.name; // Set input to the clicked suggestion
            searchPokemons(pokemon.name);      // Perform search with the selected suggestion
            suggestionsContainer.innerHTML = ""; // Clear suggestions after selection
            suggestionsContainer.style.display = "none"; // Hide suggestions container
        });
        fragment.appendChild(card);
    });

    suggestionsContainer.appendChild(fragment);
    pokemonContainer.style.display = "none"; // Hide main results when suggestions are active
};

/**
 * @function displayPokemon
 * @description Clears the main Pokémon container and displays a list of Pokémon as cards within it.
 * @param {Pokemon[]} list - An array of `Pokemon` objects to display.
 * Each object is expected to have a `renderCard()` method.
 * @returns {void}
 */
const displayPokemon = (list) => {
    // Prevent execution if the Pokémon container element is not found.
    if (!pokemonContainer) return;

    pokemonContainer.innerHTML = ""; // Clear previous results
    /**
     * @member {DocumentFragment} fragment - A lightweight DOM object used to build the list of cards
     * before appending them to the live DOM, optimizing performance.
     * @private
     */
    const fragment = document.createDocumentFragment();

    list.forEach(pokemon => {
        /**
         * @member {HTMLElement} card - The div element representing a single Pokémon card.
         * @private
         */
        const card = document.createElement("div");
        card.className = "pokemon-card col-auto"; // Add Bootstrap column class for responsiveness
        card.innerHTML = pokemon.renderCard(); // Use the Pokemon object's renderCard method
        fragment.appendChild(card);
    });

    pokemonContainer.appendChild(fragment);

    // Show the container after displaying Pokémon cards, using flex display for card arrangement.
    pokemonContainer.style.display = "flex";
    suggestionsContainer.style.display = "none"; // Hide suggestions when main results are shown
};

/**
 * @function searchPokemons
 * @description Initiates a search for a Pokémon based on the provided query or the current input field value.
 * Displays the result in the main Pokémon container or an error message if not found or no input.
 * @param {string} [searchQuery=searchInput.value.trim().toLowerCase()] - The Pokémon name or ID to search for.
 * If not provided, it defaults to the current trimmed, lowercase value of the search input field.
 * @returns {Promise<void>} A Promise that resolves when the search operation is complete.
 */
const searchPokemons = async (searchQuery = searchInput.value.trim().toLowerCase()) => {
    // Check if the search query is empty and display an error if it is.
    if (!searchQuery) {
        pokemonContainer.innerHTML = "<p style='color: red; margin-top: 15px; text-align: center;'>Please type a Pokémon name or ID to search.</p>";
        pokemonContainer.style.display = "flex"; // Ensure the container is visible to show the message
        suggestionsContainer.innerHTML = ""; // Clear any lingering suggestions
        suggestionsContainer.style.display = "none";
        return; // Stop function execution as no search can be performed
    }

    /**
     * @member {Pokemon|null} pokemon - The fetched `Pokemon` object or `null` if not found.
     * @private
     */
    const pokemon = await fetchPokemon(searchQuery);
    if (pokemon) {
        displayPokemon([pokemon]); // Display the single fetched Pokémon object
    } else {
        // Display a "Pokémon not found!" message if a search was performed but yielded no result.
        pokemonContainer.innerHTML = "<p style='color: red; margin-top: 15px; text-align: center;'>Pokémon not found!</p>";
        pokemonContainer.style.display = "flex"; // Show container with message
    }

    // Clear and hide suggestions after a direct search has been performed.
    suggestionsContainer.innerHTML = "";
    suggestionsContainer.style.display = "none";
};

// --- Helper Function ---

/**
 * @function resetSearch
 * @description Resets the search input field, clears any currently displayed Pokémon cards,
 * and hides both the main Pokémon container and the suggestions container.
 * @returns {void}
 */
const resetSearch = () => {
    searchInput.value = ""; // Clear the search input field
    pokemonContainer.innerHTML = ""; // Clear displayed Pokémon cards
    pokemonContainer.style.display = "none"; // Hide the main Pokémon container
    suggestionsContainer.innerHTML = ""; // Clear suggestions
    suggestionsContainer.style.display = "none"; // Hide suggestions container
    // Future Enhancement: You might want to clear any active filters here too if applicable,
    // for example, by removing an active state from type filter buttons.
};

// --- Event Listeners Section ---

/**
 * @description This section defines and attaches all necessary event listeners
 * to interactive elements within the Pokémon Tracker application.
 */

/**
 * @description Iterates over each type filter button and attaches event listeners for
 * click, mouseenter, and mouseleave events to handle filtering and visual feedback.
 */
filterButtons.forEach(btn => {
    /**
     * @method click - Event listener for type filter button clicks.
     * @description Fetches all Pokémon of the selected type and displays them in the main container.
     * Clears any active search input or suggestions before filtering.
     * @param {Event} event - The DOM click event object.
     */
    btn.addEventListener("click", async (event) => {
        /**
         * @member {string} type - The Pokémon type derived from the button's `data-type` attribute.
         * @private
         */
        const type = event.currentTarget.dataset.type;

        // Clear search input and suggestions when a type filter is applied.
        searchInput.value = "";
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";

        try {
            // Fetch all Pokémon associated with the clicked type using Axios.
            /**
             * @member {Object} response - The Axios response object for the type-specific Pokémon list.
             * @private
             */
            const response = await axios.get(`https://pokeapi.co/api/v2/type/${type}`);
            /**
             * @member {Object} data - The parsed JSON data containing the list of Pokémon for the specified type from `response.data`.
             * @private
             */
            const data = response.data;

            // Extract Pokémon names from the type data, limiting to TOTAL_POKEMON (Gen 1).
            /**
             * @member {Array<string>} pokemonNamesForType - An array of Pokémon names belonging to the selected type.
             * @private
             */
            const pokemonNamesForType = data.pokemon
                .map(p => p.pokemon.name)
                .filter((name, index) => index < TOTAL_POKEMON);

            // Fetch detailed data for each Pokémon of this type concurrently.
            /**
             * @member {Array<Promise<Pokemon|null>>} detailedPokemons - An array of Promises, each resolving to a detailed Pokemon object or null.
             * @private
             */
            const detailedPokemons = await Promise.all(
                pokemonNamesForType.map(pokemonName => fetchPokemon(pokemonName))
            );

            // Filter out any null results (Pokémon that couldn't be fetched successfully).
            /**
             * @member {Pokemon[]} filteredPokemons - An array of valid Pokemon objects of the selected type.
             * @private
             */
            const filteredPokemons = detailedPokemons.filter(pokemon => pokemon instanceof Pokemon);

            if (filteredPokemons.length > 0) {
                displayPokemon(filteredPokemons); // Display the filtered Pokémon objects
            } else {
                pokemonContainer.innerHTML = `<p class='text-white mt-5'>No Pokémon found for type: ${type}.</p>`;
                pokemonContainer.style.display = "flex";
            }
        } catch (error) {
            // Enhanced Axios error handling for type filtering
            if (error.response) {
                console.error(`Error fetching Pokémon for type '${type}':`, error.response.status, error.response.data);
            } else if (error.request) {
                console.error("No response received for type fetch:", error.request);
            } else {
                console.error("Error setting up Axios request for type fetch:", error.message);
            }
            pokemonContainer.innerHTML = "<p class='text-white mt-5'>Error loading Pokémon for this type.</p>";
            pokemonContainer.style.display = "flex";
        }
    });

    /**
     * @method mouseenter - Event listener for mouse entering a type filter button.
     * @description Changes the background color of the button to its corresponding Pokémon type color.
     * @param {Event} event - The DOM mouseenter event object.
     */
    btn.addEventListener("mouseenter", (event) => {
        /**
         * @member {string} type - The Pokémon type obtained from the button's `data-type` attribute.
         * @private
         */
        const type = event.currentTarget.dataset.type;
        event.currentTarget.style.backgroundColor = typeColors[type] || '#3d7dca'; // Default if type color not found
    });

    /**
     * @method mouseleave - Event listener for mouse leaving a type filter button.
     * @description Resets the background color of the button to its default secondary color.
     * @param {Event} event - The DOM mouseleave event object.
     */
    btn.addEventListener("mouseleave", (event) => {
        event.currentTarget.style.backgroundColor = '#3d7dca'; // Reset to default blue
    });
});

/**
 * @description Event listener for the main search button.
 * Triggers the Pokémon search functionality when clicked.
 * @param {Event} event - The DOM click event object.
 */
searchBtn.addEventListener("click", () => {
    searchPokemons();
});

// --- ADDED EVENT LISTENER FOR REFRESH BUTTON ---
/**
 * @description Event listener for the refresh/reset button.
 * Triggers the `resetSearch` function when clicked, clearing the UI.
 * @param {Event} event - The DOM click event object.
 */
refreshBtn.addEventListener("click", () => {
    resetSearch();
});

/**
 * @description Event listener for keydown events on the search input field.
 * Triggers the Pokémon search functionality when the "Enter" key is pressed.
 * @param {KeyboardEvent} event - The keyboard event object, containing information about the key pressed.
 */
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchPokemons();
    }
});

/**
 * @description Event listener for input changes in the search input field.
 * Triggers fetching and displaying of Pokémon suggestions dynamically based on the current query.
 * @param {Event} event - The DOM input event object.
 */
searchInput.addEventListener("input", (event) => {
    /**
     * @member {string} query - The current trimmed value of the search input field.
     * @private
     */
    const query = event.target.value.trim();
    fetchSuggestions(query);
});

/**
 * @description Initial setup when the DOM (Document Object Model) is fully loaded.
 * Ensures that the main Pokémon display containers are hidden on initial page load,
 * providing a clean starting UI.
 * @param {Event} event - The DOMContentLoaded event object.
 */
window.addEventListener("DOMContentLoaded", () => {
    pokemonContainer.style.display = "none"; // Hide main Pokémon results container
    suggestionsContainer.style.display = "none"; // Hide suggestions container
});