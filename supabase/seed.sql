-- PRISM Seed Data
-- 8 communities, 4 topics, 16 perspectives, 4 prompts
-- Run with service_role key to bypass RLS

-- ============================================================
-- COMMUNITIES (8 total, covering all 6 types)
-- ============================================================

INSERT INTO communities (id, name, region, country, latitude, longitude, community_type, color_hex, description, verified, active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Ventura County Civic Forum', 'Ventura County, CA', 'US', 34.3705, -119.1391, 'civic', '#3B82F6', 'Local government transparency, housing policy, and civic engagement in Ventura County.', true, true),
  ('a1000000-0000-0000-0000-000000000002', 'LA Diaspora Network', 'Los Angeles, CA', 'US', 34.0522, -118.2437, 'diaspora', '#A855F7', 'Connecting first and second-generation immigrant communities across greater Los Angeles.', true, true),
  ('a1000000-0000-0000-0000-000000000003', 'Central Valley Rural Alliance', 'Fresno County, CA', 'US', 36.7378, -119.7871, 'rural', '#F59E0B', 'Agricultural workers, ranchers, and rural families in California''s Central Valley.', true, true),
  ('a1000000-0000-0000-0000-000000000004', 'Bay Area Policy Institute', 'San Francisco, CA', 'US', 37.7749, -122.4194, 'policy', '#22C55E', 'Nonpartisan policy analysis for housing, transit, and economic development in the Bay Area.', true, true),
  ('a1000000-0000-0000-0000-000000000005', 'UC Berkeley Urban Studies Lab', 'Berkeley, CA', 'US', 37.8716, -122.2727, 'academic', '#06B6D4', 'Research collective studying urban displacement, gentrification, and community resilience.', true, true),
  ('a1000000-0000-0000-0000-000000000006', 'Southside Chicago Arts Collective', 'Chicago, IL', 'US', 41.7500, -87.6200, 'cultural', '#F97316', 'Artists, musicians, and cultural workers preserving and amplifying South Side creative traditions.', true, true),
  ('a1000000-0000-0000-0000-000000000007', 'Appalachian Voices Coalition', 'Morgantown, WV', 'US', 39.6295, -79.9559, 'rural', '#F59E0B', 'Rural communities across West Virginia and Kentucky navigating economic transition and identity.', true, true),
  ('a1000000-0000-0000-0000-000000000008', 'Toronto Somali-Canadian Forum', 'Toronto, ON', 'CA', 43.6532, -79.3832, 'diaspora', '#A855F7', 'Somali-Canadian families building community and navigating belonging in the Greater Toronto Area.', true, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- TOPICS (4 total: 2 hot, 1 trending, 1 active)
-- ============================================================

INSERT INTO topics (id, title, slug, summary, status, perspective_count, community_count) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Housing Affordability Crisis 2026', 'housing-affordability-crisis-2026', 'Rents and home prices continue to outpace wages across North America. Communities are responding with vastly different strategies — and experiencing vastly different consequences.', 'hot', 8, 8),
  ('b1000000-0000-0000-0000-000000000002', 'AI and the Future of Work', 'ai-future-of-work', 'Automation is reshaping industries from agriculture to finance. The communities most affected are rarely the ones making the decisions.', 'hot', 8, 8),
  ('b1000000-0000-0000-0000-000000000003', 'Water Access and Infrastructure', 'water-access-infrastructure', 'Aging pipes, drought, and contamination are creating a patchwork of water security across the continent.', 'trending', 0, 0),
  ('b1000000-0000-0000-0000-000000000004', 'Youth Mental Health in the Digital Age', 'youth-mental-health-digital-age', 'Teen anxiety and depression rates have doubled since 2019. Parents, educators, and young people themselves see different causes — and different solutions.', 'active', 0, 0)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PERSPECTIVES (16 total — 2 per community on topics 1 & 2)
-- ============================================================

-- Topic 1: Housing Affordability Crisis 2026
INSERT INTO perspectives (id, community_id, topic_id, quote, context, category_tag, verified) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'We passed a tenant protection ordinance last year and landlords are suing the county. Meanwhile families are doubling up in two-bedroom apartments because there''s nothing available under $2,400.',
   'From a county supervisor town hall in Oxnard, March 2026', 'housing', true),

  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001',
   'My parents came here in ''98 and bought a house in Koreatown for $180K. That same house is worth $1.2 million now. My generation can''t afford to stay in the neighborhoods our families built.',
   'LA Diaspora Network community discussion, February 2026', 'housing', true),

  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001',
   'People think housing is only an urban problem. We have farmworkers living eight to a trailer because there''s literally no rental stock within 40 miles of the fields. The housing crisis here is invisible.',
   'Central Valley Rural Alliance monthly meeting, January 2026', 'housing', true),

  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001',
   'The data shows that inclusionary zoning alone won''t solve the supply gap. San Francisco approved 40% fewer units in 2025 than in 2020, while adding 12,000 new jobs. The math doesn''t work without state-level preemption.',
   'Bay Area Policy Institute quarterly report, Q1 2026', 'housing', true),

  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001',
   'Our research tracks what happens to community networks when people are displaced. It''s not just about losing a home — it''s about losing the barbershop, the church, the neighbor who watches your kids. Displacement destroys social infrastructure.',
   'UC Berkeley Urban Studies Lab, published findings March 2026', 'housing', true),

  ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001',
   'Every storefront on 63rd that used to be a gallery or a record shop is now a luxury coffee place. The artists who made this neighborhood interesting are getting priced out by people who moved here because of the art.',
   'South Side community forum, February 2026', 'housing', true),

  ('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000001',
   'Housing here is cheap on paper — you can buy a house for $60,000. But there are no jobs, no broadband, and the nearest hospital closed in 2023. Affordable means nothing if the town is dying around you.',
   'Appalachian Voices Coalition community call, March 2026', 'housing', true),

  ('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001',
   'Somali families in Etobicoke are being pushed further from the city every year. The subsidized housing waitlist is 12 years long. Our community stays together by choice, but the city is making it harder every month.',
   'Toronto Somali-Canadian Forum housing committee, January 2026', 'housing', true),

