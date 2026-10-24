-- TEST DATA: example tradespeople so you can try Fixwell out.
-- Every one is marked is_test = true, has "[TEST]" in its name, and shows a
-- yellow "TEST DATA" badge. Bookings for them are emailed to you (NOTIFY_EMAIL),
-- not to a real business.
--
-- To use: change the town and postcodes on the two lines marked ← below, then
-- paste this whole file into Supabase → SQL Editor → Run.
--
-- To hide them before launch: set SHOW_TEST_DATA=false in Vercel, or delete them:
--   delete from public.bookings where tradesperson_id in (select id from public.tradespeople where is_test);
--   delete from public.tradespeople where is_test;

do $$
declare
  test_town text := 'Bristol';                                                     -- ← your town / area
  test_postcodes text[] := array['BS1','BS2','BS3','BS4','BS5','BS6','BS7','BS8']; -- ← postcode districts you cover
  weekdays jsonb := '{"1":{"start":"08:00","end":"17:00"},"2":{"start":"08:00","end":"17:00"},"3":{"start":"08:00","end":"17:00"},"4":{"start":"08:00","end":"17:00"},"5":{"start":"08:00","end":"17:00"}}';
  with_saturday jsonb := weekdays || '{"6":{"start":"09:00","end":"13:00"}}';
  tp uuid;
