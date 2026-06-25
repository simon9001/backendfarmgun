/**
 * Seed script for crop_prices table.
 * Run with:  npx tsx src/db/seed-crop-prices.ts
 */

import { supabase } from './supabaseClient.js';

// ─── Dates ───────────────────────────────────────────────────────────────────
const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const d0 = fmt(today);                                        // today
const d1 = fmt(new Date(today.getTime() - 1 * 86_400_000)); // yesterday
const d2 = fmt(new Date(today.getTime() - 2 * 86_400_000)); // 2 days ago
const d3 = fmt(new Date(today.getTime() - 3 * 86_400_000)); // 3 days ago

// ─── Commentary / Outlook per date ──────────────────────────────────────────
const COMMENTARY: Record<string, string> = {
  [d0]: `Tomato and onion prices remain elevated this week following reduced supply from Rift Valley and Central Kenya due to dry weather. Maize is steady — large-scale farmers are holding stock anticipating improved prices. Sukuma wiki (kale) is abundant and prices have softened slightly. Potato prices at Wakulima and Gikomba are firm; transport disruptions from Meru and Kinangop are adding cost pressure. Avocado prices are strong ahead of export season, benefitting smallholder farmers in Muranga and Kisii.`,
  [d1]: `Yesterday's prices reflected continued tight supply of tomatoes and cabbages. Rain forecast for the Mt. Kenya region is expected to ease leafy vegetable supply constraints by end of week. Bean prices have climbed modestly as demand from Nairobi urban households remains high. Maize continues to trade within a narrow band at most markets, with NCPB strategic reserve seen as a price ceiling.`,
  [d2]: `Markets were moderately active two days ago. Carrot prices strengthened at Nyahururu — the main producing area — as rainfall interrupted harvesting. Ginger and garlic remain imported commodity staples with tight local supply. Sweet potato prices were stable in western Kenya but slightly higher in Nairobi due to transport cost. Overall market sentiment was cautious ahead of upcoming long rains assessment reports.`,
  [d3]: `Three days ago, prices were relatively stable across most commodities. Spinach and peas were in good supply from small farms around Limuru and Tigoni. Bananas (plantain) saw a slight price rise at Mombasa market on logistics constraints. Onion arrivals at Wakulima were below average, supporting firm pricing. The week opened with buyers cautious and traders holding inventory.`,
};

const OUTLOOK: Record<string, string> = {
  [d0]: `Expect tomato prices to ease slightly next week if forecast rains materialise in Rift Valley growing zones. Kale and other leafy greens are likely to remain affordable. Watch maize closely — any government import announcement could push prices down sharply. Avocado farmgate prices are expected to hold or rise as export orders increase. Potato prices may soften mid-next week as Kinangop and Meru supply picks up.`,
  [d1]: `Bean prices expected to edge higher next week given constrained supply from western Kenya. Onion prices should moderate once the Meru and Isiolo supply chain normalises after road repairs. Tomato trajectory depends on rainfall in Rift Valley — stay tuned. Sukuma wiki will likely stay affordable with good supply from peri-urban farms. Maize to remain stable unless strategic reserve interventions occur.`,
  [d2]: `Carrot prices at Nyahururu likely to remain firm for another 3–5 days until wet fields dry. Expect avocado arrivals to increase next week, possibly easing prices at retail level. Sweet potato prices in Nairobi should ease once fuel prices stabilise. No major disruptions anticipated for maize, beans, or onions in the short term.`,
  [d3]: `No major shocks expected early in the week. Monitor banana supply from Mt. Elgon and Coast regions. Spinach and peas to remain well-supplied. Onion prices will be the key commodity to watch — supply recovery from Meru could push prices lower by midweek. Overall market looks stable heading into the rest of the week.`,
};

