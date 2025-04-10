const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const prisma = require('../prismaClient');

/**
 * Shopify Service for Cobot Pro
 * Handles all interactions with the Shopify API
 */

/**
 * Get a Shopify client for a specific store
 * @param {string} shopDomain - The shop's domain
 * @returns {Object} - Shopify API client
 */
async function getShopifyClient(shopDomain) {
  try {
    // Get the store from the database
    const store = await prisma.store.findUnique({
      where: { domain: shopDomain }
    });
    
    if (!store || !store.accessToken) {
      throw new Error(`No access token found for shop: ${shopDomain}`);
    }
    
    // Initialize the Shopify API client
    const shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET,
      scopes: process.env.SCOPES.split(','),
      hostName: process.env.HOST.replace(/^https?:\/\//, ''),
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: true,
    });
    
    // Create a session
    const session = {
      shop: shopDomain,
      accessToken: store.accessToken,
      state: 'active',
    };
    
    return {
      shopify,
      session,
      rest: new shopify.clients.Rest({ session }),
      graphql: new shopify.clients.Graphql({ session })
    };
  } catch (error) {
    console.error(`Error getting Shopify client for ${shopDomain}:`, error);
    throw error;
  }
}

/**
 * Get product details by ID
 * @param {string} productId - The product ID
 * @param {string} shopDomain - The shop's domain
 * @returns {Promise<Object>} - Product details
 */
async function getProductById(productId, shopDomain) {
  try {
    // For development/testing, return mock data if no shopDomain is provided
    if (!shopDomain) {
      return getMockProduct(productId);
    }
    
    const { rest } = await getShopifyClient(shopDomain);
    
    const response = await rest.get({
      path: `products/${productId}`,
    });
    
    const product = response.body.product;
    
    // Format the product data
    return {
      id: product.id,
      title: product.title,
      description: product.body_html,
      price: product.variants[0]?.price || '0.00',
      compareAtPrice: product.variants[0]?.compare_at_price || null,
      image: product.images[0]?.src || null,
      handle: product.handle,
      tags: product.tags,
      productType: product.product_type,
      vendor: product.vendor,
      variants: product.variants.map(v => ({
        id: v.id,
        title: v.title,
        price: v.price,
        compareAtPrice: v.compare_at_price,
        sku: v.sku,
        available: v.inventory_quantity > 0
      }))
    };
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    // Return mock data as fallback
    return getMockProduct(productId);
  }
}

/**
 * Get mock product data for development/testing
 * @param {string} productId - The product ID
 * @returns {Object} - Mock product data
 */
function getMockProduct(productId) {
  return {
    id: productId,
    title: `Product ${productId}`,
    description: 'This is a mock product description for development and testing.',
    price: '19.99',
    compareAtPrice: '24.99',
    image: 'https://via.placeholder.com/300x300',
    handle: `product-${productId}`,
    tags: 'mock, test, development',
    productType: 'Test',
    vendor: 'Test Vendor',
    variants: [
      {
        id: `variant-${productId}-1`,
        title: 'Default',
        price: '19.99',
        compareAtPrice: '24.99',
        sku: `SKU-${productId}`,
        available: true
      }
    ]
  };
}

/**
 * Search for products
 * @param {string} query - Search query
 * @param {string} shopDomain - The shop's domain
 * @param {Object} options - Search options (limit, page, etc.)
 * @returns {Promise<Array>} - Array of products
 */
async function searchProducts(query, shopDomain, options = {}) {
  try {
    // For development/testing, return mock data if no shopDomain is provided
    if (!shopDomain) {
      return [
        getMockProduct('123'),
        getMockProduct('456'),
        getMockProduct('789')
      ];
    }
    
    const { graphql } = await getShopifyClient(shopDomain);
    
    const response = await graphql.query({
      data: {
        query: `
          query searchProducts($query: String!, $first: Int!) {
            products(query: $query, first: $first) {
              edges {
                node {
                  id
                  title
                  description
                  handle
                  priceRangeV2 {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  images(first: 1) {
                    edges {
                      node {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          query,
          first: options.limit || 10
        }
      }
    });
    
    // Format the response
    return response.body.data.products.edges.map(edge => {
      const product = edge.node;
      return {
        id: product.id.split('/').pop(),
        title: product.title,
        description: product.description,
        price: product.priceRangeV2.minVariantPrice.amount,
        currencyCode: product.priceRangeV2.minVariantPrice.currencyCode,
        image: product.images.edges[0]?.node.url || null,
        handle: product.handle
      };
    });
  } catch (error) {
    console.error(`Error searching products with query "${query}":`, error);
    // Return mock data as fallback
    return [
      getMockProduct('123'),
      getMockProduct('456'),
      getMockProduct('789')
    ];
  }
}

/**
 * Get order details
 * @param {string} orderId - The order ID
 * @param {string} shopDomain - The shop's domain
 * @returns {Promise<Object>} - Order details
 */
async function getOrderById(orderId, shopDomain) {
  try {
    const { rest } = await getShopifyClient(shopDomain);
    
    const response = await rest.get({
      path: `orders/${orderId}`,
    });
    
    return response.body.order;
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    throw error;
  }
}

module.exports = {
  getShopifyClient,
  getProductById,
  searchProducts,
  getOrderById
};
