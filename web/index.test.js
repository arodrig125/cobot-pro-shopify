const express = require('express');
const request = require('supertest');
const shopify = require('../shopify');

describe('Billing API', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/api/billing/subscribe', require('../index').billingSubscribeHandler);
  });

});
