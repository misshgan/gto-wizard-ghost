// Footnotes module
// Converts {{tooltip-title: текст}} and {{tooltip-content: текст}} ... {{/tooltip-content}} notation to interactive tooltips
// Supports HTML in descriptions (br, styles, etc.)

export function initFootnotes() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content');
  
  if (!isPostPage) return;

  const contentElement = document.querySelector('.gh-content');
  if (!contentElement) return;

  // Step 1: Process tooltip definitions with new syntax
  // Format: {{tooltip-content: key}} ... content ... {{/tooltip-content}}
  // This allows multi-line content including images
  const footnotesMap = new Map();
  // Get all direct children of content element
  const allElements = Array.from(contentElement.children);
  
  // Find all definition starts: {{tooltip-content: key}}
  const startRegex = /\{\{tooltip-content:\s*([^}]+)\}\}/;
  const endRegex = /\{\{\/tooltip-content\}\}/;
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent || '';
    const startMatch = text.match(startRegex);
    
    if (startMatch) {
      const tooltipKey = startMatch[1].trim();
      
      // Skip if already processed
      if (footnotesMap.has(tooltipKey)) continue;
      
      // Find the end marker {{/tooltip-content}}
      let endIndex = -1;
      let endElement = null;
      
      for (let j = i; j < allElements.length; j++) {
        const checkElement = allElements[j];
        const checkText = checkElement.textContent || '';
        const endMatch = checkText.match(endRegex);
        
        if (endMatch) {
          endIndex = j;
          endElement = checkElement;
          break;
        }
      }
      
      // If we found both start and end
      if (endIndex !== -1 && endElement) {
        // Collect all content between start and end
        const contentParts = [];
        const elementsToRemove = [];
        
        // Process start element
        const startHTML = element.innerHTML || '';
        const startHTMLMatch = startHTML.match(new RegExp(`\\{\\{tooltip-content:\\s*${tooltipKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}\\s*(.+)`, 's'));
        
        if (startHTMLMatch && startHTMLMatch[1]) {
          // Remove marker and get remaining content
          const remainingContent = startHTMLMatch[1].trim();
          if (remainingContent) {
            contentParts.push(remainingContent);
          }
        }
        
        // Add element to removal list if it only contained the marker
        if (element.textContent.trim() === startMatch[0].trim()) {
          elementsToRemove.push(element);
        } else {
          // Remove just the marker from start element
          if (startHTMLMatch) {
            const updatedHTML = startHTML.replace(startHTMLMatch[0], '').trim();
            if (updatedHTML) {
              element.innerHTML = updatedHTML;
            } else {
              elementsToRemove.push(element);
            }
          }
        }
        
        // Process middle elements (between start and end)
        for (let k = i + 1; k < endIndex; k++) {
          const middleElement = allElements[k];
          contentParts.push(middleElement.outerHTML);
          elementsToRemove.push(middleElement);
        }
        
        // Process end element
        const endHTML = endElement.innerHTML || '';
        const endHTMLMatch = endHTML.match(/(.+?)\s*\{\{\/tooltip-content\}\}/s);
        
        if (endHTMLMatch && endHTMLMatch[1]) {
          // Get content before marker
          const beforeContent = endHTMLMatch[1].trim();
          if (beforeContent) {
            contentParts.push(beforeContent);
          }
        }
        
        // Add end element to removal list if it only contained the marker
        if (endElement.textContent.trim() === '{{/tooltip-content}}') {
          elementsToRemove.push(endElement);
        } else {
          // Remove just the marker from end element
          if (endHTMLMatch) {
            const updatedHTML = endHTML.replace(endHTMLMatch[0], '').trim();
            if (updatedHTML) {
              endElement.innerHTML = updatedHTML;
            } else {
              elementsToRemove.push(endElement);
            }
          }
        }
        
        // Combine all content parts
        const tooltipContent = contentParts.join('');
        
        // Store footnote definition
        footnotesMap.set(tooltipKey, tooltipContent);
        
        // Remove processed elements
        elementsToRemove.forEach(el => {
          if (el.parentNode) {
            el.remove();
          }
        });
        
        // Skip processed elements
        i = endIndex;
      } else {
        console.warn(`[Footnotes] Tooltip content definition started for "${tooltipKey}" but no closing {{/tooltip-content}} found. Make sure to close all tooltip definitions.`);
      }
    }
  }
  
  // If no footnotes found, exit
  if (footnotesMap.size === 0) return;
  
  // Step 2: Process tooltip references in text ({{tooltip-title: текст}})
  // Regex to match {{tooltip-title: текст}}
  const referenceRegex = /\{\{tooltip-title:\s*([^}]+)\}\}/g;
  
  // Process all text nodes in paragraphs, list items, figcaptions, and callouts
  const selectors = 'p, li, figcaption, .kg-callout-text, h1, h2, h3, h4, h5, h6';
  const elements = contentElement.querySelectorAll(selectors);
  
  elements.forEach(element => {
    // Process text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const matches = [...text.matchAll(referenceRegex)];
      
      if (matches.length === 0) return;
      
      // Build new DOM structure
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      
      matches.forEach(match => {
        const tooltipKey = match[1].trim();
        
        // Only process if we have a definition for this key
        if (!footnotesMap.has(tooltipKey)) {
          // If no definition, just keep the original text
          if (match.index > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.slice(lastIndex, match.index))
            );
          }
          fragment.appendChild(
            document.createTextNode(match[0])
          );
          lastIndex = match.index + match[0].length;
          return;
        }
        
        // Add text before match
        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.slice(lastIndex, match.index))
          );
        }
        
        // Create tooltip reference
        const tooltipId = `tooltip-${tooltipKey.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
        const span = document.createElement('span');
        span.className = 'tooltip-ref';
        span.setAttribute('data-tooltip-id', tooltipId);
        span.setAttribute('data-tooltip-key', tooltipKey); // Store key to get HTML from Map
        span.setAttribute('tabindex', '0');
        span.setAttribute('role', 'button');
        span.setAttribute('aria-label', `Tooltip: ${tooltipKey}`);
        
        // Add the tooltip title text with class
        const tooltipTitle = document.createElement('span');
        tooltipTitle.className = 'tooltip-title';
        tooltipTitle.textContent = tooltipKey;
        span.appendChild(tooltipTitle);
        
        fragment.appendChild(span);
        
        lastIndex = match.index + match[0].length;
      });
      
      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex))
        );
      }
      
      // Replace text node with fragment
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  });
  
  // Validation: Check for orphaned references (references without definitions)
  const allReferences = new Set();
  const allText = contentElement.textContent || '';
  const referenceMatches = [...allText.matchAll(referenceRegex)];
  referenceMatches.forEach(match => {
    allReferences.add(match[1].trim());
  });
  
  allReferences.forEach(ref => {
    if (!footnotesMap.has(ref)) {
      console.warn(`[Footnotes] Reference "{{tooltip-title: ${ref}}}" found but no definition provided. Make sure to add: {{tooltip-content: ${ref}}} ... {{/tooltip-content}}`);
    }
  });
  
  // Step 3: Initialize popover functionality
  // Pass footnotesMap to preserve HTML content
  initFootnotesPopover(contentElement, footnotesMap);
}

function initFootnotesPopover(container, footnotesMap) {
  const tooltipRefs = container.querySelectorAll('.tooltip-ref');
  
  if (tooltipRefs.length === 0) return;
  
  // Create popover element
  const popover = document.createElement('div');
  popover.className = 'tooltip-popover';
  popover.setAttribute('role', 'tooltip');
  document.body.appendChild(popover);
  
  let activeRef = null;
  let hideTimeout = null;
  let showTimeout = null;
  
  function showPopover(ref) {
    // Clear any pending hide
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    
    // Hide previous popover
    if (activeRef && activeRef !== ref) {
      hidePopover();
    }
    
    activeRef = ref;
    
    // Get tooltip key and content from Map (preserves HTML)
    const tooltipKey = ref.getAttribute('data-tooltip-key');
    if (!tooltipKey || !footnotesMap.has(tooltipKey)) return;
    
    const tooltipContent = footnotesMap.get(tooltipKey);
    if (!tooltipContent) return;
    
    // Set content (preserve HTML - no escaping!)
    popover.innerHTML = tooltipContent;
    
    // Position popover
    positionPopover(ref, popover);
    
    // Show popover
    popover.classList.add('is-active');
    ref.classList.add('is-active');
  }
  
  function hidePopover() {
    if (hideTimeout) return;
    
    hideTimeout = setTimeout(() => {
      popover.classList.remove('is-active');
      if (activeRef) {
        activeRef.classList.remove('is-active');
      }
      activeRef = null;
      hideTimeout = null;
    }, 100);
  }
  
  function positionPopover(ref, popover) {
    const rect = ref.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Calculate position
    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;
    
    // Check if popover would go off screen
    const popoverWidth = 320; // max-width from CSS
    const viewportWidth = window.innerWidth;
    
    if (left + popoverWidth > viewportWidth) {
      left = viewportWidth - popoverWidth - 20;
    }
    
    if (left < 20) {
      left = 20;
    }
    
    // Check if popover would go off bottom
    // First, temporarily show to measure
    popover.style.visibility = 'hidden';
    popover.style.display = 'block';
    const popoverHeight = popover.offsetHeight || 200; // estimate
    popover.style.display = '';
    popover.style.visibility = '';
    
    if (rect.bottom + popoverHeight > window.innerHeight + scrollY) {
      // Show above instead
      top = rect.top + scrollY - popoverHeight - 8;
      popover.classList.add('is-above');
    } else {
      popover.classList.remove('is-above');
    }
    
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }
  
  // Add event listeners
  tooltipRefs.forEach(ref => {
    // Click handler
    ref.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeRef === ref && popover.classList.contains('is-active')) {
        hidePopover();
      } else {
        if (showTimeout) clearTimeout(showTimeout);
        showPopover(ref);
      }
    });
    
    // Hover handlers (desktop)
    if (window.matchMedia('(hover: hover)').matches) {
      ref.addEventListener('mouseenter', () => {
        if (showTimeout) clearTimeout(showTimeout);
        showTimeout = setTimeout(() => {
          showPopover(ref);
        }, 300);
      });
      
      ref.addEventListener('mouseleave', () => {
        if (showTimeout) {
          clearTimeout(showTimeout);
          showTimeout = null;
        }
        hidePopover();
      });
      
      popover.addEventListener('mouseenter', () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      });
      
      popover.addEventListener('mouseleave', () => {
        hidePopover();
      });
    }
    
    // Keyboard handler
    ref.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (activeRef === ref && popover.classList.contains('is-active')) {
          hidePopover();
        } else {
          if (showTimeout) clearTimeout(showTimeout);
          showPopover(ref);
        }
      } else if (e.key === 'Escape' && activeRef === ref) {
        hidePopover();
        ref.focus();
      }
    });
  });
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && 
        !Array.from(tooltipRefs).some(ref => ref.contains(e.target))) {
      hidePopover();
    }
  });
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popover.classList.contains('is-active')) {
      hidePopover();
      if (activeRef) activeRef.focus();
    }
  });
  
  // Reposition on scroll/resize
  let resizeTimeout;
  function handleResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (activeRef && popover.classList.contains('is-active')) {
        positionPopover(activeRef, popover);
      }
    }, 100);
  }
  
  window.addEventListener('scroll', handleResize, { passive: true });
  window.addEventListener('resize', handleResize);
}