// ─── Crop Data per Date ──────────────────────────────────────────────────────
// commentary + outlook only on the FIRST entry of each date (frontend reads prices[0])
const buildRows = (
  date: string,
  crops: Array<{
    crop_name: string;
    price_per_unit: number;
    unit: string;
    market: string;
    price_change: number | null;
  }>
) =>
  crops.map((c, i) => ({
    ...c,
    price_date: date,
    commentary: i === 0 ? (COMMENTARY[date] ?? null) : null,
    outlook:    i === 0 ? (OUTLOOK[date]    ?? null) : null,
  }));

// ─────────────────────────────────────────────────────────────────────────────
//  TODAY  (d0)
// ─────────────────────────────────────────────────────────────────────────────
const todayRows = buildRows(d0, [
  { crop_name: 'Avocado (Hass)',   price_per_unit: 18,   unit: 'piece',  market: 'Wakulima Market, Nairobi', price_change:  4.5  },
  { crop_name: 'Bananas (Matoke)', price_per_unit: 550,  unit: 'bunch',  market: 'Mombasa Municipal Market', price_change: -2.0  },
  { crop_name: 'Beans (Dry)',      price_per_unit: 145,  unit: 'kg',     market: 'Gikomba Market, Nairobi',  price_change:  3.2  },
  { crop_name: 'Cabbages',        price_per_unit: 38,   unit: 'head',   market: 'Wakulima Market, Nairobi', price_change: -1.5  },
  { crop_name: 'Carrots',         price_per_unit: 65,   unit: 'kg',     market: 'Nyahururu Market',          price_change:  7.8  },
  { crop_name: 'Garlic',          price_per_unit: 680,  unit: 'kg',     market: 'Gikomba Market, Nairobi',  price_change:  1.2  },
  { crop_name: 'Ginger',          price_per_unit: 520,  unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  0.0  },
  { crop_name: 'Green Maize',     price_per_unit: 22,   unit: 'cob',    market: 'Eldoret Town Market',       price_change: -0.5  },
  { crop_name: 'Kale (Sukuma)',   price_per_unit: 12,   unit: 'bunch',  market: 'Wakulima Market, Nairobi', price_change: -3.5  },
  { crop_name: 'Maize (Dry)',     price_per_unit: 52,   unit: 'kg',     market: 'Eldoret Town Market',       price_change:  0.0  },
  { crop_name: 'Onions',          price_per_unit: 85,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  6.3  },
  { crop_name: 'Peas (Green)',    price_per_unit: 110,  unit: 'kg',     market: 'Limuru Market',             price_change: -2.8  },
  { crop_name: 'Potatoes',        price_per_unit: 58,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  4.0  },
  { crop_name: 'Spinach',         price_per_unit: 15,   unit: 'bunch',  market: 'Kisumu Market',             price_change: -1.0  },
  { crop_name: 'Sweet Potatoes',  price_per_unit: 44,   unit: 'kg',     market: 'Meru Town Market',          price_change:  1.8  },
  { crop_name: 'Tomatoes',        price_per_unit: 95,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  9.2  },
]);

