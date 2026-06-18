import { api } from './api.js';
import { requireAuth, getCurrentUser, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  loadProfileInfo();
  loadOrderHistory();
  setupProfileFormSubmit();
  setupPasswordFormSubmit();
  setupTabSwitcher();
});

function setupTabSwitcher() {
  const navButtons = document.querySelectorAll('.profile-nav-btn');
  const tabs = document.querySelectorAll('.profile-tab-content');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      navButtons.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      const targetTab = document.getElementById(tabId);
      if (targetTab) targetTab.classList.add('active');
    });
  });
}

function loadProfileInfo() {
  const user = getCurrentUser();
  if (!user) return;

  // Set inputs
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');

  if (nameInput) nameInput.value = user.name;
  if (emailInput) emailInput.value = user.email;
  if (phoneInput) phoneInput.value = user.phone || '';

  // Render Saved Addresses
  const addressContainer = document.getElementById('saved-addresses-list');
  if (addressContainer) {
    const addresses = user.customerProfile?.addresses || [];
    if (addresses.length === 0) {
      addressContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No saved addresses found.</p>`;
    } else {
      addressContainer.innerHTML = addresses.map(addr => `
        <div class="apx-glass" style="padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700;">${addr.name} ${addr.isDefault ? '<span class="apx-badge" style="background:var(--primary-glow); color:var(--primary); font-size:0.7rem; padding: 2px 6px; border-radius: var(--radius-sm); margin-left:6px;">Default</span>' : ''}</div>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
              ${addr.street}, ${addr.city}, ${addr.state} - ${addr.zip}, ${addr.country}
            </div>
          </div>
          <button class="icon-button delete-address-btn" data-id="${addr.id}" style="color:var(--danger)">
            ❌
          </button>
        </div>
      `).join('');
      
      bindAddressDeleteListeners(addresses);
    }
  }
}

function bindAddressDeleteListeners(addresses) {
  document.querySelectorAll('.delete-address-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this saved address?')) {
        const filtered = addresses.filter(a => a.id !== id);
        
        try {
          await api.put('/users/addresses', { addresses: filtered });
          
          // Update local memory user object
          const user = getCurrentUser();
          user.customerProfile.addresses = filtered;
          localStorage.setItem('apx_user', JSON.stringify(user));
          
          alert('Address removed!');
          loadProfileInfo();
        } catch (err) {
          alert('Failed to remove address: ' + err.message);
        }
      }
    });
  });
}

function setupProfileFormSubmit() {
  const form = document.getElementById('update-profile-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();

    if (!name) {
      alert('Name is required.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Updating...';

    try {
      const data = await api.put('/users/profile', { name, phone });
      
      // Update local storage user profile
      localStorage.setItem('apx_user', JSON.stringify(data.user));
      alert('Profile updated successfully!');
      
      // Re-trigger layout header render to show updated name
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Update Profile';
    }
  });
}

function setupPasswordFormSubmit() {
  const form = document.getElementById('update-password-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNew = document.getElementById('confirm-new-password').value;

    if (!currentPassword || !newPassword || !confirmNew) {
      alert('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNew) {
      alert('New passwords do not match.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Updating Password...';

    try {
      await api.put('/users/password', { currentPassword, newPassword });
      alert('Password updated successfully!');
      form.reset();
    } catch (err) {
      alert(err.message || 'Failed to update password.');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Change Password';
    }
  });
}

async function loadOrderHistory() {
  const container = document.getElementById('orders-history-container');
  if (!container) return;

  container.innerHTML = `
    <div class="apx-loader-container">
      <div class="apx-loader"></div>
    </div>
  `;

  try {
    const orders = await api.get('/orders');
    
    if (orders.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding: 30px 0;">You have not placed any orders yet.</p>`;
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="apx-glass order-history-card">
        <!-- Header -->
        <div class="order-card-header">
          <div>
            <div class="order-ref-num">${order.orderNumber}</div>
            <div class="order-date-text">Placed on: ${new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
          
          <div style="text-align: right;">
            <div class="order-total-price">₹${order.total.toLocaleString('en-IN')}</div>
            <span class="order-status-badge status-${order.status.toLowerCase()}">${order.status}</span>
          </div>
        </div>
        
        <!-- Items inside order -->
        <div class="order-card-items-list">
          ${order.items.map(item => `
            <div class="order-sub-item">
              <img src="${item.product?.image || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=60&q=80'}" class="order-item-thumb" />
              <div style="flex:1;">
                <a href="/product.html?id=${item.productId}" class="order-item-link-name">${item.product?.name || 'Product'}</a>
                <div class="order-item-qty-price">Qty: ${item.quantity} x ₹${item.price.toLocaleString('en-IN')}</div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Footer actions -->
        <div class="order-card-footer">
          <span style="font-size:0.8rem; color:var(--text-muted);">
            Payment Status: <strong>${order.paymentStatus}</strong>
          </span>
          <button class="apx-btn apx-btn-outline download-invoice-btn" data-id="${order.id}" style="padding: 6px 14px; font-size:0.8rem;">
            📥 Download Invoice
          </button>
        </div>
      </div>
    `).join('');

    bindInvoiceDownloadListeners(orders);

  } catch (error) {
    console.error('Failed to load orders history:', error);
    container.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load order history.</div>`;
  }
}

function bindInvoiceDownloadListeners(orders) {
  document.querySelectorAll('.download-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const order = orders.find(o => o.id.toString() === id.toString());
      if (!order) return;

      generateMockInvoiceTxt(order);
    });
  });
}

function generateMockInvoiceTxt(order) {
  // Build raw text format of invoice
  let invoice = `====================================================
               APEXBAZAAR INVOICE
====================================================
Order Number: ${order.orderNumber}
Order Date:   ${new Date(order.createdAt).toLocaleString()}
Payment:      ${order.paymentStatus} (${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD'})
Status:       ${order.status}

Shipping Address:
-----------------
Street:   ${order.shippingAddress?.street}
City:     ${order.shippingAddress?.city}
State:    ${order.shippingAddress?.state} - ${order.shippingAddress?.zip}
Country:  ${order.shippingAddress?.country}

Items Purchased:
----------------------------------------------------
`;

  order.items.forEach((item, idx) => {
    invoice += `${idx + 1}. ${item.product?.name || 'Product'}
   Qty: ${item.quantity} | Price: ₹${item.price.toLocaleString('en-IN')} | Total: ₹${item.total.toLocaleString('en-IN')}\n`;
  });

  invoice += `----------------------------------------------------
Subtotal:     ₹${order.subtotal.toLocaleString('en-IN')}
GST (5%):     ₹${order.tax.toLocaleString('en-IN')}
Shipping:     ₹${order.shipping.toLocaleString('en-IN')}
Discount:     ₹${order.discount.toLocaleString('en-IN')}
====================================================
Grand Total:  ₹${order.total.toLocaleString('en-IN')}
====================================================
Thank you for shopping with ApexBazaar!
`;

  // Trigger browser download of text file
  const element = document.createElement('a');
  const file = new Blob([invoice], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `Invoice_${order.orderNumber}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
