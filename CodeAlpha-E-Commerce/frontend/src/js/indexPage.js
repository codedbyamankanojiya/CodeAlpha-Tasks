import { api } from './api.js';
import { addToCart, toggleWishlist, fetchWishlist } from './cart.js';
import { renderRatingStars } from './main.js';
import { isAuthenticated } from './auth.js';

let activeSearch = '';
let activeCategory = '';
let activeMinPrice = '';
let activeMaxPrice = '';
let activeSortBy = 'createdAt';
let activeSortOrder = 'desc';
let currentPage = 1;
let wishlistIds = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Read initial query params from URL
  const params = new URLSearchParams(window.location.search);
  activeSearch = params.get('search') || '';
  activeCategory = params.get('category') || '';
  
  // Initialize wishlist ids to render correct hearts
  if (isAuthenticated()) {
    const list = await fetchWishlist();
    wishlistIds = list.map(p => p.id.toString());
  }

  // Load Categories & Products
  loadCategories();
  loadProducts();
  setupFilterEventListeners();
});

async function loadCategories() {
  const container = document.getElementById('categories-slider');
  if (!container) return;

  try {
    const data = await api.get('/categories');
    const categories = data.categories || [];

    container.innerHTML = categories.map(cat => `
      <div class="category-slide ${activeCategory === cat.slug ? 'active' : ''}" data-slug="${cat.slug}">
        <div class="category-image-wrapper">
          <img src="${cat.image || 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=100&q=80'}" class="category-img" alt="${cat.name}" />
        </div>
        <div class="category-name-label">${cat.name}</div>
      </div>
    `).join('');

    // Attach click listeners to category sliders
    const slides = container.querySelectorAll('.category-slide');
    slides.forEach(slide => {
      slide.addEventListener('click', () => {
        const slug = slide.getAttribute('data-slug');
        if (activeCategory === slug) {
          activeCategory = '';
          slide.classList.remove('active');
        } else {
          slides.forEach(s => s.classList.remove('active'));
          activeCategory = slug;
          slide.classList.add('active');
        }
        currentPage = 1;
        loadProducts();
      });
    });
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

export async function loadProducts() {
  const container = document.getElementById('products-grid');
  const countDisplay = document.getElementById('products-count');
  const paginationContainer = document.getElementById('pagination-controls');
  
  if (!container) return;

  // Show loader
  container.innerHTML = `
    <div class="apx-loader-container" style="grid-column: 1 / -1;">
      <div class="apx-loader"></div>
    </div>
  `;

  try {
    let endpoint = `/products?page=${currentPage}&limit=12`;
    if (activeCategory) endpoint += `&category=${encodeURIComponent(activeCategory)}`;
    if (activeSearch) endpoint += `&search=${encodeURIComponent(activeSearch)}`;
    if (activeMinPrice) endpoint += `&minPrice=${activeMinPrice}`;
    if (activeMaxPrice) endpoint += `&maxPrice=${activeMaxPrice}`;
    if (activeSortBy) endpoint += `&sortBy=${activeSortBy}&sortOrder=${activeSortOrder}`;

    const data = await api.get(endpoint);
    const products = data.products || [];
    const pagination = data.pagination || {};

    if (countDisplay) {
      countDisplay.innerText = `${pagination.total || 0} Products Found`;
    }

    if (products.length === 0) {
      container.innerHTML = `
        <div class="apx-glass" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <h2>No Products Found</h2>
          <p style="margin-top: 8px;">Try adjusting your filters or search terms.</p>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    // Render Cards
    container.innerHTML = products.map(p => {
      const isWish = wishlistIds.includes(p.id.toString());
      return `
        <div class="apx-glass product-card apx-slide-up">
          <div class="product-image-wrapper">
            <button class="wishlist-icon-btn ${isWish ? 'active' : ''}" data-id="${p.id}" title="Add to Wishlist">
              ❤️
            </button>
            <img src="${p.image}" class="product-image" alt="${p.name}" loading="lazy" />
          </div>
          <div class="product-brand">${p.brand}</div>
          <a href="/product.html?id=${p.id}" class="product-name" title="${p.name}">${p.name}</a>
          
          <div class="product-rating">
            <span>${renderRatingStars(p.rating)}</span>
            <span class="rating-count">(${p.reviewCount})</span>
          </div>
          
          <div class="product-footer">
            <div class="product-price-wrapper">
              <span class="product-price">₹${p.price.toLocaleString('en-IN')}</span>
              ${p.discountPrice ? `<span class="product-compare-price">₹${p.comparePrice.toLocaleString('en-IN')}</span>` : ''}
            </div>
            
            <button class="add-cart-btn" data-id="${p.id}" title="Add to Cart">
              🛒
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bind Wishlist Heart Click Events
    container.querySelectorAll('.wishlist-icon-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        try {
          const res = await toggleWishlist(id);
          if (res.added) {
            btn.classList.add('active');
            wishlistIds.push(id.toString());
          } else {
            btn.classList.remove('active');
            wishlistIds = wishlistIds.filter(wId => wId !== id.toString());
          }
        } catch (err) {
          console.error(err);
        }
      });
    });

    // Bind Add to Cart Click Events
    container.querySelectorAll('.add-cart-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        btn.innerHTML = '⌛';
        try {
          await addToCart(id, 1);
          btn.innerHTML = '✔';
          setTimeout(() => { btn.innerHTML = '🛒'; }, 1500);
        } catch (err) {
          btn.innerHTML = '🛒';
        }
      });
    });

    // Render Pagination
    renderPagination(pagination);

  } catch (error) {
    console.error('Failed to load products:', error);
    container.innerHTML = `<div style="grid-column: 1 / -1; color: var(--danger); text-align: center;">Error loading products.</div>`;
  }
}

