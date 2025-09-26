import { decorateIcons } from '../../scripts/aem.js';

async function loadAllTags() {
  try {
    const response = await fetch('/query-index.json');
    const { data } = await response.json();
    
    const tagCounts = new Map();
    
    // Collect all tags and count their usage
    data.forEach(post => {
      if (post.template === 'blog-post' && post.tags) {
        const postTags = post.tags.split(',').map(tag => tag.trim());
        postTags.forEach(tag => {
          if (tag) {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          }
        });
      }
    });
    
    // Convert to array and sort by usage count (most used first)
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([tag, count]) => ({ tag, count }));
    
    return sortedTags;
  } catch (error) {
    console.error('Error loading tags:', error);
    return [];
  }
}

function createTagElement(tagData, showCount = false) {
  const tag = document.createElement('a');
  tag.href = `/blog?tag=${encodeURIComponent(tagData.tag)}`;
  tag.className = 'blog-tag';
  tag.textContent = tagData.tag;
  
  if (showCount && tagData.count > 1) {
    const count = document.createElement('span');
    count.className = 'blog-tag-count';
    count.textContent = ` (${tagData.count})`;
    tag.appendChild(count);
  }
  
  // Add data attribute for potential filtering
  tag.setAttribute('data-count', tagData.count);
  
  return tag;
}

export default async function decorate(block) {
  // Check if there are any configuration options
  const rows = [...block.children];
  const config = {};
  
  // Parse configuration from block content
  rows.forEach(row => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      config[key] = value;
    }
  });
  
  // Configuration options
  const maxTags = parseInt(config.limit || config.max || '20', 10);
  const showCount = config['show-count'] !== 'false';
  const title = config.title || 'Popular Tags';
  const layout = config.layout || 'cloud'; // 'cloud' or 'list'
  
  try {
    const tags = await loadAllTags();
    
    if (tags.length === 0) {
      block.innerHTML = `
        <div class="blog-tags-container">
          <h3 class="blog-tags-title">${title}</h3>
          <p class="blog-tags-empty">No tags found.</p>
        </div>
      `;
      return;
    }
    
    // Limit the number of tags displayed
    const displayTags = tags.slice(0, maxTags);
    
    block.innerHTML = `
      <div class="blog-tags-container">
        <h3 class="blog-tags-title">${title}</h3>
        <div class="blog-tags-list ${layout}">
          ${displayTags.map(tagData => 
            createTagElement(tagData, showCount).outerHTML
          ).join('')}
        </div>
        ${tags.length > maxTags ? `
          <div class="blog-tags-more">
            <button class="blog-tags-show-more">Show More Tags</button>
          </div>
        ` : ''}
      </div>
    `;
    
    // Add show more functionality if there are more tags
    if (tags.length > maxTags) {
      const showMoreBtn = block.querySelector('.blog-tags-show-more');
      const tagsList = block.querySelector('.blog-tags-list');
      let showing = maxTags;
      
      showMoreBtn.addEventListener('click', () => {
        const remaining = tags.length - showing;
        const toShow = Math.min(remaining, 10); // Show 10 more at a time
        
        for (let i = showing; i < showing + toShow; i++) {
          const tagElement = createTagElement(tags[i], showCount);
          tagsList.appendChild(tagElement);
        }
        
        showing += toShow;
        
        if (showing >= tags.length) {
          showMoreBtn.remove();
        } else {
          showMoreBtn.textContent = `Show More Tags (${tags.length - showing} remaining)`;
        }
      });
    }
    
  } catch (error) {
    console.error('Error loading blog tags:', error);
    block.innerHTML = `
      <div class="blog-tags-container">
        <h3 class="blog-tags-title">${title}</h3>
        <p class="blog-tags-error">Unable to load tags. Please try again later.</p>
      </div>
    `;
  }
  
  decorateIcons(block);
}