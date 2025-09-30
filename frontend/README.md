# Chair Configuration Tester

A simple Next.js app to test chair configuration and pricing data from Supabase.

## Setup

1. Make sure your local Supabase instance is running:
   ```bash
   cd ../backend
   supabase start
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Product Selection**: Choose from available chair products
- **Variant Picker**: Select size/variant with pricing
- **Add-ons**: Toggle add-ons and see price changes
- **Colors**: View available color options
- **Materials**: See material details and sustainability info
- **Dimensions**: View dimensions for each variant
- **Live Price Calculator**: Total price updates as you configure

## Data Validation

Use this app to:
- Verify all products load correctly
- Check that variants have correct pricing
- Ensure add-ons are properly categorized
- Validate color and material data
- Confirm dimensions display correctly
- Test price calculations
