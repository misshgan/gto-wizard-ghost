// YouTube Search Module
// Searches videos from channel playlists

class YouTubeSearch {
  constructor() {
    this.apiKey = null;
    this.channelId = null;
    this.isInitialized = false;
    this.allPlaylists = [];
    this.allVideos = [];
    this.videosLoaded = false;
  }

  async init(apiKey, channelId) {
    if (!apiKey || !channelId) {
      console.warn('YouTube API key or channel ID not provided');
      return;
    }

    if (apiKey.includes('{{') || apiKey === 'undefined' || 
        channelId.includes('{{') || channelId === 'undefined') {
      console.warn('YouTube API key or channel ID not configured');
      return;
    }

    this.apiKey = apiKey;
    this.channelId = channelId;
    this.isInitialized = true;
    
    // Preload playlists and videos for faster search
    await this.loadAllVideos();
  }

  async loadAllVideos() {
    if (!this.isInitialized) return;
    
    try {
      // Load all playlists
      const playlistsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${this.channelId}&maxResults=50&key=${this.apiKey}`;
      const playlistsResponse = await fetch(playlistsUrl);
      const playlistsData = await playlistsResponse.json();
      
      if (playlistsData.error || !playlistsData.items) {
        console.error('Failed to load playlists:', playlistsData.error);
        return;
      }

      this.allPlaylists = playlistsData.items
        .map(pl => ({
          id: pl.id,
          title: pl.snippet.title
        }))
        .filter(pl => pl.title.toLowerCase() !== 'shorts');

      // Load videos from all playlists in parallel
      const videoPromises = this.allPlaylists.map(playlist => 
        this.loadPlaylistVideos(playlist.id, playlist.title)
      );
      
      const videosArrays = await Promise.all(videoPromises);
      this.allVideos = videosArrays.flat();
      this.videosLoaded = true;
    } catch (error) {
      console.error('Failed to load YouTube videos:', error);
    }
  }

  async loadPlaylistVideos(playlistId, playlistTitle) {
    try {
      let allVideos = [];
      let pageToken = null;
      
      do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&maxResults=50&playlistId=${playlistId}&key=${this.apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error || !data.items) break;
        
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
            title: item.snippet.title,
            description: item.snippet.description || '',
            publishedAt: item.snippet.publishedAt,
            playlistTitle: playlistTitle,
            thumbnail: item.snippet.thumbnails?.maxres?.url || 
                       item.snippet.thumbnails?.standard?.url || 
                       item.snippet.thumbnails?.high?.url || 
                       item.snippet.thumbnails?.medium?.url,
            url: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId || item.snippet?.resourceId?.videoId}`
          }));
        
        allVideos = allVideos.concat(videos);
        pageToken = data.nextPageToken || null;
      } while (pageToken);
      
      return allVideos;
    } catch (error) {
      console.error(`Failed to load videos from playlist ${playlistId}:`, error);
      return [];
    }
  }

  async search(query, options = {}) {
    if (!this.isInitialized) {
      console.warn('YouTube search not initialized');
      return [];
    }

    const {
      maxResults = 10
    } = options;

    try {
      // Wait for videos to load if not loaded yet
      if (!this.videosLoaded) {
        await this.loadAllVideos();
      }

      if (this.allVideos.length === 0) {
        return [];
      }

      // Simple text search in video titles and descriptions
      const queryLower = query.toLowerCase();
      const matchingVideos = this.allVideos.filter(video => {
        const titleMatch = video.title.toLowerCase().includes(queryLower);
        const descMatch = video.description.toLowerCase().includes(queryLower);
        return titleMatch || descMatch;
      });

      // Sort by relevance (title matches first, then by date)
      matchingVideos.sort((a, b) => {
        const aTitleMatch = a.title.toLowerCase().includes(queryLower);
        const bTitleMatch = b.title.toLowerCase().includes(queryLower);
        
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        
        // If both match title or both don't, sort by date (newest first)
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });

      // Limit results
      return matchingVideos.slice(0, maxResults).map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        publishedAt: video.publishedAt,
        playlistTitle: video.playlistTitle,
        url: video.url,
        type: 'youtube'
      }));
    } catch (error) {
      console.error('YouTube search failed:', error);
      return [];
    }
  }

  formatResults(items) {
    return items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      type: 'youtube'
    }));
  }

  renderSearchResult(video) {
    const thumbnail = video.thumbnail ? 
      `<a href="${video.url}" class="search-results-item__image" target="_blank" rel="noopener noreferrer">
        <img src="${video.thumbnail}" alt="${video.title}">
      </a>` : '';

    const playlistTag = video.playlistTitle ? 
      `<a href="${video.url}" class="search-results-item__tag" target="_blank" rel="noopener noreferrer">${video.playlistTitle}</a>` : '';

    const date = new Date(video.publishedAt);
    const dateStr = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });

    // Truncate description if too long
    const description = video.description ? 
      (video.description.length > 150 ? video.description.substring(0, 150) + '...' : video.description) : '';

    return `
      <article class="search-results-item flex items-center">
        <div class="search-results-item__main flex direction-column">
          <div class="search-results-item__meta flex items-center">
            <span class="search-results-item__tag">Video</span>
            ${playlistTag}
            <time datetime="${date.toISOString().split('T')[0]}" class="search-results-item__date">${dateStr}</time>
          </div>
          <h3 class="search-results-item__title">
            <a href="${video.url}" target="_blank" rel="noopener noreferrer">${video.title}</a>
          </h3>
          ${description ? `<p class="search-results-item__description">${description}</p>` : ''}
        </div>
        ${thumbnail}
      </article>
    `;
  }
}

// Export for use in main search module
export default YouTubeSearch;
