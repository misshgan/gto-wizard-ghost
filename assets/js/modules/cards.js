import GhostContentAPI from "@tryghost/content-api";
// Cards List Component Manager
export class CardsListManager {
  constructor() {
    this.config = window.GhostConfig || {};
    this.sections = new Map();
    this.init();
  }

  init() {
    const sections = document.querySelectorAll('.cards-list[data-scenario]');
  if (!sections.length) return;

  sections.forEach((section) => {
      const scenario = section.getAttribute('data-scenario');
      const manager = this.createScenarioManager(section, scenario);
      if (manager) {
        this.sections.set(section, manager);
        manager.init();
      }
    });
  }

  createScenarioManager(section, scenario) {
    switch (scenario) {
      case 'articles':
        return new ArticlesCardsManager(section, this.config);
      case 'videos':
        return new VideosCardsManager(section, this.config);
      case 'mixed':
        return new MixedCardsManager(section, this.config);
      case 'author':
        return new AuthorCardsManager(section, this.config);
      default:
        console.warn(`Unknown cards-list scenario: ${scenario}`);
        return null;
    }
  }
}

// Base class for all scenario managers
export class BaseCardsManager {
  constructor(section, config) {
    this.section = section;
    this.config = config;
    this.api = new GhostContentAPI({
      url: config.apiUrl,
      key: config.contentKey,
      version: 'v5.0'
    });

    this.cardType = section.getAttribute('data-card-type') || 'small';
    this.cardClass = section.getAttribute('data-card-class') || '';
    this.limit = section.getAttribute('data-limit') || '4';
    this.infiniteScroll = section.getAttribute('data-infinite-scroll') === 'true';
    this.articlesContainer = section.querySelector('.cards-list__articles');
    this.filterList = section.querySelector('.cards-filter__list');
    
    // State
    this.isLoading = false;
    this.currentPage = 1;
    this.hasMorePosts = true;
    this.allPosts = [];
  }

  init() {
    this.setupEventListeners();
    this.loadInitialContent();
    this.setupInfiniteScroll();
    
    // Check if we need to load more content immediately after initial load
    // This handles cases where the page is tall enough that user can see the end
    setTimeout(() => {
      this.checkAndLoadMoreIfNeeded();
    }, 100);
  }

  /**
   * Check if we're near the bottom of the page and load more content if needed
   */
  checkAndLoadMoreIfNeeded() {
    if (!this.infiniteScroll || this.isLoading || !this.hasMorePosts) {
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // If we're already near the bottom (within 400px), load more immediately
    if (scrollTop + windowHeight >= documentHeight - 400) {
      this.loadMorePosts();
    }
  }

  setupEventListeners() {
    // Override in subclasses
  }

  loadInitialContent() {
    // Override in subclasses
    // By default, do nothing - let server-rendered content stay
  }

  setupInfiniteScroll() {
    if (!this.infiniteScroll) return;
    
    // Add scroll listener for infinite scroll with proper binding
    this.scrollHandler = () => this.handleScroll();
    window.addEventListener('scroll', this.scrollHandler);
  }

  handleScroll() {
    if (!this.infiniteScroll || this.isLoading || !this.hasMorePosts) {
      return;
    }
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Load more when user is 200px from bottom
    if (scrollTop + windowHeight >= documentHeight - 200) {
      this.loadMorePosts();
    }
  }

  async loadMorePosts() {
    // Override in subclasses
  }

  renderCard(post) {
    const featureImage = post.feature_image ? 
      `<a href="${post.url}" class="card__image"><img data-src="${post.feature_image}" class="lazyload" alt="${post.title}"></a>` : '';
    
      const primaryTagName = post.primary_tag ? post.primary_tag.name : '';
    const tagHtml = primaryTagName ? `<span class="card__tag">${primaryTagName}</span>` : '';
    
    const readingTime = post.reading_time ? 
      `<span class="card__reading-time">${post.reading_time} min read</span>` : '';
    
      const date = new Date(post.published_at);
    const dateStr = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });

    if (this.cardType === 'default') {
      const excerpt = post.custom_excerpt ? 
        `<p class="card__description">${post.custom_excerpt}</p>` : '';

      return `
        <article class="card card--default flex direction-column ${this.cardClass}">
          ${featureImage}
          <div class="card__main flex direction-column">
            <h3 class="card__title"><a href="${post.url}">${post.title}</a></h3>
            ${excerpt}
            <div class="card__footer flex items-center">
            ${tagHtml}
              <div class="card__meta flex items-center">
                <span class="card__date">${dateStr}</span>
              ${readingTime}
              </div>
            </div>
          </div>
        </article>`;
    } else {
      return `
        <article class="card card--small flex items-center ${this.cardClass}">
          ${featureImage}
          <div class="card__main flex">
            <h3 class="card__title"><a href="${post.url}">${post.title}</a></h3>
              ${tagHtml}
            <div class="card__meta flex items-center">
              <span class="card__date">${dateStr}</span>
                ${readingTime}
            </div>
          </div>
        </article>`;
    }
  }

  renderPosts(posts, append = false) {
    const html = posts.map(post => this.renderCard(post)).join('');

    if (append) {
      this.articlesContainer.insertAdjacentHTML('beforeend', html);
      // Check if we need to load more after appending
      setTimeout(() => {
        this.checkAndLoadMoreIfNeeded();
      }, 100);
    } else {
      // Always animate content replacement for better UX
      this.articlesContainer.style.opacity = '0';
      this.articlesContainer.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        this.articlesContainer.innerHTML = html || '<p>No posts found.</p>';
        this.articlesContainer.style.opacity = '1';
        this.articlesContainer.style.transform = 'translateY(0)';
        // Check if we need to load more after rendering
        setTimeout(() => {
          this.checkAndLoadMoreIfNeeded();
        }, 100);
      }, 200);
    }
  }
}

// Articles-only scenario
export class ArticlesCardsManager extends BaseCardsManager {
  constructor(section, config) {
    super(section, config);
    this.formats = section.getAttribute('data-formats') || '';
    this.types = section.getAttribute('data-types') || '';
    this.filterByAuthors = section.getAttribute('data-filter-by-authors') === 'true';
    
    // Filter state
    this.selectedFormats = [];
    this.selectedTypes = [];
    this.selectedAuthors = [];
    this.allFormats = [];
    this.allTypes = [];
    this.allAuthors = [];
  }

  setupEventListeners() {
    super.setupEventListeners();
    
    // Filter buttons
    if (this.filterList) {
      this.filterList.addEventListener('click', (e) => {
        const button = e.target.closest('button.cards-filter__item-button');
        if (!button) return;
        e.preventDefault();
        this.handleFilterClick(button);
      });
    }

    // Filter popup
    this.setupFilterPopup();
  }

  loadInitialContent() {
    // Don't load content on init - let server-rendered content stay
    // Preload filter data to prevent popup jump when opening
    this.preloadFilterData();
  }

  async preloadFilterData() {
    // Preload all filter data in parallel to prevent popup jump
    const promises = [this.loadFormats()];
    
    if (this.types) {
      promises.push(this.loadTypes());
    }
    
    if (this.filterByAuthors) {
      promises.push(this.loadAuthors());
    }
    
    await Promise.all(promises);
  }

  async loadFormats() {
    try {
      const response = await this.api.tags.browse({
        filter: `slug:[${this.formats}]`,
        limit: 'all'
      });
      
      this.allFormats = response.map(tag => ({
        slug: tag.slug,
        name: tag.name
      }));
      
      this.renderFormatsList();
    } catch (error) {
      console.error('Failed to load formats:', error);
    }
  }

  renderFormatsList() {
    const formatsList = this.section.querySelector('#formats-list');
    if (!formatsList) return;

    const html = this.allFormats.map(format => {
      const isSelected = this.selectedFormats.some(selected => selected.slug === format.slug);
      return `
        <label class="filter-popup__option">
          <input type="checkbox" class="filter-popup__checkbox" data-format-slug="${format.slug}" ${isSelected ? 'checked' : ''}>
          <span class="filter-popup__text">${format.name}</span>
        </label>
      `;
      }).join('');

    formatsList.innerHTML = html;
  }

