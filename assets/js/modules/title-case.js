import { titleCase } from 'title-case';

/**
 * Title Case Converter - Client-side solution using title-case npm package
 * Processes all headings (h1-h6) in post/page content and converts them to Title Case
 * 
 * Works entirely on the client side, no API keys or registration required!
 * Uses the proven title-case library for reliable heading processing.
 */
export class TitleCaseProcessor {
  constructor() {
    // Cache for already processed headings
    this.processedHeadings = new Map();
  }

  /**
   * Converts text to Title Case using the title-case library
   * @param {string} text - Text to process
   * @returns {string} - Processed text
   */
  convertToTitleCase(text) {
    // Check cache
    if (this.processedHeadings.has(text)) {
      return this.processedHeadings.get(text);
    }

    if (!text || text.trim().length === 0) {
      return text;
    }

    // Use title-case library for reliable processing
    // It accounts for all Title Case rules: prepositions, conjunctions, articles, etc.
    const convertedText = titleCase(text);
    
    // Save to cache
    this.processedHeadings.set(text, convertedText);
    
    return convertedText;
  }

  /**
   * Finds all headings in the content area and processes them
   * @param {HTMLElement} contentContainer - Container with content
   */
  processHeadings(contentContainer) {
    if (!contentContainer) {
      console.warn('Content container not found');
      return;
    }

    // Find all h1-h6 headings in the content area
    const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
      console.log('No headings found in content');
      return;
    }

    console.log(`Found ${headings.length} headings to process`);

    // Process all headings (synchronously, without delays)
    let processedCount = 0;
    for (const heading of headings) {
      const originalText = heading.textContent.trim();
      
      // Skip empty headings
      if (!originalText) continue;

      try {
        const convertedText = this.convertToTitleCase(originalText);
        
        // Replace heading text
        if (convertedText !== originalText) {
          heading.textContent = convertedText;
          processedCount++;
          console.log(`Converted: "${originalText}" → "${convertedText}"`);
        }
      } catch (error) {
        console.error(`Error processing heading "${originalText}":`, error);
      }
    }

    console.log(`Title case processing completed. Processed ${processedCount} of ${headings.length} headings.`);
  }

  /**
   * Initializes heading processing for the current page
   */
  init() {
    // Check if we're on a post or page
    // Ghost adds post-template or page-template classes to body
    const isPostPage = document.body.classList.contains('post-template') || 
                      document.body.classList.contains('page-template') ||
                      // Alternative check: presence of content area
                      document.querySelector('.gh-content, .js-toc-content');
    
    if (!isPostPage) {
      return;
    }

    // Find content area
    // Use selector from post.hbs and page.hbs templates
    const contentContainer = document.querySelector('.gh-content, .js-toc-content');
    
    if (contentContainer) {
      // Small delay to ensure content is fully loaded
      // Especially important for dynamically loaded content
      setTimeout(() => {
        this.processHeadings(contentContainer);
      }, 500);
    } else {
      console.warn('TitleCaseProcessor: Content container not found');
    }
  }
}

/**
 * Initialize heading processing
 */
export function initTitleCaseProcessor() {
  const processor = new TitleCaseProcessor();
  processor.init();
}

