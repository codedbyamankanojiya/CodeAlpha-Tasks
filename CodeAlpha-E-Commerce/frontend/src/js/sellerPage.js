import { requireRole, getCurrentUser } from './auth.js';
import { api } from './api.js';

let allCategories = [];
let sellerChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard the route
  const ok = requireRole('SELLER');
  if (!ok) return;

  // 2. Setup Navigation
  initNavigation();

  // 3. Load categories
  await loadCategories();

  // 4. Render user/store details
  renderStoreInfo();

  // 5. Load dashboard stats & graphs
  await loadDashboardStats();

  // 6. Initialize products management
  initProductsCrud();

  // 7. Initialize store profile editing
  initStoreProfileForm();

  // 8. Initial Lucide icons parse
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

function initNavigation() {
  const sidebarButtons = document.querySelectorAll('.sidebar-btn');
  const views = document.querySelectorAll('.seller-view');

  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      sidebarButtons.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const viewId = btn.getAttribute('data-view');
      const viewEl = document.getElementById(`view-${viewId}`);
      if (viewEl) {
        viewEl.classList.add('active');
        
        // Refresh specific view data on navigate
        if (viewId === 'dashboard') await loadDashboardStats();
        if (viewId === 'catalog') await loadCatalogTable();
      }
    });
  });
}

function renderStoreInfo() {
  const user = getCurrentUser();
  if (!user || user.role !== 'SELLER') return;

  const titleEl = document.getElementById('seller-store-title');
  if (titleEl) {
    const profile = user.sellerProfile || {};
    titleEl.innerText = profile.storeName || `${user.name.split(' ')[0]}'s Store`;
  }
}

async function loadCategories() {
  try {
    const data = await api.get('/categories');
    allCategories = data.categories || [];
    const selectEl = document.getElementById('seller-form-product-category');
    if (selectEl) {
      selectEl.innerHTML = allCategories.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

/* Dashboard Analytics */
async function loadDashboardStats() {
  try {
    const user = getCurrentUser();
    const data = await api.get('/products/seller/my-products');
    const myProducts = data.products || [];

    // Stats variables
    const profile = user.sellerProfile || {};
    const commRate = profile.commissionRate ? `${profile.commissionRate * 100}%` : '10%';
    const status = profile.verificationStatus || 'PENDING';

    document.getElementById('stat-my-products').innerText = myProducts.length;
    document.getElementById('stat-my-orders').innerText = Math.round(myProducts.length * 1.5); // Simulated metric based on catalog size
    document.getElementById('stat-my-commission').innerText = commRate;
    
    const statusEl = document.getElementById('stat-my-status');
    statusEl.innerText = status;
    
    // Status text colors
    if (status === 'APPROVED') {
      statusEl.style.color = 'var(--success)';
      document.getElementById('stat-my-status-icon').innerHTML = '<i data-lucide="shield-check" style="color: var(--success)"></i>';
    } else if (status === 'REJECTED') {
      statusEl.style.color = 'var(--danger)';
      document.getElementById('stat-my-status-icon').innerHTML = '<i data-lucide="shield-x" style="color: var(--danger)"></i>';
    } else {
      statusEl.style.color = 'var(--warning)';
      document.getElementById('stat-my-status-icon').innerHTML = '<i data-lucide="shield-alert" style="color: var(--warning)"></i>';
    }

    if (window.lucide) window.lucide.createIcons();

    // Render sales trend line chart
    renderSellerTrendsChart();

  } catch (err) {
    console.error(err);
  }
}

function renderSellerTrendsChart() {
  const ctx = document.getElementById('sellerSalesChart');
  if (!ctx) return;

  // Generate simulated chart data for premium aesthetics
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  const viewsData = [120, 210, 480, 540, 890, 1100];
  const conversionsData = [12, 28, 54, 76, 115, 142];

  if (sellerChart) {
    sellerChart.destroy();
  }

  sellerChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Store Page Views',
          data: viewsData,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Clicks & Interest',
          data: conversionsData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#f3f4f6', font: { family: 'Plus Jakarta Sans', weight: 'bold' } }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        }
      }
    }
  });
}

