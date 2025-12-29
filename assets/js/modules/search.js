import GhostContentAPI from "@tryghost/content-api";
import Fuse from 'fuse.js';
import YouTubeSearch from '../youtube-search.js';

class GhostSearch {
  constructor() {
    this.api = null;
    this.fuse = null;
    this.deepFuse = null;
    this.posts = [];
    this.deepPosts = [];
    this.isInitialized = false;
    this.searchInput = null;
    this.resultsContainer = null;
    this.searchTimeout = null;
    this.debounceDelay = 300;
    this.youtubeSearch = new YouTubeSearch();
    this.enableYouTube = false;
    this.isDeep = false;
    this.deepSwitch = null;
  }

  async init() {
    // Get API configuration from the page
    const searchContainer = document.querySelector('.search');
    if (!searchContainer) return;

    const apiUrl = window.location.origin;
    const contentKey = searchContainer.getAttribute('data-content-key') || 
                      document.querySelector('[data-content-key]')?.getAttribute('data-content-key');
    
    if (!contentKey) {
      console.warn('Content API key not found for search');
      return;
    }

    this.api = new GhostContentAPI({
      url: apiUrl,
      key: contentKey,
      version: 'v5.0'
    });

    this.searchInput = searchContainer.querySelector('.search-input');
    this.resultsContainer = searchContainer.querySelector('.search-results__list');
    this.resultsTitle = searchContainer.querySelector('.search-results__title');
    this.deepSwitch = searchContainer.querySelector('.search-deep-switch');
    
    if (!this.searchInput || !this.resultsContainer) {
      console.warn('Search input or results container not found');
      return;
    }

    // Check for YouTube API key and channel ID
    const youtubeApiKey = searchContainer.getAttribute('data-youtube-key');
    const youtubeChannelId = searchContainer.getAttribute('data-youtube-channel-id');
    if (youtubeApiKey && youtubeChannelId) {
      await this.youtubeSearch.init(youtubeApiKey, youtubeChannelId);
      this.enableYouTube = true;
    }

    this.setupEventListeners();

    // Deep search is off by default; no persistence
    this.isDeep = false;
    if (this.deepSwitch) {
      this.deepSwitch.classList.toggle('is-on', this.isDeep);
    }
    this.isInitialized = true;
  }