// ─────────────────────────────────────────────────────────────────────────────
//  YESTERDAY  (d1)
// ─────────────────────────────────────────────────────────────────────────────
const yesterdayRows = buildRows(d1, [
  { crop_name: 'Avocado (Hass)',   price_per_unit: 17,   unit: 'piece',  market: 'Wakulima Market, Nairobi', price_change:  2.5  },
  { crop_name: 'Bananas (Matoke)', price_per_unit: 561,  unit: 'bunch',  market: 'Mombasa Municipal Market', price_change:  1.0  },
  { crop_name: 'Beans (Dry)',      price_per_unit: 140,  unit: 'kg',     market: 'Gikomba Market, Nairobi',  price_change:  2.0  },
  { crop_name: 'Cabbages',        price_per_unit: 40,   unit: 'head',   market: 'Wakulima Market, Nairobi', price_change: -0.5  },
  { crop_name: 'Carrots',         price_per_unit: 60,   unit: 'kg',     market: 'Nyahururu Market',          price_change:  5.0  },
  { crop_name: 'Garlic',          price_per_unit: 672,  unit: 'kg',     market: 'Gikomba Market, Nairobi',  price_change:  0.8  },
  { crop_name: 'Ginger',          price_per_unit: 520,  unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change: -0.5  },
  { crop_name: 'Green Maize',     price_per_unit: 22,   unit: 'cob',    market: 'Eldoret Town Market',       price_change:  0.0  },
  { crop_name: 'Kale (Sukuma)',   price_per_unit: 13,   unit: 'bunch',  market: 'Wakulima Market, Nairobi', price_change: -1.0  },
  { crop_name: 'Maize (Dry)',     price_per_unit: 52,   unit: 'kg',     market: 'Eldoret Town Market',       price_change:  0.5  },
  { crop_name: 'Onions',          price_per_unit: 80,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  4.0  },
  { crop_name: 'Peas (Green)',    price_per_unit: 113,  unit: 'kg',     market: 'Limuru Market',             price_change: -1.5  },
  { crop_name: 'Potatoes',        price_per_unit: 56,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  3.0  },
  { crop_name: 'Spinach',         price_per_unit: 15,   unit: 'bunch',  market: 'Kisumu Market',             price_change:  0.0  },
  { crop_name: 'Sweet Potatoes',  price_per_unit: 43,   unit: 'kg',     market: 'Meru Town Market',          price_change:  1.2  },
  { crop_name: 'Tomatoes',        price_per_unit: 87,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  6.5  },
]);

// ─────────────────────────────────────────────────────────────────────────────
//  2 DAYS AGO  (d2)
// ─────────────────────────────────────────────────────────────────────────────
const d2Rows = buildRows(d2, [
  { crop_name: 'Avocado (Hass)',   price_per_unit: 17,   unit: 'piece',  market: 'Wakulima Market, Nairobi', price_change:  1.5  },
  { crop_name: 'Bananas (Matoke)', price_per_unit: 555,  unit: 'bunch',  market: 'Mombasa Municipal Market', price_change:  3.2  },
  { crop_name: 'Beans (Dry)',      price_per_unit: 137,  unit: 'kg',     market: 'Gikomba Market, Nairobi',  price_change:  1.5  },
  { crop_name: 'Cabbages',        price_per_unit: 40,   unit: 'head',   market: 'Wakulima Market, Nairobi', price_change: -2.0  },
  { crop_name: 'Carrots',         price_per_unit: 57,   unit: 'kg',     market: 'Nyahururu Market',          price_change:  8.5  },
  { crop_name: 'Garlic',          price_per_unit: 667,  unit: 'kg',     market: 'Gikomba Market, Nairobi',  price_change:  0.5  },
  { crop_name: 'Ginger',          price_per_unit: 523,  unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  0.0  },
  { crop_name: 'Green Maize',     price_per_unit: 22,   unit: 'cob',    market: 'Eldoret Town Market',       price_change: -1.0  },
  { crop_name: 'Kale (Sukuma)',   price_per_unit: 13,   unit: 'bunch',  market: 'Wakulima Market, Nairobi', price_change: -2.0  },
  { crop_name: 'Maize (Dry)',     price_per_unit: 51,   unit: 'kg',     market: 'Eldoret Town Market',       price_change:  0.0  },
  { crop_name: 'Onions',          price_per_unit: 77,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  3.5  },
  { crop_name: 'Peas (Green)',    price_per_unit: 115,  unit: 'kg',     market: 'Limuru Market',             price_change: -0.5  },
  { crop_name: 'Potatoes',        price_per_unit: 54,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  2.5  },
  { crop_name: 'Spinach',         price_per_unit: 15,   unit: 'bunch',  market: 'Kisumu Market',             price_change:  1.0  },
  { crop_name: 'Sweet Potatoes',  price_per_unit: 43,   unit: 'kg',     market: 'Meru Town Market',          price_change:  0.5  },
  { crop_name: 'Tomatoes',        price_per_unit: 82,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  4.0  },
]);