/* Products CRUD */
function initProductsCrud() {
  const modal = document.getElementById('seller-product-modal');
  const addBtn = document.getElementById('seller-add-product-btn');
  const closeBtn = document.getElementById('seller-modal-close-btn');
  const cancelBtn = document.getElementById('seller-modal-cancel-btn');
  const form = document.getElementById('seller-product-form');

  addBtn.addEventListener('click', () => {
    document.getElementById('seller-modal-title').innerText = 'Add New Product';
    form.reset();
    document.getElementById('seller-form-product-id').value = '';
    modal.classList.add('active');
  });

  const closeModal = () => {
    modal.classList.remove('active');
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('seller-form-product-id').value;
    const payload = {
      name: document.getElementById('seller-form-product-name').value,
      brand: document.getElementById('seller-form-product-brand').value,
      categoryId: document.getElementById('seller-form-product-category').value,
      price: document.getElementById('seller-form-product-price').value,
      comparePrice: document.getElementById('seller-form-product-compare-price').value || null,
      sku: document.getElementById('seller-form-product-sku').value,
      quantity: document.getElementById('seller-form-product-stock').value,
      description: document.getElementById('seller-form-product-description').value,
      images: [document.getElementById('seller-form-product-image').value]
    };

    try {
      if (id) {
        await api.put(`/products/${id}`, payload);
        alert('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        alert('Product created successfully!');
      }
      closeModal();
      await loadCatalogTable();
    } catch (err) {
      alert(`Error saving product: ${err.message || 'Check image uniqueness'}`);
    }
  });
}

async function loadCatalogTable() {
  try {
    const data = await api.get('/products/seller/my-products');
    const products = data.products || [];
    const tbody = document.getElementById('seller-products-table-body');
    
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${p.image}" style="width:40px; height:40px; border-radius:var(--radius-sm); object-fit:cover;" />
            <div>
              <div style="font-weight:700; color:#fff;">${p.name}</div>
              <div style="font-size:0.8rem; color:var(--text-muted);">${p.brand}</div>
            </div>
          </div>
        </td>
        <td><code>${p.sku || 'N/A'}</code></td>
        <td>${p.categoryName || 'General'}</td>
        <td style="font-weight:700; color:var(--primary);">₹${p.price.toLocaleString('en-IN')}</td>
        <td>${p.stock} units</td>
        <td>
          <div style="display:flex; gap:8px;">
            <button class="btn-icon-only edit-prod-btn" data-id="${p.id}" title="Edit product">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="btn-icon-only delete delete-prod-btn" data-id="${p.id}" title="Delete product">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach actions
    tbody.querySelectorAll('.edit-prod-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await openEditProductModal(id);
      });
    });

    tbody.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this product from your store?')) {
          try {
            await api.delete(`/products/${id}`);
            alert('Product deleted successfully');
            await loadCatalogTable();
          } catch (err) {
            alert(`Error deleting product: ${err.message}`);
          }
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

async function openEditProductModal(id) {
  try {
    const res = await api.get(`/products/${id}`);
    const p = res.product;
    if (!p) return;

    document.getElementById('seller-modal-title').innerText = 'Edit Product';
    document.getElementById('seller-form-product-id').value = p.id;
    document.getElementById('seller-form-product-name').value = p.name;
    document.getElementById('seller-form-product-brand').value = p.brand || '';
    document.getElementById('seller-form-product-category').value = p.categoryId;
    document.getElementById('seller-form-product-price').value = p.price;
    document.getElementById('seller-form-product-compare-price').value = p.discountPrice || '';
    document.getElementById('seller-form-product-sku').value = p.sku || '';
    document.getElementById('seller-form-product-stock').value = p.stock || 0;
    document.getElementById('seller-form-product-description').value = p.description || '';
    document.getElementById('seller-form-product-image').value = p.image || '';

    document.getElementById('seller-product-modal').classList.add('active');
  } catch (err) {
    alert(`Failed to load product details: ${err.message}`);
  }
}

/* Store Profile Info Update */
function initStoreProfileForm() {
  const form = document.getElementById('store-profile-form');
  const user = getCurrentUser();
  if (!user || user.role !== 'SELLER') return;

  const profile = user.sellerProfile || {};
  document.getElementById('profile-store-name').value = profile.storeName || '';
  document.getElementById('profile-store-desc').value = profile.storeDescription || '';
  document.getElementById('profile-store-email').value = profile.businessEmail || '';
  document.getElementById('profile-store-phone').value = profile.businessPhone || '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      storeName: document.getElementById('profile-store-name').value,
      storeDescription: document.getElementById('profile-store-desc').value,
      businessEmail: document.getElementById('profile-store-email').value,
      businessPhone: document.getElementById('profile-store-phone').value,
    };

    try {
      const data = await api.put('/users/profile', payload);
      if (data && data.user) {
        // Cache new profiles
        localStorage.setItem('apx_user', JSON.stringify(data.user));
        alert('Store profile updated successfully!');
        renderStoreInfo();
      }
    } catch (err) {
      alert(`Error updating profile: ${err.message}`);
    }
  });
}
