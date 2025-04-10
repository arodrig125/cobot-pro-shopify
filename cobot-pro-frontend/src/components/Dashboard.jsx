import React, { useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Tabs,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Modal,
  EmptyState
} from '@shopify/polaris';
import UpsellRuleForm from './UpsellRuleForm';
import AnalyticsDashboard from './AnalyticsDashboard';
import ABTestingDashboard from './ABTestingDashboard';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

/**
 * Main Dashboard component for the Cobot Pro app
 */
function Dashboard() {
  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle tab change
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);
  
  // Handle create rule
  const handleCreateRule = useCallback(async (formData) => {
    setIsSubmitting(true);
    
    try {
      const response = await authenticatedFetch('/api/upsell/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Close modal
        setCreateModalOpen(false);
        
        // Refresh rules
        fetchRules();
      } else {
        console.error('Error creating rule:', data.error);
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, []);
  
  // Fetch rules
  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await authenticatedFetch('/api/upsell/rules');
      const data = await response.json();
      
      if (data.success) {
        setRules(data.rules);
      } else {
        console.error('Error fetching rules:', data.error);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Tabs
  const tabs = [
    {
      id: 'dashboard',
      content: 'Dashboard',
      accessibilityLabel: 'Dashboard tab',
      panelID: 'dashboard-panel',
    },
    {
      id: 'rules',
      content: 'Upsell Rules',
      accessibilityLabel: 'Upsell Rules tab',
      panelID: 'rules-panel',
    },
    {
      id: 'analytics',
      content: 'Analytics',
      accessibilityLabel: 'Analytics tab',
      panelID: 'analytics-panel',
    },
    {
      id: 'ab-testing',
      content: 'A/B Testing',
      accessibilityLabel: 'A/B Testing tab',
      panelID: 'ab-testing-panel',
    },
    {
      id: 'settings',
      content: 'Settings',
      accessibilityLabel: 'Settings tab',
      panelID: 'settings-panel',
    },
  ];
  
  return (
    <Page>
      <BlockStack gap="800">
        <Card>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
            {selectedTab === 0 && (
              <Card.Section>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">Welcome to Cobot Pro</Text>
                  <Text as="p" variant="bodyMd">
                    Cobot Pro is an AI-powered upsell app that helps you increase your average order value
                    by automatically suggesting relevant products to your customers.
                  </Text>
                  
                  <Layout>
                    <Layout.Section oneThird>
                      <Card>
                        <Card.Section>
                          <BlockStack gap="200" align="center">
                            <Text as="h3" variant="headingMd">Create Upsell Rules</Text>
                            <Text as="p" variant="bodyMd">
                              Set up rules to show upsell offers to your customers.
                            </Text>
                            <Button primary onClick={() => setCreateModalOpen(true)}>
                              Create Rule
                            </Button>
                          </BlockStack>
                        </Card.Section>
                      </Card>
                    </Layout.Section>
                    
                    <Layout.Section oneThird>
                      <Card>
                        <Card.Section>
                          <BlockStack gap="200" align="center">
                            <Text as="h3" variant="headingMd">View Analytics</Text>
                            <Text as="p" variant="bodyMd">
                              Track the performance of your upsell offers.
                            </Text>
                            <Button onClick={() => setSelectedTab(2)}>
                              View Analytics
                            </Button>
                          </BlockStack>
                        </Card.Section>
                      </Card>
                    </Layout.Section>
                    
                    <Layout.Section oneThird>
                      <Card>
                        <Card.Section>
                          <BlockStack gap="200" align="center">
                            <Text as="h3" variant="headingMd">Run A/B Tests</Text>
                            <Text as="p" variant="bodyMd">
                              Optimize your upsell offers with A/B testing.
                            </Text>
                            <Button onClick={() => setSelectedTab(3)}>
                              Start Testing
                            </Button>
                          </BlockStack>
                        </Card.Section>
                      </Card>
                    </Layout.Section>
                  </Layout>
                </BlockStack>
              </Card.Section>
            )}
            
            {selectedTab === 1 && (
              <Card.Section>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingLg">Upsell Rules</Text>
                    <Button primary onClick={() => setCreateModalOpen(true)}>
                      Create Rule
                    </Button>
                  </InlineStack>
                  
                  {rules.length === 0 ? (
                    <EmptyState
                      heading="No upsell rules yet"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <p>
                        Create your first upsell rule to start increasing your average order value.
                      </p>
                    </EmptyState>
                  ) : (
                    <Text as="p" variant="bodyMd">
                      You have {rules.length} upsell rules.
                    </Text>
                  )}
                </BlockStack>
              </Card.Section>
            )}
            
            {selectedTab === 2 && (
              <Card.Section>
                <AnalyticsDashboard />
              </Card.Section>
            )}
            
            {selectedTab === 3 && (
              <Card.Section>
                <ABTestingDashboard />
              </Card.Section>
            )}
            
            {selectedTab === 4 && (
              <Card.Section>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingLg">Settings</Text>
                  <Text as="p" variant="bodyMd">
                    Configure your Cobot Pro settings.
                  </Text>
                </BlockStack>
              </Card.Section>
            )}
          </Tabs>
        </Card>
      </BlockStack>
      
      {/* Create Rule Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Upsell Rule"
      >
        <Modal.Section>
          <UpsellRuleForm
            onSubmit={handleCreateRule}
            isLoading={isSubmitting}
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export default Dashboard;