  setupFilterPopup() {
    const filterButton = this.section.querySelector('.cards-filter__button');
    const popup = this.section.querySelector('.filter-popup');
    
    if (!filterButton || !popup) return;

    filterButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePopup();
    });

    // Handle checkbox changes
    popup.addEventListener('change', (e) => {
      if (e.target.classList.contains('filter-popup__checkbox')) {
        this.handleFilterChange();
      }
    });

    // Handle reset button
    const resetButton = popup.querySelector('.filter-popup__cancel-btn');
    if (resetButton) {
      resetButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetAllFilters();
      });
    }

    // Handle click outside popup
    document.addEventListener('click', (e) => {
      const popupContainer = this.section.querySelector('.cards-filter__popup-container');
      if (popup && popup.classList.contains('show') && !popupContainer.contains(e.target)) {
        this.closePopup();
      }
    });
  }

  togglePopup() {
    const popup = this.section.querySelector('.filter-popup');
    if (!popup) return;

    const isVisible = popup.classList.contains('show');
    
    if (isVisible) {
      this.closePopup();
    } else {
      popup.classList.add('show');
      this.loadFilterData();
    }
    
    this.updateFilterButton();
  }

  closePopup() {
    const popup = this.section.querySelector('.filter-popup');
    if (popup) {
      popup.classList.remove('show');
      this.updateFilterButton();
    }
  }

  loadFilterData() {
    // Data should already be preloaded, just render it
    this.renderFormatsList();
    if (this.types) {
      this.renderTypesList();
    }
    if (this.filterByAuthors) {
      this.renderAuthorsList();
    }
  }

  resetAllFilters() {
    this.selectedFormats = [];
    this.selectedTypes = [];
    this.selectedAuthors = [];
    
    // Uncheck all checkboxes
    const allCheckboxes = this.section.querySelectorAll('.filter-popup__checkbox');
    allCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    // Update main buttons
    this.updateMainFormatButtons();
    
    // Close popup
    this.closePopup();
    
    // Reload content
    this.loadPostsByTag('all');
  }

  async loadTypes() {
    if (!this.types) return;
    
    try {
      const typeSlugs = this.types.split(',');
      this.allTypes = typeSlugs.map(slug => ({
        slug: slug.trim(),
        name: slug.trim().charAt(0).toUpperCase() + slug.trim().slice(1).replace(/-/g, ' ')
      }));
      this.renderTypesList();
    } catch (error) {
      console.error('Failed to load types:', error);
    }
  }

  async loadAuthors() {
    try {
      const response = await this.api.posts.browse({
        include: ['authors'],
        limit: 'all',
        filter: `tag:[${this.formats}]`
      });
      
      const authorsMap = new Map();
      response.forEach(post => {
        if (post.authors) {
          post.authors.forEach(author => {
            if (!authorsMap.has(author.slug)) {
              authorsMap.set(author.slug, {
                slug: author.slug,
                name: author.name
              });
            }
          });
        }
      });
      
      this.allAuthors = Array.from(authorsMap.values());
      this.renderAuthorsList();
    } catch (error) {
      console.error('Failed to load authors:', error);
    }
  }

  renderTypesList() {
    const typesList = this.section.querySelector('#types-list');
    if (!typesList) return;

    const html = this.allTypes.map(type => {
      const isSelected = this.selectedTypes.some(selected => selected.slug === type.slug);
      return `
        <label class="filter-popup__option">
          <input type="checkbox" class="filter-popup__checkbox" data-type-slug="${type.slug}" ${isSelected ? 'checked' : ''}>
          <span class="filter-popup__text">${type.name}</span>
        </label>
      `;
    }).join('');

    typesList.innerHTML = html;
  }

  renderAuthorsList() {
    const authorsList = this.section.querySelector('#authors-list');
    if (!authorsList) return;

    const html = this.allAuthors.map(author => {
      const isSelected = this.selectedAuthors.some(selected => selected.slug === author.slug);
      return `
        <label class="filter-popup__option">
          <input type="checkbox" class="filter-popup__checkbox" data-author-slug="${author.slug}" ${isSelected ? 'checked' : ''}>
          <span class="filter-popup__text">${author.name}</span>
        </label>
      `;
    }).join('');

    authorsList.innerHTML = html;
  }

  handleFilterClick(button) {
    const slug = button.getAttribute('data-slug');
    
    // Update active button
    this.filterList.querySelectorAll('.cards-filter__item-button').forEach(btn => 
      btn.classList.remove('active')
    );
    button.classList.add('active');

    // Clear popup selections and set main selection
    this.selectedFormats = [];
    this.selectedTypes = [];
    this.selectedAuthors = [];

    if (slug !== 'all') {
      const format = this.allFormats.find(f => f.slug === slug);
      if (format) {
        this.selectedFormats = [format];
      }
    }

    // Close popup
    this.closePopup();

    // Update popup checkboxes
    this.updatePopupCheckboxes();

    this.loadPostsByTag(slug);
  }

  handleFilterChange() {
    // Update selected formats
    const formatCheckboxes = this.section.querySelectorAll('#formats-list input[type="checkbox"]');
    this.selectedFormats = [];
    formatCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const formatSlug = checkbox.getAttribute('data-format-slug');
        const format = this.allFormats.find(f => f.slug === formatSlug);
        if (format) {
          this.selectedFormats.push(format);
        }
      }
    });

    // Update selected types
    const typeCheckboxes = this.section.querySelectorAll('#types-list input[type="checkbox"]');
    this.selectedTypes = [];
    typeCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const typeSlug = checkbox.getAttribute('data-type-slug');
        const type = this.allTypes.find(t => t.slug === typeSlug);
        if (type) {
          this.selectedTypes.push(type);
        }
      }
    });

    // Update selected authors
    const authorCheckboxes = this.section.querySelectorAll('#authors-list input[type="checkbox"]');
    this.selectedAuthors = [];
    authorCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const authorSlug = checkbox.getAttribute('data-author-slug');
        const author = this.allAuthors.find(a => a.slug === authorSlug);
        if (author) {
          this.selectedAuthors.push(author);
        }
      }
    });

    // Update main buttons
    this.updateMainFormatButtons();
    this.loadPostsByTag('all');
  }

  updateMainFormatButtons() {
    const mainButtons = this.filterList.querySelectorAll('.cards-filter__item-button');
    mainButtons.forEach(button => {
      const slug = button.getAttribute('data-slug');
      if (slug === 'all') {
        button.classList.toggle('active', this.selectedFormats.length === 0);
      } else {
        const isSelected = this.selectedFormats.some(format => format.slug === slug);
        button.classList.toggle('active', isSelected);
      }
    });
  }

  updatePopupCheckboxes() {
    // Update format checkboxes
    const formatCheckboxes = this.section.querySelectorAll('#formats-list input[type="checkbox"]');
    formatCheckboxes.forEach(checkbox => {
      const formatSlug = checkbox.getAttribute('data-format-slug');
      checkbox.checked = this.selectedFormats.some(f => f.slug === formatSlug);
    });

    // Update type checkboxes
    const typeCheckboxes = this.section.querySelectorAll('#types-list input[type="checkbox"]');
    typeCheckboxes.forEach(checkbox => {
      const typeSlug = checkbox.getAttribute('data-type-slug');
      checkbox.checked = this.selectedTypes.some(t => t.slug === typeSlug);
    });

    // Update author checkboxes
    const authorCheckboxes = this.section.querySelectorAll('#authors-list input[type="checkbox"]');
    authorCheckboxes.forEach(checkbox => {
      const authorSlug = checkbox.getAttribute('data-author-slug');
      checkbox.checked = this.selectedAuthors.some(a => a.slug === authorSlug);
    });
  }

  async loadPostsByTag(slug, page = 1, append = false) {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      
      let filter = '';
      if (slug !== 'all') {
        filter = `tag:${slug}`;
      } else if (this.formats) {
        filter = `tag:[${this.formats}]`;
      }

      // Apply additional filters
      if (this.selectedFormats.length > 0) {
        const formatFilter = this.selectedFormats.map(f => f.slug).join(',');
        filter = filter ? `${filter}+tag:[${formatFilter}]` : `tag:[${formatFilter}]`;
      }

      if (this.selectedTypes.length > 0) {
        const typeFilter = this.selectedTypes.map(t => t.slug).join(',');
        filter = filter ? `${filter}+tag:[${typeFilter}]` : `tag:[${typeFilter}]`;
      }

      if (this.selectedAuthors.length > 0) {
        const authorSlugs = this.selectedAuthors.map(a => a.slug).join(',');
        const authorFilter = this.selectedAuthors.length === 1 ? 
          `authors:${authorSlugs}` : `authors:[${authorSlugs}]`;
        filter = filter ? `${filter}+${authorFilter}` : authorFilter;
      }

      const options = {
        include: ['tags', 'authors'],
        page: page,
        limit: this.limit === 'all' ? 15 : parseInt(this.limit)
      };

      if (filter) {
        options.filter = filter;
      }

      const response = await this.api.posts.browse(options);
      const posts = response;

      if (append) {
        const existingIds = this.allPosts.map(post => post.id);
        const newPosts = posts.filter(post => !existingIds.includes(post.id));
        this.allPosts = [...this.allPosts, ...newPosts];
        this.renderPosts(newPosts, true);
      } else {
        this.allPosts = posts;
        this.renderPosts(posts, false);
      }

      this.currentPage = page;
      this.hasMorePosts = posts.length === parseInt(this.limit);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMorePosts() {
    if (!this.infiniteScroll || this.isLoading || !this.hasMorePosts) return;
    
    const activeButton = this.filterList.querySelector('.cards-filter__item-button.active');
    const currentSlug = activeButton ? activeButton.getAttribute('data-slug') : 'all';
    
    await this.loadPostsByTag(currentSlug, this.currentPage + 1, true);
  }

  updateFilterButton() {
    const filterButton = this.section.querySelector('.cards-filter__button');
    if (!filterButton) return;

    const buttonText = filterButton.querySelector('span');
    const filterIcon = filterButton.querySelector('.filter-icon');
    const closeIcon = filterButton.querySelector('.close-icon');
    const popup = this.section.querySelector('.filter-popup');
    const isVisible = popup && popup.classList.contains('show');

    if (isVisible) {
      if (filterIcon) filterIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      buttonText.textContent = 'Close';
    } else {
      if (filterIcon) filterIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      buttonText.textContent = 'Filter';
    }
  }
}

