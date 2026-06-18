import { api } from './api.js';
import { isAuthenticated } from './auth.js';

// Custom event key to notify UI changes across scripts
export const CART_UPDATED_EVENT = 'apx_cart_updated';
export const WISHLIST_UPDATED_EVENT = 'apx_wishlist_updated';

function broadcastUpdate(eventName, detail = {}) {
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
}

// === CART ACTIONS ===

export async function fetchCart() {
  if (!isAuthenticated()) return { items: [], total: 0, itemCount: 0 };
  try {
    const data = await api.get('/cart');
    broadcastUpdate(CART_UPDATED_EVENT, data.cart);
    return data.cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return { items: [], total: 0, itemCount: 0 };
  }
}

export async function addToCart(productId, quantity = 1) {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  try {
    const data = await api.post('/cart/add', { productId, quantity });
    broadcastUpdate(CART_UPDATED_EVENT, data.cart);
    return data.cart;
  } catch (error) {
    alert(error.message);
    throw error;
  }
}

export async function updateCartItemQuantity(itemId, quantity) {
  try {
    const data = await api.put(`/cart/items/${itemId}`, { quantity });
    broadcastUpdate(CART_UPDATED_EVENT, data.cart);
    return data.cart;
  } catch (error) {
    alert(error.message);
    throw error;
  }
}

export async function removeCartItem(itemId) {
  try {
    const data = await api.delete(`/cart/items/${itemId}`);
    // Re-fetch cart details to update counts
    return await fetchCart();
  } catch (error) {
    alert(error.message);
    throw error;
  }
}

export async function clearCart() {
  try {
    await api.delete('/cart/clear');
    broadcastUpdate(CART_UPDATED_EVENT, { items: [], total: 0, itemCount: 0 });
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
}

// === WISHLIST ACTIONS ===

export async function fetchWishlist() {
  if (!isAuthenticated()) return [];
  try {
    const data = await api.get('/wishlist');
    broadcastUpdate(WISHLIST_UPDATED_EVENT, data.products);
    return data.products;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
}

export async function toggleWishlist(productId) {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  try {
    const data = await api.post('/wishlist/toggle', { productId });
    await fetchWishlist(); // trigger event broadcast
    return data; // returns { added: boolean }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    throw error;
  }
}

export async function clearWishlist() {
  try {
    await api.delete('/wishlist/clear');
    broadcastUpdate(WISHLIST_UPDATED_EVENT, []);
  } catch (error) {
    console.error('Error clearing wishlist:', error);
  }
}
