import { requireRole } from './auth.js';
import { api } from './api.js';

let allCategories = [];
let salesChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard the route
  const ok = requireRole('ADMIN');
  if (!ok) return;

  // 2. Initialize sidebar navigation switching
  initNavigation();

  // 3. Load database metadata (categories)
  await loadCategories();

  // 4. Load overview dashboard data
  await loadDashboardData();

  // 5. Initialize products management
  initProductsCrud();

  // 6. Initialize order control management
  initOrdersControl();

  // 7. Initialize user accounts management
  initUsersControl();

  // 8. Re-render icons initially
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/* Nav Actions */
function initNavigation() {
  const sidebarButtons = document.querySelectorAll('.sidebar-btn');
  const views = document.querySelectorAll('.admin-view');

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
        if (viewId === 'overview') await loadDashboardData();
        if (viewId === 'products') await loadProductsTable();
        if (viewId === 'orders') await loadOrdersTable();
        if (viewId === 'users') await loadUsersTable();
      }
    });
  });
}

/* Category Helper */
async function loadCategories() {
  try {
    const data = await api.get('/categories');
    allCategories = data.categories || [];
    const selectEl = document.getElementById('form-product-category');
    if (selectEl) {
      selectEl.innerHTML = allCategories.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

/* Analytics Dashboard & Chart.js */
async function loadDashboardData() {
  try {
    // Fetch dashboard products, orders, and users counts
    const productsRes = await api.get('/products?limit=1');
    const ordersRes = await api.get('/orders/admin/all');
    const usersRes = await api.get('/users');

    const totalProducts = productsRes.pagination ? productsRes.pagination.total : 0;
    const totalUsers = usersRes.length || 0;
    const totalOrders = ordersRes.length || 0;

    let totalRevenue = 0;
    ordersRes.forEach(o => {
      if (o.paymentStatus === 'PAID') {
        totalRevenue += o.total;
      }
    });

    // Update stats elements
    document.getElementById('stat-sales').innerText = `₹${totalRevenue.toLocaleString('en-IN')}`;
    document.getElementById('stat-orders').innerText = totalOrders;
    document.getElementById('stat-products').innerText = totalProducts;
    document.getElementById('stat-users').innerText = totalUsers;

    // Build timeline details for Chart.js
    renderSalesTrendsChart(ordersRes);

  } catch (err) {
    console.error('Dashboard data load failed', err);
  }
}

function renderSalesTrendsChart(orders) {
  const ctx = document.getElementById('salesChart');
  if (!ctx) return;

  // Group orders by date
  const groups = {};
  orders.forEach(o => {
    const date = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groups[date]) {
      groups[date] = { sales: 0, count: 0 };
    }
    groups[date].count += 1;
    if (o.paymentStatus === 'PAID') {
      groups[date].sales += o.total;
    }
  });

  // Sort dates
  const sortedDates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b)).slice(-10); // last 10 days
  const revenues = sortedDates.map(d => groups[d].sales);
  const counts = sortedDates.map(d => groups[d].count);

  if (salesChart) {
    salesChart.destroy();
  }

  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates.length ? sortedDates : ['No Data'],
      datasets: [
        {
          label: 'Revenue (₹)',
          data: revenues.length ? revenues : [0],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Orders Count',
          data: counts.length ? counts : [0],
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
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
          position: 'left',
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' },
          title: { display: true, text: 'Revenue (INR)', color: '#f3f4f6' }
        },
        y1: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#9ca3af' },
          title: { display: true, text: 'Number of Orders', color: '#f3f4f6' }
        }
      }
    }
  });
}

