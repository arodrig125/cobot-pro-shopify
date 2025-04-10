import React, { useState, useCallback, useEffect } from 'react';
import {
  TextField,
  Card,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Button,
  Spinner,
  EmptyState,
  Modal,
  TextContainer
} from '@shopify/polaris';
import { SearchIcon } from '@shopify/polaris-icons';

/**
 * ProductSelector component for selecting Shopify products
 * 
 * @param {Object} props
 * @param {Function} props.onSelect - Callback when a product is selected
 * @param {string} props.label - Label for the selector
 * @param {string} props.selectedProductId - Currently selected product ID
 * @param {string} props.selectedProductTitle - Currently selected product title
 */
function ProductSelector({ onSelect, label, selectedProductId, selectedProductTitle }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Handle search input change
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  // Search for products
  const searchProducts = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.products);
      } else {
        setError(data.error || 'Failed to search products');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setError('An error occurred while searching products');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Handle search button click
  const handleSearchClick = useCallback(() => {
    searchProducts();
  }, [searchProducts]);

  // Handle search on Enter key press
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      searchProducts();
    }
  }, [searchProducts]);

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    onSelect(product);
    setModalOpen(false);
  }, [onSelect]);

  // Handle modal open
  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  // For development/testing, load mock products
  useEffect(() => {
    if (modalOpen && process.env.NODE_ENV === 'development' && searchResults.length === 0) {
      // Mock data for development
      setSearchResults([
        {
          id: '123',
          title: 'Sample T-Shirt',
          price: '19.99',
          image: 'https://via.placeholder.com/100x100'
        },
        {
          id: '456',
          title: 'Sample Hoodie',
          price: '39.99',
          image: 'https://via.placeholder.com/100x100'
        },
        {
          id: '789',
          title: 'Sample Hat',
          price: '14.99',
          image: 'https://via.placeholder.com/100x100'
        }
      ]);
    }
  }, [modalOpen, searchResults.length]);

  return (
    <>
      <TextField
        label={label}
        value={selectedProductTitle || ''}
        placeholder="Select a product"
        readOnly
        connectedRight={
          <Button onClick={handleOpenModal}>
            Select Product
          </Button>
        }
      />
      
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Select a Product"
        primaryAction={{
          content: 'Cancel',
          onAction: handleCloseModal
        }}
      >
        <Modal.Section>
          <TextContainer>
            <div style={{ display: 'flex', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <TextField
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products..."
                  onKeyPress={handleKeyPress}
                  autoComplete="off"
                />
              </div>
              <div style={{ marginLeft: '8px' }}>
                <Button onClick={handleSearchClick} icon={SearchIcon}>
                  Search
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spinner size="large" />
                <p>Searching products...</p>
              </div>
            ) : error ? (
              <div style={{ color: 'red', padding: '10px' }}>
                {error}
              </div>
            ) : searchResults.length === 0 ? (
              <EmptyState
                heading="No products found"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Search for products using the search bar above.</p>
              </EmptyState>
            ) : (
              <Card>
                <ResourceList
                  resourceName={{ singular: 'product', plural: 'products' }}
                  items={searchResults}
                  renderItem={(product) => (
                    <ResourceItem
                      id={product.id}
                      onClick={() => handleProductSelect(product)}
                      media={
                        <Thumbnail
                          source={product.image || 'https://via.placeholder.com/100x100'}
                          alt={product.title}
                        />
                      }
                      accessibilityLabel={`Select ${product.title}`}
                    >
                      <h3>{product.title}</h3>
                      <div>${product.price}</div>
                    </ResourceItem>
                  )}
                />
              </Card>
            )}
          </TextContainer>
        </Modal.Section>
      </Modal>
    </>
  );
}

export default ProductSelector;
