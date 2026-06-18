import { login, signup, isAuthenticated } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Redirect to profile if already logged in
  if (isAuthenticated() && (window.location.pathname.includes('/login.html') || window.location.pathname.includes('/signup.html'))) {
    window.location.href = '/profile.html';
    return;
  }

  // Pre-fill remember-me email
  const rememberedEmail = localStorage.getItem('apx_remember_email');
  const emailInput = document.getElementById('login-email');
  if (emailInput && rememberedEmail) {
    emailInput.value = rememberedEmail;
    const rememberCheckbox = document.getElementById('login-remember');
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  setupLoginSubmit();
  setupSignupSubmit();
});

function setupLoginSubmit() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember')?.checked || false;

    if (!email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Signing In...';

    try {
      await login(email, password, rememberMe);
      
      // Handle redirect parameter if it exists
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');
      window.location.href = redirectUrl ? decodeURIComponent(redirectUrl) : '/profile.html';
    } catch (err) {
      alert(err.message || 'Login failed. Invalid credentials.');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Sign In';
    }
  });
}

function setupSignupSubmit() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('signup-firstname').value.trim();
    const lastName = document.getElementById('signup-lastname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      alert('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Creating Account...';

    try {
      await signup({
        name: `${firstName} ${lastName}`,
        email,
        phone: phone || null,
        password,
        role: 'CUSTOMER' // default signup role
      });
      alert('Registration successful!');
      window.location.href = '/profile.html';
    } catch (err) {
      alert(err.message || 'Registration failed.');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Create Account';
    }
  });
}
