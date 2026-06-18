import { api } from './api.js';
import { fetchCart, clearCart } from './cart.js';
import { getCurrentUser } from './auth.js';

let activeStep = 1;
let cartData = null;
let userAddresses = [];
let selectedAddress = null;
let selectedDelivery = 'standard'; // standard or express
let selectedPayment = 'cod'; // cod, stripe, or razorpay
let appliedDiscount = 0; // if cart has coupon applied

// Form values
let newAddressData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  
  // Set initial addresses
  userAddresses = user.customerProfile?.addresses || [];
  if (userAddresses.length > 0) {
    selectedAddress = userAddresses.find(a => a.isDefault) || userAddresses[0];
  }

  // Load cart data to compile review totals
  try {
    cartData = await fetchCart();
    if (cartData.items.length === 0) {
      alert('Your cart is empty. Please add products before checking out.');
      window.location.href = '/cart.html';
      return;
    }
    renderCheckoutStep();
  } catch (err) {
    console.error(err);
  }
});

function renderCheckoutStep() {
  const container = document.getElementById('checkout-step-container');
  if (!container) return;

  updateStepIndicators();

  if (activeStep === 1) {
    renderShippingAddressStep(container);
  } else if (activeStep === 2) {
    renderDeliveryMethodStep(container);
  } else if (activeStep === 3) {
    renderPaymentStep(container);
  } else if (activeStep === 4) {
    renderReviewStep(container);
  }
}

function updateStepIndicators() {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    if (el) {
      el.className = 'step-node';
      if (i < activeStep) el.classList.add('completed');
      else if (i === activeStep) el.classList.add('active');
    }
  }
}

// === STEP 1: SHIPPING ===
function renderShippingAddressStep(container) {
  container.innerHTML = `
    <div class="apx-glass" style="padding: 24px;">
      <h2 style="font-size: 1.4rem; color:#fff; margin-bottom: 20px;">Step 1: Select Shipping Address</h2>
      
      <!-- Existing Addresses List -->
      ${userAddresses.length > 0 ? `
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom: 24px;">
          ${userAddresses.map(addr => `
            <label class="address-select-card apx-glass ${selectedAddress && selectedAddress.id === addr.id ? 'active' : ''}">
              <input type="radio" name="checkout-address" value="${addr.id}" ${selectedAddress && selectedAddress.id === addr.id ? 'checked' : ''} />
              <div style="margin-left: 12px;">
                <div style="font-weight: 700;">${addr.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
                  ${addr.street}, ${addr.city}, ${addr.state} - ${addr.zip}, ${addr.country}
                </div>
              </div>
            </label>
          `).join('')}
        </div>
      ` : '<p style="color: var(--text-muted); margin-bottom: 20px;">No saved addresses found.</p>'}
      
      <!-- Add New Address Accordion -->
      <div style="margin-bottom: 30px;">
        <button id="toggle-new-addr-btn" class="apx-btn apx-btn-secondary" style="font-size:0.85rem; padding: 8px 16px;">+ Add New Address</button>
        
        <form id="new-address-form" style="display:none; flex-direction:column; gap:12px; margin-top: 16px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <input type="text" id="addr-name" class="apx-input" placeholder="Address Name (e.g. Home, Work)" required />
            <input type="text" id="addr-street" class="apx-input" placeholder="Street Address" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <input type="text" id="addr-city" class="apx-input" placeholder="City" required />
            <input type="text" id="addr-state" class="apx-input" placeholder="State" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <input type="text" id="addr-zip" class="apx-input" placeholder="PIN / ZIP Code" required />
            <input type="text" id="addr-country" class="apx-input" placeholder="Country" required />
          </div>
          <button type="submit" class="apx-btn apx-btn-primary" style="align-self: flex-start; padding: 8px 16px; font-size:0.85rem;">Save Address</button>
        </form>
      </div>

      <!-- Action Footer -->
      <div style="display:flex; justify-content: flex-end;">
        <button id="shipping-next-btn" class="apx-btn apx-btn-primary" ${!selectedAddress ? 'disabled' : ''}>Continue to Delivery</button>
      </div>
    </div>
  `;

  // Bind new address toggle
  const toggleBtn = document.getElementById('toggle-new-addr-btn');
  const form = document.getElementById('new-address-form');
  if (toggleBtn && form) {
    toggleBtn.addEventListener('click', () => {
      form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    });
  }

  // Bind new address form submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('addr-name').value;
      const street = document.getElementById('addr-street').value;
      const city = document.getElementById('addr-city').value;
      const state = document.getElementById('addr-state').value;
      const zip = document.getElementById('addr-zip').value;
      const country = document.getElementById('addr-country').value;

      const newAddr = {
        id: `addr_${Date.now()}`,
        name, street, city, state, zip, country,
        isDefault: userAddresses.length === 0
      };

      userAddresses.push(newAddr);
      selectedAddress = newAddr;
      
      // Update on database user record
      try {
        await api.put('/users/addresses', { addresses: userAddresses });
        // Update local memory user object
        const currentUser = getCurrentUser();
        currentUser.customerProfile.addresses = userAddresses;
        localStorage.setItem('apx_user', JSON.stringify(currentUser));
        
        alert('Address saved!');
        renderCheckoutStep();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Radio button click listener
  const radios = container.querySelectorAll('input[name="checkout-address"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      const id = radio.value;
      selectedAddress = userAddresses.find(a => a.id === id);
      renderCheckoutStep();
    });
  });

  // Next button click
  const nextBtn = document.getElementById('shipping-next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeStep = 2;
      renderCheckoutStep();
    });
  }
}

