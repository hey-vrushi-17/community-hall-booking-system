-- ==============================================================================
-- CivicSpaces Community Hall Booking & Management System (India)
-- Migration 02: Real Indian Community Halls & Civic Venues Seed Data
--
-- Contains verified real-world Indian municipal community halls, Barat Ghars,
-- Town Halls, and cultural auditoriums across major Indian cities.
-- ==============================================================================

-- 1. Insert Real Indian Community Halls Catalog
INSERT INTO public.halls (
  id, slug, name, tagline, description, hourly_rate, capacity,
  location, address, neighborhood, amenities, images, featured, is_active,
  rules_and_policies, operating_hours
) VALUES
(
  'hall-ndmc-babar-01',
  'babar-road-ndmc-community-centre-new-delhi',
  'Babar Road Community Centre (NDMC Barat Ghar)',
  'Central Delhi municipal community hall and Barat Ghar near Bengali Market',
  'Managed by the New Delhi Municipal Council (NDMC), the Babar Road Community Centre is a landmark public gathering venue in central Lutyens'' Delhi near Bengali Market and Connaught Place. Accommodating 225 seated guests (and up to 350 in floating reception setups), it serves civic meetings, neighborhood weddings, cultural functions, and community welfare gatherings with transparent municipal tariffs.',
  500.00,
  225,
  'Bengali Market, New Delhi',
  'Babar Road, Near Bengali Market, Connaught Place Area, New Delhi, Delhi 110001',
  'New Delhi',
  ARRAY[
    'Main Multi-Purpose Indoor Hall',
    'Catering & Food Prep Area',
    'Wheelchair Accessible Ground-Floor Entry',
    'Designated On-Site Parking',
    'Electricity & Power Backup Provision',
    'Public Restrooms & Sanitation Upkeep',
    'Near Mandi House & Barakhamba Metro'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80", "alt": "Babar Road NDMC Community Centre main indoor gathering hall", "credit": "Unsplash / Civic Venues"},
    {"url": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80", "alt": "Babar Road Community Centre event seating setup", "credit": "Unsplash / Event Architecture"}
  ]'::jsonb,
  TRUE,
  TRUE,
  ARRAY[
    'Bookings are governed by NDMC Barat Ghar guidelines; valid Aadhaar/government ID proof is mandatory.',
    'Base public rental starts around ₹3,000/day (subsidized for NDMC employees); electricity, maintenance, and GST apply separately.',
    'All amplified music and outdoor sound must conclude by 10:00 PM per Delhi Pollution Control & Police norms.',
    'External catering and decor vendors must clear waste and restore premises prior to handover.'
  ],
  '{"open": "08:00", "close": "22:30", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-ihc-stein-02',
  'stein-auditorium-india-habitat-centre-new-delhi',
  'Stein Auditorium, India Habitat Centre',
  'Premier Lodhi Road cultural auditorium with projection and simultaneous interpretation',
  'Located inside the iconic Joseph Allen Stein-designed India Habitat Centre on Lodhi Road, the Stein Auditorium is one of New Delhi''s foremost venues for civic dialogues, film screenings, classical concerts, and national conferences. Featuring tiered seating for 450 guests, state-of-the-art acoustics, and proximity to Jor Bagh and JLN Stadium Metro stations.',
  3500.00,
  450,
  'Lodhi Road, New Delhi',
  'India Habitat Centre, Lodhi Road, New Delhi, Delhi 110003',
  'New Delhi',
  ARRAY[
    'Proscenium Stage & Theatrical Lighting Rig',
    'State-of-the-Art Sound System & Wireless Mics',
    '35mm Film Projection & Live Telecast Support',
    'Simultaneous Multi-Language Interpretation Booths',
    'Air-Conditioned Tiered Auditorium',
    'Wheelchair Accessible Ramps & Seating',
    'Multi-Level Basement Parking',
    'On-Site Food Court & Dining Access'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80", "alt": "Stein Auditorium at India Habitat Centre conference and cultural seating", "credit": "Unsplash / Conference Architecture"}
  ]'::jsonb,
  TRUE,
  TRUE,
  ARRAY[
    'Formal booking application and advance payment required through the IHC Convention & Events desk.',
    'Food and beverages are strictly prohibited inside the main auditorium seating area.',
    'Technical sound/lighting riders must be submitted at least 7 days prior to the event.'
  ],
  '{"open": "09:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-mumbai-ravindra-03',
  'ravindra-natya-mandir-prabhadevi-mumbai',
  'Ravindra Natya Mandir (P.L. Deshpande Academy)',
  'Historic Prabhadevi performing arts auditorium and cultural hub near Siddhivinayak',
  'Part of the Government of Maharashtra''s P.L. Deshpande Maharashtra Kala Academy complex in Prabhadevi, Ravindra Natya Mandir is celebrated as the heart of Marathi theatre alongside Hindi, Gujarati, and English stage productions, concerts, and civic gatherings. The air-conditioned main hall offers ~900 tiered seats with acclaimed acoustics and adjacent art gallery spaces.',
  2500.00,
  900,
  'Prabhadevi, Mumbai',
  'P.L. Deshpande Maharashtra Kala Academy, Sayani Road, Near Siddhivinayak Temple, Prabhadevi, Mumbai, Maharashtra 400025',
  'Mumbai',
  ARRAY[
    'Air-Conditioned 900-Seat Tiered Auditorium',
    'Proscenium Stage & Theatrical Lighting System',
    'Acoustic Auditorium Design',
    'Dedicated Artist Green Rooms & Backstage',
    'Art Gallery & Exhibition Foyer Spaces',
    'Wheelchair Accessible Entry',
    'On-Site Limited Parking (Near Dadar & Prabhadevi Stations)'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80", "alt": "Ravindra Natya Mandir main auditorium stage lighting and tiered seating", "credit": "Unsplash / Arts Venue"}
  ]'::jsonb,
  TRUE,
  TRUE,
  ARRAY[
    'Managed by P.L. Deshpande Maharashtra Kala Academy; municipal theatre taxes and GST apply per event category.',
    'No open flames, pyrotechnics, or eatables allowed inside the auditorium.',
    'Load-in and stage setup permitted only within the contracted slot timings.'
  ],
  '{"open": "09:00", "close": "23:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-pune-balgandharva-04',
  'bal-gandharva-rang-mandir-shivajinagar-pune',
  'Bal Gandharva Rang Mandir',
  'Iconic Pune Municipal Corporation auditorium with 989 seats and exhibition gallery',
  'Owned and administered by the Pune Municipal Corporation (PMC) on Jangali Maharaj Road near Sambhaji Park, Bal Gandharva Rang Mandir is Pune''s premier civic theatre and community venue. With 989 seats (669 ground floor and 320 balcony), a 2,400 sq ft stage, and an upper-floor 3,280 sq ft art gallery, it hosts dramas, classical music festivals, civic felicitations, and exhibitions.',
  2200.00,
  989,
  'Shivajinagar, Pune',
  'Near Sambhaji Park, Jangali Maharaj Road, Shivajinagar, Pune, Maharashtra 411005',
  'Pune',
  ARRAY[
    'Air-Conditioned 989-Seat Auditorium (Stalls & Balcony)',
    '2,400 sq ft Proscenium Stage & Rigging',
    '3,280 sq ft Upper-Floor Art & Exhibition Gallery',
    'VIP & Artist Green Rooms with Storage Tenements',
    'On-Site Canteen & Refreshment Cafeteria',
    'Pay-and-Park Premises',
    'Sound System & Stage Lighting'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80", "alt": "Bal Gandharva Rang Mandir spacious municipal auditorium in Pune", "credit": "Unsplash / Auditorium Architecture"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Operates in standard PMC slots: Morning (9–11 AM), Afternoon (12:30–3:30 PM), Evening (5–8 PM), and Night (9:30 PM–12:30 AM).',
    'Events with ticket rates exceeding ₹60 are charged 1.5x the standard PMC base tariff; registered charitable events qualify for rebates.',
    'Adherence to PMC cultural center noise and cleanliness regulations is mandatory.'
  ],
  '{"open": "09:00", "close": "23:30", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-blr-sevasadan-05',
  'seva-sadan-auditorium-malleswaram-bengaluru',
  'Seva Sadan Auditorium',
  'Intimate Malleswaram community auditorium for classical recitals, talks, and theatre',
  'Located on the charitable campus of the Seva Sadan Association in Malleswaram, Seva Sadan is one of Bengaluru''s most beloved 200-seat community halls. Widely patronized by Carnatic musicians, Bharatanatyam dancers, independent theatre groups, and neighborhood forums, it offers warm acoustics and pocket-friendly rates for cultural and non-profit gatherings.',
  800.00,
  200,
  'Malleswaram, Bengaluru',
  '14th Cross Road, West Park Road, Malleswaram, Bengaluru, Karnataka 560003',
  'Bengaluru',
  ARRAY[
    'Intimate 200-Seat Acoustic Hall',
    'Raised Performance Stage & Curtains',
    'Sound System & Microphones',
    'Artist Green Rooms',
    'Wheelchair Accessible Ground-Floor Entry',
    'Neighborhood Street Parking'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", "alt": "Seva Sadan Auditorium intimate community gathering space in Malleswaram", "credit": "Unsplash / Interior Architecture"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Priority given to non-profit cultural programs, classical arts recitals, and educational talks.',
    'All evening programs must conclude by 9:30 PM to respect Malleswaram residential quiet hours.',
    'Strictly vegetarian and alcohol-free campus under Seva Sadan Association bylaws.'
  ],
  '{"open": "08:00", "close": "21:30", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-blr-chowdiah-06',
  'chowdiah-memorial-hall-malleswaram-bengaluru',
  'Chowdiah Memorial Hall',
  'Iconic seven-stringed violin-shaped cultural auditorium in Malleswaram',
  'Built in 1980 by the Academy of Music in the distinctive shape of a giant seven-stringed violin, Chowdiah Memorial Hall is a celebrated architectural and cultural landmark in Malleswaram, Bengaluru. Seating over 1,000 guests, it hosts symphony concerts, classical dance festivals, school annual days, and large civic assemblies.',
  3000.00,
  1000,
  'Malleswaram, Bengaluru',
  '16th Cross Road, Gayathri Devi Park Extension, Vyalikaval, Malleswaram, Bengaluru, Karnataka 560003',
  'Bengaluru',
  ARRAY[
    'Air-Conditioned 1,000-Seat Concert Auditorium',
    'Large Concert Stage & Theatrical Lighting',
    'Professional Acoustic Sound System',
    'Artist Green Rooms & Backstage Suites',
    'Dedicated On-Site Vehicle Parking',
    'Wheelchair Accessible Entrances & Restrooms'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80", "alt": "Chowdiah Memorial Hall grand concert auditorium interior", "credit": "Unsplash / Concert Halls"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Managed by the Academy of Music; commercial and cultural tariff slabs apply separately.',
    'No outside food, beverages, or flash photography during live performances.',
    'Sound decibel levels must comply with Bengaluru municipal auditorium guidelines.'
  ],
  '{"open": "08:30", "close": "22:30", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-chn-teynampet-07',
  'teynampet-corporation-community-hall-chennai',
  'Teynampet Corporation Community Hall (GCC)',
  'Greater Chennai Corporation neighborhood community centre on Muthiah Street',
  'Operated by the Greater Chennai Corporation (GCC), the Teynampet Community Centre on Muthiah Street behind the DMS complex provides an affordable, accessible municipal space for neighborhood weddings, resident welfare meetings, blood donation camps, and family functions with a 150-seat capacity (up to 250 floating).',
  450.00,
  150,
  'Teynampet, Chennai',
  'Muthiah Street, Behind DMS, Teynampet, Chennai, Tamil Nadu 600018',
  'Chennai',
  ARRAY[
    'Multi-Purpose Municipal Community Hall',
    'Dining & Catering Prep Kitchen Area',
    'Public Address Sound Support',
    'Wheelchair Accessible Ground-Floor Entry',
    'Two-Wheeler & Car Parking Space',
    'Near Teynampet Metro Station'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80", "alt": "Teynampet Corporation Community Hall multi-purpose civic gathering room", "credit": "Unsplash / Civic Centers"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'GCC tariff: ₹3,750 Full Day / ₹1,875 Half Day plus 18% GST and ₹1,500 refundable security deposit.',
    'Single-use plastics are strictly banned across all Greater Chennai Corporation venues.',
    'All functions must conclude by 10:00 PM; premises must be cleared cleanly for inspection.'
  ],
  '{"open": "07:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-chn-theagaraya-08',
  'sir-p-theagaraya-hall-t-nagar-chennai',
  'Sir P. Theagaraya Hall (Kalaiyarangam)',
  'Heritage 500-seat Greater Chennai Corporation auditorium on G.N. Chetty Road',
  'Situated in the bustling heart of T. Nagar on G.N. Chetty Road, Sir P. Theagaraya Hall is a historic Greater Chennai Corporation cultural auditorium. With 500 seats, full air-conditioning, and a classic stage setup, it is widely used for music sabha concerts, civic assemblies, educational convocations, and public conferences.',
  2200.00,
  500,
  'T. Nagar, Chennai',
  'G.N. Chetty Road, T. Nagar, Chennai, Tamil Nadu 600017',
  'Chennai',
  ARRAY[
    'Air-Conditioned 500-Seat Auditorium',
    'Proscenium Stage & Theatrical Lighting',
    'Public Address & Sound Reinforcement System',
    'Artist Green Rooms & Dressing Areas',
    'On-Site Parking Premises',
    'Wheelchair Accessible Entrance'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80", "alt": "Sir P. Theagaraya Hall stage and auditorium in T. Nagar Chennai", "credit": "Unsplash / Auditorium Spaces"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Standard GCC base listing: ₹17,500 Full Day / ₹10,500 Half Day + 18% GST and ₹15,000 security deposit.',
    'No plastic banners, confetti, or open flames permitted inside the auditorium.',
    'Bookings are confirmed on a first-come, first-served basis through GCC verification.'
  ],
  '{"open": "08:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-hyd-ravindrabharathi-09',
  'ravindra-bharathi-saifabad-hyderabad',
  'Ravindra Bharathi',
  'Telangana state flagship cultural auditorium and mini theatre near Assembly',
  'Operated by the Department of Culture, Government of Telangana, Ravindra Bharathi in Saifabad is Hyderabad''s premier cultural landmark. Opened in 1961 to mark Rabindranath Tagore''s birth centenary, it features a 1,000-seat air-conditioned main auditorium with motorized fly systems, a grand marble foyer, and an upper-floor mini theatre.',
  2000.00,
  1000,
  'Saifabad, Hyderabad',
  'Lakdikapul Road, Near State Legislative Assembly, Saifabad, Hyderabad, Telangana 500004',
  'Hyderabad',
  ARRAY[
    'Air-Conditioned 1,000-Seat Main Auditorium',
    'False Proscenium & Motorized Stage Fly System',
    'Sound Reinforcement System & Microphones',
    'Artist Green Rooms & Marble Foyer Lobby',
    'Power Backup & Stage Lighting Gear',
    'Dedicated Car & Two-Wheeler Parking',
    'Near Lakdikapul & Assembly Metro Stations'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80", "alt": "Ravindra Bharathi main cultural hall in Saifabad Hyderabad", "credit": "Unsplash / Cultural Landmarks"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Admin office open Mon–Fri 10:30 AM – 5:00 PM (closed Sundays & 2nd Saturdays); auditorium open daily for approved events.',
    'A/C electricity consumption is metered separately and adjusted against the upfront caution deposit.',
    'Prior departmental clearance required for ticketed commercial events and film shoots.'
  ],
  '{"open": "09:00", "close": "22:30", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-ahd-tagore-10',
  'tagore-memorial-hall-paldi-ahmedabad',
  'Tagore Memorial Hall',
  'B.V. Doshi-designed modernist municipal auditorium in Paldi, Ahmedabad',
  'Designed by Pritzker Prize-winning architect Balkrishna V. Doshi and managed by the Ahmedabad Municipal Corporation (AMC), Tagore Memorial Hall in Paldi is an architectural masterpiece of exposed concrete folded plates. Seating ~700 guests opposite the Sanskar Kendra Museum, it hosts Gujarati plays, classical concerts, seminars, and civic assemblies.',
  1800.00,
  700,
  'Paldi, Ahmedabad',
  'Opposite Sanskar Kendra Museum, Kocharab, Paldi, Ahmedabad, Gujarat 380006',
  'Ahmedabad',
  ARRAY[
    'Air-Conditioned 700-Seat Brutalist Auditorium',
    'Built-In Theatrical Stage & Wing Space',
    'Professional Lighting & Sound Infrastructure',
    'Wheelchair Accessible Entry & Seating',
    'On-Site Parking Near Sanskar Kendra',
    'Artist Dressing & Green Rooms'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80", "alt": "Tagore Memorial Hall auditorium seating in Paldi Ahmedabad", "credit": "Unsplash / Modernist Venues"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Operated by Ahmedabad Municipal Corporation (AMC); cultural/non-profit and commercial tariff tiers apply.',
    'Preservation guidelines prohibit drilling, taping, or affixing materials to exposed concrete walls.',
    'Events must wrap up within the approved AMC time slot.'
  ],
  '{"open": "08:30", "close": "22:30", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-chd-tagore-11',
  'tagore-theatre-sector-18-chandigarh',
  'Tagore Theatre',
  'Chandigarh''s 801-seat cultural flagship with rehearsal halls, exhibition foyer, and canteen',
  'Administered by the Tagore Theatre Society in Sector 18-B, Tagore Theatre is Chandigarh''s central venue for theatre, classical music, folk arts, and educational seminars. Alongside its 801-seat proscenium main auditorium, the complex includes a mini auditorium, two 40x21 ft rehearsal halls, glass exhibition foyers, and a basement canteen.',
  1500.00,
  801,
  'Sector 18, Chandigarh',
  'Sector 18-B, Chandigarh 160018',
  'Chandigarh',
  ARRAY[
    'Air-Conditioned 801-Seat Main Auditorium',
    'Proscenium Stage & Acoustic PA System',
    'Two Spacious Rehearsal Halls (40 ft x 21 ft)',
    'Glass Foyers & Exhibition Area',
    'Multiple Artist Green & Retiring Rooms',
    'Basement Canteen & Cafeteria',
    'Surface Parking for Cars & Two-Wheelers'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80", "alt": "Tagore Theatre Sector 18 Chandigarh auditorium stage", "credit": "Unsplash / Theatre Spaces"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Non-profit arts/NGO shows: ₹3,000 (free) / ₹5,000 (ticketed) per slot + GST; commercial slots range ₹10,000–₹50,000.',
    'Refundable security deposit: ₹7,500 (NGO/Govt) or ₹20,000 (Commercial).',
    'Standard slots: Morning (10 AM–2 PM) & Evening (6–10 PM); overtime beyond 30 mins incurs 1 full hour penalty.'
  ],
  '{"open": "09:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-koc-townhall-12',
  'ernakulam-town-hall-banerji-road-kochi',
  'Ernakulam Town Hall',
  'Kochi Municipal Corporation''s historic 880-seat civic town hall on Banerji Road',
  'Managed by the Kochi Municipal Corporation on Banerji Road right beside the Town Hall Kochi Metro station, Ernakulam Town Hall is one of Kerala''s most prominent public assembly venues. Featuring an 880-seat main hall (up to 1,350 floating) and a 335-seat mini hall, it hosts civic conventions, cultural programs, book fairs, and weddings.',
  1600.00,
  880,
  'Ernakulam North, Kochi',
  'Banerji Road, Ernakulam North, Kochi, Kerala 682018',
  'Kochi',
  ARRAY[
    '880-Seat Main Civic Hall & 335-Seat Mini Hall',
    'Raised Stage & Public Address Sound System',
    'Dining & Catering Service Area',
    'Wheelchair Accessible Ground-Floor Entry',
    'Adjacent Kochi Metro (Town Hall Station) & Parking',
    'Green Rooms & Restrooms'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80", "alt": "Ernakulam Town Hall civic auditorium in Kochi", "credit": "Unsplash / Municipal Halls"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Bookings administered by Kochi Municipal Corporation subject to municipal schedule availability.',
    'Green protocol mandatory: single-use plastic plates and cups are strictly prohibited.',
    'Noise levels must adhere to Kerala municipal quiet hours after 10:00 PM.'
  ],
  '{"open": "07:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-jpr-ravindramanch-13',
  'ravindra-manch-ram-niwas-garden-jaipur',
  'Ravindra Manch',
  'Jaipur''s heritage Ram Niwas Garden cultural complex with auditorium and art gallery',
  'Established in 1963 opposite the Albert Hall Museum inside Ram Niwas Garden, Ravindra Manch is Jaipur''s historic center for theatre, folk dance, and public cultural festivals. It houses a 600-seat air-conditioned indoor auditorium alongside an art gallery, rehearsal halls, VIP lounges, and an adjoining open-air theatre.',
  1400.00,
  600,
  'Adarsh Nagar, Jaipur',
  'Opposite Albert Hall Museum, Ram Niwas Garden, Adarsh Nagar, Jaipur, Rajasthan 302004',
  'Jaipur',
  ARRAY[
    'Air-Conditioned 600-Seat Indoor Auditorium',
    'Modern Art & Painting Exhibition Gallery',
    'Artist Green Rooms & VIP Holding Lounge',
    'Practice & Rehearsal Halls',
    'On-Site Canteen & Refreshments',
    'Ample Ram Niwas Garden Perimeter Parking'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80", "alt": "Ravindra Manch cultural complex grounds in Ram Niwas Garden Jaipur", "credit": "Unsplash / Cultural Venues"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Managed by Ravindra Manch Society; separate rental slabs apply for cultural bodies and commercial events.',
    'No open flames or unauthorized structural rigging inside the heritage auditorium.',
    'All outdoor amplified sound in the complex must cease by 10:00 PM.'
  ],
  '{"open": "08:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb
),
(
  'hall-bpl-bharatbhavan-14',
  'bharat-bhavan-abhirang-hall-shamla-hills-bhopal',
  'Bharat Bhavan (Abhirang Studio Hall)',
  'Charles Correa-designed lakeside studio theatre for intimate recitals and workshops',
  'Opened in 1982 and designed by renowned architect Charles Correa on the slopes of Shamla Hills overlooking Bhopal''s Upper Lake, Bharat Bhavan is a celebrated national multi-arts complex. Its Abhirang Studio Hall seats 100 guests for intimate theatre, poetry readings, and seminars, complemented by the Roopankar Museum and Vagarth poetry library.',
  900.00,
  100,
  'Shamla Hills, Bhopal',
  'J. Swaminathan Marg, Shamla Hills, Near Upper Lake, Bhopal, Madhya Pradesh 462013',
  'Bhopal',
  ARRAY[
    '100-Seat Intimate Studio Theatre (Abhirang)',
    'Professional Stage Lighting & Audio Gear',
    'Adjacent Exhibition Galleries & Museum Access',
    'Artist Green Rooms & Workshop Spaces',
    'Wheelchair Accessible Sloped Campus Paths',
    'Campus Parking Overlooking Upper Lake'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80", "alt": "Bharat Bhavan Abhirang Studio Hall intimate seating and workshop interior", "credit": "Unsplash / Studio Spaces"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Events must align with cultural, literary, educational, or civic programming standards of Bharat Bhavan Trust.',
    'Closed on Mondays for museum and campus maintenance.',
    'Smoking, alcohol, and plastic litter are strictly prohibited across the lakeside campus.'
  ],
  '{"open": "10:00", "close": "21:00", "days": "Tuesday through Sunday (Closed Mondays)"}'::jsonb
),
(
  'hall-kol-kalamandir-15',
  'kala-mandir-elgin-shakespeare-sarani-kolkata',
  'Kala Mandir Auditorium',
  'Elgin''s iconic cultural auditorium for music concerts, theatre, and literary assemblies',
  'Located on Shakespeare Sarani in Elgin, Kala Mandir (managed by the Sangit Kala Mandir Trust) is one of Kolkata''s most respected performing arts and community halls. Seating ~380 guests with crisp acoustics and warm sightlines, it regularly hosts Hindustani classical recitals, Rabindra Sangeet evenings, dramatic productions, and civic forums.',
  4150.00,
  380,
  'Elgin, Kolkata',
  '48, Shakespeare Sarani Road, Elgin, Kolkata, West Bengal 700017',
  'Kolkata',
  ARRAY[
    'Air-Conditioned 380-Seat Auditorium',
    'Proscenium Stage & Concert Lighting',
    'Acoustic Sound System & Microphones',
    'Artist Green Rooms & Lobby Lounge',
    'Wheelchair Accessible Ground Entrance',
    'Generator Power Backup'
  ],
  '[
    {"url": "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80", "alt": "Kala Mandir Auditorium interior in Elgin Kolkata", "credit": "Unsplash / Performing Arts Venues"}
  ]'::jsonb,
  FALSE,
  TRUE,
  ARRAY[
    'Base rental starts around ₹12,500 per 3-hour slot; central AC, special lighting, and GST are billed additionally.',
    'Managed by Sangit Kala Mandir Trust; prior administrative approval and caution deposit required.',
    'No eatables or beverages permitted inside the main auditorium.'
  ],
  '{"open": "09:00", "close": "22:00", "days": "Monday through Sunday"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  hourly_rate = EXCLUDED.hourly_rate,
  capacity = EXCLUDED.capacity,
  location = EXCLUDED.location,
  address = EXCLUDED.address,
  neighborhood = EXCLUDED.neighborhood,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  featured = EXCLUDED.featured,
  is_active = EXCLUDED.is_active,
  rules_and_policies = EXCLUDED.rules_and_policies,
  operating_hours = EXCLUDED.operating_hours,
  updated_at = NOW();

-- 2. Insert Sample Maintenance Windows
INSERT INTO public.maintenance_windows (
  id, hall_id, title, reason, start_time, end_time, status
) VALUES
(
  'maint-ndmc-01',
  'hall-ndmc-babar-01',
  'Semi-Annual Electrical & DG Backup Inspection',
  'Scheduled NDMC electrical safety audit and power backup servicing.',
  '2026-11-19T07:00:00Z',
  '2026-11-19T13:00:00Z',
  'SCHEDULED'
),
(
  'maint-ihc-02',
  'hall-ihc-stein-02',
  'Acoustic Panel & Projection Calibration',
  'Periodic calibration of 35mm projection and interpretation booths.',
  '2026-11-24T08:00:00Z',
  '2026-11-24T14:00:00Z',
  'SCHEDULED'
),
(
  'maint-mumbai-03',
  'hall-mumbai-ravindra-03',
  'Main Stage Rigging & Fire Safety Drill',
  'Annual stage fly-bar inspection and municipal fire safety certification.',
  '2026-11-23T06:00:00Z',
  '2026-11-23T18:00:00Z',
  'SCHEDULED'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Initial Sample Bookings
INSERT INTO public.bookings (
  id, reference_number, hall_id, requester_name, requester_email,
  requester_phone, requester_org, event_name, event_type,
  expected_attendees, special_requests, start_time, end_time,
  status, reviewed_by, reviewed_at, decision_notes
) VALUES
(
  'bkg-ndmc-101',
  'REQ-2026-8041',
  'hall-ndmc-babar-01',
  'Ananya Deshmukh',
  'ananya.deshmukh@example.org',
  '+91 98110 23456',
  'Bengali Market Cultural Welfare Society',
  'Annual Autumn Classical Music & Cultural Evening',
  'Cultural & Heritage Celebration',
  190,
  'Requires stage microphone setup and catering prep access.',
  '2026-11-20T14:00:00Z',
  '2026-11-20T21:00:00Z',
  'APPROVED',
  NULL,
  '2026-11-10T11:30:00Z',
  'NDMC Barat Ghar permit and ID verification completed.'
),
(
  'bkg-ndmc-103',
  'REQ-2026-8302',
  'hall-ndmc-babar-01',
  'Farhan Siddiqui',
  'farhan.siddiqui@example.org',
  '+91 98114 66987',
  'Dilli Craft & Handloom Collective',
  'Winter Handloom Artisans Showcase',
  'Cultural & Heritage Celebration',
  180,
  'Early morning load-in for weaver display tables.',
  '2026-11-28T10:00:00Z',
  '2026-11-28T18:00:00Z',
  'PENDING',
  NULL,
  NULL,
  NULL
),
(
  'bkg-ihc-201',
  'REQ-2026-8150',
  'hall-ihc-stein-02',
  'Dr. Meera Krishnan',
  'meera.krishnan@example.com',
  '+91 98201 89043',
  'Urban Ecology & Yamuna Trust',
  'Urban Wetlands Conservation Symposium',
  'Civic / Non-profit Workshop',
  320,
  'Dual projection screen and simultaneous translation headset setup.',
  '2026-11-21T09:00:00Z',
  '2026-11-21T13:00:00Z',
  'APPROVED',
  NULL,
  '2026-11-13T16:20:00Z',
  'IHC convention desk clearance confirmed.'
)
ON CONFLICT (id) DO NOTHING;