// Videos-only scenario
export class VideosCardsManager extends BaseCardsManager {
  constructor(section, config) {
    super(section, config);
    this.youtubeApiKey = config.youtubeApiKey;
    this.youtubeChannelId = config.youtubeChannelId;
    this.allPlaylists = [];
    this.selectedPlaylists = [];
    
    // Infinite scroll state
    this.allVideos = []; // All videos currently displayed
    this.videoCache = new Map(); // Cache: playlistId -> array of videos
    this.playlistPageTokens = {}; // Store page tokens for each playlist
    this.playlistExhausted = new Set(); // Track which playlists have no more videos
    this.displayedVideoIds = new Set(); // Track which video IDs are already displayed
    this.videoBuffer = []; // Buffer of videos ready to display (for infinite scroll)
    this.isInitialLoad = true;
  }

  setupEventListeners() {
    super.setupEventListeners();
    
    if (this.filterList) {
      this.filterList.addEventListener('click', (e) => {
        const button = e.target.closest('button.cards-filter__item-button');
        if (!button) return;
        e.preventDefault();
        this.handleFilterClick(button);
      });
    }

    // Filter popup for videos
    this.setupFilterPopup();
  }

  async loadInitialContent() {
    // Videos scenario needs to load content immediately from YouTube API
    await this.loadPlaylists();
    this.renderPlaylistButtons();
    this.loadVideos();
  }

  async loadPlaylists() {
    // Check if API key is valid
    if (!this.youtubeApiKey || this.youtubeApiKey.includes('{{') || this.youtubeApiKey === 'undefined') {
      console.warn('YouTube API key not configured or invalid');
      this.allPlaylists = [];
      return;
    }
    
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${this.youtubeChannelId}&maxResults=50&key=${this.youtubeApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.error('YouTube API error:', data.error);
        this.allPlaylists = [];
        return;
      }
      
      if (data.items) {
        this.allPlaylists = data.items
          .map(pl => ({
          id: pl.id,
          title: pl.snippet.title,
          count: pl.contentDetails?.itemCount || 0
        }))
          .filter(pl => pl.title.toLowerCase() !== 'shorts');
        
        this.renderPlaylistButtons();
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
      this.allPlaylists = [];
    }
  }

  renderPlaylistButtons() {
    if (!this.filterList) return;
    
    const topPlaylists = [...this.allPlaylists]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    const allButton = this.filterList.querySelector('li:first-child');
    this.filterList.innerHTML = '';
    if (allButton) this.filterList.appendChild(allButton);
    
    const items = topPlaylists.map(pl => 
      `<li class="cards-filter__item">
        <button class="cards-filter__item-button" data-playlist-id="${pl.id}">${pl.title}</button>
      </li>`
    ).join('');
    
    this.filterList.insertAdjacentHTML('beforeend', items);
  }

  handleFilterClick(button) {
    const playlistId = button.getAttribute('data-playlist-id');
    const slug = button.getAttribute('data-slug');
    
    this.filterList.querySelectorAll('.cards-filter__item-button').forEach(btn => 
      btn.classList.remove('active')
    );
    button.classList.add('active');

    if (slug === 'all') {
      this.selectedPlaylists = [];
    } else if (playlistId) {
      this.selectedPlaylists = [playlistId];
    }

    // Close popup when main filter is clicked
    this.closePopup();

    this.loadVideos();
  }

  async loadVideos() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      
      // Add loading class
      this.articlesContainer.classList.add('cards-list__articles--loading');
      this.articlesContainer.classList.remove('cards-list__articles--empty', 'cards-list__articles--error');
      
      // Reset state when loading fresh content (filter change)
      this.displayedVideoIds.clear();
      this.videoBuffer = [];
      this.isInitialLoad = true;
      
      // Clear cache for unselected playlists to save memory
      if (this.selectedPlaylists.length > 0) {
        const playlistsToKeep = new Set(this.selectedPlaylists);
        for (const [playlistId] of this.videoCache) {
          if (!playlistsToKeep.has(playlistId)) {
            this.videoCache.delete(playlistId);
            this.playlistPageTokens[playlistId] = null;
            this.playlistExhausted.delete(playlistId);
          }
        }
      }
      
      const { videos, hasMore } = await this.fetchYouTubeVideos(false);
      
      // Remove loading class
      this.articlesContainer.classList.remove('cards-list__articles--loading');
      
      // Mark videos as displayed
      videos.forEach(v => this.displayedVideoIds.add(v.id));
      
      // Store state
      this.allVideos = videos;
      this.hasMorePosts = hasMore;
      
      // Check if container has loading state
      const hasLoading = this.articlesContainer.querySelector('.cards-loading');
      
      if (videos.length === 0) {
        // No videos found
        this.articlesContainer.classList.add('cards-list__articles--empty');
        if (hasLoading) {
          this.articlesContainer.innerHTML = '<p class="cards-list__empty-message">No videos found.</p>';
        } else {
          this.articlesContainer.innerHTML = '<p class="cards-list__empty-message">No videos found.</p>';
        }
      } else {
        // Videos found - remove empty/error classes
        this.articlesContainer.classList.remove('cards-list__articles--empty', 'cards-list__articles--error');
        
        if (hasLoading) {
          // Replace loading state directly
          this.articlesContainer.innerHTML = videos.map(v => this.renderVideoCard(v)).join('');
        } else {
          // Use renderPosts for consistent animation
          this.renderPosts(videos, false);
        }
      }

