import { decorateIcons } from '../../scripts/aem.js';

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const words = content.textContent.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export default async function decorate(block) {
  const rows = [...block.children];
  const metaData = {};
  
  // Parse metadata from the block
  rows.forEach(row => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key && value) {
        metaData[key] = value;
      }
    }
  });
  
  const article = document.querySelector('main');
  const readingTime = calculateReadingTime(article);
  
  // Create blog post header
  const header = document.createElement('header');
  header.className = 'blog-post-header';
  
  header.innerHTML = `
    <div class="blog-post-meta">
      ${metaData.category ? `<span class="blog-post-category">${metaData.category}</span>` : ''}
      <time class="blog-post-date" datetime="${metaData.date}">${formatDate(metaData.date)}</time>
      <span class="blog-post-reading-time">${readingTime} min read</span>
    </div>
    <h1 class="blog-post-title">${metaData.title || document.title}</h1>
    ${metaData.description ? `<p class="blog-post-description">${metaData.description}</p>` : ''}
    <div class="blog-post-author">
      ${metaData.author ? `
        <div class="author-info">
          ${metaData['author-image'] ? `<img src="${metaData['author-image']}" alt="${metaData.author}" class="author-avatar">` : ''}
          <div class="author-details">
            <span class="author-name">By ${metaData.author}</span>
            ${metaData['author-bio'] ? `<span class="author-bio">${metaData['author-bio']}</span>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
    ${metaData.tags ? `
      <div class="blog-post-tags">
        ${metaData.tags.split(',').map(tag => 
          `<a href="/blog?tag=${encodeURIComponent(tag.trim())}" class="tag">${tag.trim()}</a>`
        ).join('')}
      </div>
    ` : ''}
  `;
  
  // Replace the block with the header
  block.replaceWith(header);
  
  // Add social sharing
  const socialShare = document.createElement('div');
  socialShare.className = 'blog-post-social';
  socialShare.innerHTML = `
    <h3>Share this post</h3>
    <div class="social-buttons">
      <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(metaData.title)}" target="_blank" rel="noopener" class="social-btn twitter">
        <span class="icon icon-twitter"></span> Twitter
      </a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener" class="social-btn linkedin">
        <span class="icon icon-linkedin"></span> LinkedIn
      </a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" rel="noopener" class="social-btn facebook">
        <span class="icon icon-facebook"></span> Facebook
      </a>
    </div>
  `;
  
  article.appendChild(socialShare);
  
  // Add navigation
  const navigation = document.createElement('nav');
  navigation.className = 'blog-post-navigation';
  navigation.innerHTML = `
    <div class="nav-container">
      <a href="/blog" class="back-to-blog">← Back to Blog</a>
    </div>
  `;
  
  article.appendChild(navigation);
  
  decorateIcons(article);
}