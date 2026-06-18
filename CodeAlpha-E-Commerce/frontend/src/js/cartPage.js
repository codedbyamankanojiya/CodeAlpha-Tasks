import { 
  fetchCart, 
  updateCartItemQuantity, 
  removeCartItem, 
  clearCart, 
  CART_UPDATED_EVENT 
} from './cart.js';
import { isAuthenticated } from './auth.js';

let activeCouponCode = '';
let couponDiscountRate = 0.0; // 0.0 = 0%, 0.1 = 10%

document.addEventListener('DOMContentLoaded', () => {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  
  loadCartData();
  setupCouponListener();
});

// Register state listeners to keep cart in sync dynamically
window.addEventListener(CART_UPDATED_EVENT, (e) => {
  renderCartUI(e.detail);
});

async function loadCartData() {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="apx-loader-container">
      <div class="apx-loader"></div>
    </div>
  `;

  try {
    const cart = await fetchCart();
    renderCartUI(cart);
  } catch (error) {
    container.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 40px;">Error loading cart details.</div>`;
  }
}

function renderCartUI(cart) {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  const items = cart.items || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="apx-glass" style="text-align: center; padding: 60px 40px; max-width: 600px; margin: 40px auto;">
        <span style="font-size: 4rem; display: block; margin-bottom: 20px;">🛒</span>
        <h2 style="font-size: 1.8rem; margin-bottom: 12px; color: #fff;">Your Shopping Cart is Empty</h2>
        <p style="color: var(--text-muted); margin-bottom: 24px;">Add items to your cart to checkout. You'll find active deals on the homepage.</p>
        <a href="/index.html" class="apx-btn apx-btn-primary">Browse Products</a>
      </div>
    `;
    return;
  }

  // Calculate fields
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const shipping = subtotal >= 999 ? 0 : 99;
  
  const discountAmount = Math.round(subtotal * couponDiscountRate);
  const totalAmount = subtotal + tax + shipping - discountAmount;

  container.innerHTML = `
    <div class="cart-layout-grid">
      <!-- Left Column: Items List -->
      <div class="cart-items-column">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <h2 style="font-size: 1.4rem; color:#fff;">Cart Items (${items.reduce((sum, i) => sum + i.quantity, 0)})</h2>
          <button id="clear-all-cart-btn" class="apx-btn apx-btn-outline" style="padding: 6px 14px; font-size: 0.8rem; border-color: var(--danger); color: var(--danger);">Clear Cart</button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${items.map(item => {
            const p = item.product || {};
            return `
              <div class="apx-glass cart-item-card">
                <img src="${p.image || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=100&q=80'}" class="cart-item-image" alt="${p.name || 'Product'}" />
                
                <div class="cart-item-info">
                  <a href="/product.html?id=${item.productId}" class="cart-item-name">${p.name || 'Unnamed Product'}</a>
                  <div class="cart-item-unit-price">₹${item.price.toLocaleString('en-IN')} each</div>
                </div>
                
                <div class="cart-item-actions">
                  <!-- Qty Selector -->
                  <div class="quantity-input-group" style="padding: 2px;">
                    <button type="button" class="qty-btn item-qty-minus" data-id="${item.id}" data-qty="${item.quantity}">-</button>
                    <input type="number" value="${item.quantity}" class="qty-input" style="width: 36px;" readonly />
                    <button type="button" class="qty-btn item-qty-plus" data-id="${item.id}" data-qty="${item.quantity}" data-max="${p.quantity || 99}">+</button>
                  </div>
                  
                  <div class="cart-item-total-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
                  
                  <button class="icon-button remove-item-btn" data-id="${item.id}" title="Remove Item" style="color: var(--danger);">
                    ❌
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Right Column: Summary Card -->
      <div class="cart-summary-column">
        <div class="apx-glass cart-summary-card">
          <h3 style="font-size: 1.3rem; margin-bottom: 20px; color: #fff;">Order Summary</h3>
          
          <div class="summary-row">
            <span>Subtotal</span>
            <span>₹${subtotal.toLocaleString('en-IN')}</span>
          </div>
          
          <div class="summary-row">
            <span>GST (5%)</span>
            <span>₹${tax.toLocaleString('en-IN')}</span>
          </div>
          
          <div class="summary-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? '<span style="color: var(--success); font-weight:700;">FREE</span>' : `₹${shipping.toLocaleString('en-IN')}`}</span>
          </div>

          ${couponDiscountRate > 0 ? `
            <div class="summary-row" style="color: var(--success);">
              <span>Coupon Discount (${Math.round(couponDiscountRate * 100)}%)</span>
              <span>- ₹${discountAmount.toLocaleString('en-IN')}</span>
            </div>
          ` : ''}
          
          <div class="summary-divider"></div>
          
          <div class="summary-row total-row" style="font-size: 1.3rem; font-weight:800; color: #fff; margin-bottom: 24px;">
            <span>Total</span>
            <span>₹${totalAmount.toLocaleString('en-IN')}</span>
          </div>

          <!-- Coupon code form -->
          <div style="margin-bottom: 24px;">
            <label style="display:block; font-size: 0.8rem; font-weight:700; margin-bottom: 8px;">Apply Promo Coupon:</label>
            <div style="display:flex; gap: 8px;">
              <input type="text" id="coupon-code-input" class="apx-input" placeholder="e.g. ALPHA10" style="flex:1; text-transform: uppercase;" value="${activeCouponCode}" />
              <button id="apply-coupon-btn" class="apx-btn apx-btn-primary" style="padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.8rem;">Apply</button>
            </div>
            <div id="coupon-message" style="font-size: 0.75rem; margin-top: 6px;"></div>
          </div>
          
          <a href="/checkout.html" class="apx-btn apx-btn-primary" style="width: 100%; height: 48px;">Proceed to Checkout</a>
          <a href="/index.html" class="apx-btn apx-btn-outline" style="width: 100%; height: 48px; margin-top: 10px;">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;

  bindCartActionListeners();
}

function bindCartActionListeners() {
  // Clear Cart
  const clearBtn = document.getElementById('clear-all-cart-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your shopping cart?')) {
        await clearCart();
      }
    });
  }

  // Qty Increment/Decrement
  document.querySelectorAll('.item-qty-minus').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const qty = parseInt(btn.getAttribute('data-qty'));
      await updateCartItemQuantity(id, qty - 1);
    });
  });

  document.querySelectorAll('.item-qty-plus').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const qty = parseInt(btn.getAttribute('data-qty'));
      const max = parseInt(btn.getAttribute('data-max'));
      if (qty >= max) {
        alert('Cannot add more, stock limit reached.');
        return;
      }
      await updateCartItemQuantity(id, qty + 1);
    });
  });

  // Remove Single Item
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Remove this product from your cart?')) {
        await removeCartItem(id);
      }
    });
  });
}

function setupCouponListener() {
  // We use event delegation since the container renders dynamically
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'apply-coupon-btn') {
      const input = document.getElementById('coupon-code-input');
      const msg = document.getElementById('coupon-message');
      if (!input || !msg) return;

      const code = input.value.trim().toUpperCase();
      if (!code) {
        msg.innerText = 'Please enter a coupon code.';
        msg.style.color = 'var(--danger)';
        return;
      }

      if (code === 'ALPHA10') {
        couponDiscountRate = 0.10;
        activeCouponCode = code;
        msg.innerText = 'Coupon Code "ALPHA10" Applied! (10% Discount)';
        msg.style.color = 'var(--success)';
        // Redraw cart with discount
        fetchCart();
      } else if (code === 'APEX20') {
        couponDiscountRate = 0.20;
        activeCouponCode = code;
        msg.innerText = 'Coupon Code "APEX20" Applied! (20% Discount)';
        msg.style.color = 'var(--success)';
        fetchCart();
      } else {
        msg.innerText = 'Invalid Coupon Code.';
        msg.style.color = 'var(--danger)';
      }
    }
  });
}
