-- ==============================================================================
-- CivicSpaces Community Hall Booking & Management System
-- Migration 02: Realistic Development Seed Data
--
-- NOTE: THIS IS DEVELOPMENT SAMPLE DATA FOR TESTING AND LOCAL DEMONSTRATION.
-- It matches the isolated test fixtures and civic facility catalog.
-- In production environments, run Migration 01 only.
-- ==============================================================================

-- 1. Insert Initial Civic Halls Catalog (Development Sample Data)
INSERT INTO public.halls (
  id, slug, name, tagline, description, hourly_rate, capacity,
  location, address, neighborhood, amenities, images, featured, is_active,
  rules_and_policies, operating_hours
) VALUES
(
  'hall-oakridge-01',
  'oakridge-civic-hall',
  'Oakridge Civic Hall',
  'Historic grand auditorium with proscenium stage and commercial kitchen',
  'Oakridge Civic Hall is the centerpiece of the East Civic District. Built in 1928 and completely modernized with seismic retrofits, central climate control, and full ADA accessibility, the hall accommodates large public assemblies, cultural galas, community banquets, and stage performances. Featuring polished maple hardwood floors, 24-foot vaulted ceilings, and a dedicated backstage dressing suite.',
  85.00,
  350,
  'East Civic District',
  '420 Heritage Way, Oakridge District',
  'Oakridge',
  ARRAY[
    'Proscenium Stage & Lighting Rig',
    'Commercial Prep Kitchen',
    'Wheelchair Accessible (Elevator & Ramps)',
    'High-Definition Projector & Dual Screens',
    'Professional Sound System & Wireless Mics',
    'Banquet Tables & 350 Padded Chairs',
    'Dedicated On-Site Parking (85 stalls)',
    'Public High-Speed Wi-Fi',
    'Loading Dock & Stage Door'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80", "alt": "Oakridge Civic Hall main auditorium with vaulted ceiling and timber banquet tables", "credit": "Unsplash / Civic Architecture"},
    {"url": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80", "alt": "Oakridge Civic Hall stage and lighting view", "credit": "Unsplash / Civic Venues"}
  ]'::jsonb,
  TRUE,
  TRUE,
  ARRAY[
    'All events must conclude and clear by 11:00 PM per municipal residential quiet hours.',
    'A temporary special event alcohol permit is required if serving alcoholic beverages.',
    'Commercial kitchen cleaning checklist must be completed and signed before key return.',
    'Decorations must not use nails, duct tape, or open flames; LED candles are permitted.'
  ],
  '{"open": "08:00", "close": "23:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-riverside-02',
  'riverside-community-pavilion',
  'Riverside Community Pavilion',
  'Modern timber-and-glass hall overlooking the river greenbelt',
  'Set within the Riverside Parklands, the Riverside Pavilion offers floor-to-ceiling panoramic views of the water and surrounding canopy. Designed with sustainable heavy timber construction and polished aggregate floors, this light-filled venue is ideal for neighborhood forums, educational workshops, environmental society meetings, and family milestone celebrations.',
  60.00,
  140,
  'Riverside Parklands',
  '115 Riverbend Boulevard, Riverside District',
  'Riverside',
  ARRAY[
    'Floor-to-Ceiling Riverfront Glass Wall',
    'Covered Outdoor Veranda & Terrace',
    'Kitchenette with Warming Oven & Refrigeration',
    'Integrated Ceiling Audio System',
    'Motorized Projection Screen & 4K Laser Projector',
    'Flexible Stacking Tables & Modern Ergonomic Seating',
    'Direct Park Trail Access',
    'Level-2 EV Charging Stalls',
    'ADA Restrooms'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80", "alt": "Riverside Community Pavilion glass windows and open hall layout", "credit": "Unsplash / Parkland Facilities"},
    {"url": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80", "alt": "Riverside outdoor terrace seating", "credit": "Unsplash / Civic Venues"}
  ]'::jsonb,
  TRUE,
  TRUE,
  ARRAY[
    'Amplified outdoor music on the veranda requires prior community relations clearance.',
    'No single-use plastic dishware or confetti permitted in line with greenbelt conservation rules.',
    'Recycling and compost sortation mandatory on site.',
    'Setup and tear-down must be scheduled within contracted hours.'
  ],
  '{"open": "08:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-summit-03',
  'summit-ridge-activity-hall',
  'Summit Ridge Activity Hall',
  'Versatile recreational hall with spring-loaded wood floors and classroom breakout',
  'Summit Ridge Hall serves the upland residential neighborhoods with multi-purpose facilities suited for physical activities, youth sports programs, dance practices, wellness workshops, and homeowners association meetings. Features an adjoining 30-person seminar breakout room with interactive smartboard.',
  45.00,
  120,
  'North Hill District',
  '880 Highland Crest Avenue, Summit Ridge',
  'Summit Ridge',
  ARRAY[
    'Impact-Absorbing Maple Athletic Floor',
    'Retractable Basketball Hoops & Floor Markings',
    'Adjoining 30-Seat Conference Breakout Room',
    'Wall-Mounted 85-inch Smart Presentation Display',
    'Locker Rooms & Accessible Showers',
    'Bluetooth-Enabled PA & Acoustic Wall Panels',
    'Storage for Registered Youth Clubs'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80", "alt": "Summit Ridge athletic wood floor hall with natural light", "credit": "Unsplash / Recreation Architecture"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Non-marking athletic footwear required on maple flooring surfaces.',
    'Food and beverages are restricted to the conference room and lobby areas.',
    'Equipment must be returned to designated storage racks immediately following reservation.'
  ],
  '{"open": "07:00", "close": "21:30", "days": "Monday through Saturday"}'::jsonb
),
(
  'hall-harbor-04',
  'harbor-view-community-center',
  'Harbor View Community Center',
  'Bayside civic assembly venue with maritime architectural accents',
  'Located in the historic harbor quarter, this multi-room facility accommodates civic town halls, maritime union conferences, cultural exhibits, and evening banquets with sweeping vistas of the working port. Equipped with comprehensive audiovisual production capabilities.',
  75.00,
  220,
  'Harbor Waterfront',
  '55 Quay Street, Harbor District',
  'Harbor Quarter',
  ARRAY[
    'Dual-Room Combined Assembly Configuration',
    'Waterfront Sunset Deck',
    'Catering Prep Suite with Commercial Ice Machine',
    'Full Truss Lighting and Broadcast AV Connectivity',
    'High-Density WiFi 6 Infrastructure',
    'Tiered Loading Bay with Street-Level Ramp Access'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80", "alt": "Harbor View Community Center modern hall setup with harbour background", "credit": "Unsplash / Coastal Venues"}
  ]'::jsonb,
  TRUE,
  TRUE,
  ARRAY[
    'Harbor district parking permits provided for up to 50 attendee vehicles.',
    'Catering vendors must carry registered municipal health certifications.'
  ],
  '{"open": "08:30", "close": "23:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-westend-05',
  'westend-arts-and-civic-hub',
  'Westend Arts & Civic Hub',
  'Creative studio hall with gallery lighting, acoustic baffles, and piano',
  'A revitalized brick-and-beam municipal space dedicated to community arts, acoustic recitals, cultural lectures, public hearings, and neighborhood non-profit fundraisers. Features museum-grade track lighting and a tuned Yamaha C7 grand piano.',
  55.00,
  95,
  'West End Arts District',
  '312 Artisan Court, Westend',
  'West End',
  ARRAY[
    'Acoustically Tuned Timber Ceiling & Baffles',
    'Yamaha C7 Concert Semi-Grand Piano',
    'Track Picture Hanging Rail System (Gallery Standard)',
    'Dimmable Gallery Lighting Zones',
    'Espresso & Beverage Service Counter',
    'Accessible Ground-Floor Entrance'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", "alt": "Westend Arts Hub warm brick interior with gallery lighting", "credit": "Unsplash / Art Hub"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Piano tuning request must be placed at least 7 business days prior to event.',
    'Wall-hanging artwork requires use of standard adjustable gallery wires only.'
  ],
  '{"open": "09:00", "close": "22:00", "days": "Tuesday through Sunday"}'::jsonb
),
(
  'hall-meadow-06',
  'meadowbrook-pavilion',
  'Meadowbrook Pavilion',
  'Open-air covered cedar pavilion with adjoining community picnic grounds',
  'Surrounded by heirloom oak trees in Meadowbrook Memorial Park, this heavy cedar pavilion offers sheltered outdoor community gatherings, farmers markets, seasonal craft fairs, and summer youth day-camps.',
  35.00,
  80,
  'South Valley District',
  '2400 Parkside Drive, South Valley',
  'Meadowbrook',
  ARRAY[
    'Heavy Timber Cedar Post-and-Beam Structure',
    'Built-in Concrete Charcoal Grills',
    'Heavy-Duty Weather-Proof Electrical Outlets (20A)',
    '12 Fixed Cedar Picnic Tables',
    'Direct Access to Public Playground & Restrooms',
    'Covered Rain & Shade Protection'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80", "alt": "Meadowbrook Pavilion surrounded by park trees", "credit": "Unsplash / Park Venues"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Open flames permitted strictly within designated concrete charcoal pits.',
    'All trash and recycling must be bagged and deposited in wildlife-proof bins.'
  ],
  '{"open": "08:00", "close": "20:00", "days": "Monday through Sunday"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  hourly_rate = EXCLUDED.hourly_rate,
  capacity = EXCLUDED.capacity,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  updated_at = NOW();

-- 2. Insert Sample Maintenance Windows (Development Sample Data)
INSERT INTO public.maintenance_windows (
  id, hall_id, title, reason, start_time, end_time, status
) VALUES
(
  'maint-oakridge-01',
  'hall-oakridge-01',
  'Bi-Annual HVAC Ventilation Inspection & Filter Replacement',
  'Mandatory municipal health and ventilation service inspection of central air handling units.',
  '2026-11-19T07:00:00Z',
  '2026-11-19T13:00:00Z',
  'SCHEDULED'
),
(
  'maint-riverside-01',
  'hall-riverside-02',
  'Floor Deep Cleaning & Eco-Seal Conditioning',
  'Routine maintenance of timber flooring after autumn civic usage season.',
  '2026-11-24T08:00:00Z',
  '2026-11-24T14:00:00Z',
  'SCHEDULED'
),
(
  'maint-summit-01',
  'hall-summit-03',
  'Athletic Wood Floor Recoating & Line Restriping',
  'Annual polyurethane friction recoat for sports hall safety certification.',
  '2026-12-01T06:00:00Z',
  '2026-12-03T18:00:00Z',
  'SCHEDULED'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Initial Sample Bookings (Development Sample Data)
INSERT INTO public.bookings (
  id, reference_number, hall_id, requester_name, requester_email,
  requester_phone, requester_org, event_name, event_type,
  expected_attendees, special_requests, start_time, end_time,
  status, reviewed_by, reviewed_at, decision_notes
) VALUES
(
  'bkg-sample-oakridge-approved-01',
  'REQ-2026-1042',
  'hall-oakridge-01',
  'Eleanor Vance',
  'eleanor.vance@civic.example',
  '(555) 234-5678',
  'Oakridge Heritage Preservation Society',
  'Annual Civic Heritage Gala & Awards Dinner',
  'Cultural & Heritage Celebration',
  280,
  'Stage podium and dual wireless microphones required for opening remarks.',
  '2026-11-20T14:00:00Z',
  '2026-11-20T21:00:00Z',
  'APPROVED',
  NULL,
  '2026-11-05T10:30:00Z',
  'Approved by Facilities Division. Commercial kitchen permit verified on file.'
),
(
  'bkg-sample-oakridge-pending-02',
  'REQ-2026-1088',
  'hall-oakridge-01',
  'David Chen',
  'dchen@metrononprofit.example',
  '(555) 876-5432',
  'Metro Community Housing Alliance',
  'Neighborhood Housing Forum & Information Session',
  'Community Meeting',
  120,
  'Requires 12 breakout tables and projection screen.',
  '2026-11-28T10:00:00Z',
  '2026-11-28T18:00:00Z',
  'PENDING',
  NULL,
  NULL,
  NULL
),
(
  'bkg-sample-riverside-approved-03',
  'REQ-2026-2031',
  'hall-riverside-02',
  'Dr. Sarah Lin',
  'slin@watershed-ecology.example',
  '(555) 345-6789',
  'Urban Watershed Conservation Foundation',
  'River Ecology Youth Symposium & Citizen Science Day',
  'Educational Seminar',
  85,
  'Access to outdoor veranda required for water quality demonstration kits.',
  '2026-11-22T09:00:00Z',
  '2026-11-22T16:00:00Z',
  'APPROVED',
  NULL,
  '2026-11-08T14:15:00Z',
  'Approved with environmental awareness guidelines acknowledged by organizer.'
)
ON CONFLICT (id) DO NOTHING;
