-- ==============================================================================
-- EVENTEASE: Web-Based Event Registration & Ticketing Platform
-- Relational Database Architecture & Concurrency Control (PostgreSQL 15 / Supabase)
-- Aligned with Academic Project Report Architecture Specifications
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- 2.1 PROFILES (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    role VARCHAR(20) NOT NULL DEFAULT 'attendee' CHECK (role IN ('attendee', 'organizer', 'admin')),
    organization VARCHAR(255) DEFAULT 'EventEase Community',
    department VARCHAR(255),
    designation VARCHAR(255),
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    banner_image TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'Technology', 'Business', 'Workshop', 'Sports', 
        'Cultural', 'Education', 'Hackathon', 'Music'
    )),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    location_type VARCHAR(20) NOT NULL DEFAULT 'In-Person' CHECK (location_type IN ('In-Person', 'Virtual', 'Hybrid')),
    virtual_meeting_url TEXT,
    organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    organizer_name VARCHAR(255) NOT NULL,
    organizer_email VARCHAR(255) NOT NULL,
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    registered_count INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0 AND registered_count <= max_capacity),
    checked_in_count INTEGER NOT NULL DEFAULT 0 CHECK (checked_in_count >= 0),
    registration_deadline DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL DEFAULT 'Conference',
    ticket_type VARCHAR(20) NOT NULL DEFAULT 'Free' CHECK (ticket_type IN ('Free', 'Paid')),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'Registration Open' CHECK (status IN (
        'Registration Open', 'Almost Full', 'Registration Closed', 'Completed', 'Cancelled'
    )),
    speakers JSONB NOT NULL DEFAULT '[]'::jsonb,
    agenda JSONB NOT NULL DEFAULT '[]'::jsonb,
    faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
    terms JSONB NOT NULL DEFAULT '[]'::jsonb,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 BOOKINGS (Registrations & Digital Passes)
CREATE TABLE IF NOT EXISTS public.bookings (
    id VARCHAR(50) PRIMARY KEY, -- e.g. "EVT-7F3K92"
    ticket_id VARCHAR(100) NOT NULL UNIQUE, -- e.g. "TCK-8H2K91-4M22"
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    attendee_phone VARCHAR(30) NOT NULL,
    organization VARCHAR(255),
    department VARCHAR(255),
    designation VARCHAR(255),
    dietary_preference VARCHAR(100),
    custom_notes TEXT,
    tshirt_size VARCHAR(20),
    ticket_status VARCHAR(30) NOT NULL DEFAULT 'Confirmed' CHECK (ticket_status IN ('Confirmed', 'Checked In', 'Cancelled')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (payment_status IN ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checked_in_at TIMESTAMPTZ,
    checked_in_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_user_active_booking UNIQUE (event_id, user_id)
);

-- 2.4 WISHLIST (Saved Events)
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_event_wishlist UNIQUE (user_id, event_id)
);

-- 2.5 EVENT FEEDBACKS
CREATE TABLE IF NOT EXISTS public.event_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_avatar TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    suggestions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 ACTIVITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id VARCHAR(100) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH-CONCURRENCY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_id ON public.bookings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, self-update
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Events: Everyone can view, organizers/admins can insert/update
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers and admins can insert events" ON public.events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
);
CREATE POLICY "Organizers can update own events, admins can update any" ON public.events FOR UPDATE USING (
    organizer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings: Attendees view own; organizers view for their events; staff check in
CREATE POLICY "Users view own bookings" ON public.bookings FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.events WHERE events.id = bookings.event_id AND events.organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);

-- Wishlist: Only owner can view, insert, or delete
CREATE POLICY "Users view own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert into own wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete from own wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. ATOMIC STORED PROCEDURES / RPC FUNCTIONS (CONCURRENCY-SAFE)
-- ==============================================================================