begin
  if exists (select 1 from public.tradespeople where is_test) then
    raise notice 'Test data already present, skipping.';
    return;
  end if;

  insert into public.tradespeople (slug, status, is_test, business_name, contact_name, email, phone, trade, bio, base_area, postcode_areas,
    hourly_rate_pence, callout_fee_pence, working_hours, imi_number, approved_at, admin_notes)
  values ('test-mobile-mechanic', 'approved', true, '[TEST] Example Mobile Mechanics', 'Test Person', 'test-mechanic@example.invalid', '07700900001', 'mechanic',
    'EXAMPLE LISTING. Mobile mechanic who comes to your home or workplace. Servicing, brakes, diagnostics and batteries.', test_town, test_postcodes,
    5500, 3500, with_saturday, 'TEST-IMI-000001', now(), 'Test data, not a real business.')
  returning id into tp;
  insert into public.services (tradesperson_id, name, description, estimated_hours, sort_order) values
    (tp, 'Full service', 'Oil, filters, fluids and safety check', 2.5, 1),
    (tp, 'Brake pads (front or rear)', 'Supply and fit pads; discs extra if needed', 1.5, 2),
    (tp, 'Diagnostic check', 'Read fault codes and find the problem', 1, 3),
    (tp, 'Battery replacement', 'Test and fit a new battery', 0.5, 4);

  insert into public.tradespeople (slug, status, is_test, business_name, contact_name, email, phone, trade, bio, base_area, postcode_areas,
    hourly_rate_pence, callout_fee_pence, working_hours, approved_at, admin_notes)
  values ('test-plumber', 'approved', true, '[TEST] Example Plumbing', 'Test Person', 'test-plumber@example.invalid', '07700900002', 'plumber',
    'EXAMPLE LISTING. Leaks, taps, toilets, radiators and general plumbing.', test_town, test_postcodes,
    5000, 4000, weekdays, now(), 'Test data, not a real business.')
  returning id into tp;
  insert into public.services (tradesperson_id, name, description, estimated_hours, sort_order) values
    (tp, 'Fix a leaking tap', 'Washer or cartridge replacement', 1, 1),
    (tp, 'Unblock a sink or toilet', '', 1, 2),
    (tp, 'Replace a radiator', 'Like-for-like swap', 3, 3);

  insert into public.tradespeople (slug, status, is_test, business_name, contact_name, email, phone, trade, bio, base_area, postcode_areas,
    hourly_rate_pence, callout_fee_pence, working_hours, niceic_napit_number, approved_at, admin_notes)
  values ('test-electrician', 'approved', true, '[TEST] Example Electrical', 'Test Person', 'test-electrician@example.invalid', '07700900003', 'electrician',
    'EXAMPLE LISTING. Domestic electrician: sockets, lighting, fault finding and safety certificates.', test_town, test_postcodes,
    6000, 4500, weekdays, 'TEST-NICEIC-000003', now(), 'Test data, not a real business.')
  returning id into tp;
  insert into public.services (tradesperson_id, name, description, estimated_hours, sort_order) values
    (tp, 'Add a double socket', '', 1.5, 1),
    (tp, 'Fault finding', 'Tripping circuits, dead sockets', 1, 2),
    (tp, 'Electrical safety certificate (EICR)', 'Up to 3-bed home', 3, 3);

  insert into public.tradespeople (slug, status, is_test, business_name, contact_name, email, phone, trade, bio, base_area, postcode_areas,
    hourly_rate_pence, callout_fee_pence, working_hours, gas_safe_number, approved_at, admin_notes)
  values ('test-gas-engineer', 'approved', true, '[TEST] Example Heating & Gas', 'Test Person', 'test-gas@example.invalid', '07700900004', 'gas_engineer',
    'EXAMPLE LISTING. Boiler servicing, repairs and landlord gas safety certificates.', test_town, test_postcodes,
    6500, 5000, with_saturday, 'TEST-000004', now(), 'Test data, not a real business.')
  returning id into tp;
  insert into public.services (tradesperson_id, name, description, estimated_hours, sort_order) values
    (tp, 'Boiler service', 'Annual service with report', 1, 1),
    (tp, 'Landlord gas safety certificate (CP12)', 'Up to 3 appliances', 1, 2),
    (tp, 'Boiler breakdown repair', 'Diagnosis and repair; parts extra', 2, 3);

  insert into public.tradespeople (slug, status, is_test, business_name, contact_name, email, phone, trade, bio, base_area, postcode_areas,
    hourly_rate_pence, callout_fee_pence, working_hours, approved_at, admin_notes)
  values ('test-carpenter', 'approved', true, '[TEST] Example Carpentry', 'Test Person', 'test-carpenter@example.invalid', '07700900005', 'carpenter',
    'EXAMPLE LISTING. Doors, shelving, flat-pack assembly and small joinery jobs.', test_town, test_postcodes,
    4500, 3000, weekdays, now(), 'Test data, not a real business.')
  returning id into tp;
  insert into public.services (tradesperson_id, name, description, estimated_hours, sort_order) values
    (tp, 'Hang an internal door', '', 2, 1),
    (tp, 'Fit shelves', 'Up to 3 shelves', 1.5, 2),
    (tp, 'Flat-pack assembly', 'Per large item', 2, 3);

  insert into public.tradespeople (slug, status, is_test, business_name, contact_name, email, phone, trade, bio, base_area, postcode_areas,
    hourly_rate_pence, callout_fee_pence, working_hours, approved_at, admin_notes)
  values ('test-locksmith', 'approved', true, '[TEST] Example Locksmiths', 'Test Person', 'test-locksmith@example.invalid', '07700900006', 'locksmith',
    'EXAMPLE LISTING. Lock changes, upgrades to British Standard locks and lockouts.', test_town, test_postcodes,
    5000, 4500, with_saturday, now(), 'Test data, not a real business.')
  returning id into tp;
  insert into public.services (tradesperson_id, name, description, estimated_hours, sort_order) values
    (tp, 'Change a front door lock', 'Lock supplied extra', 1, 1),
    (tp, 'Upgrade to anti-snap locks', 'Per door', 1, 2);

  insert into public.tradespeople (slug, status, is_test, business_name, contact_name, email, phone, trade, bio, base_area, postcode_areas,
    hourly_rate_pence, callout_fee_pence, working_hours, approved_at, admin_notes)
  values ('test-roofer', 'approved', true, '[TEST] Example Roofing', 'Test Person', 'test-roofer@example.invalid', '07700900007', 'roofer',
    'EXAMPLE LISTING. Slipped tiles, leaks, guttering and roof inspections.', test_town, test_postcodes,
    5500, 5000, weekdays, now(), 'Test data, not a real business.')
  returning id into tp;
  insert into public.services (tradesperson_id, name, description, estimated_hours, sort_order) values
    (tp, 'Roof inspection', 'With photos of any problems', 1, 1),
    (tp, 'Replace slipped tiles', 'Up to 5 tiles', 2, 2),
    (tp, 'Gutter clearing', 'Typical semi-detached house', 2, 3);
end $$;