-- Topic 2: AI and the Future of Work
  ('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
   'The county just automated half our permit review process. It''s faster, sure, but now residents can''t get a human on the phone when something goes wrong. Efficiency without accountability isn''t progress.',
   'Ventura County civic engagement meeting, March 2026', 'technology', true),

  ('c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'My mother worked in garment manufacturing for 20 years. That industry already left. Now the call center jobs that replaced it are being automated too. Every generation loses the ladder the last one climbed.',
   'LA Diaspora Network discussion thread, February 2026', 'technology', true),

  ('c1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002',
   'They''re testing autonomous harvesters on the big corporate farms outside Bakersfield. The growers say it solves the labor shortage. The workers say it solves growers having to pay fair wages.',
   'Central Valley farmworker community meeting, March 2026', 'technology', true),

  ('c1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002',
   'Our analysis shows AI adoption is concentrating economic gains in 15 metro areas while accelerating decline everywhere else. Without deliberate redistribution policy, this technology will widen the geography of inequality.',
   'Bay Area Policy Institute AI impact study, Q1 2026', 'technology', true),

  ('c1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002',
   'Students in our program are using AI tools to write papers, analyze data, and generate code. The ones with access are pulling further ahead. The ones without it are falling further behind. AI is amplifying existing inequality, not creating new equality.',
   'UC Berkeley Urban Studies Lab faculty discussion, February 2026', 'technology', true),

  ('c1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000002',
   'AI-generated music is flooding the platforms and burying independent artists. We spent decades fighting for South Side musicians to get heard, and now an algorithm can clone their sound for free.',
   'Southside Chicago Arts Collective town hall, January 2026', 'technology', true),

  ('c1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000002',
   'Coal jobs left, then manufacturing left, and now they want us to learn to code. But the broadband barely works and the nearest community college is an hour drive. The retraining programs assume a world that doesn''t exist here.',
   'Appalachian Voices Coalition workforce development discussion, March 2026', 'technology', true),

  ('c1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000002',
   'Young people in our community are excited about AI — they see opportunity. But their parents work in warehouses and trucking. Nobody in this family is going to code their way out of a layoff.',
   'Toronto Somali-Canadian Forum youth panel, February 2026', 'technology', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PERSPECTIVE PROMPTS (4 total: 1 active, 3 archived)
-- ============================================================

INSERT INTO perspective_prompts (id, topic_id, prompt_text, description, active) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'How is the housing crisis showing up in your neighborhood right now?',
   'Open prompt for the housing affordability topic — seeking ground-level perspectives', true),
  ('d1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
   'Has AI changed how you or someone you know does their job?',
   'Personal experience prompt for the AI and work topic', false),
  ('d1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
   'What does water access look like where you live?',
   'Geography-focused prompt for the water infrastructure topic', false),
  ('d1000000-0000-0000-0000-000000000004', NULL,
   'What''s one thing your community is dealing with that nobody outside it seems to understand?',
   'General open-ended prompt — no specific topic', false)
ON CONFLICT (id) DO NOTHING;
