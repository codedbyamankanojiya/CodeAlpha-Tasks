import { 
  fetchWishlist, 
  toggleWishlist, 
  clearWishlist, 
  addToCart, 
  WISHLIST_UPDATED_EVENT 
} from './cart.js';
import { isAuthenticated } from './auth.js';
import { renderRatingStars } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  
  loadWishlistData();
});

// Sync UI when changes happen
window.addEventListener(WISHLIST_UPDATED_EVENT, (e) => {
  renderWishlistUI(e.detail);
});

async function loadWishlistData() {
  const container = document.getElementById('wishlist-page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="apx-loader-container">
      <div class="apx-loader"></div>
    </div>
  `;

  try {
    const products = await fetchWishlist();
    renderWishlistUI(products);
  } catch (error) {
    container.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 40px;">Error loading wishlist items.</div>`;
  }
}

function renderWishlistUI(products) {
  const container = document.getElementById('wishlist-page-container');
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="apx-glass" style="text-align: center; padding: 60px 40px; max-width: 600px; margin: 40px auto;">
        <span style="font-size: 4rem; display: block; margin-bottom: 20px;">❤️</span>
        <h2 style="font-size: 1.8rem; margin-bottom: 12px; color: #fff;">Your Wishlist is Empty</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Save items you like to buy them later. Explore the trending products on the store.</p>
        <a href="/index.html" class="apx-btn apx-btn-primary">Explore Products</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
      <div style="font-size: 1.05rem; color: var(--text-muted);">
        You have <span style="font-weight: 700; color: #fff;">${products.length}</span> saved items
      </div>
      <div style="display: flex; gap: 12px;">
        <button id="add-all-wish-cart-btn" class="apx-btn apx-btn-primary" style="padding: 10px 20px; font-size: 0.85rem;">🛒 Add All to Cart</button>
        <button id="clear-all-wishlist-btn" class="apx-btn apx-btn-outline" style="padding: 10px 20px; font-size: 0.85rem; border-color: var(--danger); color: var(--danger);">Clear All</button>
      </div>
    </div>

    <div class="grid-container">
      ${products.map(p => `
        <div class="apx-glass product-card apx-slide-up">
          <div class="product-image-wrapper">
            <button class="wishlist-icon-btn active remove-wishlist-btn" data-id="${p.id}" title="Remove from Wishlist">
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
            
            <button class="apx-btn apx-btn-primary transfer-to-cart-btn" data-id="${p.id}" style="padding: 8px 12px; font-size: 0.75rem; border-radius: var(--radius-sm)">
              🛒 Add
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  bindWishlistActions(products);
}

function bindWishlistActions(products) {
  // Clear wishlist
  const clearBtn = document.getElementById('clear-all-wishlist-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Clear all items from your wishlist?')) {
        await clearWishlist();
      }
    });
  }

  // Add all to cart
  const addAllBtn = document.getElementById('add-all-wish-cart-btn');
  if (addAllBtn) {
    addAllBtn.addEventListener('click', async () => {
      addAllBtn.disabled = true;
      addAllBtn.innerText = 'Transferring...';
      try {
        for (const p of products) {
          await addToCart(p.id, 1);
        }
        alert(`Transferred ${products.length} products to your cart!`);
        window.location.href = '/cart.html';
      } catch (err) {
        addAllBtn.disabled = false;
        addAllBtn.innerText = 'Add All to Cart';
      }
    });
  }

  // Remove single item
  document.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      await toggleWishlist(id);
    });
  });

  // Transfer single item to cart
  document.querySelectorAll('.transfer-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      btn.disabled = true;
      btn.innerText = 'Adding...';
      try {
        await addToCart(id, 1);
        // Automatically remove from wishlist as it moved to cart!
        await toggleWishlist(id);
        alert('Product transferred to cart!');
      } catch (err) {
        btn.disabled = false;
        btn.innerText = 'Add';
      }
    });
  });
}
