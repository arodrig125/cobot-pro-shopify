# Cobot Pro - Shopify Upsell App

Cobot Pro is a Shopify app that helps merchants increase their average order value by automatically suggesting relevant upsell products to customers during the checkout process.

## Features

- **Easy Rule Creation**: Create upsell rules by specifying trigger products and upsell products
- **Custom Messages**: Add personalized messages for each upsell offer
- **Simple Management**: View, edit, and delete your upsell rules from a clean dashboard
- **Seamless Integration**: Works with your existing Shopify store with minimal setup

## Getting Started

### Prerequisites

1. A Shopify Partner account
2. A development store or a production store for testing
3. Node.js and npm installed on your development machine

### Installation

1. Clone this repository:

```bash
git clone https://github.com/yourusername/cobot-pro.git
cd cobot-pro
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=read_products,write_products
HOST=your_app_url
DATABASE_URL=your_database_url
```

4. Run the development server:

```bash
npm run dev
```

## Usage

### Creating Upsell Rules

1. Navigate to the Cobot Pro app in your Shopify admin
2. Enter the product ID of the trigger product (the product that will trigger the upsell)
3. Enter the product ID of the upsell product (the product you want to offer as an upsell)
4. Add a custom message to display with the upsell offer
5. Click "Save Rule"

### Managing Upsell Rules

- View all your upsell rules in the dashboard
- Delete rules by clicking the delete icon next to the rule

## Database Schema

The app uses a database to store upsell rules with the following schema:

```prisma
model Upsell {
  id              Int      @id @default(autoincrement())
  triggerProductId String
  upsellProductId  String
  message          String   @default("")
  createdAt        DateTime @default(now())
}
```

## API Endpoints

- `POST /api/upsell`: Get upsell recommendation for a product
- `POST /api/upsell/save`: Create a new upsell rule
- `GET /api/upsell/rules`: Get all upsell rules
- `DELETE /api/upsell/rule/:id`: Delete an upsell rule

## Future Enhancements

- Product selector UI instead of requiring product IDs
- Discount options for upsell products
- Analytics to track conversion rates
- A/B testing for different upsell messages
- Bulk import/export of upsell rules

## License

This project is licensed under the MIT License.
