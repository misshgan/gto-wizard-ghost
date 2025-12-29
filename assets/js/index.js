// JavaScript files are compiled and minified during the build process to the assets/built folder. See available scripts in the package.json file.

// Import CSS
import "../css/index.css";
import 'lazysizes';

// Core modules - always loaded
import { initTheme, handleThemeToggle } from './modules/theme.js';
import { initActiveNavigation, initSecondaryDropdown, initMobileSidebar } from './modules/navigation.js';
import { initSearch, initSearchBarButton } from './modules/search.js';
import { initAnnouncementProcessor } from './modules/announcement-processor.js';

// Page-specific modules - conditionally loaded
import { initTOC, initTOCAccordion } from './modules/toc.js';
import { initPostImagesLightbox } from './modules/lightbox.js';
import { initTitleCaseProcessor } from './modules/title-case.js';
import { initCardSymbolProcessor } from './modules/symbols.js';
import { initCardsListFilter } from './modules/cards.js';
import { initSimpleInfiniteScroll } from './modules/infinite-scroll.js';
import { initFootnotes } from './modules/footnotes.js';
import { initColorProcessor } from './modules/color-processor.js';
import { initRevealAnswer } from './modules/reveal-answer.js';
import { initToggle } from './modules/toggle.js';
import { initQuoteAuthor } from './modules/quote-author.js';
import { initContentCleanup } from './modules/content-cleanup.js';
import { initContentSnippets } from './modules/content-snippets.js';

// Initialize theme immediately (before DOM ready to prevent flash)
initTheme();
handleThemeToggle();

// Initialize core features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Core navigation features - always needed
  initActiveNavigation();
  initSecondaryDropdown();
  initMobileSidebar();
  
  // Search - always needed (search button in header)
  initSearch();
  initSearchBarButton();
  
  // Announcement bar processor - process color snippets
  initAnnouncementProcessor();
  
  // Cards list - only if cards-list sections exist
  initCardsListFilter();
  
  // Infinite scroll for tag/author pages - only if specific section exists
  initSimpleInfiniteScroll();
  
  // Post/page specific features
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content, .js-toc-content');
  
  if (isPostPage) {
    // TOC - only on post/page templates
    initTOC();
    initTOCAccordion();
    
    // Lightbox for images - only on post/page templates
    setTimeout(() => {
      initPostImagesLightbox();
    }, 100);
    
    // Title case processor - only on post/page templates
    initTitleCaseProcessor();
    
    // Card symbol processor - only on post/page templates
    initCardSymbolProcessor();
    
    // Footnotes - only on post/page templates
    initFootnotes();
    
    // Color processor - only on post/page templates
    initColorProcessor();
    
    // Reveal answer - only on post/page templates
    initRevealAnswer();
    
    // Toggle - only on post/page templates
    initToggle();
    
    // Quote author - only on post/page templates
    initQuoteAuthor();
    
    // Content snippets (question-mark, exclamation-mark, search-mark, grid) - only on post/page templates
    initContentSnippets();
    
    // Content cleanup - only on post/page templates (should run last)
    initContentCleanup();
    
    // Show content after all snippets are processed
    const contentElement = document.querySelector('.gh-content');
    if (contentElement) {
      // Small delay to ensure all processing is complete
      setTimeout(() => {
        contentElement.classList.add('snippets-ready');
      }, 100);
    }
  }
});