// ─────────────────────────────────────────────────────────────────────────────
//  3 DAYS AGO  (d3)
// ─────────────────────────────────────────────────────────────────────────────
const d3Rows = buildRows(d3, [
  { crop_name: 'Avocado (Hass)',   price_per_unit: 17,   unit: 'piece',  market: 'Wakulima Market, Nairobi', price_change:  0.0  },
  { crop_name: 'Bananas (Matoke)', price_per_unit: 538,  unit: 'bunch',  market: 'Mombasa Municipal Market', price_change:  4.5  },
  { crop_name: 'Beans (Dry)',      price_per_unit: 135,  unit: 'kg',     market: 'Gikomba Market, Nairobi',  price_change:  0.5  },
  { crop_name: 'Cabbages',        price_per_unit: 41,   unit: 'head',   market: 'Wakulima Market, Nairobi', price_change:  1.0  },
  { crop_name: 'Carrots',         price_per_unit: 53,   unit: 'kg',     market: 'Nyahururu Market',          price_change:  2.0  },
  { crop_name: 'Garlic',          price_per_unit: 664,  unit: 'kg',     market: 'Gikomba Market, Nairobi',  price_change: -0.5  },
  { crop_name: 'Ginger',          price_per_unit: 523,  unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  0.0  },
  { crop_name: 'Green Maize',     price_per_unit: 22,   unit: 'cob',    market: 'Eldoret Town Market',       price_change:  0.0  },
  { crop_name: 'Kale (Sukuma)',   price_per_unit: 14,   unit: 'bunch',  market: 'Wakulima Market, Nairobi', price_change: -1.5  },
  { crop_name: 'Maize (Dry)',     price_per_unit: 51,   unit: 'kg',     market: 'Eldoret Town Market',       price_change:  0.5  },
  { crop_name: 'Onions',          price_per_unit: 74,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  1.5  },
  { crop_name: 'Peas (Green)',    price_per_unit: 116,  unit: 'kg',     market: 'Limuru Market',             price_change:  0.5  },
  { crop_name: 'Potatoes',        price_per_unit: 53,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  1.0  },
  { crop_name: 'Spinach',         price_per_unit: 15,   unit: 'bunch',  market: 'Kisumu Market',             price_change:  0.0  },
  { crop_name: 'Sweet Potatoes',  price_per_unit: 43,   unit: 'kg',     market: 'Meru Town Market',          price_change: -0.5  },
  { crop_name: 'Tomatoes',        price_per_unit: 79,   unit: 'kg',     market: 'Wakulima Market, Nairobi', price_change:  1.5  },
]);

// ─── Insert ──────────────────────────────────────────────────────────────────
async function seed() {
  const allRows = [...todayRows, ...yesterdayRows, ...d2Rows, ...d3Rows];

  console.log(`\n🌱 Seeding ${allRows.length} crop price rows across 4 dates...`);
  console.log(`   Dates: ${d3} → ${d2} → ${d1} → ${d0}\n`);

  // Wipe existing seed data for these dates so re-runs are idempotent
  const { error: delErr } = await supabase
    .from('crop_prices')
    .delete()
    .in('price_date', [d0, d1, d2, d3]);

  if (delErr) {
    console.error('❌ Failed to clear existing rows:', delErr.message);
    process.exit(1);
  }
  console.log('🗑️  Cleared any existing rows for these dates.');

  const { data, error } = await supabase
    .from('crop_prices')
    .insert(allRows)
    .select('id, crop_name, price_date');

  if (error) {
    console.error('❌ Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${data?.length} rows successfully.\n`);

  // Summary
  const byDate: Record<string, number> = {};
  data?.forEach(r => { byDate[r.price_date] = (byDate[r.price_date] || 0) + 1; });
  Object.entries(byDate).sort().forEach(([date, count]) =>
    console.log(`   ${date}  →  ${count} crops`)
  );

  console.log('\n🎉 Seed complete! Visit the homepage to see the prices section.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