-- 5.1 ATOMIC EVENT REGISTRATION WITH ROW-LEVEL LOCKING
CREATE OR REPLACE FUNCTION public.register_for_event(
    p_event_id UUID,
    p_user_id UUID,
    p_attendee_name VARCHAR,
    p_attendee_email VARCHAR,
    p_attendee_phone VARCHAR,
    p_organization VARCHAR DEFAULT NULL,
    p_department VARCHAR DEFAULT NULL,
    p_designation VARCHAR DEFAULT NULL,
    p_dietary VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_tshirt VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_existing_booking RECORD;
    v_reg_id VARCHAR(50);
    v_ticket_id VARCHAR(100);
    v_new_status VARCHAR(30);
    v_new_count INT;
    v_result JSONB;
BEGIN
    -- 1. Lock the target event row exclusively to prevent race conditions & overbooking
    SELECT * INTO v_event
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event with ID % was not found.', p_event_id;
    END IF;

    -- 2. Validate Event State & Status
    IF v_event.status = 'Cancelled' THEN
        RAISE EXCEPTION 'This event has been cancelled.';
    END IF;

    IF v_event.status = 'Completed' OR v_event.event_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Registration closed: Event has already concluded.';
    END IF;

    IF v_event.registration_deadline < CURRENT_DATE THEN
        RAISE EXCEPTION 'Registration deadline for this event has passed.';
    END IF;

    -- 3. Validate Available Capacity Atomically
    IF v_event.registered_count >= v_event.max_capacity THEN
        RAISE EXCEPTION 'Sorry, this event has reached maximum capacity!';
    END IF;

    -- 4. Prevent duplicate active registrations
    SELECT * INTO v_existing_booking
    FROM public.bookings
    WHERE event_id = p_event_id 
      AND (user_id = p_user_id OR LOWER(attendee_email) = LOWER(p_attendee_email))
      AND ticket_status != 'Cancelled';

    IF FOUND THEN
        RAISE EXCEPTION 'User is already registered for this event with ticket %', v_existing_booking.ticket_id;
    END IF;

    -- 5. Generate unique identifiers
    v_reg_id := 'EVT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    v_ticket_id := 'TCK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6)) || '-' || TO_CHAR(NOW(), 'YYMM');

    -- 6. Insert booking record
    INSERT INTO public.bookings (
        id,
        ticket_id,
        event_id,
        user_id,
        attendee_name,
        attendee_email,
        attendee_phone,
        organization,
        department,
        designation,
        dietary_preference,
        custom_notes,
        tshirt_size,
        ticket_status,
        payment_status,
        ticket_price,
        registered_at
    ) VALUES (
        v_reg_id,
        v_ticket_id,
        p_event_id,
        p_user_id,
        p_attendee_name,
        p_attendee_email,
        p_attendee_phone,
        p_organization,
        p_department,
        p_designation,
        p_dietary,
        p_notes,
        p_tshirt,
        'Confirmed',
        CASE WHEN v_event.ticket_type = 'Free' OR v_event.price = 0 THEN 'NOT_REQUIRED' ELSE 'PAID' END,
        v_event.price,
        NOW()
    );

    -- 7. Atomically increment capacity and update dynamic status
    v_new_count := v_event.registered_count + 1;
    v_new_status := v_event.status;

    IF v_new_count >= v_event.max_capacity THEN
        v_new_status := 'Registration Closed';
    ELSIF v_new_count >= (v_event.max_capacity * 0.9)::INT THEN
        v_new_status := 'Almost Full';
    END IF;

    UPDATE public.events
    SET 
        registered_count = v_new_count,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = p_event_id;

    -- 8. Return confirmation payload
    SELECT jsonb_build_object(
        'success', true,
        'registration_id', v_reg_id,
        'ticket_id', v_ticket_id,
        'event_id', p_event_id,
        'registered_count', v_new_count,
        'status', v_new_status
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 5.2 ATOMIC CANCELLATION & SEAT RESTORATION
CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id VARCHAR,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
    v_event RECORD;
    v_new_count INT;
    v_new_status VARCHAR(30);
    v_result JSONB;
BEGIN
    -- 1. Find and lock the booking row
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking % not found.', p_booking_id;
    END IF;

    -- Verify ownership (unless called by admin)
    IF v_booking.user_id != p_user_id THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'admin') THEN
            RAISE EXCEPTION 'Unauthorized to cancel this booking.';
        END IF;
    END IF;

    IF v_booking.ticket_status = 'Cancelled' THEN
        RAISE EXCEPTION 'Booking % is already cancelled.', p_booking_id;
    END IF;

    -- 2. Lock event row to safely decrement registered count
    SELECT * INTO v_event
    FROM public.events
    WHERE id = v_booking.event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated event % not found.', v_booking.event_id;
    END IF;

    -- 3. Mark booking as cancelled
    UPDATE public.bookings
    SET 
        ticket_status = 'Cancelled',
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- 4. Restore seat capacity safely
    v_new_count := GREATEST(0, v_event.registered_count - 1);
    v_new_status := v_event.status;

    IF v_new_status = 'Registration Closed' AND v_new_count < v_event.max_capacity THEN
        IF v_new_count >= (v_event.max_capacity * 0.9)::INT THEN
            v_new_status := 'Almost Full';
        ELSE
            v_new_status := 'Registration Open';
        END IF;
    END IF;

    UPDATE public.events
    SET 
        registered_count = v_new_count,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = v_booking.event_id;

    SELECT jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'event_id', v_booking.event_id,
        'registered_count', v_new_count,
        'status', v_new_status
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 5.3 FAST TICKET CHECK-IN VIA QR SCAN OR TICKET CODE
CREATE OR REPLACE FUNCTION public.check_in_attendee(
    p_ticket_id VARCHAR,
    p_checked_in_by VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
    v_result JSONB;
BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE (ticket_id = p_ticket_id OR id = p_ticket_id)
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid Ticket: Code not found in registry');
    END IF;

    IF v_booking.ticket_status = 'Cancelled' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ticket has been cancelled and cannot be used');
    END IF;

    IF v_booking.ticket_status = 'Checked In' THEN
        RETURN jsonb_build_object(
            'success', false,
            'alreadyCheckedIn', true,
            'message', 'Ticket was already checked in at ' || v_booking.checked_in_at::TEXT
        );
    END IF;

    UPDATE public.bookings
    SET 
        ticket_status = 'Checked In',
        checked_in_at = NOW(),
        checked_in_by = p_checked_in_by,
        updated_at = NOW()
    WHERE id = v_booking.id;

    UPDATE public.events
    SET 
        checked_in_count = checked_in_count + 1,
        updated_at = NOW()
    WHERE id = v_booking.event_id;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking.id,
        'ticket_id', v_booking.ticket_id,
        'attendee_name', v_booking.attendee_name,
        'attendee_email', v_booking.attendee_email,
        'organization', v_booking.organization,
        'checked_in_at', NOW()
    );
END;
$$;
