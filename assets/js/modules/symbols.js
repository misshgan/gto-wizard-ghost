/**
 * Processes card symbols in post content
 * Finds card symbols (♠ ♥ ♦ ♣) and the character before them,
 * then applies appropriate styling
 */
export class CardSymbolProcessor {
  constructor() {
    // Card symbols: spades, hearts, diamonds, clubs (both Unicode and emoji versions)
    // Order matters: longer emoji versions first to match them before shorter Unicode versions
    this.cardSymbols = [
      '\u2660\uFE0F', // ♠️
      '\u2665\uFE0F', // ♥️
      '\u2666\uFE0F', // ♦️
      '\u2663\uFE0F', // ♣️
      '\u2660', // ♠
      '\u2665', // ♥
      '\u2666', // ♦
      '\u2663'  // ♣
    ];
    
    // Color class mapping for card symbols
    this.cardColorClasses = {
      '\u2665': 'red',      // ♥
      '\u2665\uFE0F': 'red', // ♥️
      '\u2663': 'green',    // ♣
      '\u2663\uFE0F': 'green', // ♣️
      '\u2666': 'blue',     // ♦
      '\u2666\uFE0F': 'blue', // ♦️
      '\u2660': 'black',    // ♠
      '\u2660\uFE0F': 'black' // ♠️
    };
  }

  /**
   * Gets the color class for a card symbol
   */
  getCardColorClass(symbol) {
    return this.cardColorClasses[symbol] || 'black';
  }

  /**
   * Processes card symbols in the given content container
   */
  processCardSymbols(contentContainer) {
    if (!contentContainer) {
      console.warn('CardSymbolProcessor: Content container not found');
      return;
    }

    // Create a walker to traverse all text nodes
    const walker = document.createTreeWalker(
      contentContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip if node is inside script, style, or already processed elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains('card-symbol-processed')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    let processedCount = 0;

    textNodes.forEach((textNode) => {
      const text = textNode.textContent;
      let hasCardSymbol = false;

      // Check if text contains any card symbol
      for (const symbol of this.cardSymbols) {
        if (text.includes(symbol)) {
          hasCardSymbol = true;
          break;
        }
      }

      if (!hasCardSymbol) return;

      // Process the text node
      const parent = textNode.parentElement;
      if (!parent) return;

      // Mark parent as processed to avoid double processing
      parent.classList.add('card-symbol-processed');

      // Create a document fragment to hold the processed content
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let modified = false;

      // Process each character in the text
      for (let i = 0; i < text.length; i++) {
        let foundSymbol = null;
        let symbolLength = 0;

        // Check for card symbols (check longer emoji versions first)
        for (const symbol of this.cardSymbols) {
          if (text.substring(i, i + symbol.length) === symbol) {
            foundSymbol = symbol;
            symbolLength = symbol.length;
            break;
          }
        }

        if (foundSymbol) {
          // Find the character before the card symbol
          let charBeforeIndex = i - 1;
          let charBefore = '';

          // Skip whitespace and find the first non-whitespace character
          while (charBeforeIndex >= lastIndex && /\s/.test(text[charBeforeIndex])) {
            charBeforeIndex--;
          }

          // Add text from lastIndex to charBeforeIndex (not including charBefore itself)
          if (charBeforeIndex >= lastIndex) {
            charBefore = text[charBeforeIndex];
            // Add text before charBefore
            if (charBeforeIndex > lastIndex) {
              const beforeCharText = text.substring(lastIndex, charBeforeIndex);
              if (beforeCharText) {
                fragment.appendChild(document.createTextNode(beforeCharText));
              }
            }
          } else {
            // No character before, add all text up to the card symbol
            if (i > lastIndex) {
              const beforeText = text.substring(lastIndex, i);
              if (beforeText) {
                fragment.appendChild(document.createTextNode(beforeText));
              }
            }
          }

          // Get color class for the card symbol
          const cardColorClass = this.getCardColorClass(foundSymbol);

          // Create span for character before card symbol (if exists and is alphanumeric)
          if (charBefore && /[\w\d]/.test(charBefore)) {
            const charSpan = document.createElement('span');
            charSpan.className = `card-symbol-char card-symbol-char--${cardColorClass}`;
            charSpan.textContent = charBefore;
            fragment.appendChild(charSpan);
            modified = true;
            
            // Add whitespace between charBefore and card symbol (if any)
            if (charBeforeIndex + 1 < i) {
              const middleText = text.substring(charBeforeIndex + 1, i);
              if (middleText) {
                fragment.appendChild(document.createTextNode(middleText));
              }
            }
            
            lastIndex = i + symbolLength;
          } else if (charBeforeIndex >= lastIndex) {
            // Character exists but is not alphanumeric, just add it as text
            if (charBeforeIndex > lastIndex) {
              const beforeCharText = text.substring(lastIndex, charBeforeIndex);
              if (beforeCharText) {
                fragment.appendChild(document.createTextNode(beforeCharText));
              }
            }
            fragment.appendChild(document.createTextNode(charBefore));
            if (charBeforeIndex + 1 < i) {
              const middleText = text.substring(charBeforeIndex + 1, i);
              if (middleText) {
                fragment.appendChild(document.createTextNode(middleText));
              }
            }
            lastIndex = i + symbolLength;
          } else {
            // No character before, lastIndex already updated above
            lastIndex = i + symbolLength;
          }

          // Create span for card symbol
          const symbolSpan = document.createElement('span');
          symbolSpan.className = `card-symbol card-symbol--${cardColorClass}`;
          symbolSpan.textContent = foundSymbol;
          fragment.appendChild(symbolSpan);
          modified = true;

          i += symbolLength - 1; // -1 because loop will increment
        }
      }

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      // Replace the text node with the fragment if modifications were made
      if (modified) {
        parent.replaceChild(fragment, textNode);
        processedCount++;
      } else {
        // Remove the class if no modifications were made
        parent.classList.remove('card-symbol-processed');
      }
    });

    if (processedCount > 0) {
      console.log(`Card symbol processing completed. Processed ${processedCount} text nodes.`);
    }
  }

  /**
   * Initializes card symbol processing for the current page
   */
  init() {
    // Check if we're on a post or page
    const isPostPage = document.body.classList.contains('post-template') || 
                      document.body.classList.contains('page-template') ||
                      document.querySelector('.gh-content, .js-toc-content');
    
    if (!isPostPage) {
      return;
    }

    // Find content area
    const contentContainer = document.querySelector('.gh-content, .js-toc-content');
    
    if (contentContainer) {
      // Small delay to ensure content is fully loaded
      setTimeout(() => {
        this.processCardSymbols(contentContainer);
      }, 500);
    } else {
      console.warn('CardSymbolProcessor: Content container not found');
    }
  }
}

/**
 * Initialize card symbol processing
 */
export function initCardSymbolProcessor() {
  const processor = new CardSymbolProcessor();
  processor.init();
}

