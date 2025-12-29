import tocbot from 'tocbot';

// Initialize TOC (Table of Contents)
export function initTOC() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.js-toc-content');
  
  if (!isPostPage) return;

  const tocElement = document.querySelector('.js-toc');
  const contentElement = document.querySelector('.js-toc-content');
  
  if (!tocElement || !contentElement) return;

  tocbot.init({
    // Where to render the table of contents.
    tocSelector: '.js-toc',
    // Where to grab the headings to build the table of contents.
    contentSelector: '.js-toc-content',
    // Which headings to grab inside of the contentSelector element.
    headingSelector: 'h2, h3',
  });
}

// TOC Accordion functionality
export function initTOCAccordion() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.js-toc-content');
  
  if (!isPostPage) return;

  const tocHeader = document.querySelector('.toc-header');
  const tocContent = document.querySelector('.js-toc');
  const arrowIcon = document.querySelector('.toc-header__arrow-icon');
  let isHidden = true;
  if (!tocHeader || !tocContent || !arrowIcon) return;


  // Toggle function
  function toggleTOC() {
    isHidden = !tocHeader.classList.contains('is-open');

    if (isHidden) {
      // Open
      tocHeader.classList.add('is-open');
      arrowIcon.classList.add('is-open');
      tocContent.classList.add('is-open');
    } else {
      // Close
      tocHeader.classList.remove('is-open');
      arrowIcon.classList.remove('is-open');
      tocContent.classList.remove('is-open');
    }
  }

  // Add click event listener
  tocHeader.addEventListener('click', toggleTOC);
}