// === STEP 2: DELIVERY ===
function renderDeliveryMethodStep(container) {
  container.innerHTML = `
    <div class="apx-glass" style="padding: 24px;">
      <h2 style="font-size: 1.4rem; color:#fff; margin-bottom: 20px;">Step 2: Choose Delivery Method</h2>
      
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom: 30px;">
        <label class="address-select-card apx-glass ${selectedDelivery === 'standard' ? 'active' : ''}">
          <input type="radio" name="checkout-delivery" value="standard" ${selectedDelivery === 'standard' ? 'checked' : ''} />
          <div style="margin-left: 12px; flex:1;">
            <div style="display:flex; justify-content:space-between; font-weight:700;">
              <span>Standard Delivery</span>
              <span>${cartData.total >= 999 ? 'FREE' : '₹99'}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Delivered within 3 - 5 business days.</div>
          </div>
        </label>
        
        <label class="address-select-card apx-glass ${selectedDelivery === 'express' ? 'active' : ''}">
          <input type="radio" name="checkout-delivery" value="express" ${selectedDelivery === 'express' ? 'checked' : ''} />
          <div style="margin-left: 12px; flex:1;">
            <div style="display:flex; justify-content:space-between; font-weight:700;">
              <span>Express Delivery</span>
              <span>₹199</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Delivered within 1 - 2 business days. Guaranteed fast shipping.</div>
          </div>
        </label>
      </div>

      <!-- Action Footer -->
      <div style="display:flex; justify-content: space-between;">
        <button id="delivery-prev-btn" class="apx-btn apx-btn-secondary">Back</button>
        <button id="delivery-next-btn" class="apx-btn apx-btn-primary">Continue to Payment</button>
      </div>
    </div>
  `;

  // Bind change
  const radios = container.querySelectorAll('input[name="checkout-delivery"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      selectedDelivery = radio.value;
      renderCheckoutStep();
    });
  });

  // Navigation
  document.getElementById('delivery-prev-btn').addEventListener('click', () => {
    activeStep = 1;
    renderCheckoutStep();
  });

  document.getElementById('delivery-next-btn').addEventListener('click', () => {
    activeStep = 3;
    renderCheckoutStep();
  });
}

