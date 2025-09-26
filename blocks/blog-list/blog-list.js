import { readBlockConfig, decorateIcons } from '../../scripts/aem.js';

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function createBlogCard(post) {
  const card = document.createElement('div');
  card.className = 'blog-card';
  
  const imageUrl = post.image || '/styles/images/default-blog.jpg';
  
  card.innerHTML = `
    <div class="blog-card-image">
      <a href="${post.path}" aria-label="Read ${post.title}">
        <img src="${imageUrl}" alt="${post.title}" loading="lazy">
      </a>
    </div>
    <div class="blog-card-content">
      <div class="blog-card-meta">
        <span class="blog-card-date">${formatDate(post.date)}</span>
        ${post.category ? `<span class="blog-card-category">${post.category}</span>` : ''}
      </div>
      <h3 class="blog-card-title">
        <a href="${post.path}">${post.title}</a>
      </h3>
      <p class="blog-card-description">${post.description || ''}</p>
      <div class="blog-card-author">
        ${post.author ? `<span>By ${post.author}</span>` : ''}
      </div>
      ${post.tags ? `<div class="blog-card-tags">${post.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}</div>` : ''}
    </div>
  `;
  
  return card;
}

async function loadBlogPosts(limit = 10, offset = 0, category = '', tag = '', searchTerm = '') {
  try {
    const response = await fetch('/query-index.json');
    const { data } = await response.json();
    
    let posts = data.filter(post => {
      if (post.template !== 'blog-post' || post.path === '/blog') return false;
      
      if (category && post.category !== category) return false;
      if (tag && (!post.tags || !post.tags.includes(tag))) return false;
      
      if (searchTerm) {
        const searchContent = `${post.title} ${post.description} ${post.tags} ${post.author}`.toLowerCase();
        if (!searchContent.includes(searchTerm.toLowerCase())) return false;
      }
      
      return true;
    });
    
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return {
      posts: posts.slice(offset, offset + limit),
      total: posts.length,
      hasMore: (offset + limit) < posts.length
    };
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return { posts: [], total: 0, hasMore: false };
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const limit = parseInt(config.limit || '10', 10);
  const category = config.category || '';
  const tag = config.tag || '';
  const showPagination = config.pagination !== 'false';
  
  block.textContent = '';
  
  const container = document.createElement('div');
  container.className = 'blog-list-container';
  
  const postsGrid = document.createElement('div');
  postsGrid.className = 'blog-posts-grid';
  container.appendChild(postsGrid);
  
  let offset = 0;
  let loadMoreBtn;
  
  async function loadMore() {
    const { posts, hasMore } = await loadBlogPosts(limit, offset, category, tag);
    
    posts.forEach(post => {
      const card = createBlogCard(post);
      postsGrid.appendChild(card);
    });
    
    offset += limit;
    
    if (showPagination && hasMore) {
      if (!loadMoreBtn) {
        loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'blog-load-more';
        loadMoreBtn.textContent = 'Load More Posts';
        loadMoreBtn.addEventListener('click', loadMore);
        container.appendChild(loadMoreBtn);
      }
    } else if (loadMoreBtn) {
      loadMoreBtn.remove();
    }
  }
  
  block.appendChild(container);
  await loadMore();
  decorateIcons(block);
}