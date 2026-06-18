import { api } from './api.js';
import { addToCart, toggleWishlist, fetchWishlist } from './cart.js';
import { renderRatingStars } from './main.js';
import { isAuthenticated, getCurrentUser } from './auth.js';

let productId = null;
let currentProduct = null;
let wishlistIds = [];

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  productId = params.get('id');
  
  if (!productId) {
    window.location.href = '/index.html';
    return;
  }

  if (isAuthenticated()) {
    const list = await fetchWishlist();
    wishlistIds = list.map(p => p.id.toString());
  }

  loadProductDetails();
  loadProductReviews();
  setupReviewForm();
});

async function loadProductDetails() {
  const container = document.getElementById('product-details-container');
  if (!container) return;

  try {
    const data = await api.get(`/products/${productId}`);
    const p = data.product;
    currentProduct = p;

    // Document Title
    document.title = `${p.name} — ApexBazaar`;

    // Render HTML
    const inStock = p.stock > 0;
    const isWish = wishlistIds.includes(p.id.toString());
    const discountPercent = p.comparePrice && p.comparePrice > p.price
      ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
      : 0;

    container.innerHTML = `
      <div class="product-details-grid">
        <!-- Left: Image Gallery -->
        <div class="gallery-column">
          <div class="main-image-container apx-glass" id="zoom-container">
            <img src="${p.imageUrl}" id="main-product-image" class="main-image" alt="${p.name}" />
            <div class="zoom-lens" id="zoom-lens"></div>
          </div>
          
          <div class="thumbnails-row" id="thumbnails-container">
            ${p.images.map((img, idx) => `
              <div class="thumbnail-card apx-glass ${idx === 0 ? 'active' : ''}" data-src="${img}">
                <img src="${img}" alt="Thumbnail" />
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Right: Info -->
        <div class="info-column">
          <div class="product-brand" style="font-size: 0.95rem;">${p.brand}</div>
          <h1 class="details-name">${p.name}</h1>
          
          <div class="details-rating">
            <span class="stars-gold">${renderRatingStars(p.rating)}</span>
            <span class="rating-value">${p.rating.toFixed(1)}</span>
            <span class="rating-count">(${p.reviewCount} customer reviews)</span>
          </div>
          
          <div class="details-price-card apx-glass">
            <div style="display: flex; align-items: baseline; gap: 12px;">
              <span class="details-price">₹${p.price.toLocaleString('en-IN')}</span>
              ${p.discountPrice ? `<span class="details-compare-price">₹${p.comparePrice.toLocaleString('en-IN')}</span>` : ''}
              ${discountPercent > 0 ? `<span class="details-discount-tag">${discountPercent}% OFF</span>` : ''}
            </div>
            <div class="tax-shipping-info">Inclusive of all taxes. Free shipping on orders above ₹999.</div>
          </div>
          
          <div class="details-desc">
            <h3>Description</h3>
            <p>${p.description}</p>
          </div>
          
          <div style="margin: 24px 0;">
            <div style="font-weight: 700; margin-bottom: 8px;">Availability:</div>
            <span class="stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
              ${inStock ? `✔ In Stock (${p.stock} units)` : '✘ Out of Stock'}
            </span>
          </div>

          ${inStock ? `
            <div class="quantity-selector-container">
              <span style="font-weight: 700;">Quantity:</span>
              <div class="quantity-input-group">
                <button type="button" id="qty-minus" class="qty-btn">-</button>
                <input type="number" id="purchase-qty" value="1" min="1" max="${p.stock}" class="qty-input" readonly />
                <button type="button" id="qty-plus" class="qty-btn">+</button>
              </div>
            </div>
          ` : ''}
          
          <div class="details-actions">
            ${inStock ? `
              <button id="add-to-cart-btn" class="apx-btn apx-btn-primary" style="flex: 1; height: 50px;">🛒 Add to Cart</button>
              <button id="buy-now-btn" class="apx-btn apx-btn-secondary" style="flex: 1; height: 50px; background: var(--secondary); border: none; color: #fff;">⚡ Buy Now</button>
            ` : `
              <button class="apx-btn apx-btn-outline" style="flex: 1; height: 50px;" disabled>Sold Out</button>
            `}
            <button id="toggle-wishlist-btn" class="apx-btn apx-btn-outline ${isWish ? 'active' : ''}" style="height: 50px; width: 50px; padding: 0;">
              ❤️
            </button>
          </div>
          
          <div class="specs-section">
            <h3>Product Specifications</h3>
            <table class="specs-table">
              <tr><td>Brand</td><td>${p.brand}</td></tr>
              <tr><td>SKU Code</td><td>${p.sku}</td></tr>
              <tr><td>Category</td><td>${p.category ? p.category.name : 'General'}</td></tr>
              <tr><td>Warranty</td><td>1 Year Manufacturer Warranty</td></tr>
              ${p.tags && p.tags.length ? `<tr><td>Tags</td><td>${p.tags.join(', ')}</td></tr>` : ''}
            </table>
          </div>
        </div>
      </div>
    `;

    setupProductGalleryActions();
    setupZoomEffect();
    setupQuantitySelector(p.stock);
    setupAddActions(p.id);
    loadRelatedProducts(p.categoryId, p.id);

  } catch (error) {
    console.error('Failed to load product details:', error);
    container.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 60px;">Failed to load product details. ${error.message}</div>`;
  }
}