// === STEP 3: PAYMENT ===
function renderPaymentStep(container) {
  container.innerHTML = `
    <div class="apx-glass" style="padding: 24px;">
      <h2 style="font-size: 1.4rem; color:#fff; margin-bottom: 20px;">Step 3: Select Payment Method</h2>
      
      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom: 30px;">
        <label class="address-select-card apx-glass ${selectedPayment === 'cod' ? 'active' : ''}">
          <input type="radio" name="checkout-payment" value="cod" ${selectedPayment === 'cod' ? 'checked' : ''} />
          <div style="margin-left: 12px;">
            <div style="font-weight:700;">Cash on Delivery (COD)</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Pay securely with cash or UPI on delivery.</div>
          </div>
        </label>
        
        <label class="address-select-card apx-glass ${selectedPayment === 'stripe' ? 'active' : ''}">
          <input type="radio" name="checkout-payment" value="stripe" ${selectedPayment === 'stripe' ? 'checked' : ''} />
          <div style="margin-left: 12px;">
            <div style="font-weight:700;">Stripe Checkout (Card Payment)</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Pay instantly with international Credit or Debit cards. Secure transactions by Stripe.</div>
          </div>
        </label>

        <label class="address-select-card apx-glass ${selectedPayment === 'razorpay' ? 'active' : ''}">
          <input type="radio" name="checkout-payment" value="razorpay" ${selectedPayment === 'razorpay' ? 'checked' : ''} />
          <div style="margin-left: 12px;">
            <div style="font-weight:700;">Razorpay Payments (NetBanking / UPI)</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Fast domestic cards, UPI, GooglePay, NetBanking payments via Razorpay gateway.</div>
          </div>
        </label>
      </div>

      <!-- Action Footer -->
      <div style="display:flex; justify-content: space-between;">
        <button id="payment-prev-btn" class="apx-btn apx-btn-secondary">Back</button>
        <button id="payment-next-btn" class="apx-btn apx-btn-primary">Review Order</button>
      </div>
    </div>
  `;

  // Bind change
  const radios = container.querySelectorAll('input[name="checkout-payment"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      selectedPayment = radio.value;
      renderCheckoutStep();
    });
  });

  // Navigation
  document.getElementById('payment-prev-btn').addEventListener('click', () => {
    activeStep = 2;
    renderCheckoutStep();
  });

  document.getElementById('payment-next-btn').addEventListener('click', () => {
    activeStep = 4;
    renderCheckoutStep();
  });
}