  setupEventListeners() {
    // Search input with debounce
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value.trim());
      }, this.debounceDelay);
    });


    // Enter key in search input
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch(this.searchInput.value.trim());
      }
    });

    // Deep search toggle
    const btn = document.querySelector('.search-deep-switch');
    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        this.isDeep = !this.isDeep;
        btn.classList.toggle('is-on', this.isDeep);
        if (this.isDeep && !this.deepFuse) {
          // Build deep index lazily
          await this.initializeDeepFuse();
        }

        // Re-run current query if present
        const q = this.searchInput.value.trim();
        if (q.length >= 2) {
          this.performSearch(q);
        }
      });
    }
  }

  async loadPosts() {
    if (this.posts.length > 0) return this.posts;

    try {
      const response = await this.api.posts.browse({
        include: ['tags'],
        limit: 'all',
      });

      this.posts = response || [];
      return this.posts;
    } catch (error) {
      console.error('Failed to load posts for search:', error);
      return [];
    }
  }

  async loadDeepPosts() {
    if (this.deepPosts.length > 0) return this.deepPosts;

    try {
      // Load plaintext lazily for deep search only
      const response = await this.api.posts.browse({
        include: ['tags'],
        limit: 'all',
        formats: ['plaintext']
      });
      // Ensure plaintext exists (fallback to empty string)
      this.deepPosts = (response || []).map(p => ({
        ...p,
        plaintext: typeof p.plaintext === 'string' ? p.plaintext : ''
      }));
      return this.deepPosts;
    } catch (error) {
      console.error('Failed to load deep posts for search:', error);
      return [];
    }
  }

  async initializeFuse() {
    if (this.fuse) return this.fuse;

    const posts = await this.loadPosts();
    if (posts.length === 0) return null;

    this.fuse = new Fuse(posts, {
      includeScore: true,
      minMatchCharLength: 3,
      threshold: 0.25,
      ignoreLocation: true,
      keys: [
        { name: 'title', weight: 0.6 },
        { name: 'custom_excerpt', weight: 0.3 },
        { name: 'primary_tag.name', weight: 0.1 }
      ]
    });

    return this.fuse;
  }

  async initializeDeepFuse() {
    if (this.deepFuse) return this.deepFuse;

    const posts = await this.loadDeepPosts();
    if (posts.length === 0) return null;

    this.deepFuse = new Fuse(posts, {
      includeScore: true,
      minMatchCharLength: 3,
      // Make matches independent of their position in the text so tail matches are not penalized
      ignoreLocation: true,
      findAllMatches: true,
      threshold: 0.25,
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'custom_excerpt', weight: 0.2 },
        { name: 'primary_tag.name', weight: 0.05 },
        { name: 'plaintext', weight: 0.25 }
      ]
    });

    return this.deepFuse;
  }

  async performSearch(query) {
    if (!this.isInitialized) return;

    if (!query || query.length < 2) {
      this.showEmptyState();
      return;
    }

    this.showLoadingState();

    try {
      if (this.enableYouTube) {
        // Combined search with YouTube
        await this.performCombinedSearch(query);
      } else {
        // Ghost posts only
        const fuse = this.isDeep ? await this.initializeDeepFuse() : await this.initializeFuse();
        if (!fuse) {
          this.showErrorState();
          return;
        }

        const results = fuse.search(query, { limit: 10 });
        this.displayResults(results.map(result => result.item));
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.showErrorState();
    }
  }

  showLoadingState() {
    this.showResults();
    this.hideResultsTitle();
    this.resultsContainer.innerHTML = `
      <div class="search-loading">
        <div class="search-loading__spinner"></div>
        <p>Searching...</p>
      </div>
    `;
  }

  showEmptyState() {
    this.hideResults();
    this.hideResultsTitle();
  }

  showResults() {
    const resultsContainer = document.querySelector('.search-results');
    if (resultsContainer) {
      resultsContainer.style.display = 'block';
      // Trigger animation after a small delay to ensure display is set
      setTimeout(() => {
        resultsContainer.classList.add('show');
      }, 10);
    }
  }

  hideResults() {
    const resultsContainer = document.querySelector('.search-results');
    if (resultsContainer) {
      resultsContainer.classList.remove('show');
      // Hide after animation completes
      setTimeout(() => {
        resultsContainer.style.display = 'none';
      }, 300);
    }
  }

  showResultsTitle() {
    if (this.resultsTitle) {
      this.resultsTitle.style.display = 'block';
    }
  }

  hideResultsTitle() {
    if (this.resultsTitle) {
      this.resultsTitle.style.display = 'none';
    }
  }

  showErrorState() {
    this.showResults();
    this.hideResultsTitle();
    this.resultsContainer.innerHTML = `
      <div class="search-error">
        <p>Sorry, search is temporarily unavailable. Please try again later.</p>
      </div>
    `;
  }

  displayResults(posts) {
    if (posts.length === 0) {
      this.showResults();
      this.hideResultsTitle();
      this.resultsContainer.innerHTML = `
        <div class="search-no-results">
          <p>No posts found matching your search.</p>
        </div>
      `;
      return;
    }

    this.showResults();
    this.showResultsTitle();
    const html = posts.map(post => this.renderSearchResult(post)).join('');
    this.resultsContainer.innerHTML = html;
  }

  renderSearchResult(post) {
    const featureImage = post.feature_image ? 
      `<a href="${post.url}" class="search-results-item__image">
        <img src="${post.feature_image}" alt="${post.title}">
      </a>` : '';

    const primaryTag = post.primary_tag ? 
      `<a href="${post.primary_tag.url}" class="search-results-item__tag">${post.primary_tag.name}</a>` : '';

    const readingTime = post.reading_time ? 
      `<span class="search-results-item__reading-time">${post.reading_time} min read</span>` : '';

    const excerpt = post.custom_excerpt ? 
      `<p class="search-results-item__description">${post.custom_excerpt}</p>` : '';

    const date = new Date(post.published_at);
    const dateStr = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });

    return `
      <article class="search-results-item flex items-center">
        <div class="search-results-item__main flex direction-column">
          <div class="search-results-item__meta flex items-center">
            ${primaryTag}
            <time datetime="${date.toISOString().split('T')[0]}" class="search-results-item__date">${dateStr}</time>
            ${readingTime}
          </div>
          <h3 class="search-results-item__title">
            <a href="${post.url}">${post.title}</a>
          </h3>
          ${excerpt}
        </div>
        ${featureImage}
      </article>
    `;
  }

  // Future method for YouTube integration
  async searchYouTube(query) {
    // Placeholder for future YouTube API integration
    console.log('YouTube search not implemented yet:', query);
    return [];
  }

  // Method to combine Ghost and YouTube results
  async performCombinedSearch(query) {
    try {
      // Get Ghost posts
      const fuse = await this.initializeFuse();
      let ghostResults = [];
      if (fuse) {
        const fuseResults = fuse.search(query, { limit: 5 });
        ghostResults = fuseResults.map(result => ({ ...result.item, type: 'ghost' }));
      }

      // Get YouTube videos
      const youtubeResults = await this.youtubeSearch.search(query, { maxResults: 5 });
      const formattedYoutubeResults = youtubeResults.map(video => ({ ...video, type: 'youtube' }));

      // Combine and sort results by relevance
      const allResults = [...ghostResults, ...formattedYoutubeResults];
      
      // Simple sorting: Ghost posts first, then YouTube videos
      allResults.sort((a, b) => {
        if (a.type === 'ghost' && b.type === 'youtube') return -1;
        if (a.type === 'youtube' && b.type === 'ghost') return 1;
        return 0;
      });

      this.displayCombinedResults(allResults);
    } catch (error) {
      console.error('Combined search failed:', error);
      this.showErrorState();
    }
  }

  displayCombinedResults(results) {
    if (results.length === 0) {
      this.showResults();
      this.hideResultsTitle();
      this.resultsContainer.innerHTML = `
        <div class="search-no-results">
          <p>No posts or videos found matching your search.</p>
        </div>
      `;
      return;
    }

    this.showResults();
    this.showResultsTitle();
    const html = results.map(item => {
      if (item.type === 'youtube') {
        return this.youtubeSearch.renderSearchResult(item);
      } else {
        return this.renderSearchResult(item);
      }
    }).join('');

    this.resultsContainer.innerHTML = html;
  }
}

// Initialize search when DOM is ready
export function initSearch() {
  // Only initialize if search popup exists
  const searchPopup = document.querySelector('.search');
  if (!searchPopup) return;

  const search = new GhostSearch();
  search.init();
}

// Global search bar buttons -> open/close search popup
export function initSearchBarButton() {
  const openBtn = document.querySelector('.js-search-open');
  const closeBtn = document.querySelector('.js-search-close');
  const searchPopup = document.querySelector('.search');
  
  if (!openBtn || !closeBtn || !searchPopup) return;

  function openSearch() {
    // Show popup
    searchPopup.classList.add('show');
    // Mark body for global styles
    document.body.classList.add('search-popup-active');

    // Focus input for immediate typing
    const input = searchPopup.querySelector('.search-input');
    if (input) {
      try { input.focus(); } catch (e) {}
    }
  }

  function closeSearch() {
    // Hide popup
    searchPopup.classList.remove('show');
    // Remove body class
    document.body.classList.remove('search-popup-active');
  }

  // Open search popup
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openSearch();
  });

  // Close search popup
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeSearch();
  });

  // Close search popup on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchPopup.classList.contains('show')) {
      closeSearch();
    }
  });
}