      // Prefetch next batch in background for smoother infinite scroll (don't await to avoid blocking)
      if (this.infiniteScroll && hasMore) {
        this.prefetchMoreVideos().catch(err => {
          console.error('Background prefetch failed:', err);
        });
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
      
      // Remove loading class and add error class
      this.articlesContainer.classList.remove('cards-list__articles--loading');
      this.articlesContainer.classList.add('cards-list__articles--error');
      
      const hasLoading = this.articlesContainer.querySelector('.cards-loading');
      if (hasLoading) {
        this.articlesContainer.innerHTML = '<p class="cards-list__error-message">Failed to load videos. Please try again later.</p>';
      } else {
        this.articlesContainer.innerHTML = '<p class="cards-list__error-message">Failed to load videos. Please try again later.</p>';
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch videos from a single playlist
   */
  async fetchPlaylistVideos(playlistId, pageToken = null) {
    const playlist = this.allPlaylists.find(p => p.id === playlistId);
    if (!playlist) return { videos: [], nextPageToken: null };

    // Check if playlist is exhausted
    if (this.playlistExhausted.has(playlistId) && !pageToken) {
      return { videos: [], nextPageToken: null };
    }

    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&maxResults=50&playlistId=${playlistId}&key=${this.youtubeApiKey}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.error('YouTube API error:', data.error);
        this.playlistExhausted.add(playlistId);
        return { videos: [], nextPageToken: null };
      }
      
      if (!data.items || data.items.length === 0) {
        this.playlistExhausted.add(playlistId);
        return { videos: [], nextPageToken: null };
      }

      const videos = data.items
        .filter(item => {
          const title = item.snippet?.title || '';
          if (!title || title === 'Deleted video' || title === 'Private video' || title === 'This video is unavailable') {
            return false;
          }
          if (item.status?.privacyStatus) {
            return item.status.privacyStatus === 'public';
          }
          return true;
        })
        .map(item => ({
          id: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
          url: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId || item.snippet?.resourceId?.videoId}`,
          title: item.snippet.title,
          published_at: item.snippet.publishedAt,
          feature_image: item.snippet.thumbnails?.maxres?.url || 
                        item.snippet.thumbnails?.standard?.url || 
                        item.snippet.thumbnails?.high?.url || 
                        item.snippet.thumbnails?.medium?.url,
          playlist_title: playlist.title,
          playlist_id: playlistId
        }));

      // Update page token
      if (data.nextPageToken) {
        this.playlistPageTokens[playlistId] = data.nextPageToken;
      } else {
        delete this.playlistPageTokens[playlistId];
        this.playlistExhausted.add(playlistId);
      }

      return { videos, nextPageToken: data.nextPageToken || null };
    } catch (error) {
      console.error(`Failed to fetch playlist ${playlistId}:`, error);
      this.playlistExhausted.add(playlistId);
      return { videos: [], nextPageToken: null };
    }
  }

  /**
   * Get videos from cache or fetch new ones if needed
   */
  async ensurePlaylistVideosLoaded(playlistId) {
    // Check cache first
    if (this.videoCache.has(playlistId)) {
      const cached = this.videoCache.get(playlistId);
      if (cached.length > 0) {
        return cached;
      }
    }

    // Fetch from API
    const pageToken = this.playlistPageTokens[playlistId] || null;
    const { videos, nextPageToken } = await this.fetchPlaylistVideos(playlistId, pageToken);
    
    // Update cache
    if (videos.length > 0) {
      const existing = this.videoCache.get(playlistId) || [];
      const allVideos = [...existing, ...videos];
      // Remove duplicates
      const unique = [];
      const seen = new Set();
      for (const v of allVideos) {
        if (!seen.has(v.id)) {
          seen.add(v.id);
          unique.push(v);
        }
      }
      this.videoCache.set(playlistId, unique);
      return unique;
    }

    return [];
  }

  /**
   * Fetch videos from multiple playlists in parallel
   */
  async fetchYouTubeVideos(append = false) {
    const perPage = parseInt(this.limit) || 6;
    const playlistIds = this.selectedPlaylists.length 
      ? this.selectedPlaylists 
      : this.allPlaylists.map(p => p.id);
    
    if (!playlistIds.length) {
      return { videos: [], hasMore: false };
    }

    // For initial load or filter change, fetch from all playlists in parallel
    if (!append) {
      // Fetch first batch from all playlists in parallel
      const fetchPromises = playlistIds.map(id => this.ensurePlaylistVideosLoaded(id));
      await Promise.all(fetchPromises);
      this.isInitialLoad = false;
    } else {
      // For infinite scroll, first check if we have unshown videos in cache
      let hasUnshownInCache = false;
      for (const playlistId of playlistIds) {
        const cached = this.videoCache.get(playlistId) || [];
        const unshown = cached.filter(v => !this.displayedVideoIds.has(v.id));
        if (unshown.length > 0) {
          hasUnshownInCache = true;
          break;
        }
      }
      
      // Only fetch from API if we don't have enough unshown videos in cache
      if (!hasUnshownInCache) {
        // Fetch more videos from playlists that still have pages
        const playlistsToFetch = playlistIds.filter(id => 
          !this.playlistExhausted.has(id) && this.playlistPageTokens[id]
        );
        
        if (playlistsToFetch.length > 0) {
          const fetchPromises = playlistsToFetch.map(id => 
            this.fetchPlaylistVideos(id, this.playlistPageTokens[id])
          );
          const results = await Promise.all(fetchPromises);
          
          // Update cache with new videos
          results.forEach((result, index) => {
            const playlistId = playlistsToFetch[index];
            if (result.videos.length > 0) {
              const existing = this.videoCache.get(playlistId) || [];
              const allVideos = [...existing, ...result.videos];
              // Remove duplicates
              const unique = [];
              const seen = new Set();
              for (const v of allVideos) {
                if (!seen.has(v.id)) {
                  seen.add(v.id);
                  unique.push(v);
                }
              }
              this.videoCache.set(playlistId, unique);
            }
          });
        }
      }
    }

    // Collect videos from cache
    let allVideos = [];
    for (const playlistId of playlistIds) {
      const cached = this.videoCache.get(playlistId) || [];
      allVideos = allVideos.concat(cached);
    }

    // Sort by published date (newest first)
    allVideos.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    
    // Remove duplicates
    const uniqueVideos = [];
    const seenIds = new Set();
    for (const video of allVideos) {
      if (!seenIds.has(video.id)) {
        seenIds.add(video.id);
        uniqueVideos.push(video);
      }
    }

    // Filter out already displayed videos if appending
    const availableVideos = append 
      ? uniqueVideos.filter(v => !this.displayedVideoIds.has(v.id))
      : uniqueVideos;

    // Get the requested number of videos
    const result = availableVideos.slice(0, perPage);

    // Check if we need to fetch more videos for infinite scroll
    // hasMore is true if:
    // 1. We got the full requested amount (result.length === perPage)
    //    OR there are more available videos than we're showing
    // 2. AND there are more videos available (either in cache or from API)
    const hasMoreAvailable = this.hasMoreVideosAvailable();
    const hasMore = (result.length === perPage || availableVideos.length > perPage) && hasMoreAvailable;

    return { videos: result, hasMore };
  }

  renderVideoCard(video) {
      const date = new Date(video.published_at);
    const dateStr = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
    
    const featureImage = video.feature_image ? 
      `<a href="${video.url}" class="card__image" target="_blank" rel="noopener">
        <img data-src="${video.feature_image}" class="lazyload" alt="${video.title}">
      </a>` : '';
    
    const tagHtml = video.playlist_title ? 
      `<span class="card__tag">${video.playlist_title}</span>` : '';

    if (this.cardType === 'default') {
        return `
        <article class="card card--default flex direction-column ${this.cardClass}">
  ${featureImage}
          <div class="card__main flex direction-column">
            <h3 class="card__title">
              <a href="${video.url}" target="_blank" rel="noopener">${video.title}</a>
            </h3>
            <div class="card__footer flex items-center">
      ${tagHtml}
              <div class="card__meta flex items-center">
                <span class="card__date">${dateStr}</span>
      </div>
    </div>
  </div>
</article>`;
    } else {
      return `
        <article class="card card--small flex items-center ${this.cardClass}">
  ${featureImage}
          <div class="card__main flex">
            <h3 class="card__title">
              <a href="${video.url}" target="_blank" rel="noopener">${video.title}</a>
            </h3>
    ${tagHtml}
            <div class="card__meta flex items-center">
              <span class="card__date">${dateStr}</span>
    </div>
  </div>
</article>`;
    }
  }

  async loadMorePosts() {
    if (!this.infiniteScroll || this.isLoading || !this.hasMorePosts) {
      return;
    }
    
    this.isLoading = true;
    
    try {
      // First, try to get videos from buffer if available
      if (this.videoBuffer.length > 0) {
        const perPage = parseInt(this.limit) || 6;
        const videosToShow = this.videoBuffer.splice(0, perPage);
        
        videosToShow.forEach(v => this.displayedVideoIds.add(v.id));
        this.allVideos = [...this.allVideos, ...videosToShow];
        this.renderPosts(videosToShow, true);
        
        // Check if we need to fetch more
        if (this.videoBuffer.length === 0) {
          await this.prefetchMoreVideos();
        }
        
        this.hasMorePosts = this.videoBuffer.length > 0 || this.hasMoreVideosAvailable();
        this.isLoading = false;
        return;
      }

      // No buffer, fetch new videos
      const { videos, hasMore } = await this.fetchYouTubeVideos(true);
      
      if (videos && videos.length > 0) {
        videos.forEach(v => this.displayedVideoIds.add(v.id));
        this.allVideos = [...this.allVideos, ...videos];
        this.renderPosts(videos, true);
        this.hasMorePosts = hasMore;
        
        // Prefetch next batch in background (don't await to avoid blocking)
        if (hasMore) {
          this.prefetchMoreVideos().catch(err => {
            console.error('Background prefetch failed:', err);
          });
        }
      } else {
        this.hasMorePosts = false;
      }
    } catch (error) {
      console.error('Failed to load more videos:', error);
      this.hasMorePosts = false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if there are more videos available to load
   */
  hasMoreVideosAvailable() {
    const playlistIds = this.selectedPlaylists.length 
      ? this.selectedPlaylists 
      : this.allPlaylists.map(p => p.id);
    
    // Check if there are unshown videos in cache
    for (const playlistId of playlistIds) {
      const cached = this.videoCache.get(playlistId) || [];
      const unshown = cached.filter(v => !this.displayedVideoIds.has(v.id));
      if (unshown.length > 0) {
        return true;
      }
    }
    
    // Check if there are playlists with more pages to fetch
    return playlistIds.some(id => 
      !this.playlistExhausted.has(id) && this.playlistPageTokens[id]
    );
  }

  /**
   * Prefetch next batch of videos in background for smoother infinite scroll
   */
  async prefetchMoreVideos() {
    if (this.isLoading || !this.hasMoreVideosAvailable()) return;
    
    try {
      const playlistIds = this.selectedPlaylists.length 
        ? this.selectedPlaylists 
        : this.allPlaylists.map(p => p.id);
      
      // Fetch from playlists that still have page tokens
      const activePlaylists = playlistIds.filter(id => 
        !this.playlistExhausted.has(id) && this.playlistPageTokens[id]
      );

      if (activePlaylists.length === 0) return;

      // Fetch more videos from playlists in parallel
      const fetchPromises = activePlaylists.map(id => 
        this.fetchPlaylistVideos(id, this.playlistPageTokens[id])
      );

      const results = await Promise.all(fetchPromises);
      
      // Update cache and collect new videos
      let newVideos = [];
      results.forEach((result, index) => {
        const playlistId = activePlaylists[index];
        if (result.videos.length > 0) {
          const existing = this.videoCache.get(playlistId) || [];
          const allVideos = [...existing, ...result.videos];
          // Remove duplicates
          const unique = [];
          const seen = new Set();
          for (const v of allVideos) {
            if (!seen.has(v.id)) {
              seen.add(v.id);
              unique.push(v);
            }
          }
          this.videoCache.set(playlistId, unique);
          newVideos = newVideos.concat(result.videos);
        }
      });

      // Sort and deduplicate
      newVideos.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      const uniqueNewVideos = [];
      const seenIds = new Set();
      for (const video of newVideos) {
        if (!seenIds.has(video.id) && !this.displayedVideoIds.has(video.id)) {
          seenIds.add(video.id);
          uniqueNewVideos.push(video);
        }
      }

      // Add to buffer
      this.videoBuffer = [...this.videoBuffer, ...uniqueNewVideos];
    } catch (error) {
      console.error('Failed to prefetch videos:', error);
    }
  }

  resetInfiniteScrollState() {
    this.allVideos = [];
    this.displayedVideoIds.clear();
    this.videoBuffer = [];
    this.playlistPageTokens = {};
    this.playlistExhausted.clear();
    // Keep videoCache for performance, but clear displayed IDs
  }

  renderPosts(videos, append = false) {
    const html = videos.map(video => this.renderVideoCard(video)).join('');

    if (append) {
      this.articlesContainer.insertAdjacentHTML('beforeend', html);
      // Check if we need to load more after appending
      setTimeout(() => {
        this.checkAndLoadMoreIfNeeded();
      }, 100);
    } else {
      // Always animate content replacement for better UX
      this.articlesContainer.style.opacity = '0';
      this.articlesContainer.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        this.articlesContainer.innerHTML = html || '<p>No videos found.</p>';
        this.articlesContainer.style.opacity = '1';
        this.articlesContainer.style.transform = 'translateY(0)';
        // Check if we need to load more after rendering
        setTimeout(() => {
          this.checkAndLoadMoreIfNeeded();
        }, 100);
      }, 200);
    }
  }

  setupFilterPopup() {
    const filterButton = this.section.querySelector('.cards-filter__button');
    const popup = this.section.querySelector('.filter-popup');
    
    if (!filterButton || !popup) return;

    filterButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePopup();
    });

    // Handle checkbox changes
    popup.addEventListener('change', (e) => {
      if (e.target.classList.contains('filter-popup__checkbox')) {
        if (e.target.hasAttribute('data-yplaylist')) {
          this.handlePlaylistChange();
        }
      }
    });

    // Handle reset button
    const resetButton = popup.querySelector('.filter-popup__cancel-btn');
    if (resetButton) {
      resetButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetAllFilters();
      });
    }

    // Handle click outside popup
    document.addEventListener('click', (e) => {
      const popupContainer = this.section.querySelector('.cards-filter__popup-container');
      if (popup && popup.classList.contains('show') && !popupContainer.contains(e.target)) {
        this.closePopup();
      }
    });
  }

  togglePopup() {
    const popup = this.section.querySelector('.filter-popup');
    if (!popup) return;

    const isVisible = popup.classList.contains('show');
    
    if (isVisible) {
      this.closePopup();
    } else {
      popup.classList.add('show');
      this.renderPlaylistsInPopup();
    }
    
    this.updateFilterButton();
  }

  closePopup() {
    const popup = this.section.querySelector('.filter-popup');
    if (popup) {
      popup.classList.remove('show');
      this.updateFilterButton();
    }
  }

  renderPlaylistsInPopup() {
    const formatsList = this.section.querySelector('#formats-list');
      if (!formatsList) return;
    
      // Change title to Playlists and hide other columns
    const popup = this.section.querySelector('.filter-popup');
      if (popup) {
        const titleEls = popup.querySelectorAll('.filter-popup__title');
        if (titleEls && titleEls[0]) titleEls[0].textContent = 'Playlists';
        const typesCol = popup.querySelector('#types-list')?.closest('.filter-popup__column');
        const authorsCol = popup.querySelector('#authors-list')?.closest('.filter-popup__column');
        if (typesCol) typesCol.style.display = 'none';
        if (authorsCol) authorsCol.style.display = 'none';
      }
    
    const html = this.allPlaylists.map((pl) => {
      const checked = this.selectedPlaylists.includes(pl.id) ? 'checked' : '';
        return `
        <label class="filter-popup__option">
          <input type="checkbox" class="filter-popup__checkbox" data-yplaylist="${pl.id}" ${checked}>
          <span class="filter-popup__text">${pl.title}</span>
        </label>
        `;
      }).join('');
      formatsList.innerHTML = html;
    }

  handlePlaylistChange() {
    const boxes = this.section.querySelectorAll('#formats-list input[data-yplaylist]');
    this.selectedPlaylists = Array.from(boxes).filter(b => b.checked).map(b => b.getAttribute('data-yplaylist'));
    this.updateMainPlaylistButtons();
    this.loadVideos();
  }

  updateMainPlaylistButtons() {
    const mainButtons = this.filterList.querySelectorAll('.cards-filter__item-button');
    mainButtons.forEach(button => {
        const slug = button.getAttribute('data-slug');
      const playlistId = button.getAttribute('data-playlist-id');
        if (slug === 'all') {
        button.classList.toggle('active', this.selectedPlaylists.length === 0);
      } else if (playlistId) {
        button.classList.toggle('active', this.selectedPlaylists.includes(playlistId));
        } else {
          button.classList.remove('active');
        }
      });
    }

  updateFilterButton() {
    const filterButton = this.section.querySelector('.cards-filter__button');
    if (!filterButton) return;

    const buttonText = filterButton.querySelector('span');
    const filterIcon = filterButton.querySelector('.filter-icon');
    const closeIcon = filterButton.querySelector('.close-icon');
    const popup = this.section.querySelector('.filter-popup');
    const isVisible = popup && popup.classList.contains('show');

    if (isVisible) {
      if (filterIcon) filterIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      buttonText.textContent = 'Close';
    } else {
      if (filterIcon) filterIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      buttonText.textContent = 'Filter';
    }
  }

  resetAllFilters() {
    this.selectedPlaylists = [];
    
    // Uncheck all checkboxes
    const allCheckboxes = this.section.querySelectorAll('.filter-popup__checkbox');
    allCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    // Update main buttons
    this.updateMainPlaylistButtons();
    
    // Close popup
    this.closePopup();
    
    // Reload content
    this.loadVideos();
  }
}

// Mixed mode scenario (articles + videos)
export class MixedCardsManager extends BaseCardsManager {
  constructor(section, config) {
    super(section, config);
    this.formats = section.getAttribute('data-formats') || '';
    this.types = section.getAttribute('data-types') || '';
    this.filterByAuthors = section.getAttribute('data-filter-by-authors') === 'true';
    this.youtubeApiKey = config.youtubeApiKey;
    this.youtubeChannelId = config.youtubeChannelId;
    this.isVideosMode = false;
    this.allPlaylists = [];
    this.selectedPlaylists = [];
    
    // Articles mode state
    this.allFormats = [];
    this.allTypes = [];
    this.allAuthors = [];
    this.selectedFormats = [];
    this.selectedTypes = [];
    this.selectedAuthors = [];
    
    // Store original view all href
    this.originalViewAllHref = '';
  }

  setupEventListeners() {
    super.setupEventListeners();
    
    // Mode switching
    const modeButtons = this.section.querySelectorAll('.cards-list__mode-button');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.preventDefault();
        this.switchMode(btn.getAttribute('data-mode'), false);
      });
    });

    // Filter buttons
    if (this.filterList) {
      this.filterList.addEventListener('click', (e) => {
        const button = e.target.closest('button.cards-filter__item-button');
        if (!button) return;
        e.preventDefault();
        this.handleFilterClick(button);
      });
    }

    // Filter popup for articles mode
    this.setupFilterPopup();
  }

  async loadInitialContent() {
    // Don't load content on init - let server-rendered content stay
    // But initialize UI elements
    
    // Set up initial mode state
    this.isVideosMode = false;
    
    // Initialize mode buttons - set Articles as active
    const modeButtons = this.section.querySelectorAll('.cards-list__mode-button');
    modeButtons.forEach(btn => btn.classList.remove('active'));
    const articlesButton = this.section.querySelector('.cards-list__mode-button[data-mode="articles"]');
    if (articlesButton) {
      articlesButton.classList.add('active');
    }
    
    // Load formats and render main buttons for Articles mode
    await this.loadFormats();
    this.renderFormatButtons();
    
    // Preload filter data to prevent popup jump when opening
    await this.preloadFilterData();
    
    // Load playlists for Videos mode (but don't render yet)
    await this.loadPlaylists();
    
    // Store original view all href
    const viewAllButton = this.section.querySelector('.cards-list__view-all');
    if (viewAllButton) {
      this.originalViewAllHref = viewAllButton.getAttribute('href') || '/articles';
    }
  }

  async preloadFilterData() {
    // Preload all filter data in parallel to prevent popup jump
    const promises = [];
    
    if (this.types) {
      promises.push(this.loadTypes());
    }
    
    if (this.filterByAuthors) {
      promises.push(this.loadAuthors());
    }
    
    await Promise.all(promises);
  }

  updateViewAllButton(newHref) {
    const viewAllButton = this.section.querySelector('.cards-list__view-all');
    if (viewAllButton) {
      viewAllButton.setAttribute('href', newHref);
    }
  }

  async switchMode(mode, skipContentLoad = false) {
    const modeButtons = this.section.querySelectorAll('.cards-list__mode-button');
    modeButtons.forEach(btn => btn.classList.remove('active'));
    modeButtons.forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
          btn.classList.add('active');
      }
    });

    this.isVideosMode = mode === 'videos';

    // Close popup when switching modes
    this.closePopup();

    // Reset all filters when switching modes (but not on initial load)
    if (!skipContentLoad) {
      this.resetAllFilters();
    }

    if (this.isVideosMode) {
      await this.loadPlaylists();
      this.renderPlaylistButtons();
      this.updateViewAllButton('/videos');
      if (!skipContentLoad) {
        this.loadVideos();
      }
          } else {
      await this.loadFormats();
      this.renderFormatButtons();
      this.updateViewAllButton(this.originalViewAllHref || '/articles');
      if (!skipContentLoad) {
        this.loadPostsByTag('all');
      }
    }
  }

  async loadPlaylists() {
    if (this.allPlaylists.length > 0) return;
    
    // Check if API key is valid
    if (!this.youtubeApiKey || this.youtubeApiKey.includes('{{') || this.youtubeApiKey === 'undefined') {
      console.warn('YouTube API key not configured or invalid');
      this.allPlaylists = [];
      return;
    }
    
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${this.youtubeChannelId}&maxResults=50&key=${this.youtubeApiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.error('YouTube API error:', data.error);
        this.allPlaylists = [];
        return;
      }
      
      if (data.items) {
        this.allPlaylists = data.items
          .map(pl => ({
            id: pl.id,
            title: pl.snippet.title,
            count: pl.contentDetails?.itemCount || 0
          }))
          .filter(pl => pl.title.toLowerCase() !== 'shorts');
      }
    } catch (error) {
      console.error('Failed to load playlists:', error);
      this.allPlaylists = [];
    }
  }

  renderPlaylistButtons() {
    if (!this.filterList) return;
    
    const topPlaylists = [...this.allPlaylists]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    const allButton = this.filterList.querySelector('li:first-child');
    this.filterList.innerHTML = '';
    if (allButton) this.filterList.appendChild(allButton);
    
    const items = topPlaylists.map(pl => 
      `<li class="cards-filter__item">
        <button class="cards-filter__item-button" data-playlist-id="${pl.id}">${pl.title}</button>
      </li>`
    ).join('');
    
    this.filterList.insertAdjacentHTML('beforeend', items);
  }

  handleFilterClick(button) {
    if (this.isVideosMode) {
      this.handleVideoFilterClick(button);
    } else {
      this.handleArticleFilterClick(button);
    }
  }

  handleVideoFilterClick(button) {
    const playlistId = button.getAttribute('data-playlist-id');
    const slug = button.getAttribute('data-slug');
    
    this.filterList.querySelectorAll('.cards-filter__item-button').forEach(btn => 
      btn.classList.remove('active')
    );
      button.classList.add('active');

      if (slug === 'all') {
      this.selectedPlaylists = [];
    } else if (playlistId) {
      this.selectedPlaylists = [playlistId];
    }

    this.loadVideos();
  }

  handleArticleFilterClick(button) {
    const slug = button.getAttribute('data-slug');
    
    this.filterList.querySelectorAll('.cards-filter__item-button').forEach(btn => 
      btn.classList.remove('active')
    );
    button.classList.add('active');

    this.loadPostsByTag(slug);
  }

  async loadVideos() {
    try {
      // Add loading class
      this.articlesContainer.classList.add('cards-list__articles--loading');
      this.articlesContainer.classList.remove('cards-list__articles--empty', 'cards-list__articles--error');
      
      const { videos } = await this.fetchYouTubeVideos();
      
      // Remove loading class
      this.articlesContainer.classList.remove('cards-list__articles--loading');
      
      if (videos.length === 0) {
        // No videos found
        this.articlesContainer.classList.add('cards-list__articles--empty');
        const html = '<p class="cards-list__empty-message">No videos found.</p>';
        
        // Add animation for videos
        this.articlesContainer.style.opacity = '0';
        this.articlesContainer.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          this.articlesContainer.innerHTML = html;
          this.articlesContainer.style.opacity = '1';
          this.articlesContainer.style.transform = 'translateY(0)';
        }, 200);
      } else {
        // Videos found - remove empty/error classes
        this.articlesContainer.classList.remove('cards-list__articles--empty', 'cards-list__articles--error');
        
        const html = videos.map(video => this.renderVideoCard(video)).join('');
        
        // Add animation for videos
        this.articlesContainer.style.opacity = '0';
        this.articlesContainer.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          this.articlesContainer.innerHTML = html;
          this.articlesContainer.style.opacity = '1';
          this.articlesContainer.style.transform = 'translateY(0)';
        }, 200);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
      
      // Remove loading class and add error class
      this.articlesContainer.classList.remove('cards-list__articles--loading');
      this.articlesContainer.classList.add('cards-list__articles--error');
      
      const html = '<p class="cards-list__error-message">Failed to load videos. Please try again later.</p>';
      
      this.articlesContainer.style.opacity = '0';
      this.articlesContainer.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        this.articlesContainer.innerHTML = html;
        this.articlesContainer.style.opacity = '1';
        this.articlesContainer.style.transform = 'translateY(0)';
      }, 200);
    }
  }

  async fetchYouTubeVideos() {
    const perPage = parseInt(this.limit) || 6;
    const playlistIds = this.selectedPlaylists.length 
      ? this.selectedPlaylists 
      : this.allPlaylists.map(p => p.id);

    if (!playlistIds.length) {
      return { videos: [] };
    }

    // Fetch from all playlists in parallel for better performance
    const fetchPromises = playlistIds.map(async (playlistId) => {
      const playlist = this.allPlaylists.find(p => p.id === playlistId);
      if (!playlist) return { videos: [] };

      try {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&maxResults=50&playlistId=${playlistId}&key=${this.youtubeApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error || !data.items) {
          return { videos: [] };
        }

        const videos = data.items
          .filter(item => {
            const title = item.snippet?.title || '';
            if (!title || title === 'Deleted video' || title === 'Private video' || title === 'This video is unavailable') {
              return false;
            }
            if (item.status?.privacyStatus) {
              return item.status.privacyStatus === 'public';
            }
            return true;
          })
          .map(item => ({
            id: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
            url: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId || item.snippet?.resourceId?.videoId}`,
            title: item.snippet.title,
            published_at: item.snippet.publishedAt,
            feature_image: item.snippet.thumbnails?.maxres?.url || 
                          item.snippet.thumbnails?.standard?.url || 
                          item.snippet.thumbnails?.high?.url || 
                          item.snippet.thumbnails?.medium?.url,
            playlist_title: playlist.title
          }));

        return { videos };
      } catch (error) {
        console.error(`Failed to fetch playlist ${playlistId}:`, error);
        return { videos: [] };
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Combine all videos
    let allVideos = [];
    results.forEach(result => {
      allVideos = allVideos.concat(result.videos);
    });

    // Sort by published date (newest first)
    allVideos.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    
    // Remove duplicates
    const uniqueVideos = [];
    const seenIds = new Set();
    for (const video of allVideos) {
      if (!seenIds.has(video.id)) {
        seenIds.add(video.id);
        uniqueVideos.push(video);
      }
    }
    
    return { videos: uniqueVideos.slice(0, perPage) };
  }

