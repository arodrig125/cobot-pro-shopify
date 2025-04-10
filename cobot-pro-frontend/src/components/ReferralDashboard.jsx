import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Layout,
  Text,
  BlockStack,
  InlineStack,
  Button,
  TextField,
  Banner,
  DataTable,
  Icon,
  Toast
} from '@shopify/polaris';
import { ShareIcon, CopyIcon } from '@shopify/polaris-icons';
import { useAuthenticatedFetch } from '../hooks';

/**
 * ReferralDashboard component for managing referrals
 */
function ReferralDashboard() {
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userPlan, setUserPlan] = useState({});
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch referral data
  const fetchReferralData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch('/api/referrals');
      const data = await response.json();
      
      if (data.success) {
        setReferralLink(data.referralLink);
        setReferrals(data.referrals);
        setUserPlan(data.userPlan);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch]);

  // Copy referral link to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [referralLink]);

  // Fetch data on mount
  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  // Prepare table data
  const tableRows = referrals.map(referral => [
    referral.email || 'Not signed up yet',
    referral.status,
    new Date(referral.createdAt).toLocaleDateString(),
    referral.status === 'UPGRADED' ? '$50.00' : '-'
  ]);

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">Referral Program</Text>
          
          {userPlan.planName === 'FREE' ? (
            <Banner status="info">
              <p>Earn +1 active rule for each referral (up to 10 total) and $50 credit when they upgrade!</p>
            </Banner>
          ) : (
            <Banner status="info">
              <p>Earn $50 credit for each referral who upgrades to a paid plan!</p>
            </Banner>
          )}
          
          <Card sectioned>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">Your Referral Link</Text>
              <InlineStack align="space-between">
                <TextField
                  value={referralLink}
                  readOnly
                  autoComplete="off"
                  connectedRight={
                    <Button onClick={copyToClipboard} icon={CopyIcon}>
                      Copy
                    </Button>
                  }
                />
              </InlineStack>
              
              <InlineStack gap="200">
                <Button primary icon={ShareIcon}>Share on Twitter</Button>
                <Button icon={ShareIcon}>Share on Facebook</Button>
                <Button icon={ShareIcon}>Share via Email</Button>
              </InlineStack>
            </BlockStack>
          </Card>
          
          {userPlan.planName === 'FREE' && (
            <Card sectioned>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Your Rule Bonus</Text>
                <Text as="p" variant="bodyMd">
                  You have earned {userPlan.additionalRules} additional rules through referrals.
                </Text>
                <div style={{ background: '#f4f6f8', padding: '16px', borderRadius: '8px' }}>
                  <Text as="p" variant="bodyMd">
                    <strong>Total active rules: {5 + userPlan.additionalRules}/10</strong>
                  </Text>
                  <div style={{ 
                    height: '8px', 
                    background: '#e4e5e7', 
                    borderRadius: '4px',
                    marginTop: '8px'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${((5 + userPlan.additionalRules) / 10) * 100}%`, 
                      background: '#008060',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              </BlockStack>
            </Card>
          )}
          
          <Card sectioned>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">Your Referrals</Text>
              {tableRows.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['User', 'Status', 'Date', 'Credit Earned']}
                  rows={tableRows}
                />
              ) : (
                <Text as="p" variant="bodyMd">
                  You haven't referred anyone yet. Share your link to start earning rewards!
                </Text>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </Card>
      
      {copied && (
        <Toast content="Referral link copied to clipboard" onDismiss={() => setCopied(false)} />
      )}
    </BlockStack>
  );
}

export default ReferralDashboard;
