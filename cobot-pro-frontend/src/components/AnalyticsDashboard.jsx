import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Layout,
  Text,
  BlockStack,
  InlineStack,
  DatePicker,
  Button,
  Select,
  SkeletonBodyText,
  EmptyState,
  DataTable,
  Tabs
} from '@shopify/polaris';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * AnalyticsDashboard component for displaying upsell performance metrics
 */
function AnalyticsDashboard() {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [dateRange, setDateRange] = useState('last30days');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState(0);
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false);
  
  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const response = await fetch(`/api/analytics/performance?startDate=${formattedStartDate}&endDate=${formattedEndDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      } else {
        console.error('Error fetching metrics:', data.error);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);
  
  // Handle date range change
  const handleDateRangeChange = useCallback((value) => {
    setDateRange(value);
    
    const now = new Date();
    let newStartDate;
    
    switch (value) {
      case 'today':
        newStartDate = new Date(now);
        newStartDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 1);
        newStartDate.setHours(0, 0, 0, 0);
        break;
      case 'last7days':
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 30);
        break;
      case 'thisMonth':
        newStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        newStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        now.setDate(lastDayOfLastMonth);
        break;
      case 'custom':
        setCustomDatePickerOpen(true);
        return;
      default:
        newStartDate = new Date(now);
        newStartDate.setDate(now.getDate() - 30);
    }
    
    setStartDate(newStartDate);
    setEndDate(now);
    setCustomDatePickerOpen(false);
  }, []);
  
  // Handle tab change
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);
  
  // Handle date picker change
  const handleDatePickerChange = useCallback(({ start, end }) => {
    setStartDate(start);
    setEndDate(end);
  }, []);
  
  // Apply custom date range
  const applyCustomDateRange = useCallback(() => {
    setCustomDatePickerOpen(false);
    fetchMetrics();
  }, [fetchMetrics]);
  
  // Fetch metrics on mount and when date range changes
  useEffect(() => {
    if (dateRange !== 'custom') {
      fetchMetrics();
    }
  }, [fetchMetrics, dateRange, startDate, endDate]);
  
  // For development/testing, generate mock data
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isLoading) {
      // Generate mock data
      setTimeout(() => {
        const mockDailyData = [];
        const mockStartDate = new Date(startDate);
        const mockEndDate = new Date(endDate);
        
        for (let date = new Date(mockStartDate); date <= mockEndDate; date.setDate(date.getDate() + 1)) {
          mockDailyData.push({
            date: date.toISOString().split('T')[0],
            impressions: Math.floor(Math.random() * 100) + 50,
            conversions: Math.floor(Math.random() * 20) + 5,
            revenue: (Math.random() * 500 + 100).toFixed(2),
            conversionRate: (Math.random() * 15 + 5).toFixed(2)
          });
        }
        
        const mockMetrics = {
          summary: {
            totalImpressions: mockDailyData.reduce((sum, day) => sum + day.impressions, 0),
            totalConversions: mockDailyData.reduce((sum, day) => sum + day.conversions, 0),
            totalRevenue: mockDailyData.reduce((sum, day) => sum + parseFloat(day.revenue), 0).toFixed(2),
            conversionRate: (mockDailyData.reduce((sum, day) => sum + parseFloat(day.conversionRate), 0) / mockDailyData.length).toFixed(2),
            averageOrderValue: (mockDailyData.reduce((sum, day) => sum + parseFloat(day.revenue), 0) / mockDailyData.reduce((sum, day) => sum + day.conversions, 0)).toFixed(2)
          },
          topRules: [
            { id: 1, triggerProductId: '123', upsellProductId: '456', impressions: 245, conversions: 42, revenue: 839.58, conversionRate: 17.14 },
            { id: 2, triggerProductId: '789', upsellProductId: '012', impressions: 189, conversions: 31, revenue: 619.69, conversionRate: 16.40 },
            { id: 3, triggerProductId: '345', upsellProductId: '678', impressions: 156, conversions: 22, revenue: 439.78, conversionRate: 14.10 },
            { id: 4, triggerProductId: '901', upsellProductId: '234', impressions: 132, conversions: 18, revenue: 359.82, conversionRate: 13.64 },
            { id: 5, triggerProductId: '567', upsellProductId: '890', impressions: 98, conversions: 12, revenue: 239.88, conversionRate: 12.24 }
          ],
          dailyData: mockDailyData
        };
        
        setMetrics(mockMetrics);
        setIsLoading(false);
      }, 1000);
    }
  }, [isLoading, startDate, endDate]);
  
  // Date range options
  const dateRangeOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last7days' },
    { label: 'Last 30 days', value: 'last30days' },
    { label: 'This month', value: 'thisMonth' },
    { label: 'Last month', value: 'lastMonth' },
    { label: 'Custom range', value: 'custom' }
  ];
  
  // Tab options
  const tabs = [
    {
      id: 'overview',
      content: 'Overview',
      accessibilityLabel: 'Overview tab',
      panelID: 'overview-panel',
    },
    {
      id: 'revenue',
      content: 'Revenue',
      accessibilityLabel: 'Revenue tab',
      panelID: 'revenue-panel',
    },
    {
      id: 'conversions',
      content: 'Conversions',
      accessibilityLabel: 'Conversions tab',
      panelID: 'conversions-panel',
    },
    {
      id: 'top-rules',
      content: 'Top Rules',
      accessibilityLabel: 'Top Rules tab',
      panelID: 'top-rules-panel',
    },
  ];
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!metrics || !metrics.dailyData) return null;
    
    const dates = metrics.dailyData.map(day => day.date);
    
    const revenueData = {
      labels: dates,
      datasets: [
        {
          label: 'Revenue',
          data: metrics.dailyData.map(day => day.revenue),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }
      ]
    };
    
    const conversionData = {
      labels: dates,
      datasets: [
        {
          label: 'Conversion Rate (%)',
          data: metrics.dailyData.map(day => day.conversionRate),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Conversions',
          data: metrics.dailyData.map(day => day.conversions),
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
    
    const impressionsData = {
      labels: dates,
      datasets: [
        {
          label: 'Impressions',
          data: metrics.dailyData.map(day => day.impressions),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4
        }
      ]
    };
    
    return {
      revenue: revenueData,
      conversion: conversionData,
      impressions: impressionsData
    };
  };
  
  const chartData = prepareChartData();
  
  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">Analytics Dashboard</Text>
          <SkeletonBodyText lines={10} />
        </BlockStack>
      </Card>
    );
  }
  
  // Render empty state
  if (!metrics || !metrics.dailyData || metrics.dailyData.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No analytics data available"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            Start creating upsell rules and collecting data to see analytics here.
          </p>
        </EmptyState>
      </Card>
    );
  }
  
  // Prepare top rules table data
  const topRulesTableData = metrics.topRules.map(rule => [
    `#${rule.id}`,
    rule.triggerProductId,
    rule.upsellProductId,
    rule.impressions,
    rule.conversions,
    `${rule.conversionRate.toFixed(2)}%`,
    `$${rule.revenue.toFixed(2)}`
  ]);
  
  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h2" variant="headingLg">Analytics Dashboard</Text>
            <Select
              label="Date Range"
              labelHidden
              options={dateRangeOptions}
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </InlineStack>
          
          {customDatePickerOpen && (
            <Card>
              <BlockStack gap="400">
                <DatePicker
                  month={startDate.getMonth()}
                  year={startDate.getFullYear()}
                  onChange={handleDatePickerChange}
                  selected={{
                    start: startDate,
                    end: endDate,
                  }}
                  allowRange
                />
                <InlineStack align="end">
                  <Button onClick={applyCustomDateRange} primary>
                    Apply
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          )}
          
          <Layout>
            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="200" align="center">
                  <Text as="h3" variant="headingMd">Total Revenue</Text>
                  <Text as="p" variant="heading2xl">${parseFloat(metrics.summary.totalRevenue).toFixed(2)}</Text>
                </BlockStack>
              </Card>
            </Layout.Section>
            
            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="200" align="center">
                  <Text as="h3" variant="headingMd">Conversion Rate</Text>
                  <Text as="p" variant="heading2xl">{parseFloat(metrics.summary.conversionRate).toFixed(2)}%</Text>
                </BlockStack>
              </Card>
            </Layout.Section>
            
            <Layout.Section oneThird>
              <Card>
                <BlockStack gap="200" align="center">
                  <Text as="h3" variant="headingMd">Average Order Value</Text>
                  <Text as="p" variant="heading2xl">${parseFloat(metrics.summary.averageOrderValue).toFixed(2)}</Text>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Card>
      
      <Card>
        <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
          {selectedTab === 0 && (
            <Card.Section>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Overview</Text>
                <div style={{ height: '300px' }}>
                  <Line
                    data={chartData.revenue}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Revenue Over Time'
                        }
                      }
                    }}
                  />
                </div>
                
                <InlineStack gap="400">
                  <div style={{ flex: 1 }}>
                    <Text as="h3" variant="headingMd">Impressions</Text>
                    <Text as="p" variant="headingXl">{metrics.summary.totalImpressions}</Text>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Text as="h3" variant="headingMd">Conversions</Text>
                    <Text as="p" variant="headingXl">{metrics.summary.totalConversions}</Text>
                  </div>
                </InlineStack>
              </BlockStack>
            </Card.Section>
          )}
          
          {selectedTab === 1 && (
            <Card.Section>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Revenue</Text>
                <div style={{ height: '300px' }}>
                  <Bar
                    data={chartData.revenue}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Daily Revenue'
                        }
                      }
                    }}
                  />
                </div>
                
                <InlineStack gap="400">
                  <div style={{ flex: 1 }}>
                    <Text as="h3" variant="headingMd">Total Revenue</Text>
                    <Text as="p" variant="headingXl">${parseFloat(metrics.summary.totalRevenue).toFixed(2)}</Text>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Text as="h3" variant="headingMd">Average Daily Revenue</Text>
                    <Text as="p" variant="headingXl">
                      ${(parseFloat(metrics.summary.totalRevenue) / metrics.dailyData.length).toFixed(2)}
                    </Text>
                  </div>
                </InlineStack>
              </BlockStack>
            </Card.Section>
          )}
          
          {selectedTab === 2 && (
            <Card.Section>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Conversions</Text>
                <div style={{ height: '300px' }}>
                  <Line
                    data={chartData.conversion}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: true,
                          text: 'Conversion Rate & Conversions'
                        }
                      },
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: {
                            display: true,
                            text: 'Conversion Rate (%)'
                          }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                            display: true,
                            text: 'Conversions'
                          },
                          grid: {
                            drawOnChartArea: false
                          }
                        }
                      }
                    }}
                  />
                </div>
                
                <InlineStack gap="400">
                  <div style={{ flex: 1 }}>
                    <Text as="h3" variant="headingMd">Total Conversions</Text>
                    <Text as="p" variant="headingXl">{metrics.summary.totalConversions}</Text>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Text as="h3" variant="headingMd">Conversion Rate</Text>
                    <Text as="p" variant="headingXl">{parseFloat(metrics.summary.conversionRate).toFixed(2)}%</Text>
                  </div>
                </InlineStack>
              </BlockStack>
            </Card.Section>
          )}
          
          {selectedTab === 3 && (
            <Card.Section>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Top Performing Rules</Text>
                <DataTable
                  columnContentTypes={[
                    'text',
                    'text',
                    'text',
                    'numeric',
                    'numeric',
                    'numeric',
                    'numeric'
                  ]}
                  headings={[
                    'Rule ID',
                    'Trigger Product',
                    'Upsell Product',
                    'Impressions',
                    'Conversions',
                    'Conv. Rate',
                    'Revenue'
                  ]}
                  rows={topRulesTableData}
                />
              </BlockStack>
            </Card.Section>
          )}
        </Tabs>
      </Card>
    </BlockStack>
  );
}

export default AnalyticsDashboard;
