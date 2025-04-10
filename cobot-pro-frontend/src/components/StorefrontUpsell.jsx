import React, { useState, useEffect } from 'react';
import './StorefrontUpsell.css';

/**
 * StorefrontUpsell component for displaying upsell offers in the storefront
 * This component is designed to be embedded in the Shopify storefront
 * 
 * @param {Object} props
 * @param {string} props.productId - The current product ID
 * @param {Object} props.customerData - Customer data for personalization
 * @param {Object} props.cartData - Current cart data
 * @param {string} props.placement - Where the upsell is being displayed
 * @param {string} props.shopDomain - The shop's domain
 * @param {string} props.apiUrl - The API URL for fetching upsell data
 */
function StorefrontUpsell({
  productId,
  customerData = {},
  cartData = {},
  placement = 'CART',
  shopDomain,
  apiUrl = 'https://your-app-url.com/api/upsell'
}) {
  // State
  const [upsells, setUpsells] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState('');
  
  // Fetch upsell recommendations
  useEffect(() => {
    const fetchUpsells = async () => {
      if (!productId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Generate a session ID if not already set
        if (!sessionId) {
          setSessionId(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId,
            customerData,
            cartData,
            placement,
            sessionId
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setUpsells(data.upsells || []);
          
          // Track impressions for each upsell
          if (data.upsells && data.upsells.length > 0) {
            data.upsells.forEach(upsell => {
              if (upsell.ruleId) {
                trackImpression(upsell.ruleId);
              }
              
              if (upsell.testId) {
                trackTestImpression(upsell.testId, upsell.variant);
              }
            });
          }
        } else {
          setError(data.error || 'Failed to fetch upsell recommendations');
          setUpsells([]);
        }
      } catch (error) {
        console.error('Error fetching upsell recommendations:', error);
        setError('An error occurred while fetching upsell recommendations');
        setUpsells([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUpsells();
  }, [productId, placement, apiUrl, sessionId]);
  
  // Track impression
  const trackImpression = async (upsellId) => {
    try {
      await fetch(`${apiUrl.replace('/upsell', '/analytics/impression')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          upsellId,
          shopDomain,
          customerId: customerData.id,
          sessionId
        })
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };
  
  // Track test impression
  const trackTestImpression = async (testId, variant) => {
    try {
      await fetch(`${apiUrl.replace('/upsell', '/abtest/impression')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId,
          variant
        })
      });
    } catch (error) {
      console.error('Error tracking test impression:', error);
    }
  };
  
  // Track conversion
  const trackConversion = async (upsell) => {
    try {
      // Track upsell conversion
      if (upsell.ruleId) {
        await fetch(`${apiUrl.replace('/upsell', '/analytics/conversion')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            upsellId: upsell.ruleId,
            shopDomain,
            customerId: customerData.id,
            sessionId,
            revenue: upsell.price
          })
        });
      }
      
      // Track test conversion
      if (upsell.testId) {
        await fetch(`${apiUrl.replace('/upsell', '/abtest/conversion')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testId: upsell.testId,
            variant: upsell.variant
          })
        });
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  };
  
  // Handle add to cart
  const handleAddToCart = async (upsell) => {
    try {
      // Track conversion
      await trackConversion(upsell);
      
      // Add to cart using Shopify AJAX API
      const formData = {
        'items': [
          {
            'id': upsell.productId,
            'quantity': 1
          }
        ]
      };
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.items) {
        // Refresh cart
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  };
  
  // If no upsells, don't render anything
  if (!isLoading && (upsells.length === 0 || error)) {
    return null;
  }
  
  // Determine display style based on placement
  let containerClass = 'cobot-upsell-container';
  
  switch (placement) {
    case 'PRODUCT_PAGE':
      containerClass += ' cobot-upsell-product-page';
      break;
    case 'CART':
      containerClass += ' cobot-upsell-cart';
      break;
    case 'CHECKOUT':
      containerClass += ' cobot-upsell-checkout';
      break;
    case 'POST_PURCHASE':
      containerClass += ' cobot-upsell-post-purchase';
      break;
    default:
      containerClass += ' cobot-upsell-standard';
  }
  
  return (
    <div className={containerClass}>
      {isLoading ? (
        <div className="cobot-upsell-loading">
          <div className="cobot-upsell-spinner"></div>
          <p>Loading recommendations...</p>
        </div>
      ) : (
        <div className="cobot-upsell-items">
          {upsells.map((upsell, index) => (
            <div key={index} className="cobot-upsell-item">
              <div className="cobot-upsell-image">
                <img src={upsell.image} alt={upsell.title} />
              </div>
              <div className="cobot-upsell-content">
                <h3 className="cobot-upsell-title">{upsell.title}</h3>
                <p className="cobot-upsell-message">{upsell.message}</p>
                <div className="cobot-upsell-price-row">
                  <span className="cobot-upsell-price">{upsell.price}</span>
                  {upsell.compareAtPrice && (
                    <span className="cobot-upsell-compare-price">{upsell.compareAtPrice}</span>
                  )}
                </div>
                <button 
                  className="cobot-upsell-button"
                  onClick={() => handleAddToCart(upsell)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StorefrontUpsell;
