// Content snippets module
// Converts {{question-mark}}, {{exclamation-mark}}, {{search-mark}}, and {{grid}} snippets
// to styled content blocks

export function initContentSnippets() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content');
  
  if (!isPostPage) return;

  const contentElement = document.querySelector('.gh-content');
  if (!contentElement) return;

  // Get all direct children of content element
  const allElements = Array.from(contentElement.children);
  
  // Process different snippet types
  const snippetTypes = {
    'question-mark': {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 24C4.5 13.23 13.23 4.5 24 4.5C34.77 4.5 43.5 13.23 43.5 24C43.5 34.77 34.77 43.5 24 43.5C13.23 43.5 4.5 34.77 4.5 24ZM27.256 16.166C25.476 14.612 22.524 14.612 20.746 16.166C20.4466 16.428 20.0553 16.5604 19.6583 16.5339C19.2613 16.5075 18.891 16.3244 18.629 16.025C18.367 15.7256 18.2346 15.3343 18.2611 14.9373C18.2875 14.5403 18.4706 14.17 18.77 13.908C21.678 11.364 26.322 11.364 29.23 13.908C32.256 16.556 32.256 20.944 29.23 23.592C28.7239 24.0333 28.1609 24.4046 27.556 24.696C26.204 25.352 25.5 26.244 25.5 27V28.5C25.5 28.8978 25.342 29.2794 25.0607 29.5607C24.7794 29.842 24.3978 30 24 30C23.6022 30 23.2206 29.842 22.9393 29.5607C22.658 29.2794 22.5 28.8978 22.5 28.5V27C22.5 24.442 24.62 22.786 26.25 21.996C26.614 21.82 26.952 21.598 27.256 21.334C28.916 19.88 28.916 17.62 27.256 16.166ZM24 36C24.3978 36 24.7794 35.842 25.0607 35.5607C25.342 35.2794 25.5 34.8978 25.5 34.5C25.5 34.1022 25.342 33.7206 25.0607 33.4393C24.7794 33.158 24.3978 33 24 33C23.6022 33 23.2206 33.158 22.9393 33.4393C22.658 33.7206 22.5 34.1022 22.5 34.5C22.5 34.8978 22.658 35.2794 22.9393 35.5607C23.2206 35.842 23.6022 36 24 36Z" fill="var(--color-accent)"/>
</svg>`
    },
    'exclamation-mark': {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 24C4.5 13.23 13.23 4.5 24 4.5C34.77 4.5 43.5 13.23 43.5 24C43.5 34.77 34.77 43.5 24 43.5C13.23 43.5 4.5 34.77 4.5 24ZM24 16.5C24.3978 16.5 24.7794 16.658 25.0607 16.9393C25.342 17.2206 25.5 17.6022 25.5 18V25.5C25.5 25.8978 25.342 26.2794 25.0607 26.5607C24.7794 26.842 24.3978 27 24 27C23.6022 27 23.2206 26.842 22.9393 26.5607C22.658 26.2794 22.5 25.8978 22.5 25.5V18C22.5 17.6022 22.658 17.2206 22.9393 16.9393C23.2206 16.658 23.6022 16.5 24 16.5ZM24 33C24.3978 33 24.7794 32.842 25.0607 32.5607C25.342 32.2794 25.5 31.8978 25.5 31.5C25.5 31.1022 25.342 30.7206 25.0607 30.4393C24.7794 30.158 24.3978 30 24 30C23.6022 30 23.2206 30.158 22.9393 30.4393C22.658 30.7206 22.5 31.1022 22.5 31.5C22.5 31.8978 22.658 32.2794 22.9393 32.5607C23.2206 32.842 23.6022 33 24 33Z" fill="var(--color-accent)"/>
</svg>`
    },
    'search-mark': {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <path d="M16.5 21.75C16.5 21.0606 16.6358 20.3779 16.8996 19.7409C17.1635 19.104 17.5502 18.5252 18.0377 18.0377C18.5252 17.5502 19.104 17.1635 19.7409 16.8996C20.3779 16.6358 21.0606 16.5 21.75 16.5C22.4394 16.5 23.1221 16.6358 23.7591 16.8996C24.396 17.1635 24.9748 17.5502 25.4623 18.0377C25.9498 18.5252 26.3365 19.104 26.6004 19.7409C26.8642 20.3779 27 21.0606 27 21.75C27 23.1424 26.4469 24.4777 25.4623 25.4623C24.4777 26.4469 23.1424 27 21.75 27C20.3576 27 19.0223 26.4469 18.0377 25.4623C17.0531 24.4777 16.5 23.1424 16.5 21.75Z" fill="var(--color-accent)"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M24 4.5C13.23 4.5 4.5 13.23 4.5 24C4.5 34.77 13.23 43.5 24 43.5C34.77 43.5 43.5 34.77 43.5 24C43.5 13.23 34.77 4.5 24 4.5ZM21.75 13.5C20.4572 13.5003 19.1825 13.8043 18.0288 14.3877C16.8751 14.9711 15.8746 15.8175 15.1081 16.8585C14.3416 17.8996 13.8305 19.1063 13.616 20.3812C13.4015 21.6561 13.4896 22.9635 13.8732 24.1981C14.2569 25.4327 14.9253 26.5599 15.8246 27.4887C16.7238 28.4175 17.8288 29.1219 19.0504 29.5452C20.2719 29.9685 21.5759 30.0988 22.857 29.9256C24.1382 29.7524 25.3607 29.2805 26.426 28.548L30.44 32.56C30.5773 32.7074 30.7429 32.8256 30.9269 32.9076C31.1109 32.9895 31.3095 33.0336 31.511 33.0372C31.7124 33.0407 31.9124 33.0037 32.0992 32.9282C32.286 32.8528 32.4556 32.7405 32.5981 32.5981C32.7405 32.4556 32.8528 32.286 32.9282 32.0992C33.0037 31.9124 33.0407 31.7124 33.0372 31.511C33.0336 31.3095 32.9895 31.1109 32.9076 30.9269C32.8256 30.7429 32.7074 30.5773 32.56 30.44L28.548 26.426C29.4002 25.1873 29.8977 23.7392 29.9867 22.2383C30.0756 20.7373 29.7528 19.2406 29.0529 17.9099C28.353 16.5791 27.3028 15.4649 26.0157 14.6877C24.7286 13.9105 23.2536 13.4998 21.75 13.5Z" fill="var(--color-accent)"/>
</svg>`
    }
  };
  
  const processedBlocks = [];
  
  // Process icon snippets (question-mark, exclamation-mark, search-mark)
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent || '';
    
    // Check for icon snippet start: {{question-mark}}, {{exclamation-mark}}, {{search-mark}}
    const iconStartMatch = text.match(/\{\{(question-mark|exclamation-mark|search-mark)\}\}/);
    
    if (iconStartMatch) {
      const snippetType = iconStartMatch[1];
      const endRegex = new RegExp(`\\{\\{/${snippetType}\\}\\}`);
      
      // Find the end marker
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
      
      if (endIndex !== -1 && endElement) {
        // Create container
        const container = document.createElement('div');
        container.className = 'content-grid';
        container.style.gridTemplateColumns = '4rem 1fr';
        container.style.alignItems = 'center';
        
        // Create icon wrapper
        const iconWrapper = document.createElement('div');
        iconWrapper.innerHTML = snippetTypes[snippetType].icon;
        container.appendChild(iconWrapper);
        
        // Create content wrapper
        const contentWrapper = document.createElement('div');
        
        // Collect content between start and end
        const contentElements = [];
        
        // Process start element
        const startHTML = element.innerHTML || '';
        const startHTMLMatch = startHTML.match(new RegExp(`\\{\\{${snippetType}\\}\\}\\s*(.+)`, 's'));
        
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
        
        // Process middle elements
        for (let k = i + 1; k < endIndex; k++) {
          const middleElement = allElements[k];
          if (middleElement && middleElement.parentNode) {
            contentElements.push(middleElement.cloneNode(true));
          }
        }
        
        // Process end element
        const endHTML = endElement.innerHTML || '';
        const endHTMLMatch = endHTML.match(new RegExp(`(.+?)\\s*\\{\\{/${snippetType}\\}\\}`, 's'));
        
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
        
        // Add all content to wrapper
        contentElements.forEach(el => {
          contentWrapper.appendChild(el);
        });
        
        container.appendChild(contentWrapper);
        
        // Replace start element
        element.replaceWith(container);
        
        // Remove middle and end elements
        for (let k = i + 1; k <= endIndex; k++) {
          const elementToRemove = allElements[k];
          if (elementToRemove && elementToRemove.parentNode) {
            elementToRemove.remove();
          }
        }
        
        processedBlocks.push({ start: i, end: endIndex });
        i = endIndex;
      } else {
        console.warn(`[Content Snippets] ${snippetType} snippet started but no closing {{/${snippetType}}} found. Make sure to close all icon blocks.`);
      }
    }
  }
  
  // Process grid snippets
  // Reset allElements after icon processing
  const remainingElements = Array.from(contentElement.children);
  
  for (let i = 0; i < remainingElements.length; i++) {
    const element = remainingElements[i];
    const text = element.textContent || '';
    
    // Check for grid start: {{grid: 2}}, {{grid: 3}}, {{grid: 1fr 1fr}}, etc.
    const gridStartMatch = text.match(/\{\{grid:\s*([^}]+)\}\}/);
    
    if (gridStartMatch) {
      const gridValue = gridStartMatch[1].trim();
      const endRegex = /\{\{\/grid\}\}/;
      
      // Find the end marker
      let endIndex = -1;
      let endElement = null;
      
      for (let j = i; j < remainingElements.length; j++) {
        const checkElement = remainingElements[j];
        const checkText = checkElement.textContent || '';
        const endMatch = checkText.match(endRegex);
        
        if (endMatch) {
          endIndex = j;
          endElement = checkElement;
          break;
        }
      }
      
      if (endIndex !== -1 && endElement) {
        // Create grid container
        const container = document.createElement('div');
        container.className = 'content-grid';
        
        // Set grid columns based on value
        if (gridValue === '2') {
          container.classList.add('col-2');
        } else if (gridValue === '3') {
          container.classList.add('col-3');
        } else {
          // Custom grid template (e.g., "1fr 1fr", "1fr 2fr", etc.)
          container.style.gridTemplateColumns = gridValue;
        }
        
        // Collect content between start and end
        const contentElements = [];
        
        // Process start element
        const startHTML = element.innerHTML || '';
        const startHTMLMatch = startHTML.match(/\{\{grid:\s*[^}]+\}\}\s*(.+)/s);
        
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
        
        // Process middle elements
        for (let k = i + 1; k < endIndex; k++) {
          const middleElement = remainingElements[k];
          if (middleElement && middleElement.parentNode) {
            contentElements.push(middleElement.cloneNode(true));
          }
        }
        
        // Process end element
        const endHTML = endElement.innerHTML || '';
        const endHTMLMatch = endHTML.match(/(.+?)\s*\{\{\/grid\}\}/s);
        
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
        
        // Add all content to container
        contentElements.forEach(el => {
          container.appendChild(el);
        });
        
        // Replace start element
        element.replaceWith(container);
        
        // Remove middle and end elements
        for (let k = i + 1; k <= endIndex; k++) {
          const elementToRemove = remainingElements[k];
          if (elementToRemove && elementToRemove.parentNode) {
            elementToRemove.remove();
          }
        }
        
        i = endIndex;
      } else {
        console.warn(`[Content Snippets] Grid snippet started but no closing {{/grid}} found. Make sure to close all grid sections.`);
      }
    }
  }
}