  renderVideoCard(video) {
    const date = new Date(video.published_at);
    const dateStr = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
    
    const featureImage = video.feature_image ? 
      `<a href="${video.url}" class="card__image" target="_blank" rel="noopener">
        <img data-src="${video.feature_image}" class="lazyload" alt="${video.title}">
      </a>` : '';
    
    const tagHtml = video.playlist_title ? 
      `<span class="card__tag">${video.playlist_title}</span>` : '';

    if (this.cardType === 'default') {
      return `
        <article class="card card--default flex direction-column ${this.cardClass}">
          ${featureImage}
          <div class="card__main flex direction-column">
            <h3 class="card__title">
              <a href="${video.url}" target="_blank" rel="noopener">${video.title}</a>
            </h3>
            <div class="card__footer flex items-center">
              ${tagHtml}
              <div class="card__meta flex items-center">
                <span class="card__date">${dateStr}</span>
              </div>
            </div>
          </div>
        </article>`;
      } else {
      return `
        <article class="card card--small flex items-center ${this.cardClass}">
          ${featureImage}
          <div class="card__main flex">
            <h3 class="card__title">
              <a href="${video.url}" target="_blank" rel="noopener">${video.title}</a>
            </h3>
            ${tagHtml}
            <div class="card__meta flex items-center">
              <span class="card__date">${dateStr}</span>
            </div>
          </div>
        </article>`;
    }
  }

