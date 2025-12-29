// Toggle module
// Converts {{toggle: Заголовок}} ... content ... {{/toggle}} to collapsible sections

export function initToggle() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content');
  
  if (!isPostPage) return;

  const contentElement = document.querySelector('.gh-content');
  if (!contentElement) return;

  // Get all direct children of content element
  const allElements = Array.from(contentElement.children);
  
  // Find all toggle starts: {{toggle: Заголовок}}
  const startRegex = /\{\{toggle:\s*([^}]+)\}\}/;
  const endRegex = /\{\{\/toggle\}\}/;
  
  const toggleBlocks = [];
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent || '';
    const startMatch = text.match(startRegex);
    
    if (startMatch) {
      const toggleTitle = startMatch[1].trim();
      
      // Find the end marker {{/toggle}}
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
        // Validation: Check if end comes before start (shouldn't happen, but just in case)
        if (endIndex < i) {
          console.warn(`[Toggle] End marker {{/toggle}} found before start marker for "${toggleTitle}"`);
          continue;
        }
        toggleBlocks.push({
          startIndex: i,
          endIndex: endIndex,
          startElement: element,
          endElement: endElement,
          title: toggleTitle
        });
        
        // Skip to end
        i = endIndex;
      } else {
        // Validation: Start found but no end
        console.warn(`[Toggle] Start marker {{toggle: ${toggleTitle}}} found but no closing {{/toggle}} marker. Make sure to close all toggle sections.`);
      }
    }
  }
  
  // Validation: Check for orphaned end markers
  allElements.forEach((element, index) => {
    const text = element.textContent || '';
    const endMatch = text.match(endRegex);
    if (endMatch) {
      // Check if this end marker was processed
      const wasProcessed = toggleBlocks.some(block => block.endIndex === index);
      if (!wasProcessed) {
        console.warn(`[Toggle] Found closing marker {{/toggle}} without matching opening {{toggle: ...}} marker.`);
      }
    }
  });
  
  // Process toggle blocks in reverse order to maintain indices
  toggleBlocks.reverse().forEach(block => {
    // Create toggle container
    const container = document.createElement('div');
    container.className = 'toggle';
    
    // Create header/button
    const header = document.createElement('button');
    header.className = 'toggle__header';
    header.setAttribute('type', 'button');
    header.setAttribute('aria-expanded', 'false');
    
    const headerText = document.createElement('span');
    headerText.className = 'toggle__title';
    headerText.textContent = block.title;
    header.appendChild(headerText);
    
    const headerIcon = document.createElement('span');
    headerIcon.className = 'toggle__icon';
    headerIcon.setAttribute('aria-hidden', 'true');
    header.appendChild(headerIcon);
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'toggle__content';
    
    // Collect all content between start and end
    const contentElements = [];
    
    // Process start element
    const startHTML = block.startElement.innerHTML || '';
    const startHTMLMatch = startHTML.match(/\{\{toggle:\s*[^}]+\}\}\s*(.+)/s);
    
    if (startHTMLMatch && startHTMLMatch[1]) {
      const remainingContent = startHTMLMatch[1].trim();
      if (remainingContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = remainingContent;
        while (tempDiv.firstChild) {
          contentElements.push(tempDiv.firstChild);
        }
      }
    }
    
    // Process middle elements (between start and end)
    for (let k = block.startIndex + 1; k < block.endIndex; k++) {
      const middleElement = allElements[k];
      if (middleElement && middleElement.parentNode) {
        contentElements.push(middleElement.cloneNode(true));
      }
    }
    
    // Process end element
    const endHTML = block.endElement.innerHTML || '';
    const endHTMLMatch = endHTML.match(/(.+?)\s*\{\{\/toggle\}\}/s);
    
    if (endHTMLMatch && endHTMLMatch[1]) {
      const beforeContent = endHTMLMatch[1].trim();
      if (beforeContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = beforeContent;
        while (tempDiv.firstChild) {
          contentElements.push(tempDiv.firstChild);
        }
      }
    }
    
    // Add all content elements to container
    contentElements.forEach(el => {
      contentContainer.appendChild(el);
    });
    
    container.appendChild(header);
    container.appendChild(contentContainer);
    
    // Replace start element with container
    block.startElement.replaceWith(container);
    
    // Remove middle and end elements
    for (let k = block.startIndex + 1; k <= block.endIndex; k++) {
      const elementToRemove = allElements[k];
      if (elementToRemove && elementToRemove.parentNode) {
        elementToRemove.remove();
      }
    }
    
    // Add click handler
    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', !isExpanded);
      container.classList.toggle('is-open', !isExpanded);
    });
  });
}