/* Products CRUD Operations */
function initProductsCrud() {
  const modal = document.getElementById('product-modal');
  const addBtn = document.getElementById('add-product-btn');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const form = document.getElementById('product-form');
  const searchInput = document.getElementById('product-search');

  addBtn.addEventListener('click', () => {
    document.getElementById('modal-title').innerText = 'Add New Product';
    form.reset();
    document.getElementById('form-product-id').value = '';
    modal.classList.add('active');
  });

  const closeModal = () => {
    modal.classList.remove('active');
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('form-product-id').value;
    const productPayload = {
      name: document.getElementById('form-product-name').value,
      brand: document.getElementById('form-product-brand').value,
      categoryId: document.getElementById('form-product-category').value,
      price: document.getElementById('form-product-price').value,
      comparePrice: document.getElementById('form-product-compare-price').value || null,
      sku: document.getElementById('form-product-sku').value,
      quantity: document.getElementById('form-product-stock').value,
      description: document.getElementById('form-product-description').value,
      images: [document.getElementById('form-product-image').value]
    };

    try {
      if (id) {
        // Edit flow
        await api.put(`/products/${id}`, productPayload);
        alert('Product updated successfully!');
      } else {
        // Create flow
        await api.post('/products', productPayload);
        alert('Product created successfully!');
      }
      closeModal();
      await loadProductsTable();
    } catch (err) {
      alert(`Error saving product: ${err.message || 'Check inputs or images URL uniqueness'}`);
    }
  });

  // Simple live search in table rows
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll('#admin-products-table-body tr');
    rows.forEach(r => {
      const text = r.innerText.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

async function loadProductsTable() {
  try {
    const data = await api.get('/products?limit=100');
    const products = data.products || [];
    const tbody = document.getElementById('admin-products-table-body');
    
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
        if (confirm('Are you sure you want to delete this product?')) {
          try {
            await api.delete(`/products/${id}`);
            alert('Product deleted successfully');
            await loadProductsTable();
          } catch (err) {
            alert(`Error: ${err.message}`);
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

    document.getElementById('modal-title').innerText = 'Edit Product';
    document.getElementById('form-product-id').value = p.id;
    document.getElementById('form-product-name').value = p.name;
    document.getElementById('form-product-brand').value = p.brand || '';
    document.getElementById('form-product-category').value = p.categoryId;
    document.getElementById('form-product-price').value = p.price;
    document.getElementById('form-product-compare-price').value = p.discountPrice || '';
    document.getElementById('form-product-sku').value = p.sku || '';
    document.getElementById('form-product-stock').value = p.stock || 0;
    document.getElementById('form-product-description').value = p.description || '';
    document.getElementById('form-product-image').value = p.image || '';

    document.getElementById('product-modal').classList.add('active');
  } catch (err) {
    alert(`Failed to load product details: ${err.message}`);
  }
}

/* Orders Control */
function initOrdersControl() {
  // Table operations are attached inside render list loop
}

async function loadOrdersTable() {
  try {
    const orders = await api.get('/orders/admin/all');
    const tbody = document.getElementById('admin-orders-table-body');
    
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.orderNumber}</strong></td>
        <td>
          <div style="font-weight:600; color:#fff;">${o.user ? o.user.name : 'Unknown User'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${o.user ? o.user.email : ''}</div>
        </td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
        <td style="font-weight:700; color:#fff;">₹${o.total.toLocaleString('en-IN')}</td>
        <td>
          <select class="apx-input order-status-select" data-id="${o.id}" style="height:32px; font-size:0.8rem; padding: 4px 8px; border-radius:var(--radius-sm);">
            <option value="PENDING" ${o.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
            <option value="CONFIRMED" ${o.status === 'CONFIRMED' ? 'selected' : ''}>CONFIRMED</option>
            <option value="PROCESSING" ${o.status === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
            <option value="SHIPPED" ${o.status === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
            <option value="DELIVERED" ${o.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
            <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
            <option value="REFUNDED" ${o.status === 'REFUNDED' ? 'selected' : ''}>REFUNDED</option>
          </select>
        </td>
        <td>
          <select class="apx-input order-payment-select" data-id="${o.id}" style="height:32px; font-size:0.8rem; padding: 4px 8px; border-radius:var(--radius-sm);">
            <option value="PENDING" ${o.paymentStatus === 'PENDING' ? 'selected' : ''}>PENDING</option>
            <option value="PAID" ${o.paymentStatus === 'PAID' ? 'selected' : ''}>PAID</option>
            <option value="FAILED" ${o.paymentStatus === 'FAILED' ? 'selected' : ''}>FAILED</option>
            <option value="REFUNDED" ${o.paymentStatus === 'REFUNDED' ? 'selected' : ''}>REFUNDED</option>
          </select>
        </td>
        <td>
          <button class="apx-btn apx-btn-primary save-order-btn" data-id="${o.id}" style="padding:6px 12px; font-size:0.75rem;">
            Save
          </button>
        </td>
      </tr>
    `).join('');

    // Attach Save Status listeners
    tbody.querySelectorAll('.save-order-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const row = btn.closest('tr');
        const statusVal = row.querySelector('.order-status-select').value;
        const paymentVal = row.querySelector('.order-payment-select').value;

        try {
          await api.patch(`/orders/${id}/status`, {
            status: statusVal,
            paymentStatus: paymentVal
          });
          alert(`Order status updated successfully!`);
          await loadOrdersTable();
        } catch (err) {
          alert(`Failed: ${err.message}`);
        }
      });
    });

  } catch (err) {
    console.error(err);
  }
}

/* User Accounts Control */
function initUsersControl() {
  // Hook attached to table rendering
}

async function loadUsersTable() {
  try {
    const users = await api.get('/users');
    const tbody = document.getElementById('admin-users-table-body');
    
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>
          <select class="apx-input user-role-select" data-id="${u.id}" style="height:32px; font-size:0.8rem; padding:4px 8px; border-radius:var(--radius-sm);">
            <option value="CUSTOMER" ${u.role === 'CUSTOMER' ? 'selected' : ''}>CUSTOMER</option>
            <option value="SELLER" ${u.role === 'SELLER' ? 'selected' : ''}>SELLER</option>
            <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
          </select>
        </td>
        <td>
          ${u.role === 'SELLER' && u.sellerProfile ? `
            <div style="font-weight:600; color:#fff;">${u.sellerProfile.storeName || 'N/A'}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${u.sellerProfile.storeDescription || ''}</div>
          ` : '<span style="color:var(--text-muted);">None</span>'}
        </td>
        <td>
          ${u.role === 'SELLER' && u.sellerProfile ? `
            <select class="apx-input seller-status-select" data-id="${u.id}" style="height:32px; font-size:0.8rem; padding:4px 8px; border-radius:var(--radius-sm);">
              <option value="PENDING" ${u.sellerProfile.verificationStatus === 'PENDING' ? 'selected' : ''}>PENDING</option>
              <option value="APPROVED" ${u.sellerProfile.verificationStatus === 'APPROVED' ? 'selected' : ''}>APPROVED</option>
              <option value="REJECTED" ${u.sellerProfile.verificationStatus === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
            </select>
          ` : '<span style="color:var(--text-muted);">N/A</span>'}
        </td>
        <td>
          <div style="display:flex; gap:8px;">
            <button class="apx-btn apx-btn-primary save-user-btn" data-id="${u.id}" style="padding:6px 12px; font-size:0.75rem;">
              Save
            </button>
            <button class="btn-icon-only delete delete-user-btn" data-id="${u.id}" title="Delete account">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach actions
    tbody.querySelectorAll('.save-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const row = btn.closest('tr');
        const roleVal = row.querySelector('.user-role-select').value;
        const statusEl = row.querySelector('.seller-status-select');
        const verificationVal = statusEl ? statusEl.value : null;

        try {
          // Update role
          await api.patch(`/users/${id}/role`, { role: roleVal });
          
          // If seller status element exists, update verification status
          if (verificationVal) {
            await api.patch(`/users/${id}/verification`, { verificationStatus: verificationVal });
          }

          alert(`User settings saved successfully!`);
          await loadUsersTable();
        } catch (err) {
          alert(`Failed: ${err.message}`);
        }
      });
    });

    tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this user?')) {
          try {
            await api.delete(`/users/${id}`);
            alert('User deleted successfully');
            await loadUsersTable();
          } catch (err) {
            alert(`Failed: ${err.message}`);
          }
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}