  async loadFormats() {
    try {
      const response = await this.api.tags.browse({
        filter: `slug:[${this.formats}]`,
        limit: 'all'
      });
      
      this.allFormats = response.map(tag => ({
        slug: tag.slug,
        name: tag.name
      }));
      
      // Render formats in popup
      this.renderFormatsList();
    } catch (error) {
      console.error('Failed to load formats:', error);
    }
  }

  renderFormatButtons() {
    if (!this.filterList) return;
    
    const allButton = this.filterList.querySelector('li:first-child');
    this.filterList.innerHTML = '';
    if (allButton) this.filterList.appendChild(allButton);
    
    const items = this.allFormats.map(format => 
      `<li class="cards-filter__item">
        <button class="cards-filter__item-button" data-slug="${format.slug}">${format.name}</button>
      </li>`
    ).join('');
    
    this.filterList.insertAdjacentHTML('beforeend', items);
  }

  renderFormatsList() {
    const formatsList = this.section.querySelector('#formats-list');
    if (!formatsList) return;

    const html = this.allFormats.map(format => {
      const isSelected = this.selectedFormats.some(selected => selected.slug === format.slug);
      return `
        <label class="filter-popup__option">
          <input type="checkbox" class="filter-popup__checkbox" data-format-slug="${format.slug}" ${isSelected ? 'checked' : ''}>
          <span class="filter-popup__text">${format.name}</span>
        </label>
      `;
    }).join('');

    formatsList.innerHTML = html;
  }

