import React, { useState, useCallback } from 'react';
import {
  Card,
  Layout,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Banner,
  Badge,
  Icon,
  Modal,
  TextContainer
} from '@shopify/polaris';
import { CheckmarkIcon, CancelSmallIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '../hooks';

/**
 * PricingPage component for displaying pricing tiers
 */
function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const authenticatedFetch = useAuthenticatedFetch();

  // Handle plan selection
  const handleSelectPlan = useCallback((planName) => {
    setSelectedPlan(planName);
    setUpgradeModalOpen(true);
  }, []);

  // Handle plan upgrade
  const handleUpgrade = useCallback(async () => {
    if (!selectedPlan) return;
    
    setIsUpgrading(true);
    try {
      const response = await authenticatedFetch('/api/user/plan/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planName: selectedPlan,
          annual: annualBilling
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUserPlan(data.plan);
        setUpgradeModalOpen(false);
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
    } finally {
      setIsUpgrading(false);
    }
  }, [selectedPlan, annualBilling, authenticatedFetch]);

  // Toggle billing cycle
  const toggleBillingCycle = useCallback(() => {
    setAnnualBilling(!annualBilling);
  }, [annualBilling]);

  // Calculate price with discount
  const getPrice = (basePrice, plan) => {
    // Apply 30% launch discount
    const launchDiscount = basePrice * 0.3;
    const discountedPrice = basePrice - launchDiscount;
    
    // Apply 20% annual discount if applicable
    if (annualBilling) {
      return (discountedPrice * 0.8).toFixed(2);
    }
    
    return discountedPrice.toFixed(2);
  };

  return (
    <BlockStack gap="800">
      <Card>
        <BlockStack gap="400">
          <Text as="h1" variant="headingXl">Choose Your Plan</Text>
          
          <Banner status="info">
            <p>🚀 Launch Special: 30% off all paid plans for the first 3 months</p>
          </Banner>
          
          <InlineStack align="center" gap="400">
            <Text as="span" variant="bodyMd">Monthly</Text>
            <div 
              style={{ 
                width: '44px', 
                height: '22px', 
                backgroundColor: annualBilling ? '#008060' : '#e4e5e7',
                borderRadius: '11px',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={toggleBillingCycle}
            >
              <div 
                style={{
                  width: '18px',
                  height: '18px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: annualBilling ? '24px' : '2px',
                  transition: 'left 0.2s'
                }}
              />
            </div>
            <Text as="span" variant="bodyMd">Annual (Save 20%)</Text>
          </InlineStack>
          
          <Layout>
            {/* Free Plan */}
            <Layout.Section oneQuarter>
              <Card>
                <Card.Section>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">Free</Text>
                    <Text as="p" variant="headingXl">$0</Text>
                    <Text as="p" variant="bodyMd">Forever</Text>
                  </BlockStack>
                </Card.Section>
                <Card.Section>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">Perfect for exploring upsell opportunities</Text>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                      <li>5 active AI-powered upsell rules</li>
                      <li>Basic analytics (impressions & clicks)</li>
                      <li>Cart page placement</li>
                      <li>Standard templates</li>
                      <li>Community support</li>
                    </ul>
                    <div style={{ padding: '10px', backgroundColor: '#f4f6f8', borderRadius: '4px' }}>
                      <Text as="p" variant="bodyMd">
                        Get +1 rule for each referral (up to 10)
                      </Text>
                    </div>
                  </BlockStack>
                </Card.Section>
                <Card.Section>
                  <Button fullWidth>Current Plan</Button>
                </Card.Section>
              </Card>
            </Layout.Section>
            
            {/* Growth Plan */}
            <Layout.Section oneQuarter>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  backgroundColor: '#008060', 
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  zIndex: 1
                }}>
                  Most Popular
                </div>
                <Card>
                  <Card.Section>
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingLg">Growth</Text>
                      <Text as="p" variant="headingXl">${getPrice(49, 'GROWTH')}</Text>
                      <Text as="p" variant="bodyMd">per month</Text>
                    </BlockStack>
                  </Card.Section>
                  <Card.Section>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">For growing merchants ready to scale</Text>
                      <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                        <li>25 active AI-powered upsell rules</li>
                        <li>Full conversion analytics</li>
                        <li>Cart and product page placements</li>
                        <li>Basic customization options</li>
                        <li>Email support</li>
                        <li>No branding on widgets</li>
                        <li>Referral program access</li>
                      </ul>
                      <div style={{ padding: '10px', backgroundColor: '#f4f6f8', borderRadius: '4px' }}>
                        <Text as="p" variant="bodyMd">
                          Launch offer: ${getPrice(49, 'GROWTH')}/month for first 3 months
                        </Text>
                      </div>
                    </BlockStack>
                  </Card.Section>
                  <Card.Section>
                    <Button primary fullWidth onClick={() => handleSelectPlan('GROWTH')}>
                      Start 14-Day Trial
                    </Button>
                  </Card.Section>
                </Card>
              </div>
            </Layout.Section>
            
            {/* Pro Plan */}
            <Layout.Section oneQuarter>
              <Card>
                <Card.Section>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">Pro</Text>
                    <Text as="p" variant="headingXl">${getPrice(99, 'PRO')}</Text>
                    <Text as="p" variant="bodyMd">per month</Text>
                  </BlockStack>
                </Card.Section>
                <Card.Section>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">For established merchants seeking optimization</Text>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                      <li>100 active AI-powered upsell rules</li>
                      <li>Advanced analytics with revenue tracking</li>
                      <li>All placements (including post-purchase)</li>
                      <li>A/B testing (up to 5 active tests)</li>
                      <li>Advanced customization options</li>
                      <li>Priority support</li>
                      <li>Customer segmentation (3 segments)</li>
                    </ul>
                    <div style={{ padding: '10px', backgroundColor: '#f4f6f8', borderRadius: '4px' }}>
                      <Text as="p" variant="bodyMd">
                        Launch offer: ${getPrice(99, 'PRO')}/month for first 3 months
                      </Text>
                    </div>
                  </BlockStack>
                </Card.Section>
                <Card.Section>
                  <Button fullWidth onClick={() => handleSelectPlan('PRO')}>
                    Start 14-Day Trial
                  </Button>
                </Card.Section>
              </Card>
            </Layout.Section>
            
            {/* Enterprise Plan */}
            <Layout.Section oneQuarter>
              <Card>
                <Card.Section>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingLg">Enterprise</Text>
                    <Text as="p" variant="headingXl">${getPrice(249, 'ENTERPRISE')}</Text>
                    <Text as="p" variant="bodyMd">per month</Text>
                  </BlockStack>
                </Card.Section>
                <Card.Section>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">For high-volume merchants needing full power</Text>
                    <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                      <li>Unlimited AI-powered rules</li>
                      <li>Full analytics suite with customer insights</li>
                      <li>Multi-channel upsell experiences</li>
                      <li>Unlimited A/B testing</li>
                      <li>White-labeled upsell widgets</li>
                      <li>Dedicated support manager</li>
                      <li>Advanced customer segmentation</li>
                    </ul>
                    <div style={{ padding: '10px', backgroundColor: '#f4f6f8', borderRadius: '4px' }}>
                      <Text as="p" variant="bodyMd">
                        Launch offer: ${getPrice(249, 'ENTERPRISE')}/month for first 3 months
                      </Text>
                    </div>
                  </BlockStack>
                </Card.Section>
                <Card.Section>
                  <Button fullWidth onClick={() => handleSelectPlan('ENTERPRISE')}>
                    Start 14-Day Trial
                  </Button>
                </Card.Section>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Card>
      
      {/* ROI Calculator */}
      <Card>
        <Card.Section>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">Calculate Your ROI</Text>
            <Layout>
              <Layout.Section oneHalf>
                <BlockStack gap="400">
                  <TextField
                    label="Monthly Revenue ($)"
                    type="number"
                    value="10000"
                  />
                  <TextField
                    label="Average Order Value ($)"
                    type="number"
                    value="50"
                  />
                  <Select
                    label="Expected AOV Increase"
                    options={[
                      { label: 'Conservative: 10%', value: '10' },
                      { label: 'Average: 15%', value: '15' },
                      { label: 'Top Performer: 25%', value: '25' }
                    ]}
                    value="15"
                  />
                  <Button primary>Calculate ROI</Button>
                </BlockStack>
              </Layout.Section>
              <Layout.Section oneHalf>
                <Card subdued>
                  <Card.Section>
                    <BlockStack gap="400">
                      <InlineStack gap="400">
                        <div style={{ flex: 1 }}>
                          <Text as="h3" variant="headingMd">New Average Order Value</Text>
                          <Text as="p" variant="headingLg">$57.50</Text>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text as="h3" variant="headingMd">Additional Monthly Revenue</Text>
                          <Text as="p" variant="headingLg">$1,500</Text>
                        </div>
                      </InlineStack>
                      <InlineStack gap="400">
                        <div style={{ flex: 1 }}>
                          <Text as="h3" variant="headingMd">Monthly ROI</Text>
                          <Text as="p" variant="headingLg">3,061%</Text>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text as="h3" variant="headingMd">Annual Additional Revenue</Text>
                          <Text as="p" variant="headingLg">$18,000</Text>
                        </div>
                      </InlineStack>
                    </BlockStack>
                  </Card.Section>
                </Card>
              </Layout.Section>
            </Layout>
          </BlockStack>
        </Card.Section>
      </Card>
      
      {/* Upgrade Modal */}
      <Modal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title={`Upgrade to ${selectedPlan} Plan`}
        primaryAction={{
          content: 'Start 14-Day Trial',
          onAction: handleUpgrade,
          loading: isUpgrading
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setUpgradeModalOpen(false)
          }
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>You're about to start a 14-day free trial of the {selectedPlan} plan. You won't be charged until your trial ends.</p>
            <p>After your trial, you'll be billed at ${getPrice(selectedPlan === 'GROWTH' ? 49 : selectedPlan === 'PRO' ? 99 : 249, selectedPlan)}/month.</p>
            <p>You can cancel anytime before your trial ends.</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </BlockStack>
  );
}

export default PricingPage;
