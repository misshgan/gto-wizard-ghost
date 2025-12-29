// Reveal answer module
// Converts {{reveal-answer: Title}} ... {{/reveal-answer}} with {{correct:}} and {{wrong:}} options

export function initRevealAnswer() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content');
  
  if (!isPostPage) return;

  const contentElement = document.querySelector('.gh-content');
  if (!contentElement) return;

  // Get all direct children of content element
  const allElements = Array.from(contentElement.children);
  
  // Find all reveal answer blocks: {{reveal-answer: Title}} ... {{/reveal-answer}}
  const startRegex = /\{\{reveal-answer:\s*([^}]+)\}\}/;
  const endRegex = /\{\{\/reveal-answer\}\}/;
  
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const text = element.textContent || '';
    const startMatch = text.match(startRegex);
    
    if (startMatch) {
      const title = startMatch[1].trim();
      
      // Find the end marker {{/reveal-answer}}
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
        // Collect all content between start and end
        const contentElements = [];
        const elementsToRemove = [];
        
        // Process start element - extract title
        const startHTML = element.innerHTML || '';
        const startHTMLMatch = startHTML.match(new RegExp(`\\{\\{reveal-answer:\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}\\s*(.+)`, 's'));
        
        // If there's content after the marker in start element, add it
        if (startHTMLMatch && startHTMLMatch[1]) {
          const remainingContent = startHTMLMatch[1].trim();
          if (remainingContent) {
            // Create a temporary element to parse the content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = remainingContent;
            Array.from(tempDiv.children).forEach(child => {
              contentElements.push(child);
            });
          }
        }
        
        // Add start element to removal list if it only contained the marker
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
          contentElements.push(middleElement);
          elementsToRemove.push(middleElement);
        }
        
        // Process end element
        const endHTML = endElement.innerHTML || '';
        const endHTMLMatch = endHTML.match(/(.+?)\s*\{\{\/reveal-answer\}\}/s);
        
        if (endHTMLMatch && endHTMLMatch[1]) {
          const beforeContent = endHTMLMatch[1].trim();
          if (beforeContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = beforeContent;
            Array.from(tempDiv.children).forEach(child => {
              contentElements.push(child);
            });
          }
        }
        
        // Add end element to removal list if it only contained the marker
        if (endElement.textContent.trim() === '{{/reveal-answer}}') {
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
        
        // Parse answers from collected content
        const answers = [];
        const correctRegex = /\{\{correct:\s*([^}]+)\}\}/;
        const wrongRegex = /\{\{wrong:\s*([^}]+)\}\}/;
        
        contentElements.forEach(contentEl => {
          const contentText = contentEl.textContent || '';
          
          // Check for correct answer
          const correctMatch = contentText.match(correctRegex);
          if (correctMatch) {
            const answerText = correctMatch[1].trim();
            // Check if element only contains the marker
            if (contentText.trim() === correctMatch[0].trim()) {
              // Element only contains marker, mark for removal
              const index = elementsToRemove.indexOf(contentEl);
              if (index === -1) {
                elementsToRemove.push(contentEl);
              }
            } else {
              // Remove the marker from element
              const updatedHTML = contentEl.innerHTML.replace(correctRegex, '').trim();
              if (updatedHTML) {
                contentEl.innerHTML = updatedHTML;
              } else {
                elementsToRemove.push(contentEl);
              }
            }
            answers.push({
              type: 'correct',
              text: answerText
            });
            return;
          }
          
          // Check for wrong answer
          const wrongMatch = contentText.match(wrongRegex);
          if (wrongMatch) {
            const answerText = wrongMatch[1].trim();
            // Check if element only contains the marker
            if (contentText.trim() === wrongMatch[0].trim()) {
              // Element only contains marker, mark for removal
              const index = elementsToRemove.indexOf(contentEl);
              if (index === -1) {
                elementsToRemove.push(contentEl);
              }
            } else {
              // Remove the marker from element
              const updatedHTML = contentEl.innerHTML.replace(wrongRegex, '').trim();
              if (updatedHTML) {
                contentEl.innerHTML = updatedHTML;
              } else {
                elementsToRemove.push(contentEl);
              }
            }
            answers.push({
              type: 'wrong',
              text: answerText
            });
            return;
          }
        });
        
        if (answers.length === 0) {
          console.warn(`[Reveal Answer] "{{reveal-answer: ${title}}}" found but no {{correct:}} or {{wrong:}} answers provided. Add at least one answer option.`);
        }
        
        // Create container
        const container = document.createElement('div');
        container.className = 'reveal-answer';
        
        // Create header/button
        const header = document.createElement('button');
        header.className = 'reveal-answer__header';
        header.setAttribute('type', 'button');
        header.setAttribute('aria-expanded', 'false');
        
        const headerText = document.createElement('span');
        headerText.className = 'reveal-answer__title';
        headerText.textContent = title;
        header.appendChild(headerText);
        
        const headerIcon = document.createElement('span');
        headerIcon.className = 'reveal-answer__icon';
        headerIcon.setAttribute('aria-hidden', 'true');
        header.appendChild(headerIcon);
        
        // Create answers container as ordered list
        const answersContainer = document.createElement('ol');
        answersContainer.className = 'reveal-answer__answers';
        
        // Create answer items as list items
        answers.forEach(answer => {
          const answerItem = document.createElement('li');
          answerItem.className = `reveal-answer__answer reveal-answer__answer--${answer.type}`;
          
          const answerText = document.createElement('span');
          answerText.className = 'reveal-answer__answer-text';
          answerText.textContent = answer.text;
          answerItem.appendChild(answerText);
          
          answersContainer.appendChild(answerItem);
        });
        
        container.appendChild(header);
        container.appendChild(answersContainer);
        
        // Replace the start element with the container
        if (elementsToRemove.includes(element)) {
          element.replaceWith(container);
        } else {
          element.insertAdjacentElement('afterend', container);
        }
        
        // Remove processed elements
        elementsToRemove.forEach(el => {
          if (el.parentNode && el !== element) {
            el.remove();
          }
        });
        
        // Add click handler
        header.addEventListener('click', () => {
          const isExpanded = header.getAttribute('aria-expanded') === 'true';
          header.setAttribute('aria-expanded', !isExpanded);
          container.classList.toggle('is-open', !isExpanded);
        });
        
        // Skip processed elements
        i = endIndex;
      } else {
        console.warn(`[Reveal Answer] Opening marker "{{reveal-answer: ${title}}}" found without a matching closing {{/reveal-answer}}. Make sure to close all reveal answer blocks.`);
      }
    }
  }
}
