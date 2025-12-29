# Content Snippets Documentation

This theme includes several custom content snippets that allow you to enhance your Ghost posts with interactive elements, styled text, and collapsible sections.

## Table of Contents

1. [Tooltips/Footnotes](#tooltipsfootnotes)
2. [Text Coloring](#text-coloring)
3. [Reveal Answer](#reveal-answer)
4. [Toggle Sections](#toggle-sections)
5. [Quote Author](#quote-author)
6. [Icon Blocks](#icon-blocks)
7. [Grid Layouts](#grid-layouts)

---

## Tooltips/Footnotes

Add interactive tooltips that appear on hover (desktop) or click (mobile) with support for rich content including images.

### Syntax

**In text (reference):**
```
This is some text with a {{tooltip-title: tooltip key}} in it.
```

**Definition (multi-line with images support):**
```
{{tooltip-content: tooltip key}}

This is the tooltip content that will appear in a popover.
You can add multiple paragraphs.

You can even add images here!

{{/tooltip-content}}
```

### Features

- Text inside `{{tooltip-title: ...}}` is visible in content with class `tooltip-title` for styling
- Full HTML support in tooltip content (including `<br>`, `<strong>`, links, etc.)
- Images are fully supported
- Popover appears on hover (desktop) or click (mobile)
- Works in both light and dark themes
- Uses unified `{{}}` bracket syntax for consistency

### Example

```
This is a sentence with a {{tooltip-title: example tooltip}} reference.

{{tooltip-content: example tooltip}}

This tooltip can contain <strong>formatted text</strong> and <br>line breaks.

You can also add images here!

{{/tooltip-content}}
```

### Styling Classes

- `.tooltip-ref` - The reference element in text
- `.tooltip-title` - The visible text inside brackets
- `.tooltip-popover` - The popover container
- `.tooltip-popover.is-active` - Active state

---

## Text Coloring

Apply custom colors to text inline using CSS color values.

### Syntax

**Preferred (recommended):**
```
{{color: color-value}}text to be colored{{/color}}
```

**Legacy (still supported):**
```
{{color: color-value}}text to be colored{{color}}
```

### Supported Color Formats

- Named colors: `{{color: red}}text{{/color}}`
- HEX: `{{color: #ff0000}}text{{/color}}`
- RGB: `{{color: rgb(255, 0, 0)}}text{{/color}}`
- RGBA: `{{color: rgba(255, 0, 0, 0.5)}}text{{/color}}`
- HSL: `{{color: hsl(0, 100%, 50%)}}text{{/color}}`

### Example

```
This is normal text, and this is {{color: red}}red text{{/color}}.

You can use {{color: #AAFBB2}}hex colors{{/color}} from your theme.

Or {{color: rgba(170, 251, 178, 0.8)}}semi-transparent colors{{/color}}.
```

**Note:** Both `{{/color}}` (preferred) and `{{color}}` (legacy) closing syntax are supported for backward compatibility.

### Styling

The colored text is wrapped in a `<span>` with inline `color` style. You can override styles using CSS if needed.

---

## Reveal Answer

Create interactive quiz-style components with correct and wrong answer options.

### Syntax

```
{{reveal-answer: Title for the reveal answer section}}

{{correct: This is the correct answer}}

{{wrong: This is a wrong answer}}

{{wrong: Another wrong answer}}

{{/reveal-answer}}
```

### Features

- Clickable header that expands/collapses to show answers
- Answers are numbered with Latin letters (A, B, C, etc.)
- Supports multiple correct/wrong answers
- Styled differently for correct vs wrong answers
- Smooth expand/collapse animation
- Uses unified `{{}}` bracket syntax for consistency

### Example

```
{{reveal-answer: What is the highest user level in Ghost?}}

{{correct: Administrator - Administrators have full access to all features}}

{{wrong: Editor - Editors can manage content but have limited settings access}}

{{wrong: Author - Authors can only create and edit their own content}}

{{/reveal-answer}}
```

### Styling Classes

- `.reveal-answer` - Main container
- `.reveal-answer__header` - Clickable header button
- `.reveal-answer__title` - Header title text
- `.reveal-answer__icon` - Arrow icon
- `.reveal-answer__answers` - Answers list container
- `.reveal-answer__answer` - Individual answer item
- `.reveal-answer__answer--correct` - Correct answer modifier
- `.reveal-answer__answer--wrong` - Wrong answer modifier
- `.reveal-answer.is-open` - Open state

---

## Toggle Sections

Create collapsible sections with custom titles that can contain any content.

### Syntax

```
{{toggle: Section Title}}

Content that will be hidden/shown.
Can include multiple paragraphs.
Images are supported.
Any HTML content.

{{/toggle}}
```

### Features

- Collapsible sections with custom titles
- Supports multi-line content including images
- Smooth expand/collapse animation
- Content is styled like regular post content but slightly narrower (90% width)
- Works in both light and dark themes

### Example

```
{{toggle: Additional Information}}

This section contains extra details that readers can expand if needed.

You can include:
- Lists
- Images
- **Formatted text**
- Any other content

{{/toggle}}
```

### Styling Classes

- `.toggle` - Main container
- `.toggle__header` - Clickable header button
- `.toggle__title` - Header title text
- `.toggle__icon` - Arrow icon
- `.toggle__content` - Content container
- `.toggle.is-open` - Open state

---

## Quote Author

Add author attribution to blockquotes. This snippet should be placed immediately after a blockquote element.

### Syntax

```
> This is a quote text.

{{quote-author: Author Name}}
```

### Features

- Automatically detects and attaches to the previous blockquote
- Styled differently from regular text (smaller, right-aligned, with em dash)
- Positioned closer to the quote (negative margin-top)
- Works in both light and dark themes
- Includes em dash (—) before author name

### Example

```
> The only way to do great work is to love what you do.

{{quote-author: Steve Jobs}}
```

### Styling Classes

- `.quote-author` - Main author container
- `.quote-author__text` - Author name text
- `.quote-author--attached` - Applied when blockquote is detected
- `.has-author` - Added to blockquote when author is found

### Notes

- Place `{{quote-author: ...}}` immediately after the blockquote
- The snippet will automatically find and attach to the previous blockquote
- If no blockquote is found, a warning will be logged to console
- The author text is right-aligned and styled smaller than regular text

---

## Icon Blocks

Create content blocks with icons (question mark, exclamation mark, or search mark) displayed alongside the content.

### Syntax

**Question Mark Block:**
```
{{question-mark}}

Your content here with question mark icon.

{{/question-mark}}
```

**Exclamation Mark Block:**
```
{{exclamation-mark}}

Your content here with exclamation mark icon.

{{/exclamation-mark}}
```

**Search Mark Block:**
```
{{search-mark}}

Your content here with search icon.

{{/search-mark}}
```

### Features

- Icons are displayed on the left (4rem width)
- Content flows on the right side
- Grid layout with proper alignment
- Icons use theme accent color
- Supports multi-line content

### Example

```
{{question-mark}}

This is a helpful tip or question that needs attention.
You can add multiple paragraphs here.

{{/question-mark}}
```

### Styling

- `.content-grid` - Grid container with `grid-template-columns: 4rem 1fr`
- Icons are 48x48px SVG with accent color
- Content is aligned to center vertically

---

## Grid Layouts

Create multi-column grid layouts for organizing content.

### Syntax

**2 Columns:**
```
{{grid: 2}}

Content for column 1

Content for column 2

{{/grid}}
```

**3 Columns:**
```
{{grid: 3}}

Content for column 1

Content for column 2

Content for column 3

{{/grid}}
```

**Custom Grid:**
```
{{grid: 1fr 1fr}}

Content for first column

Content for second column

{{/grid}}
```

You can also use other CSS grid values:
- `{{grid: 1fr 2fr}}` - Two columns, second twice as wide
- `{{grid: 1fr 1fr 1fr}}` - Three equal columns
- `{{grid: 2fr 1fr}}` - Two columns, first twice as wide

### Features

- Predefined layouts: 2 columns, 3 columns
- Custom grid templates using CSS grid syntax
- Supports any content type (text, images, etc.)
- Responsive by default

### Example

```
{{grid: 2}}

This is the left column content.

This is the right column content.

{{/grid}}
```

### Styling Classes

- `.content-grid` - Main grid container
- `.content-grid.col-2` - Two column layout
- `.content-grid.col-3` - Three column layout
- Custom `grid-template-columns` for custom layouts

---

## Best Practices

1. **Tooltips**: 
   - Use descriptive keys that make sense in context
   - Keep tooltip content concise but informative
   - Always provide both `{{tooltip-title: key}}` reference and `{{tooltip-content: key}}` ... `{{/tooltip-content}}` definition
   - Use the same key in both reference and definition
   - Ensure opening and closing markers are in separate paragraphs/elements

2. **Colors**: 
   - Use `{{/color}}` closing syntax (preferred over `{{color}}`)
   - Use theme color variables when possible for consistency
   - Test colors in both light and dark themes
   - Avoid spaces in color values (use `rgb(255,0,0)` not `rgb(255, 0, 0)`)

3. **Reveal Answer**: 
   - Always include at least one `{{correct: ...}}` answer
   - Use clear, distinct options
   - Keep answer text concise
   - Always close with `{{/reveal-answer}}`
   - Ensure opening and closing markers are in separate paragraphs/elements

4. **Toggle**: 
   - Use for supplementary content that doesn't need to be immediately visible
   - Keep titles concise and descriptive
   - Always close with `{{/toggle}}`
   - Ensure opening and closing markers are in separate paragraphs/elements

5. **Quote Author**: 
   - Place immediately after the blockquote
   - Use full name or attribution as appropriate
   - Keep author names concise
   - Works best when blockquote and author are in separate paragraphs

6. **Icon Blocks**: 
   - Use question-mark for questions or tips
   - Use exclamation-mark for warnings or important notes
   - Use search-mark for search-related content
   - Keep content concise for best visual balance

7. **Grid Layouts**: 
   - Use `{{grid: 2}}` or `{{grid: 3}}` for simple layouts
   - Use custom grid syntax for advanced layouts
   - Ensure content is balanced across columns
   - Test on mobile devices as grids may stack

## Browser Support

All snippets work in modern browsers that support:
- ES6 JavaScript features
- CSS Grid and Flexbox
- CSS Custom Properties (CSS Variables)

## Troubleshooting

### Tooltips not appearing
- Ensure the definition uses the exact same key as the reference
- Check that reference uses `{{tooltip-title: key}}` and definition uses `{{tooltip-content: key}}` ... `{{/tooltip-content}}`
- Verify the content is within `.gh-content` container
- Ensure opening and closing markers are in separate paragraphs/elements
- Check browser console for validation warnings about missing definitions

### Colors not applying
- Verify the color value is valid CSS
- Check for typos in the closing tag (use `{{/color}}` or `{{color}}`)
- Ensure there are no spaces in the color value (use `rgb(255,0,0)` not `rgb(255, 0, 0)`)
- Check that opening and closing tags match

### Reveal Answer not working
- Ensure opening `{{reveal-answer: Title}}` and closing `{{/reveal-answer}}` markers are present
- Check that answer options use `{{correct: ...}}` or `{{wrong: ...}}` exactly
- Verify all markers are in separate paragraphs/elements
- Check browser console for warnings about missing answers or unclosed blocks

### Toggle not expanding
- Check that opening `{{toggle: Title}}` and closing `{{/toggle}}` are present
- Ensure markers are in separate paragraphs/elements
- Verify the content structure is valid
- Check browser console for warnings about unclosed toggle sections

### Quote Author not attaching
- Ensure `{{quote-author: ...}}` is placed immediately after the blockquote
- Check that blockquote and author are in separate paragraphs
- Verify the blockquote is a direct `<blockquote>` element
- Check browser console for warnings about missing blockquote

### Icon Blocks not displaying
- Ensure opening `{{icon-type}}` and closing `{{/icon-type}}` markers are present
- Check that markers are in separate paragraphs/elements
- Verify icon type is one of: `question-mark`, `exclamation-mark`, `search-mark`
- Check browser console for warnings about unclosed blocks

### Grid not working
- Ensure opening `{{grid: ...}}` and closing `{{/grid}}` markers are present
- Check that markers are in separate paragraphs/elements
- Verify grid value is valid (2, 3, or CSS grid syntax)
- Check browser console for warnings about unclosed grids

## Validation & Error Handling

All snippets include built-in validation that will log warnings to the browser console if:
- Tooltip references (`{{tooltip-title: ...}}`) are found without matching definitions (`{{tooltip-content: ...}}`)
- Toggle sections are opened but not closed
- Reveal answer sections are opened but not closed or created without any answer options
- Icon blocks or grid layouts are opened but not closed
- Orphaned closing markers are detected

**Tip:** Open your browser's developer console (F12) to see helpful warnings that can help you fix syntax errors in your content.

---

## Implementation Details

### Processing Order
Snippets are processed in the following order for optimal results:
1. **Tooltips/Footnotes** - Processed first to handle multi-line definitions
2. **Reveal Answer** - Processed before Toggle to avoid conflicts
3. **Toggle** - Processed after Reveal Answer
4. **Color** - Processed last as it works on inline text

### Performance
- All snippets only initialize on post/page templates
- Processing happens once on page load
- Validation warnings are logged to console but don't block rendering
- Failed snippets gracefully degrade (content remains visible)

### Browser Support
All snippets work in modern browsers that support:
- ES6 JavaScript features
- CSS Grid and Flexbox
- CSS Custom Properties (CSS Variables)
- TreeWalker API for text node processing

---

## Support

For issues or questions about these content snippets, please contact Vlad.

