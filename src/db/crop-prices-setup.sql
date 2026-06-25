-- ============================================================
--  Farm with Irene  —  Crop Prices: Table + Seed Data
--  Run this in Supabase SQL Editor (once)
-- ============================================================

-- 1. CREATE TABLE
CREATE TABLE IF NOT EXISTS crop_prices (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name      TEXT         NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  unit           TEXT         NOT NULL DEFAULT 'kg',
  market         TEXT         NOT NULL,
  price_date     DATE         NOT NULL DEFAULT CURRENT_DATE,
  price_change   DECIMAL(5,2),          -- % change from previous day
  commentary     TEXT,                  -- admin market analysis (shown publicly)
  outlook        TEXT,                  -- what to expect next (shown publicly)
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. INDEX for fast date-based queries
CREATE INDEX IF NOT EXISTS idx_crop_prices_date ON crop_prices (price_date DESC);

-- 3. GRANTS  (PostgREST needs these even for service-role connections)
GRANT ALL ON TABLE crop_prices TO service_role;
GRANT SELECT ON TABLE crop_prices TO anon;
GRANT SELECT ON TABLE crop_prices TO authenticated;

-- ============================================================
--  SEED DATA  (4 days: today, yesterday, 2 & 3 days ago)
--  Commentary and outlook are set on the first crop (Avocado)
--  for each date — the frontend reads prices[0].commentary
-- ============================================================

-- Truncate existing seed rows so this is idempotent
DELETE FROM crop_prices
WHERE price_date >= CURRENT_DATE - INTERVAL '4 days';

-- ─── TODAY ────────────────────────────────────────────────────────────────
INSERT INTO crop_prices (crop_name, price_per_unit, unit, market, price_date, price_change, commentary, outlook) VALUES
('Avocado (Hass)',   18,   'piece',  'Wakulima Market, Nairobi',  CURRENT_DATE,  4.5,
 'Tomato and onion prices remain elevated this week following reduced supply from Rift Valley and Central Kenya due to dry weather. Maize is steady — large-scale farmers are holding stock anticipating improved prices. Sukuma wiki (kale) is abundant and prices have softened slightly. Potato prices at Wakulima and Gikomba are firm; transport disruptions from Meru and Kinangop are adding cost pressure. Avocado prices are strong ahead of export season, benefitting smallholder farmers in Muranga and Kisii.',
 'Expect tomato prices to ease slightly next week if forecast rains materialise in Rift Valley growing zones. Kale and other leafy greens are likely to remain affordable. Watch maize closely — any government import announcement could push prices down sharply. Avocado farmgate prices are expected to hold or rise as export orders increase. Potato prices may soften mid-next week as Kinangop and Meru supply picks up.'),
('Bananas (Matoke)', 550,  'bunch',  'Mombasa Municipal Market',  CURRENT_DATE, -2.0, NULL, NULL),
('Beans (Dry)',      145,  'kg',     'Gikomba Market, Nairobi',   CURRENT_DATE,  3.2, NULL, NULL),
('Cabbages',         38,   'head',   'Wakulima Market, Nairobi',  CURRENT_DATE, -1.5, NULL, NULL),
('Carrots',          65,   'kg',     'Nyahururu Market',           CURRENT_DATE,  7.8, NULL, NULL),
('Garlic',           680,  'kg',     'Gikomba Market, Nairobi',   CURRENT_DATE,  1.2, NULL, NULL),
('Ginger',           520,  'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE,  0.0, NULL, NULL),
('Green Maize',      22,   'cob',    'Eldoret Town Market',        CURRENT_DATE, -0.5, NULL, NULL),
('Kale (Sukuma)',    12,   'bunch',  'Wakulima Market, Nairobi',  CURRENT_DATE, -3.5, NULL, NULL),
('Maize (Dry)',      52,   'kg',     'Eldoret Town Market',        CURRENT_DATE,  0.0, NULL, NULL),
('Onions',           85,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE,  6.3, NULL, NULL),
('Peas (Green)',     110,  'kg',     'Limuru Market',              CURRENT_DATE, -2.8, NULL, NULL),
('Potatoes',         58,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE,  4.0, NULL, NULL),
('Spinach',          15,   'bunch',  'Kisumu Market',              CURRENT_DATE, -1.0, NULL, NULL),
('Sweet Potatoes',   44,   'kg',     'Meru Town Market',           CURRENT_DATE,  1.8, NULL, NULL),
('Tomatoes',         95,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE,  9.2, NULL, NULL);

-- ─── YESTERDAY ────────────────────────────────────────────────────────────
INSERT INTO crop_prices (crop_name, price_per_unit, unit, market, price_date, price_change, commentary, outlook) VALUES
('Avocado (Hass)',   17,   'piece',  'Wakulima Market, Nairobi',  CURRENT_DATE - 1,  2.5,
 'Yesterday''s prices reflected continued tight supply of tomatoes and cabbages. Rain forecast for the Mt. Kenya region is expected to ease leafy vegetable supply constraints by end of week. Bean prices have climbed modestly as demand from Nairobi urban households remains high. Maize continues to trade within a narrow band at most markets, with NCPB strategic reserve seen as a price ceiling.',
 'Bean prices expected to edge higher next week given constrained supply from western Kenya. Onion prices should moderate once the Meru and Isiolo supply chain normalises after road repairs. Tomato trajectory depends on rainfall in Rift Valley — stay tuned. Sukuma wiki will likely stay affordable with good supply from peri-urban farms. Maize to remain stable unless strategic reserve interventions occur.'),
('Bananas (Matoke)', 561,  'bunch',  'Mombasa Municipal Market',  CURRENT_DATE - 1,  1.0, NULL, NULL),
('Beans (Dry)',      140,  'kg',     'Gikomba Market, Nairobi',   CURRENT_DATE - 1,  2.0, NULL, NULL),
('Cabbages',         40,   'head',   'Wakulima Market, Nairobi',  CURRENT_DATE - 1, -0.5, NULL, NULL),
('Carrots',          60,   'kg',     'Nyahururu Market',           CURRENT_DATE - 1,  5.0, NULL, NULL),
('Garlic',           672,  'kg',     'Gikomba Market, Nairobi',   CURRENT_DATE - 1,  0.8, NULL, NULL),
('Ginger',           520,  'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 1, -0.5, NULL, NULL),
('Green Maize',      22,   'cob',    'Eldoret Town Market',        CURRENT_DATE - 1,  0.0, NULL, NULL),
('Kale (Sukuma)',    13,   'bunch',  'Wakulima Market, Nairobi',  CURRENT_DATE - 1, -1.0, NULL, NULL),
('Maize (Dry)',      52,   'kg',     'Eldoret Town Market',        CURRENT_DATE - 1,  0.5, NULL, NULL),
('Onions',           80,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 1,  4.0, NULL, NULL),
('Peas (Green)',     113,  'kg',     'Limuru Market',              CURRENT_DATE - 1, -1.5, NULL, NULL),
('Potatoes',         56,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 1,  3.0, NULL, NULL),
('Spinach',          15,   'bunch',  'Kisumu Market',              CURRENT_DATE - 1,  0.0, NULL, NULL),
('Sweet Potatoes',   43,   'kg',     'Meru Town Market',           CURRENT_DATE - 1,  1.2, NULL, NULL),
('Tomatoes',         87,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 1,  6.5, NULL, NULL);

-- ─── 2 DAYS AGO ───────────────────────────────────────────────────────────
INSERT INTO crop_prices (crop_name, price_per_unit, unit, market, price_date, price_change, commentary, outlook) VALUES
('Avocado (Hass)',   17,   'piece',  'Wakulima Market, Nairobi',  CURRENT_DATE - 2,  1.5,
 'Markets were moderately active. Carrot prices strengthened at Nyahururu — the main producing area — as rainfall interrupted harvesting. Ginger and garlic remain imported commodity staples with tight local supply. Sweet potato prices were stable in western Kenya but slightly higher in Nairobi due to transport cost. Overall market sentiment was cautious ahead of upcoming long rains assessment reports.',
 'Carrot prices at Nyahururu likely to remain firm for another 3–5 days until wet fields dry. Expect avocado arrivals to increase next week, possibly easing prices at retail level. Sweet potato prices in Nairobi should ease once fuel prices stabilise. No major disruptions anticipated for maize, beans, or onions in the short term.'),
('Bananas (Matoke)', 555,  'bunch',  'Mombasa Municipal Market',  CURRENT_DATE - 2,  3.2, NULL, NULL),
('Beans (Dry)',      137,  'kg',     'Gikomba Market, Nairobi',   CURRENT_DATE - 2,  1.5, NULL, NULL),
('Cabbages',         40,   'head',   'Wakulima Market, Nairobi',  CURRENT_DATE - 2, -2.0, NULL, NULL),
('Carrots',          57,   'kg',     'Nyahururu Market',           CURRENT_DATE - 2,  8.5, NULL, NULL),
('Garlic',           667,  'kg',     'Gikomba Market, Nairobi',   CURRENT_DATE - 2,  0.5, NULL, NULL),
('Ginger',           523,  'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 2,  0.0, NULL, NULL),
('Green Maize',      22,   'cob',    'Eldoret Town Market',        CURRENT_DATE - 2, -1.0, NULL, NULL),
('Kale (Sukuma)',    13,   'bunch',  'Wakulima Market, Nairobi',  CURRENT_DATE - 2, -2.0, NULL, NULL),
('Maize (Dry)',      51,   'kg',     'Eldoret Town Market',        CURRENT_DATE - 2,  0.0, NULL, NULL),
('Onions',           77,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 2,  3.5, NULL, NULL),
('Peas (Green)',     115,  'kg',     'Limuru Market',              CURRENT_DATE - 2, -0.5, NULL, NULL),
('Potatoes',         54,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 2,  2.5, NULL, NULL),
('Spinach',          15,   'bunch',  'Kisumu Market',              CURRENT_DATE - 2,  1.0, NULL, NULL),
('Sweet Potatoes',   43,   'kg',     'Meru Town Market',           CURRENT_DATE - 2,  0.5, NULL, NULL),
('Tomatoes',         82,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 2,  4.0, NULL, NULL);

-- ─── 3 DAYS AGO ───────────────────────────────────────────────────────────
INSERT INTO crop_prices (crop_name, price_per_unit, unit, market, price_date, price_change, commentary, outlook) VALUES
('Avocado (Hass)',   17,   'piece',  'Wakulima Market, Nairobi',  CURRENT_DATE - 3,  0.0,
 'Markets were stable to open the week. Spinach and peas were in good supply from small farms around Limuru and Tigoni. Bananas (plantain) saw a slight price rise at Mombasa market on logistics constraints. Onion arrivals at Wakulima were below average, supporting firm pricing. The week opened with buyers cautious and traders holding inventory.',
 'No major shocks expected early in the week. Monitor banana supply from Mt. Elgon and Coast regions. Spinach and peas to remain well-supplied. Onion prices will be the key commodity to watch — supply recovery from Meru could push prices lower by midweek. Overall market looks stable heading into the rest of the week.'),
('Bananas (Matoke)', 538,  'bunch',  'Mombasa Municipal Market',  CURRENT_DATE - 3,  4.5, NULL, NULL),
('Beans (Dry)',      135,  'kg',     'Gikomba Market, Nairobi',   CURRENT_DATE - 3,  0.5, NULL, NULL),
('Cabbages',         41,   'head',   'Wakulima Market, Nairobi',  CURRENT_DATE - 3,  1.0, NULL, NULL),
('Carrots',          53,   'kg',     'Nyahururu Market',           CURRENT_DATE - 3,  2.0, NULL, NULL),
('Garlic',           664,  'kg',     'Gikomba Market, Nairobi',   CURRENT_DATE - 3, -0.5, NULL, NULL),
('Ginger',           523,  'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 3,  0.0, NULL, NULL),
('Green Maize',      22,   'cob',    'Eldoret Town Market',        CURRENT_DATE - 3,  0.0, NULL, NULL),
('Kale (Sukuma)',    14,   'bunch',  'Wakulima Market, Nairobi',  CURRENT_DATE - 3, -1.5, NULL, NULL),
('Maize (Dry)',      51,   'kg',     'Eldoret Town Market',        CURRENT_DATE - 3,  0.5, NULL, NULL),
('Onions',           74,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 3,  1.5, NULL, NULL),
('Peas (Green)',     116,  'kg',     'Limuru Market',              CURRENT_DATE - 3,  0.5, NULL, NULL),
('Potatoes',         53,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 3,  1.0, NULL, NULL),
('Spinach',          15,   'bunch',  'Kisumu Market',              CURRENT_DATE - 3,  0.0, NULL, NULL),
('Sweet Potatoes',   43,   'kg',     'Meru Town Market',           CURRENT_DATE - 3, -0.5, NULL, NULL),
('Tomatoes',         79,   'kg',     'Wakulima Market, Nairobi',  CURRENT_DATE - 3,  1.5, NULL, NULL);

-- ============================================================
--  Verify
-- ============================================================
SELECT price_date, COUNT(*) AS crops
FROM crop_prices
GROUP BY price_date
ORDER BY price_date DESC;
