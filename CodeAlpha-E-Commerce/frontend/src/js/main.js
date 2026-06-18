import { getCurrentUser, isAuthenticated, logout } from './auth.js';
import { fetchCart, fetchWishlist, CART_UPDATED_EVENT, WISHLIST_UPDATED_EVENT } from './cart.js';
import { api } from './api.js';

// Setup common elements on load
document.addEventListener('DOMContentLoaded', async () => {
  initCommonLayout();
  
  // Fetch initial counts if logged in
  if (isAuthenticated()) {
    fetchCart();
    fetchWishlist();
  }
});

// Helper: render rating stars
export function renderRatingStars(rating) {
  const r = parseFloat(rating || 0);
  const fullStars = Math.floor(r);
  const halfStar = r % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let starsHtml = '';
  for (let i = 0; i < fullStars; i++) starsHtml += '★';
  if (halfStar) starsHtml += '½';
  for (let i = 0; i < emptyStars; i++) starsHtml += '☆';
  
  return starsHtml;
}

function initCommonLayout() {
  const headerEl = document.getElementById('global-header');
  const footerEl = document.getElementById('global-footer');
  
  const user = getCurrentUser();
  const loggedIn = isAuthenticated();

  // 1. Inject Header
  if (headerEl) {
    headerEl.className = ''; // reset classes if any
    headerEl.innerHTML = `
      <div class="apx-container">
        <div class="header-wrapper">
          <a href="/index.html" class="logo-container">
            <span class="logo-icon">⚡</span> ApexBazaar
          </a>
          
          <div class="search-bar-container">
            <form id="global-search-form" action="/index.html" method="GET">
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="global-search-input" name="search" class="search-input" placeholder="Search for products, brands, or categories..." autocomplete="off" />
              </div>
            </form>
            <div id="search-suggestions-box" class="search-suggestions"></div>
          </div>
          
          <nav class="nav-actions">
            <a href="/index.html" class="nav-link">Home</a>
            <a href="/wishlist.html" class="icon-button" title="Wishlist">
              ❤️
              <span id="wishlist-badge" class="badge-count" style="display: none;">0</span>
            </a>
            <a href="/cart.html" class="icon-button" title="Shopping Cart">
              🛒
              <span id="cart-badge" class="badge-count" style="display: none;">0</span>
            </a>
            
            ${loggedIn && user ? `
              <div class="user-menu">
                <div id="user-menu-trigger" class="avatar-btn">
                  <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" class="user-avatar" alt="Avatar" />
                  <span class="username-display">${user.name.split(' ')[0]}</span>
                </div>
                <div id="user-dropdown" class="dropdown-menu">
                  <a href="/profile.html" class="dropdown-item">👤 My Profile</a>
                  ${user.role === 'SELLER' ? `<a href="/seller.html" class="dropdown-item">💼 Seller Portal</a>` : ''}
                  ${user.role === 'ADMIN' ? `<a href="/admin.html" class="dropdown-item">🛡️ Admin Panel</a>` : ''}
                  <div class="dropdown-divider"></div>
                  <div id="logout-action" class="dropdown-item" style="color: var(--danger)">🚪 Log Out</div>
                </div>
              </div>
            ` : `
              <a href="/login.html" class="apx-btn apx-btn-outline" style="padding: 8px 18px; font-size: 0.85rem;">Sign In</a>
            `}
          </nav>
        </div>
      </div>
    `;
  }

  // 2. Inject Footer
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="apx-container">
        <div class="footer-grid">
          <div class="footer-column">
            <h3 style="background: linear-gradient(135deg, #fff 30%, var(--primary) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight:800; font-size:1.3rem;">⚡ ApexBazaar</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 10px;">
              The leading premium marketplace offering high-quality items in tech, wearables, sound, fashion, and photography.
            </p>
          </div>
          <div class="footer-column">
            <h3>Quick Links</h3>
            <ul class="footer-links">
              <li><a href="/index.html">Product Catalog</a></li>
              <li><a href="/cart.html">Shopping Cart</a></li>
              <li><a href="/wishlist.html">Saved Items</a></li>
              <li><a href="/profile.html">Order Tracker</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3>Policy & Info</h3>
            <ul class="footer-links">
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Refund Guidelines</a></li>
              <li><a href="#">Support desk</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h3>Newsletter</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Sign up to receive flash deals alerts!</p>
            <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Subscribed to ApexBazaar alerts!');">
              <input type="email" placeholder="Enter your email" class="newsletter-input" required />
              <button type="submit" class="apx-btn apx-btn-primary newsletter-btn" style="padding: 10px 16px; font-size: 0.8rem;">Join</button>
            </form>
          </div>
        </div>
        <div class="footer-bottom">
          <div>© ${new Date().getFullYear()} ApexBazaar. Rebuilt for CodeAlpha Internship. All rights reserved.</div>
          <div style="display: flex; gap: 16px;">
            <a href="#" style="color: var(--text-muted);">Facebook</a>
            <a href="#" style="color: var(--text-muted);">Twitter</a>
            <a href="#" style="color: var(--text-muted);">LinkedIn</a>
          </div>
        </div>
      </div>
    `;
  }

  // 3. User Avatar Dropdown Actions
  const menuTrigger = document.getElementById('user-menu-trigger');
  const dropdown = document.getElementById('user-dropdown');
  const logoutAction = document.getElementById('logout-action');

  if (menuTrigger && dropdown) {
    menuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });
  }

  if (logoutAction) {
    logoutAction.addEventListener('click', () => logout());
  }

  // 4. Autocomplete Search suggestions
  const searchInput = document.getElementById('global-search-input');
  const suggestionsBox = document.getElementById('search-suggestions-box');
  const searchForm = document.getElementById('global-search-form');

  if (searchInput && suggestionsBox) {
    let debounceTimeout;

    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      const query = searchInput.value.trim();

      if (query.length < 2) {
        suggestionsBox.classList.remove('active');
        return;
      }

      debounceTimeout = setTimeout(async () => {
        try {
          const data = await api.get(`/products?search=${encodeURIComponent(query)}&limit=5`);
          const products = data.products || [];

          if (products.length === 0) {
            suggestionsBox.innerHTML = `<div class="suggestion-item" style="color: var(--text-muted)">No products found</div>`;
          } else {
            suggestionsBox.innerHTML = products.map(p => `
              <div class="suggestion-item" data-id="${p.id}">
                <img src="${p.image}" style="width: 36px; height: 36px; border-radius: var(--radius-sm); object-fit: cover;" />
                <div>
                  <div style="font-weight: 600; font-size: 0.85rem;">${p.name}</div>
                  <div style="font-size: 0.75rem; color: var(--primary)">₹${p.price.toLocaleString('en-IN')}</div>
                </div>
              </div>
            `).join('');

            // Click handling
            const items = suggestionsBox.querySelectorAll('.suggestion-item');
            items.forEach(item => {
              item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                if (id) window.location.href = `/product.html?id=${id}`;
              });
            });
          }
          suggestionsBox.classList.add('active');
        } catch (error) {
          console.error('Search suggestions query failed:', error);
        }
      }, 300); // 300ms delay
    });

    // Close suggestions list on click away
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.remove('active');
      }
    });
  }

  // Preserve query string in search input on index.html
  if (searchInput && window.location.pathname.includes('/index.html')) {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('search');
    if (searchQuery) {
      searchInput.value = searchQuery;
    }
  }

  // 5. Setup counts updates
  window.addEventListener(CART_UPDATED_EVENT, (e) => {
    const cart = e.detail;
    const badge = document.getElementById('cart-badge');
    if (badge) {
      if (cart.itemCount > 0) {
        badge.innerText = cart.itemCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  });

  window.addEventListener(WISHLIST_UPDATED_EVENT, (e) => {
    const products = e.detail || [];
    const badge = document.getElementById('wishlist-badge');
    if (badge) {
      if (products.length > 0) {
        badge.innerText = products.length;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  });
}
