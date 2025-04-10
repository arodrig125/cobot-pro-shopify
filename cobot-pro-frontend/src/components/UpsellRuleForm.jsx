import React, { useState, useCallback } from 'react';
import {
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  InlineStack,
  BlockStack,
  Text,
  Banner,
  Collapsible,
  Link,
  RangeSlider
} from '@shopify/polaris';
import ProductSelector from './ProductSelector';

/**
 * UpsellRuleForm component for creating and editing upsell rules
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.initialValues - Initial values for the form
 * @param {boolean} props.isLoading - Whether the form is in a loading state
 */
function UpsellRuleForm({ onSubmit, initialValues = {}, isLoading = false }) {
  // Form state
  const [triggerProduct, setTriggerProduct] = useState({
    id: initialValues.triggerProductId || '',
    title: initialValues.triggerProductTitle || ''
  });
  
  const [upsellProduct, setUpsellProduct] = useState({
    id: initialValues.upsellProductId || '',
    title: initialValues.upsellProductTitle || ''
  });
  
  const [message, setMessage] = useState(initialValues.message || '');
  const [discount, setDiscount] = useState(initialValues.discount?.toString() || '');
  const [discountType, setDiscountType] = useState(initialValues.discountType || 'PERCENTAGE');
  const [placement, setPlacement] = useState(initialValues.placement || 'CART');
  const [displayStyle, setDisplayStyle] = useState(initialValues.displayStyle || 'STANDARD');
  const [priority, setPriority] = useState(initialValues.priority || 1);
  
  // Advanced options state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [error, setError] = useState('');
  
  // Handle form submission
  const handleSubmit = useCallback(() => {
    // Validate form
    if (!triggerProduct.id) {
      setError('Trigger product is required');
      return;
    }
    
    if (!upsellProduct.id) {
      setError('Upsell product is required');
      return;
    }
    
    // Clear error
    setError('');
    
    // Prepare form data
    const formData = {
      triggerProductId: triggerProduct.id,
      triggerProductTitle: triggerProduct.title,
      upsellProductId: upsellProduct.id,
      upsellProductTitle: upsellProduct.title,
      message,
      discount: discount ? parseFloat(discount) : null,
      discountType: discount ? discountType : null,
      placement,
      displayStyle,
      priority
    };
    
    // Submit form
    onSubmit(formData);
  }, [
    triggerProduct, 
    upsellProduct, 
    message, 
    discount, 
    discountType, 
    placement, 
    displayStyle, 
    priority, 
    onSubmit
  ]);
  
  // Handle trigger product selection
  const handleTriggerProductSelect = useCallback((product) => {
    setTriggerProduct({
      id: product.id,
      title: product.title
    });
  }, []);
  
  // Handle upsell product selection
  const handleUpsellProductSelect = useCallback((product) => {
    setUpsellProduct({
      id: product.id,
      title: product.title
    });
  }, []);
  
  // Handle message change
  const handleMessageChange = useCallback((value) => {
    setMessage(value);
  }, []);
  
  // Handle discount change
  const handleDiscountChange = useCallback((value) => {
    // Only allow numbers and decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    setDiscount(sanitizedValue);
  }, []);
  
  // Handle discount type change
  const handleDiscountTypeChange = useCallback((value) => {
    setDiscountType(value);
  }, []);
  
  // Handle placement change
  const handlePlacementChange = useCallback((value) => {
    setPlacement(value);
  }, []);
  
  // Handle display style change
  const handleDisplayStyleChange = useCallback((value) => {
    setDisplayStyle(value);
  }, []);
  
  // Handle priority change
  const handlePriorityChange = useCallback((value) => {
    setPriority(value);
  }, []);
  
  // Toggle advanced options
  const toggleAdvancedOptions = useCallback(() => {
    setShowAdvancedOptions((prev) => !prev);
  }, []);
  
  // Discount type options
  const discountTypeOptions = [
    { label: 'Percentage', value: 'PERCENTAGE' },
    { label: 'Fixed Amount', value: 'FIXED_AMOUNT' }
  ];
  
  // Placement options
  const placementOptions = [
    { label: 'Cart Page', value: 'CART' },
    { label: 'Product Page', value: 'PRODUCT_PAGE' },
    { label: 'Post-Purchase', value: 'POST_PURCHASE' },
    { label: 'Checkout', value: 'CHECKOUT' }
  ];
  
  // Display style options
  const displayStyleOptions = [
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Popup', value: 'POPUP' },
    { label: 'Sidebar', value: 'SIDEBAR' },
    { label: 'Notification', value: 'NOTIFICATION' }
  ];
  
  return (
    <Card>
      <BlockStack gap="400">
        {error && (
          <Banner status="critical">
            <p>{error}</p>
          </Banner>
        )}
        
        <FormLayout>
          <ProductSelector
            label="Trigger Product"
            onSelect={handleTriggerProductSelect}
            selectedProductId={triggerProduct.id}
            selectedProductTitle={triggerProduct.title}
          />
          
          <ProductSelector
            label="Upsell Product"
            onSelect={handleUpsellProductSelect}
            selectedProductId={upsellProduct.id}
            selectedProductTitle={upsellProduct.title}
          />
          
          <TextField
            label="Upsell Message"
            value={message}
            onChange={handleMessageChange}
            placeholder="Would you like to add this item to your cart?"
            multiline={3}
          />
          
          <Link onClick={toggleAdvancedOptions} monochrome>
            {showAdvancedOptions ? 'Hide advanced options' : 'Show advanced options'}
          </Link>
          
          <Collapsible open={showAdvancedOptions}>
            <BlockStack gap="400">
              <InlineStack gap="400" blockAlign="center">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Discount"
                    value={discount}
                    onChange={handleDiscountChange}
                    placeholder="0"
                    suffix={discountType === 'PERCENTAGE' ? '%' : '$'}
                    type="text"
                    helpText="Leave empty for no discount"
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <Select
                    label="Discount Type"
                    options={discountTypeOptions}
                    value={discountType}
                    onChange={handleDiscountTypeChange}
                    disabled={!discount}
                  />
                </div>
              </InlineStack>
              
              <Select
                label="Placement"
                options={placementOptions}
                value={placement}
                onChange={handlePlacementChange}
                helpText="Where the upsell offer will be displayed"
              />
              
              <Select
                label="Display Style"
                options={displayStyleOptions}
                value={displayStyle}
                onChange={handleDisplayStyleChange}
                helpText="How the upsell offer will be displayed"
              />
              
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Priority: {priority}</Text>
                <RangeSlider
                  label="Priority"
                  value={priority}
                  onChange={handlePriorityChange}
                  min={1}
                  max={10}
                  output
                  helpText="Higher priority rules are shown first when multiple rules match"
                />
              </BlockStack>
            </BlockStack>
          </Collapsible>
          
          <InlineStack gap="200" align="end">
            <Button primary onClick={handleSubmit} loading={isLoading}>
              Save Rule
            </Button>
          </InlineStack>
        </FormLayout>
      </BlockStack>
    </Card>
  );
}

export default UpsellRuleForm;