  setupFilterPopup() {
    const filterButton = this.section.querySelector('.cards-filter__button');
    const popup = this.section.querySelector('.filter-popup');
    
    if (!filterButton || !popup) return;

    filterButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.togglePopup();
    });

    // Handle checkbox changes
    popup.addEventListener('change', (e) => {
      if (e.target.classList.contains('filter-popup__checkbox')) {
        // Check if it's a playlist checkbox (for videos mode)
        if (e.target.hasAttribute('data-yplaylist')) {
          // Only handle playlist change if we're in videos mode
          if (this.isVideosMode) {
            this.handlePlaylistChange();
          }
        } else {
          // Handle filter change for articles mode
          if (!this.isVideosMode) {
            this.handleFilterChange();
          }
        }
      }
    });

    // Handle reset button
    const resetButton = popup.querySelector('.filter-popup__cancel-btn');
    if (resetButton) {
      resetButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetAllFilters();
      });
    }

    // Handle click outside popup
    document.addEventListener('click', (e) => {
      const popupContainer = this.section.querySelector('.cards-filter__popup-container');
      if (popup && popup.classList.contains('show') && !popupContainer.contains(e.target)) {
        this.closePopup();
      }
    });
  }

  togglePopup() {
    const popup = this.section.querySelector('.filter-popup');
    if (!popup) return;

    const isVisible = popup.classList.contains('show');
    
    if (isVisible) {
      this.closePopup();
    } else {
      popup.classList.add('show');
      this.loadFilterData();
    }
    
    this.updateFilterButton();
  }

  closePopup() {
    const popup = this.section.querySelector('.filter-popup');
    if (popup) {
      popup.classList.remove('show');
      this.updateFilterButton();
    }
  }

  loadFilterData() {
    if (this.isVideosMode) {
      // For videos mode, populate playlists in popup
      this.renderPlaylistsInPopup();
    } else {
      // For articles mode, restore popup and render preloaded data
      this.restorePopupForArticles();
      // Data should already be preloaded, just render it
      this.renderFormatsList();
      if (this.types) {
        this.renderTypesList();
      }
      if (this.filterByAuthors) {
        this.renderAuthorsList();
      }
    }
  }

  renderPlaylistsInPopup() {
    const formatsList = this.section.querySelector('#formats-list');
    if (!formatsList) return;
    
    // Change title to Playlists and hide other columns
    const popup = this.section.querySelector('.filter-popup');
    if (popup) {
      const titleEls = popup.querySelectorAll('.filter-popup__title');
      if (titleEls && titleEls[0]) titleEls[0].textContent = 'Playlists';
      const typesCol = popup.querySelector('#types-list')?.closest('.filter-popup__column');
      const authorsCol = popup.querySelector('#authors-list')?.closest('.filter-popup__column');
      if (typesCol) typesCol.style.display = 'none';
      if (authorsCol) authorsCol.style.display = 'none';
    }
    
    const html = this.allPlaylists.map((pl) => {
      const checked = this.selectedPlaylists.includes(pl.id) ? 'checked' : '';
      return `
        <label class="filter-popup__option">
          <input type="checkbox" class="filter-popup__checkbox" data-yplaylist="${pl.id}" ${checked}>
          <span class="filter-popup__text">${pl.title}</span>
        </label>
      `;
    }).join('');
    formatsList.innerHTML = html;
  }

  restorePopupForArticles() {
    const popup = this.section.querySelector('.filter-popup');
    if (popup) {
      const titleEls = popup.querySelectorAll('.filter-popup__title');
      if (titleEls && titleEls[0]) titleEls[0].textContent = 'Formats';
      const typesCol = popup.querySelector('#types-list')?.closest('.filter-popup__column');
      const authorsCol = popup.querySelector('#authors-list')?.closest('.filter-popup__column');
      if (typesCol) typesCol.style.display = '';
      if (authorsCol) authorsCol.style.display = '';
    }
  }

  async loadTypes() {
    if (!this.types) return;
    
    try {
      const typeSlugs = this.types.split(',');
      this.allTypes = typeSlugs.map(slug => ({
            slug: slug.trim(),
            name: slug.trim().charAt(0).toUpperCase() + slug.trim().slice(1).replace(/-/g, ' ')
          }));
      this.renderTypesList();
    } catch (error) {
      console.error('Failed to load types:', error);
    }
  }

  async loadAuthors() {
    try {
      const response = await this.api.posts.browse({
          include: ['authors'],
        limit: 'all',
        filter: `tag:[${this.formats}]`
      });
      
        const authorsMap = new Map();
      response.forEach(post => {
          if (post.authors) {
            post.authors.forEach(author => {
              if (!authorsMap.has(author.slug)) {
                authorsMap.set(author.slug, {
                  slug: author.slug,
                  name: author.name
                });
              }
            });
          }
        });
        
      this.allAuthors = Array.from(authorsMap.values());
      this.renderAuthorsList();
    } catch (error) {
      console.error('Failed to load authors:', error);
    }
  }

  renderFormatsList() {
    const formatsList = this.section.querySelector('#formats-list');
      if (!formatsList) return;

    const html = this.allFormats.map(format => {
      const isSelected = this.selectedFormats.some(selected => selected.slug === format.slug);
        return `
          <label class="filter-popup__option">
            <input type="checkbox" class="filter-popup__checkbox" data-format-slug="${format.slug}" ${isSelected ? 'checked' : ''}>
            <span class="filter-popup__text">${format.name}</span>
          </label>
        `;
      }).join('');

      formatsList.innerHTML = html;
    }

  renderTypesList() {
    const typesList = this.section.querySelector('#types-list');
      if (!typesList) return;

    const html = this.allTypes.map(type => {
      const isSelected = this.selectedTypes.some(selected => selected.slug === type.slug);
        return `
          <label class="filter-popup__option">
            <input type="checkbox" class="filter-popup__checkbox" data-type-slug="${type.slug}" ${isSelected ? 'checked' : ''}>
            <span class="filter-popup__text">${type.name}</span>
          </label>
        `;
      }).join('');

      typesList.innerHTML = html;
    }

  renderAuthorsList() {
    const authorsList = this.section.querySelector('#authors-list');
      if (!authorsList) return;

    const html = this.allAuthors.map(author => {
      const isSelected = this.selectedAuthors.some(selected => selected.slug === author.slug);
        return `
          <label class="filter-popup__option">
            <input type="checkbox" class="filter-popup__checkbox" data-author-slug="${author.slug}" ${isSelected ? 'checked' : ''}>
            <span class="filter-popup__text">${author.name}</span>
          </label>
        `;
      }).join('');

      authorsList.innerHTML = html;
    }

  handleFilterClick(button) {
    if (this.isVideosMode) {
      this.handleVideoFilterClick(button);
      } else {
      this.handleArticleFilterClick(button);
    }
  }

  handleArticleFilterClick(button) {
    const slug = button.getAttribute('data-slug');
    
    // Update active button
    this.filterList.querySelectorAll('.cards-filter__item-button').forEach(btn => 
      btn.classList.remove('active')
    );
    button.classList.add('active');

    // Clear popup selections and set main selection
    this.selectedFormats = [];
    this.selectedTypes = [];
    this.selectedAuthors = [];

    if (slug !== 'all') {
      const format = this.allFormats.find(f => f.slug === slug);
      if (format) {
        this.selectedFormats = [format];
      }
    }

    // Close popup
    this.closePopup();

    // Update popup checkboxes
    this.updatePopupCheckboxes();

    this.loadPostsByTag(slug);
  }

  handleVideoFilterClick(button) {
    const playlistId = button.getAttribute('data-playlist-id');
    const slug = button.getAttribute('data-slug');
    
    this.filterList.querySelectorAll('.cards-filter__item-button').forEach(btn => 
      btn.classList.remove('active')
    );
    button.classList.add('active');

    if (slug === 'all') {
      this.selectedPlaylists = [];
    } else if (playlistId) {
      this.selectedPlaylists = [playlistId];
    }

    this.loadVideos();
  }

  handlePlaylistChange() {
    // Only handle playlist change if we're in videos mode
    if (!this.isVideosMode) {
      console.warn('handlePlaylistChange called but not in videos mode');
      return;
    }
    
    const boxes = this.section.querySelectorAll('#formats-list input[data-yplaylist]');
    this.selectedPlaylists = Array.from(boxes).filter(b => b.checked).map(b => b.getAttribute('data-yplaylist'));
    this.updateMainPlaylistButtons();
    this.loadVideos();
  }

  updateMainPlaylistButtons() {
    const mainButtons = this.filterList.querySelectorAll('.cards-filter__item-button');
    mainButtons.forEach(button => {
      const slug = button.getAttribute('data-slug');
      const playlistId = button.getAttribute('data-playlist-id');
      if (slug === 'all') {
        button.classList.toggle('active', this.selectedPlaylists.length === 0);
      } else if (playlistId) {
        button.classList.toggle('active', this.selectedPlaylists.includes(playlistId));
      } else {
        button.classList.remove('active');
      }
    });
  }

  handleFilterChange() {
    // Update selected formats
    const formatCheckboxes = this.section.querySelectorAll('#formats-list input[type="checkbox"]');
    this.selectedFormats = [];
    formatCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const formatSlug = checkbox.getAttribute('data-format-slug');
        const format = this.allFormats.find(f => f.slug === formatSlug);
        if (format) {
          this.selectedFormats.push(format);
        }
      }
    });

    // Update selected types
    const typeCheckboxes = this.section.querySelectorAll('#types-list input[type="checkbox"]');
    this.selectedTypes = [];
    typeCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const typeSlug = checkbox.getAttribute('data-type-slug');
        const type = this.allTypes.find(t => t.slug === typeSlug);
        if (type) {
          this.selectedTypes.push(type);
        }
      }
    });

    // Update selected authors
    const authorCheckboxes = this.section.querySelectorAll('#authors-list input[type="checkbox"]');
    this.selectedAuthors = [];
    authorCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        const authorSlug = checkbox.getAttribute('data-author-slug');
        const author = this.allAuthors.find(a => a.slug === authorSlug);
        if (author) {
          this.selectedAuthors.push(author);
        }
      }
    });

    // Update main buttons
    this.updateMainButtons();
    this.loadPostsByTag('all');
  }

  updateMainButtons() {
    if (!this.filterList) return;
    
    if (this.isVideosMode) {
      this.updateMainPlaylistButtons();
        } else {
      const mainButtons = this.filterList.querySelectorAll('.cards-filter__item-button');
      mainButtons.forEach(button => {
        const slug = button.getAttribute('data-slug');
        if (slug === 'all') {
          button.classList.toggle('active', this.selectedFormats.length === 0);
        } else {
          const isSelected = this.selectedFormats.some(format => format.slug === slug);
          button.classList.toggle('active', isSelected);
        }
      });
    }
  }

  updatePopupCheckboxes() {
    // Update format checkboxes
    const formatCheckboxes = this.section.querySelectorAll('#formats-list input[type="checkbox"]');
    formatCheckboxes.forEach(checkbox => {
      const formatSlug = checkbox.getAttribute('data-format-slug');
      checkbox.checked = this.selectedFormats.some(f => f.slug === formatSlug);
    });

    // Update type checkboxes
    const typeCheckboxes = this.section.querySelectorAll('#types-list input[type="checkbox"]');
    typeCheckboxes.forEach(checkbox => {
      const typeSlug = checkbox.getAttribute('data-type-slug');
      checkbox.checked = this.selectedTypes.some(t => t.slug === typeSlug);
    });

    // Update author checkboxes
    const authorCheckboxes = this.section.querySelectorAll('#authors-list input[type="checkbox"]');
    authorCheckboxes.forEach(checkbox => {
      const authorSlug = checkbox.getAttribute('data-author-slug');
      checkbox.checked = this.selectedAuthors.some(a => a.slug === authorSlug);
    });
  }

  resetAllFilters() {
    this.selectedFormats = [];
    this.selectedTypes = [];
    this.selectedAuthors = [];
    this.selectedPlaylists = [];
    
    // Uncheck all checkboxes
    const allCheckboxes = this.section.querySelectorAll('.filter-popup__checkbox');
    allCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    // Reset main buttons to "All" active
    if (this.filterList) {
      this.filterList.querySelectorAll('.cards-filter__item-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-slug') === 'all') {
          btn.classList.add('active');
        }
      });
    }
    
    // Close popup
    this.closePopup();
    
    // Reload content based on current mode
    if (this.isVideosMode) {
      this.loadVideos();
    } else {
      this.loadPostsByTag('all');
    }
  }

  updateFilterButton() {
    const filterButton = this.section.querySelector('.cards-filter__button');
    if (!filterButton) return;

    const buttonText = filterButton.querySelector('span');
    const filterIcon = filterButton.querySelector('.filter-icon');
    const closeIcon = filterButton.querySelector('.close-icon');
    const popup = this.section.querySelector('.filter-popup');
    const isVisible = popup && popup.classList.contains('show');

    if (isVisible) {
      if (filterIcon) filterIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      buttonText.textContent = 'Close';
    } else {
      if (filterIcon) filterIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      buttonText.textContent = 'Filter';
    }
  }

  async loadPostsByTag(slug, page = 1, append = false) {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      
      let filter = '';
      if (slug !== 'all') {
        filter = `tag:${slug}`;
      } else if (this.formats) {
        filter = `tag:[${this.formats}]`;
      }

      // Apply additional filters
      if (this.selectedFormats.length > 0) {
        const formatFilter = this.selectedFormats.map(f => f.slug).join(',');
        filter = filter ? `${filter}+tag:[${formatFilter}]` : `tag:[${formatFilter}]`;
      }

      if (this.selectedTypes.length > 0) {
        const typeFilter = this.selectedTypes.map(t => t.slug).join(',');
        filter = filter ? `${filter}+tag:[${typeFilter}]` : `tag:[${typeFilter}]`;
      }

      if (this.selectedAuthors.length > 0) {
        const authorSlugs = this.selectedAuthors.map(a => a.slug).join(',');
        const authorFilter = this.selectedAuthors.length === 1 ? 
          `authors:${authorSlugs}` : `authors:[${authorSlugs}]`;
        filter = filter ? `${filter}+${authorFilter}` : authorFilter;
      }

      const options = {
        include: ['tags', 'authors'],
        page: page,
        limit: this.limit === 'all' ? 15 : parseInt(this.limit)
      };

      if (filter) {
        options.filter = filter;
      }

      const response = await this.api.posts.browse(options);
      
      if (append) {
        // For infinite scroll, append new posts
        this.allPosts = [...this.allPosts, ...response];
        this.renderPosts(response, true);
        this.hasMorePosts = response.length === parseInt(this.limit);
        this.currentPage = page;
      } else {
        // For filter changes, replace all posts
        this.allPosts = response;
        this.renderPosts(response, false);
        this.hasMorePosts = response.length === parseInt(this.limit);
        this.currentPage = 1;
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMorePosts() {
    if (!this.infiniteScroll || this.isLoading || !this.hasMorePosts) return;
    
    if (this.isVideosMode) {
      // For videos, we don't support infinite scroll yet
      return;
    }
    
    const activeButton = this.filterList.querySelector('.cards-filter__item-button.active');
    const currentSlug = activeButton ? activeButton.getAttribute('data-slug') : 'all';
    
    await this.loadPostsByTag(currentSlug, this.currentPage + 1, true);
  }
}

// Author page scenario
export class AuthorCardsManager extends BaseCardsManager {
  constructor(section, config) {
    super(section, config);
    this.authorSlug = section.getAttribute('data-author-slug');
    this.allTags = [];
  }

  setupEventListeners() {
    super.setupEventListeners();
    
    if (this.filterList) {
      this.filterList.addEventListener('click', (e) => {
        const button = e.target.closest('button.cards-filter__item-button');
        if (!button) return;
        e.preventDefault();
        this.handleFilterClick(button);
      });
    }
  }

  async loadInitialContent() {
    // Don't load content on init - let server-rendered content stay
    // Only load tags for popup when needed
    await this.loadAuthorTags();
  }

  async loadAuthorTags() {
    try {
      const response = await this.api.posts.browse({
        filter: `authors:${this.authorSlug}`,
        include: ['tags'],
        limit: 'all'
      });
      
      const tagsMap = new Map();
      response.forEach(post => {
        if (post.primary_tag) {
          tagsMap.set(post.primary_tag.slug, {
            slug: post.primary_tag.slug,
            name: post.primary_tag.name
          });
        }
      });
      
      this.allTags = Array.from(tagsMap.values());
      this.renderTagButtons();
    } catch (error) {
      console.error('Failed to load author tags:', error);
    }
  }

  renderTagButtons() {
    if (!this.filterList) return;
    
    const allButton = this.filterList.querySelector('li:first-child');
    this.filterList.innerHTML = '';
    if (allButton) this.filterList.appendChild(allButton);
    
    const items = this.allTags.map(tag => 
      `<li class="cards-filter__item">
        <button class="cards-filter__item-button" data-slug="${tag.slug}">${tag.name}</button>
      </li>`
    ).join('');
    
    this.filterList.insertAdjacentHTML('beforeend', items);
  }

  handleFilterClick(button) {
    const slug = button.getAttribute('data-slug');
    
    this.filterList.querySelectorAll('.cards-filter__item-button').forEach(btn => 
      btn.classList.remove('active')
    );
    button.classList.add('active');

    this.loadPostsByTag(slug);
  }

  async loadPostsByTag(slug, page = 1, append = false) {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      
      let filter = `authors:${this.authorSlug}`;
      
      if (slug !== 'all') {
        filter += `+tag:${slug}`;
      }

      const options = {
        include: ['tags', 'authors'],
        page: page,
        limit: this.limit === 'all' ? 15 : parseInt(this.limit),
        filter: filter
      };

      const response = await this.api.posts.browse(options);
      
      if (append) {
        const existingIds = this.allPosts.map(post => post.id);
        const newPosts = response.filter(post => !existingIds.includes(post.id));
        this.allPosts = [...this.allPosts, ...newPosts];
        this.renderPosts(newPosts, true);
      } else {
        this.allPosts = response;
        this.renderPosts(response, false);
      }

      this.currentPage = page;
      this.hasMorePosts = response.length === parseInt(this.limit);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMorePosts() {
    if (!this.infiniteScroll || this.isLoading || !this.hasMorePosts) return;
    
    const activeButton = this.filterList.querySelector('.cards-filter__item-button.active');
    const currentSlug = activeButton ? activeButton.getAttribute('data-slug') : 'all';
    
    await this.loadPostsByTag(currentSlug, this.currentPage + 1, true);
  }
}

// Initialize the cards list manager
export function initCardsListFilter() {
  const sections = document.querySelectorAll(".cards-list[data-scenario]");
  if (!sections.length) return;
  new CardsListManager();
}