// === STEP 4: REVIEW ===
function renderReviewStep(container) {
  const subtotal = cartData.total;
  const tax = Math.round(subtotal * 0.05);
  
  // Calculate delivery fee
  let shipping = 0;
  if (selectedDelivery === 'standard') {
    shipping = subtotal >= 999 ? 0 : 99;
  } else {
    shipping = 199; // express
  }

  // Fetch discount from cart if cart stores it, otherwise we check if coupon details were entered
  const totalAmount = subtotal + tax + shipping;

  container.innerHTML = `
    <div class="apx-glass" style="padding: 24px;">
      <h2 style="font-size: 1.4rem; color:#fff; margin-bottom: 20px;">Step 4: Review Your Order</h2>
      
      <div class="review-details-summary" style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom: 24px;">
        <div class="apx-glass" style="padding:16px;">
          <h4 style="color:#fff; margin-bottom:8px;">Shipping Destination</h4>
          <p style="font-size:0.85rem; color:var(--text-muted);">
            <strong>${selectedAddress.name}</strong><br />
            ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.zip}, ${selectedAddress.country}
          </p>
        </div>
        
        <div class="apx-glass" style="padding:16px;">
          <h4 style="color:#fff; margin-bottom:8px;">Details & Payment</h4>
          <p style="font-size:0.85rem; color:var(--text-muted);">
            <strong>Delivery Method:</strong> ${selectedDelivery === 'standard' ? 'Standard (3-5 days)' : 'Express (1-2 days)'}<br />
            <strong>Payment Method:</strong> ${selectedPayment.toUpperCase()}
          </p>
        </div>
      </div>

      <!-- Items List -->
      <h4 style="color:#fff; margin-bottom:12px;">Order Items</h4>
      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom: 30px;">
        ${cartData.items.map(item => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom: 1px solid var(--border-color);">
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="${item.product?.image}" style="width: 40px; height: 40px; border-radius: var(--radius-sm); object-fit: contain; background: var(--bg-secondary);" />
              <div>
                <div style="font-weight:700; font-size:0.9rem; color:#fff;">${item.product?.name}</div>
                <div style="font-size:0.8rem; color:var(--text-muted)">Quantity: ${item.quantity} x ₹${item.price.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style="font-weight:700;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
          </div>
        `).join('')}
      </div>

      <!-- Summary calculations -->
      <div style="max-width: 300px; margin-left: auto; margin-bottom: 30px; display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
          <span>Subtotal:</span>
          <span>₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
          <span>GST (5%):</span>
          <span>₹${tax.toLocaleString('en-IN')}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
          <span>Shipping:</span>
          <span>${shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
        </div>
        <div style="height:1px; background:var(--border-color);"></div>
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:1.15rem; color:#fff;">
          <span>Total:</span>
          <span>₹${totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Action Footer -->
      <div style="display:flex; justify-content: space-between;">
        <button id="review-prev-btn" class="apx-btn apx-btn-secondary">Back</button>
        <button id="place-order-btn" class="apx-btn apx-btn-primary" style="background: var(--success); color:#fff; font-weight:700;">Place Order & Pay</button>
      </div>
    </div>
  `;

  // Navigation
  document.getElementById('review-prev-btn').addEventListener('click', () => {
    activeStep = 3;
    renderCheckoutStep();
  });

  // Place Order Action Handler
  document.getElementById('place-order-btn').addEventListener('click', () => {
    executePaymentAndPlacement(totalAmount, tax, shipping);
  });
}

// === PAYMENT FLOWS (COD, Stripe, Razorpay stubs) ===
async function executePaymentAndPlacement(total, tax, shipping) {
  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.innerText = 'Processing Order...';

  try {
    if (selectedPayment === 'cod') {
      // Direct placement
      await submitOrderToBackend(total, tax, shipping);
    } else if (selectedPayment === 'stripe') {
      // Execute Stripe Integration Stub
      console.log('💳 Opening Stripe Checkout Dialog...');
      btn.innerText = 'Redirecting to Stripe...';
      
      // Simulate redirection delay and card inputs
      setTimeout(async () => {
        alert('💳 [Stripe Mock SDK] Card payment approved for ₹' + total.toLocaleString('en-IN'));
        await submitOrderToBackend(total, tax, shipping, `str_ch_${Date.now()}`);
      }, 1500);

    } else if (selectedPayment === 'razorpay') {
      // Execute Razorpay Integration Stub
      console.log('💸 Calling Razorpay order API...');
      btn.innerText = 'Creating Razorpay order...';
      
      try {
        const orderData = await api.post('/payments/create-order', { amount: total });
        btn.innerText = 'Opening Razorpay checkout...';
        
        setTimeout(async () => {
          alert(`💸 [Razorpay Web SDK] Order ${orderData.order.id} paid successfully via UPI/Netbanking signature!`);
          await submitOrderToBackend(total, tax, shipping, `pay_rzp_${Date.now()}`);
        }, 1500);
      } catch (err) {
        alert('Razorpay order creation failed: ' + err.message);
        btn.disabled = false;
        btn.innerText = 'Place Order & Pay';
      }
    }
  } catch (error) {
    alert('Failed to place order: ' + error.message);
    btn.disabled = false;
    btn.innerText = 'Place Order & Pay';
  }
}

async function submitOrderToBackend(total, tax, shipping, paymentId = null) {
  const orderItems = cartData.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price
  }));

  try {
    const data = await api.post('/orders', {
      items: orderItems,
      shippingAddress: selectedAddress,
      paymentMethod: selectedPayment,
      totalAmount: total,
    });

    // If online payment, confirm it
    if (paymentId) {
      await api.post(`/orders/${data.id}/confirm-mock-payment`);
    }

    // Clear client cart cache
    await clearCart();
    
    // Redirect to confirmation step (step 5)
    renderConfirmationStep(data.orderNumber || `PK-ORDER-${data.id}`);
  } catch (error) {
    alert('Order backend insertion failed: ' + error.message);
  }
}

// === STEP 5: CONFIRMATION ===
function renderConfirmationStep(orderNumber) {
  activeStep = 5;
  updateStepIndicators();

  const container = document.getElementById('checkout-step-container');
  if (!container) return;

  container.innerHTML = `
    <div class="apx-glass" style="text-align: center; padding: 60px 40px; max-width: 650px; margin: 40px auto; animation: fadeInUp 0.6s ease-out;">
      <span style="font-size: 5rem; display: block; margin-bottom: 20px; filter: drop-shadow(0 0 10px var(--success-glow)); color: var(--success);">✔</span>
      
      <h2 style="font-size: 2.1rem; color: #fff; margin-bottom: 12px; font-family: var(--font-heading);">Order Placed Successfully!</h2>
      <p style="color: var(--text-muted); font-size:1.05rem; margin-bottom: 30px;">
        Thank you for your purchase. Your order has been placed and is currently being processed.
      </p>

      <div class="apx-glass" style="padding: 16px 24px; display:inline-block; margin-bottom: 32px; border-color: var(--primary-glow);">
        <span style="font-size: 0.85rem; color: var(--text-muted); display:block; text-transform:uppercase; font-weight:700;">Order Reference Number</span>
        <span style="font-size: 1.25rem; font-weight:800; color:#fff; font-family: var(--font-heading); margin-top:4px; display:block;">${orderNumber}</span>
      </div>

      <div style="display:flex; justify-content:center; gap:16px;">
        <a href="/profile.html" class="apx-btn apx-btn-primary">Track My Order</a>
        <a href="/index.html" class="apx-btn apx-btn-outline">Return to Catalog</a>
      </div>
    </div>
  `;
}
