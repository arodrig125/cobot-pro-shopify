import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Layout,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Modal,
  FormLayout,
  TextField,
  Select,
  DatePicker,
  SkeletonBodyText,
  EmptyState,
  Badge,
  DataTable,
  Tabs,
  Banner
} from '@shopify/polaris';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * ABTestingDashboard component for managing and analyzing A/B tests
 */
function ABTestingDashboard() {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVariantA, setFormVariantA] = useState('');
  const [formVariantB, setFormVariantB] = useState('');
  const [formEndDate, setFormEndDate] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRules, setAvailableRules] = useState([]);
  
  // Fetch tests
  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/abtest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTests(data.tests);
      } else {
        console.error('Error fetching tests:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch available rules for test creation
  const fetchAvailableRules = useCallback(async () => {
    try {
      const response = await fetch('/api/upsell/rules', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAvailableRules(data.rules);
      } else {
        console.error('Error fetching rules:', data.error);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  }, []);
  
  // Handle create test
  const handleCreateTest = useCallback(async () => {
    // Validate form
    if (!formName) {
      setFormError('Test name is required');
      return;
    }
    
    if (!formVariantA) {
      setFormError('Variant A is required');
      return;
    }
    
    if (!formVariantB) {
      setFormError('Variant B is required');
      return;
    }
    
    if (formVariantA === formVariantB) {
      setFormError('Variants must be different');
      return;
    }
    
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/abtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          variantA: formVariantA,
          variantB: formVariantB,
          endDate: formEndDate
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setFormName('');
        setFormDescription('');
        setFormVariantA('');
        setFormVariantB('');
        setFormEndDate(null);
        
        // Close modal
        setCreateModalOpen(false);
        
        // Refresh tests
        fetchTests();
      } else {
        setFormError(data.error || 'Failed to create test');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      setFormError('An error occurred while creating the test');
    } finally {
      setIsSubmitting(false);
    }
  }, [formName, formDescription, formVariantA, formVariantB, formEndDate, fetchTests]);
  
  // Handle view test details
  const handleViewTestDetails = useCallback((testId) => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      setSelectedTest(test);
      setDetailsModalOpen(true);
    }
  }, [tests]);
  
  // Handle end test
  const handleEndTest = useCallback(async (testId) => {
    try {
      const response = await fetch(`/api/abtest/${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'COMPLETED'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh tests
        fetchTests();
      } else {
        console.error('Error ending test:', data.error);
      }
    } catch (error) {
      console.error('Error ending test:', error);
    }
  }, [fetchTests]);
  
  // Handle delete test
  const handleDeleteTest = useCallback(async (testId) => {
    try {
      const response = await fetch(`/api/abtest/${testId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Close modal if open
        if (selectedTest && selectedTest.id === testId) {
          setDetailsModalOpen(false);
          setSelectedTest(null);
        }
        
        // Refresh tests
        fetchTests();
      } else {
        console.error('Error deleting test:', data.error);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  }, [fetchTests, selectedTest]);
  
  // Handle tab change
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);
  
  // Fetch tests on mount
  useEffect(() => {
    fetchTests();
  }, [fetchTests]);
  
  // Fetch available rules when create modal opens
  useEffect(() => {
    if (createModalOpen) {
      fetchAvailableRules();
    }
  }, [createModalOpen, fetchAvailableRules]);
  
  // For development/testing, generate mock data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isLoading) {
      // Generate mock data
      setTimeout(() => {
        const mockTests = [
          {
            id: 1,
            name: 'Product Page Message Test',
            description: 'Testing different messages for product page upsells',
            status: 'ACTIVE',
            startDate: '2023-05-01T00:00:00Z',
            endDate: null,
            variantA: {
              id: 1,
              triggerProductId: '123',
              upsellProductId: '456',
              message: 'Would you like to add this matching item?',
              impressions: 156,
              conversions: 23,
              conversionRate: '14.74'
            },
            variantB: {
              id: 2,
              triggerProductId: '123',
              upsellProductId: '456',
              message: 'Customers who bought this also bought:',
              impressions: 148,
              conversions: 31,
              conversionRate: '20.95'
            },
            winningVariant: null
          },
          {
            id: 2,
            name: 'Discount vs No Discount',
            description: 'Testing if offering a discount increases conversion rate',
            status: 'COMPLETED',
            startDate: '2023-04-01T00:00:00Z',
            endDate: '2023-04-30T00:00:00Z',
            variantA: {
              id: 3,
              triggerProductId: '789',
              upsellProductId: '012',
              message: 'Add this item to your cart',
              impressions: 203,
              conversions: 28,
              conversionRate: '13.79'
            },
            variantB: {
              id: 4,
              triggerProductId: '789',
              upsellProductId: '012',
              message: 'Add this item to your cart (20% off)',
              impressions: 197,
              conversions: 45,
              conversionRate: '22.84'
            },
            winningVariant: 4
          }
        ];
        
        const mockRules = [
          { id: 1, triggerProductId: '123', upsellProductId: '456', message: 'Would you like to add this matching item?' },
          { id: 2, triggerProductId: '123', upsellProductId: '456', message: 'Customers who bought this also bought:' },
          { id: 3, triggerProductId: '789', upsellProductId: '012', message: 'Add this item to your cart' },
          { id: 4, triggerProductId: '789', upsellProductId: '012', message: 'Add this item to your cart (20% off)' },
          { id: 5, triggerProductId: '345', upsellProductId: '678', message: 'Complete your purchase with:' }
        ];
        
        setTests(mockTests);
        setAvailableRules(mockRules);
        setIsLoading(false);
      }, 1000);
    }
  }, [isLoading]);
  
  // Prepare rule options for select
  const ruleOptions = availableRules.map(rule => ({
    label: `#${rule.id}: ${rule.triggerProductId} → ${rule.upsellProductId}`,
    value: rule.id.toString()
  }));
  
  // Tabs for test details
  const detailsTabs = [
    {
      id: 'results',
      content: 'Results',
      accessibilityLabel: 'Test results tab',
      panelID: 'results-panel',
    },
    {
      id: 'variants',
      content: 'Variants',
      accessibilityLabel: 'Test variants tab',
      panelID: 'variants-panel',
    }
  ];
  
  // Prepare chart data for test details
  const prepareTestChartData = (test) => {
    if (!test) return null;
    
    return {
      labels: ['Impressions', 'Conversions', 'Conversion Rate (%)'],
      datasets: [
        {
          label: 'Variant A',
          data: [
            test.variantA.impressions,
            test.variantA.conversions,
            parseFloat(test.variantA.conversionRate)
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Variant B',
          data: [
            test.variantB.impressions,
            test.variantB.conversions,
            parseFloat(test.variantB.conversionRate)
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">A/B Testing Dashboard</Text>
          <SkeletonBodyText lines={10} />
        </BlockStack>
      </Card>
    );
  }
  
  // Prepare tests table data
  const testsTableData = tests.map(test => [
    test.id.toString(),
    test.name,
    <Badge status={test.status === 'ACTIVE' ? 'success' : 'info'}>
      {test.status}
    </Badge>,
    `${test.variantA.conversionRate}% vs ${test.variantB.conversionRate}%`,
    test.status === 'ACTIVE' ? (
      <InlineStack gap="200">
        <Button size="slim" onClick={() => handleViewTestDetails(test.id)}>
          View
        </Button>
        <Button size="slim" onClick={() => handleEndTest(test.id)}>
          End
        </Button>
      </InlineStack>
    ) : (
      <InlineStack gap="200">
        <Button size="slim" onClick={() => handleViewTestDetails(test.id)}>
          View
        </Button>
        <Button size="slim" destructive onClick={() => handleDeleteTest(test.id)}>
          Delete
        </Button>
      </InlineStack>
    )
  ]);
  
  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h2" variant="headingLg">A/B Testing Dashboard</Text>
            <Button primary onClick={() => setCreateModalOpen(true)}>
              Create New Test
            </Button>
          </InlineStack>
          
          {tests.length === 0 ? (
            <EmptyState
              heading="No A/B tests yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                Create A/B tests to optimize your upsell rules and improve conversion rates.
              </p>
            </EmptyState>
          ) : (
            <DataTable
              columnContentTypes={[
                'text',
                'text',
                'text',
                'text',
                'text'
              ]}
              headings={[
                'ID',
                'Name',
                'Status',
                'Conversion Rates',
                'Actions'
              ]}
              rows={testsTableData}
            />
          )}
        </BlockStack>
      </Card>
      
      {/* Create Test Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create A/B Test"
        primaryAction={{
          content: 'Create Test',
          onAction: handleCreateTest,
          loading: isSubmitting
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setCreateModalOpen(false)
          }
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {formError && (
              <Banner status="critical">
                <p>{formError}</p>
              </Banner>
            )}
            
            <FormLayout>
              <TextField
                label="Test Name"
                value={formName}
                onChange={setFormName}
                autoComplete="off"
                required
              />
              
              <TextField
                label="Description"
                value={formDescription}
                onChange={setFormDescription}
                multiline={3}
                autoComplete="off"
              />
              
              <Select
                label="Variant A"
                options={ruleOptions}
                value={formVariantA}
                onChange={setFormVariantA}
                required
              />
              
              <Select
                label="Variant B"
                options={ruleOptions}
                value={formVariantB}
                onChange={setFormVariantB}
                required
              />
              
              <Text as="p" variant="bodyMd">
                End Date (Optional)
              </Text>
              <DatePicker
                month={new Date().getMonth()}
                year={new Date().getFullYear()}
                onChange={(date) => setFormEndDate(date.start)}
                selected={formEndDate}
              />
            </FormLayout>
          </BlockStack>
        </Modal.Section>
      </Modal>
      
      {/* Test Details Modal */}
      {selectedTest && (
        <Modal
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={`Test Details: ${selectedTest.name}`}
          primaryAction={{
            content: 'Close',
            onAction: () => setDetailsModalOpen(false)
          }}
          secondaryActions={[
            selectedTest.status === 'ACTIVE' ? {
              content: 'End Test',
              onAction: () => handleEndTest(selectedTest.id)
            } : {
              content: 'Delete',
              destructive: true,
              onAction: () => handleDeleteTest(selectedTest.id)
            }
          ]}
        >
          <Modal.Section>
            <Tabs tabs={detailsTabs} selected={selectedTab} onSelect={handleTabChange}>
              {selectedTab === 0 && (
                <BlockStack gap="400">
                  <InlineStack gap="400">
                    <div style={{ flex: 1 }}>
                      <Text as="h3" variant="headingMd">Status</Text>
                      <Badge status={selectedTest.status === 'ACTIVE' ? 'success' : 'info'}>
                        {selectedTest.status}
                      </Badge>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <Text as="h3" variant="headingMd">Start Date</Text>
                      <Text as="p" variant="bodyMd">
                        {new Date(selectedTest.startDate).toLocaleDateString()}
                      </Text>
                    </div>
                    
                    {selectedTest.endDate && (
                      <div style={{ flex: 1 }}>
                        <Text as="h3" variant="headingMd">End Date</Text>
                        <Text as="p" variant="bodyMd">
                          {new Date(selectedTest.endDate).toLocaleDateString()}
                        </Text>
                      </div>
                    )}
                  </InlineStack>
                  
                  {selectedTest.description && (
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">Description</Text>
                      <Text as="p" variant="bodyMd">{selectedTest.description}</Text>
                    </BlockStack>
                  )}
                  
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">Results</Text>
                    
                    {selectedTest.winningVariant ? (
                      <Banner status="success">
                        <p>
                          <strong>Winner:</strong> Variant {selectedTest.winningVariant === selectedTest.variantA.id ? 'A' : 'B'} with a conversion rate of {selectedTest.winningVariant === selectedTest.variantA.id ? selectedTest.variantA.conversionRate : selectedTest.variantB.conversionRate}%
                        </p>
                      </Banner>
                    ) : (
                      <Banner status="info">
                        <p>
                          This test is still running or doesn't have a clear winner yet.
                        </p>
                      </Banner>
                    )}
                    
                    <div style={{ height: '300px' }}>
                      <Bar
                        data={prepareTestChartData(selectedTest)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Variant Comparison'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  </BlockStack>
                </BlockStack>
              )}
              
              {selectedTab === 1 && (
                <BlockStack gap="400">
                  <Layout>
                    <Layout.Section oneHalf>
                      <Card title="Variant A">
                        <Card.Section>
                          <BlockStack gap="200">
                            <InlineStack gap="200">
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Trigger Product</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantA.triggerProductId}</Text>
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Upsell Product</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantA.upsellProductId}</Text>
                              </div>
                            </InlineStack>
                            
                            <BlockStack gap="200">
                              <Text as="h3" variant="headingMd">Message</Text>
                              <Text as="p" variant="bodyMd">{selectedTest.variantA.message}</Text>
                            </BlockStack>
                            
                            <InlineStack gap="200">
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Impressions</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantA.impressions}</Text>
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Conversions</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantA.conversions}</Text>
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Conversion Rate</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantA.conversionRate}%</Text>
                              </div>
                            </InlineStack>
                          </BlockStack>
                        </Card.Section>
                      </Card>
                    </Layout.Section>
                    
                    <Layout.Section oneHalf>
                      <Card title="Variant B">
                        <Card.Section>
                          <BlockStack gap="200">
                            <InlineStack gap="200">
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Trigger Product</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantB.triggerProductId}</Text>
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Upsell Product</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantB.upsellProductId}</Text>
                              </div>
                            </InlineStack>
                            
                            <BlockStack gap="200">
                              <Text as="h3" variant="headingMd">Message</Text>
                              <Text as="p" variant="bodyMd">{selectedTest.variantB.message}</Text>
                            </BlockStack>
                            
                            <InlineStack gap="200">
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Impressions</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantB.impressions}</Text>
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Conversions</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantB.conversions}</Text>
                              </div>
                              
                              <div style={{ flex: 1 }}>
                                <Text as="h3" variant="headingMd">Conversion Rate</Text>
                                <Text as="p" variant="bodyMd">{selectedTest.variantB.conversionRate}%</Text>
                              </div>
                            </InlineStack>
                          </BlockStack>
                        </Card.Section>
                      </Card>
                    </Layout.Section>
                  </Layout>
                </BlockStack>
              )}
            </Tabs>
          </Modal.Section>
        </Modal>
      )}
    </BlockStack>
  );
}

export default ABTestingDashboard;