function setupProductGalleryActions() {
  const thumbnails = document.querySelectorAll('.thumbnail-card');
  const mainImg = document.getElementById('main-product-image');
  
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const newSrc = thumb.getAttribute('data-src');
      if (mainImg) mainImg.src = newSrc;
    });
  });
}

function setupZoomEffect() {
  const container = document.getElementById('zoom-container');
  const image = document.getElementById('main-product-image');

  if (!container || !image) return;

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    image.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    image.style.transform = 'scale(1.8)';
  });

  container.addEventListener('mouseleave', () => {
    image.style.transformOrigin = 'center';
    image.style.transform = 'scale(1)';
  });
}

function setupQuantitySelector(maxStock) {
  const minusBtn = document.getElementById('qty-minus');
  const plusBtn = document.getElementById('qty-plus');
  const qtyInput = document.getElementById('purchase-qty');

  if (!qtyInput) return;

  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val > 1) {
        qtyInput.value = val - 1;
      }
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val < maxStock) {
        qtyInput.value = val + 1;
      }
    });
  }
}

function setupAddActions(id) {
  const addCartBtn = document.getElementById('add-to-cart-btn');
  const buyNowBtn = document.getElementById('buy-now-btn');
  const wishBtn = document.getElementById('toggle-wishlist-btn');
  const qtyInput = document.getElementById('purchase-qty');

  if (addCartBtn) {
    addCartBtn.addEventListener('click', async () => {
      const qty = qtyInput ? parseInt(qtyInput.value) : 1;
      addCartBtn.innerText = '⌛ Adding...';
      try {
        await addToCart(id, qty);
        addCartBtn.innerText = '✔ Added!';
        setTimeout(() => { addCartBtn.innerText = '🛒 Add to Cart'; }, 1500);
      } catch (err) {
        addCartBtn.innerText = '🛒 Add to Cart';
      }
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', async () => {
      const qty = qtyInput ? parseInt(qtyInput.value) : 1;
      try {
        await addToCart(id, qty);
        window.location.href = '/checkout.html';
      } catch (err) {
        // failed add
      }
    });
  }

  if (wishBtn) {
    wishBtn.addEventListener('click', async () => {
      try {
        const res = await toggleWishlist(id);
        if (res.added) {
          wishBtn.classList.add('active');
        } else {
          wishBtn.classList.remove('active');
        }
      } catch (err) {
        // fail
      }
    });
  }
}

