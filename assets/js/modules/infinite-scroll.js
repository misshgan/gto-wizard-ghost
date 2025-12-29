import GhostContentAPI from "@tryghost/content-api";

// Always-on infinite scroll for tag/author pages
export function initSimpleInfiniteScroll() {
  const section = document.querySelector('section.cards-list--author-tag[data-api-url][data-content-key]');
  if (!section) return;

  const apiUrl = section.getAttribute('data-api-url');
  const contentKey = section.getAttribute('data-content-key');
  const tagSlug = section.getAttribute('data-tag-slug');
  const authorSlug = section.getAttribute('data-author-slug');
  const articlesContainer = section.querySelector('.cards-list__articles');
  if (!apiUrl || !contentKey || !articlesContainer) return;

  const api = new GhostContentAPI({
    url: apiUrl,
    key: contentKey,
    version: 'v5.0'
  });

  // Derive initial page from server-rendered cards to avoid duplicates
  const batchSize = 3;
  const initiallyRendered = Array.from(articlesContainer.querySelectorAll('.card'));
  let page = Math.ceil(initiallyRendered.length / batchSize);
  let isLoading = false;
  let hasMore = true;

  // Track already rendered post ids to avoid duplicates
  const renderedIds = new Set(
    Array.from(articlesContainer.querySelectorAll('.card[data-post-id]')).map(el => el.getAttribute('data-post-id'))
  );

  function renderDefaultCard(post) {
    const featureImage = post.feature_image ? `<a href="${post.url}" class="card__image"><img data-src="${post.feature_image}" class="lazyload" alt="${post.title}"></a>` : '';
    const primaryTagName = post.primary_tag ? post.primary_tag.name : '';
    const tagHtml = primaryTagName ? `<span class=\"card__tag\">${primaryTagName}</span>` : '';
    const readingTime = post.reading_time ? `<span class=\"card__reading-time\">${post.reading_time} min read</span>` : '';
    const excerpt = post.custom_excerpt ? `<p class=\"card__description\">${post.custom_excerpt}</p>` : '';
    const date = new Date(post.published_at);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });

    return `
<article class=\"card card--default flex direction-column card--default-smaller\" data-post-id=\"${post.id}\">
  ${featureImage}
  <div class=\"card__main flex direction-column\">
    <h3 class=\"card__title\"><a href=\"${post.url}\">${post.title}</a></h3>
    ${excerpt}
    <div class=\"card__footer flex items-center\">
      ${tagHtml}
      <div class=\"card__meta flex items-center\">
        <span class=\"card__date\">${dateStr}</span>
        ${readingTime}
      </div>
    </div>
  </div>
</article>`;
  }

  async function loadNext() {
    if (isLoading || !hasMore) return;
    isLoading = true;

    const options = {
      include: ['tags'],
      limit: batchSize,
      page: page + 1
    };
    if (tagSlug) options.filter = `tag:${tagSlug}`;
    if (authorSlug) options.filter = options.filter ? `${options.filter}+authors:${authorSlug}` : `authors:${authorSlug}`;

    try {
      const posts = await api.posts.browse(options);
      // Filter out already rendered posts
      const newPosts = posts.filter(p => !renderedIds.has(p.id));
      if (!newPosts.length) {
        hasMore = false;
        return;
      }
      page += 1;
      newPosts.forEach(p => renderedIds.add(p.id));
      const html = newPosts.map(renderDefaultCard).join('');
      articlesContainer.insertAdjacentHTML('beforeend', html);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load more posts', e);
      hasMore = false;
    } finally {
      isLoading = false;
    }
  }

  function onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (scrollTop + windowHeight >= docHeight - 200) {
      loadNext();
    }
  }

  // Kick off scroll listener
  window.addEventListener('scroll', onScroll);
}

