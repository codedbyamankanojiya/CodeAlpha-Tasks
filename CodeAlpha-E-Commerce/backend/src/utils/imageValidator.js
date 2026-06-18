const Product = require('../models/Product');

/**
 * Validates whether an image URL is alive and returns an image content-type.
 * Performs a fast fetch (HEAD or GET request).
 * @param {string} url 
 * @returns {Promise<boolean>}
 */
const validateImageUrl = async (url) => {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    // Try HEAD first (faster, no body payload)
    let response = await fetch(url, { method: 'HEAD', signal: controller.signal }).catch(() => null);

    // If HEAD fails or returns non-200, try a GET request with Range header
    if (!response || response.status !== 200) {
      response = await fetch(url, { 
        method: 'GET', 
        headers: { 'Range': 'bytes=0-10' }, 
        signal: controller.signal 
      }).catch(() => null);
    }

    clearTimeout(timeoutId);

    if (response && response.ok) {
      const contentType = response.headers.get('content-type');
      return contentType && contentType.startsWith('image/');
    }
    return false;
  } catch (error) {
    // If request fails or timeouts, mark as invalid
    return false;
  }
};

/**
 * Checks if an image URL is already in use by any other product in the database.
 * If productId is provided, it excludes that product from the check (for updates).
 * @param {string} url 
 * @param {number} [productId]
 * @returns {Promise<boolean>}
 */
const isDuplicateImageUrl = async (url, productId = null) => {
  if (!url) return false;
  
  const { Op } = require('sequelize');
  const query = {
    where: {
      imageUrl: url
    }
  };

  if (productId) {
    query.where.id = {
      [Op.ne]: productId
    };
  }

  const existingProduct = await Product.findOne(query);
  return !!existingProduct;
};

// Curated fallbacks by category if an image fails validation
const CATEGORY_FALLBACK_IMAGES = {
  smartphone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
  television: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  wearables: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
  gaming: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=80',
  fashion_men: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  fashion_women: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
  accessories: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=800&q=80'
};

const getFallbackImageUrl = (categorySlug) => {
  const slug = categorySlug ? categorySlug.toLowerCase() : 'default';
  if (slug.includes('phone') || slug.includes('mobile')) return CATEGORY_FALLBACK_IMAGES.smartphone;
  if (slug.includes('laptop') || slug.includes('pc') || slug.includes('gear')) return CATEGORY_FALLBACK_IMAGES.laptop;
  if (slug.includes('tv') || slug.includes('television')) return CATEGORY_FALLBACK_IMAGES.television;
  if (slug.includes('audio') || slug.includes('headphone') || slug.includes('speaker')) return CATEGORY_FALLBACK_IMAGES.audio;
  if (slug.includes('wear') || slug.includes('watch') || slug.includes('gadget')) return CATEGORY_FALLBACK_IMAGES.wearables;
  if (slug.includes('game') || slug.includes('console')) return CATEGORY_FALLBACK_IMAGES.gaming;
  if (slug.includes('men')) return CATEGORY_FALLBACK_IMAGES.fashion_men;
  if (slug.includes('women') || slug.includes('dress') || slug.includes('bag')) return CATEGORY_FALLBACK_IMAGES.fashion_women;
  if (slug.includes('access')) return CATEGORY_FALLBACK_IMAGES.accessories;
  
  return CATEGORY_FALLBACK_IMAGES.default;
};

module.exports = {
  validateImageUrl,
  isDuplicateImageUrl,
  getFallbackImageUrl
};