async function loadProductReviews() {
  const reviewsList = document.getElementById('reviews-list');
  const summaryRating = document.getElementById('summary-avg-rating');
  const summaryCount = document.getElementById('summary-reviews-count');

  if (!reviewsList) return;

  try {
    const data = await api.get(`/reviews?productId=${productId}`);
    const reviews = data.reviews || [];

    if (summaryCount) summaryCount.innerText = `${reviews.length} reviews`;
    
    if (reviews.length === 0) {
      reviewsList.innerHTML = `<p style="color: var(--text-muted); padding: 20px 0;">No reviews written yet. Be the first to review this product!</p>`;
      return;
    }

    // Render list
    reviewsList.innerHTML = reviews.map(r => `
      <div class="review-card apx-glass">
        <div class="review-header">
          <div class="reviewer-info">
            <img src="${r.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}" class="reviewer-avatar" />
            <div>
              <div class="reviewer-name">${r.user ? r.user.name : 'Verified Customer'}</div>
              <div class="review-date">${new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div class="review-stars-wrapper">
            <span class="stars-gold">${renderRatingStars(r.rating)}</span>
            ${r.verified ? `<span class="verified-purchase-badge">✔ Verified Purchase</span>` : ''}
          </div>
        </div>
        ${r.title ? `<h4 class="review-title-text">${r.title}</h4>` : ''}
        <p class="review-content-text">${r.content}</p>
        ${r.images && r.images.length > 0 ? `
          <div style="display:flex; gap: 8px; margin-top:12px;">
            ${r.images.map(img => `<img src="${img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-sm);" />`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

  } catch (error) {
    console.error('Failed to load reviews:', error);
  }
}

function setupReviewForm() {
  const form = document.getElementById('write-review-form');
  const ratingStars = document.querySelectorAll('.interactive-star');
  const ratingInput = document.getElementById('review-rating-input');

  if (!form) return;

  // Star selector logic
  ratingStars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      ratingInput.value = val;
      
      ratingStars.forEach(s => {
        const sVal = parseInt(s.getAttribute('data-value'));
        if (sVal <= val) {
          s.classList.add('selected');
        } else {
          s.classList.remove('selected');
        }
      });
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      window.location.href = '/login.html';
      return;
    }

    const rating = ratingInput.value;
    const title = document.getElementById('review-title').value.trim();
    const content = document.getElementById('review-content').value.trim();
    const imageUrl = document.getElementById('review-image-url').value.trim();

    if (!rating || parseInt(rating) === 0) {
      alert('Please select a star rating.');
      return;
    }
    if (!content) {
      alert('Please write review comment.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting...';

    try {
      await api.post('/reviews', {
        productId,
        rating: parseInt(rating),
        title,
        content,
        images: imageUrl ? [imageUrl] : []
      });

      // Reset form
      form.reset();
      ratingInput.value = '0';
      ratingStars.forEach(s => s.classList.remove('selected'));
      
      // Reload details and reviews list
      loadProductDetails();
      loadProductReviews();
      
      alert('Thank you! Your review was submitted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Submit Review';
    }
  });
}

async function loadRelatedProducts(categoryId, currentId) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  try {
    const data = await api.get(`/products?category=${categoryId}&limit=5`);
    const products = data.products || [];
    
    // Filter out active product
    const related = products.filter(p => p.id.toString() !== currentId.toString()).slice(0, 4);

    if (related.length === 0) {
      container.innerHTML = `<p style="grid-column:1/-1; color: var(--text-muted); text-align:center;">No related items found.</p>`;
      return;
    }

    container.innerHTML = related.map(p => `
      <div class="apx-glass product-card">
        <div class="product-image-wrapper" style="padding-bottom:80%; margin-bottom:10px;">
          <img src="${p.image}" class="product-image" alt="${p.name}" />
        </div>
        <div class="product-brand" style="font-size:0.7rem;">${p.brand}</div>
        <a href="/product.html?id=${p.id}" class="product-name" style="font-size:0.9rem; height:2.4rem; -webkit-line-clamp:2;">${p.name}</a>
        <div class="product-footer" style="margin-top:6px;">
          <span class="product-price" style="font-size:1.1rem;">₹${p.price.toLocaleString('en-IN')}</span>
          <a href="/product.html?id=${p.id}" class="apx-btn apx-btn-primary" style="padding: 6px 12px; font-size: 0.75rem; border-radius: var(--radius-sm)">View</a>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Failed to load related products:', error);
  }
}
