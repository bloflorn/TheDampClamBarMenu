const fs = require('fs');
const path = require('path');

const ETSY_API_KEY = process.env.ETSY_API_KEY;
const ETSY_SHOP_ID = process.env.ETSY_SHOP_ID;
const MERCH_FILE = path.join(__dirname, '../data/merch.json');

async function syncMerch() {
  if (!ETSY_API_KEY || !ETSY_SHOP_ID) {
    console.error('Missing ETSY_API_KEY or ETSY_SHOP_ID secret.');
    process.exit(1);
  }

  const url = `https://openapi.etsy.com/v3/application/shops/${ETSY_SHOP_ID}/listings/active?includes=Images`;
  
  const res = await fetch(url, {
    headers: { 'x-api-key': ETSY_API_KEY }
  });

  if (!res.ok) {
    console.error(`Etsy API Error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  
  const items = data.results.map(listing => {
    const priceAmount = (listing.price.amount / listing.price.divisor).toFixed(2);
    const primaryImg = listing.images && listing.images.length > 0 ? listing.images[0].url_570xN : '';

    return {
      name: listing.title,
      category: "Merchandise",
      desc: listing.description.split('\n')[0], // Uses the first line as a concise description
      price: `$${priceAmount}`,
      etsyUrl: listing.url,
      imageUrl: primaryImg,
      inStock: listing.state === 'active' && listing.quantity > 0
    };
  });

  const payload = { items };
  fs.writeFileSync(MERCH_FILE, JSON.stringify(payload, null, 2));
  console.log(`Successfully synced ${items.length} Etsy listings to merch.json.`);
}

syncMerch();