function renderPagination(meta) {
  const container = document.getElementById('pagination-controls');
  if (!container) return;

  const { page, pages } = meta;
  if (!pages || pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  // Prev button
  html += `<button class="apx-btn apx-btn-secondary" style="padding: 8px 16px; border-radius: var(--radius-sm);" ${page === 1 ? 'disabled' : ''} id="pag-prev">Prev</button>`;
  
  // Page number displays
  for (let i = 1; i <= pages; i++) {
    const isActive = i === page;
    html += `<button class="apx-btn ${isActive ? 'apx-btn-primary' : 'apx-btn-secondary'}" style="padding: 8px 16px; border-radius: var(--radius-sm);" data-page="${i}">${i}</button>`;
  }

  // Next button
  html += `<button class="apx-btn apx-btn-secondary" style="padding: 8px 16px; border-radius: var(--radius-sm);" ${page === pages ? 'disabled' : ''} id="pag-next">Next</button>`;

  container.innerHTML = html;

  // Bind clicks
  const prevBtn = container.querySelector('#pag-prev');
  const nextBtn = container.querySelector('#pag-next');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentPage = page - 1;
      loadProducts();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentPage = page + 1;
      loadProducts();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    });
  }

  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.getAttribute('data-page'));
      loadProducts();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    });
  });
}

function setupFilterEventListeners() {
  const minPriceInput = document.getElementById('filter-min-price');
  const maxPriceInput = document.getElementById('filter-max-price');
  const sortSelect = document.getElementById('filter-sort');
  const applyBtn = document.getElementById('apply-filters-btn');
  const clearBtn = document.getElementById('clear-filters-btn');

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      activeMinPrice = minPriceInput ? minPriceInput.value : '';
      activeMaxPrice = maxPriceInput ? maxPriceInput.value : '';
      
      if (sortSelect) {
        const [field, order] = sortSelect.value.split('-');
        activeSortBy = field;
        activeSortOrder = order;
      }
      currentPage = 1;
      loadProducts();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      if (sortSelect) sortSelect.value = 'createdAt-desc';
      
      activeMinPrice = '';
      activeMaxPrice = '';
      activeSortBy = 'createdAt';
      activeSortOrder = 'desc';
      activeCategory = '';
      activeSearch = '';
      
      // Reset URL query parameters
      window.history.pushState({}, '', '/index.html');
      
      // Reload slides active status
      const slides = document.querySelectorAll('.category-slide');
      slides.forEach(s => s.classList.remove('active'));

      currentPage = 1;
      loadProducts();
    });
  }
}
