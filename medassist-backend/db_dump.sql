--
-- PostgreSQL database dump
--

\restrict dzEonpeetWsDDQsa7gGWvogdC2jdrSrw7h7b9XHcplhnk4NHkPb8PmEq5GkJCAW

-- Dumped from database version 18.1 (Postgres.app)
-- Dumped by pg_dump version 18.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: nanthinik
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    visitor_id uuid,
    doctor_id text,
    thirdparty_booking_id text,
    service_type text,
    timeslot timestamp with time zone,
    status text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    attendance_status text DEFAULT 'PENDING'::text,
    followup_sent boolean DEFAULT false,
    doctor_name text,
    severity text,
    reminded boolean DEFAULT false,
    reschedule_count integer DEFAULT 0
);


ALTER TABLE public.bookings OWNER TO nanthinik;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: nanthinik
--

CREATE TABLE public.doctors (
    id text NOT NULL,
    name text NOT NULL,
    specialty text NOT NULL,
    email text,
    phone text
);


ALTER TABLE public.doctors OWNER TO nanthinik;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: nanthinik
--

CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid(),
    visitor_id uuid,
    operator_id text,
    note text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notes OWNER TO nanthinik;

--
-- Name: notifications_log; Type: TABLE; Schema: public; Owner: nanthinik
--

CREATE TABLE public.notifications_log (
    id integer NOT NULL,
    booking_id uuid NOT NULL,
    type character varying(100) NOT NULL,
    to_contact character varying(255) NOT NULL,
    payload jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications_log OWNER TO nanthinik;

--
-- Name: notifications_log_id_seq; Type: SEQUENCE; Schema: public; Owner: nanthinik
--

CREATE SEQUENCE public.notifications_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_log_id_seq OWNER TO nanthinik;

--
-- Name: notifications_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nanthinik
--

ALTER SEQUENCE public.notifications_log_id_seq OWNED BY public.notifications_log.id;


--
-- Name: otps; Type: TABLE; Schema: public; Owner: nanthinik
--

CREATE TABLE public.otps (
    phone text,
    otp_code text,
    expires_at timestamp without time zone,
    send_count_hour integer DEFAULT 0,
    send_count_day integer DEFAULT 0,
    last_sent_at timestamp without time zone
);


ALTER TABLE public.otps OWNER TO nanthinik;

--
-- Name: slots_id_seq; Type: SEQUENCE; Schema: public; Owner: nanthinik
--

CREATE SEQUENCE public.slots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.slots_id_seq OWNER TO nanthinik;

--
-- Name: slots; Type: TABLE; Schema: public; Owner: nanthinik
--

CREATE TABLE public.slots (
    id text DEFAULT nextval('public.slots_id_seq'::regclass) NOT NULL,
    doctor_id text,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    duration integer DEFAULT 30,
    status text DEFAULT 'available'::text,
    slot_type character varying(20)
);


ALTER TABLE public.slots OWNER TO nanthinik;

--
-- Name: visitors; Type: TABLE; Schema: public; Owner: nanthinik
--

CREATE TABLE public.visitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    email text,
    phone text,
    created_at timestamp without time zone DEFAULT now(),
    age integer,
    gender text
);


ALTER TABLE public.visitors OWNER TO nanthinik;

--
-- Name: notifications_log id; Type: DEFAULT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.notifications_log ALTER COLUMN id SET DEFAULT nextval('public.notifications_log_id_seq'::regclass);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: nanthinik
--

COPY public.bookings (id, visitor_id, doctor_id, thirdparty_booking_id, service_type, timeslot, status, created_at, updated_at, attendance_status, followup_sent, doctor_name, severity, reminded, reschedule_count) FROM stdin;
bd5a431f-d665-4276-9065-bfcd7ebd5856	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:14:21.734011	2025-11-28 20:14:21.734011	PENDING	f	Dr. Smith	LOW	f	0
9d066748-1233-411e-97c1-13190340a7eb	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:15:12.846319	2025-11-28 20:15:12.846319	PENDING	f	Dr. Smith	LOW	f	0
bf033d91-7a97-41c9-850d-4535ef020145	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:15:25.396392	2025-11-28 20:15:25.396392	PENDING	f	Dr. Smith	LOW	f	0
a12fc888-77f0-483f-bb3d-e16f330f0dc0	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:16:57.013437	2025-11-28 20:16:57.013437	PENDING	f	Dr. Smith	LOW	f	0
2cb4e9a6-436f-4213-a472-50f8be3cf19c	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:18:38.641708	2025-11-28 20:18:38.641708	PENDING	f	Dr. Smith	LOW	f	0
70234bdd-0edd-4461-8935-fbddb407ab0a	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:23:22.583964	2025-11-28 20:23:22.583964	PENDING	f	Dr. Smith	LOW	f	0
1e58335d-543e-4f66-a1e7-9d08affdb7a6	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:27:03.842747	2025-11-28 20:27:03.842747	PENDING	f	Dr. Smith	LOW	f	0
389921a6-cafa-4e4e-b530-55c505404c09	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:30:13.263899	2025-11-28 20:30:13.263899	PENDING	f	Dr. Smith	LOW	f	0
7063afcc-57b5-41fd-a39d-5c45e9d513db	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:36:16.818673	2025-11-28 20:36:16.818673	PENDING	f	Dr. Smith	LOW	f	0
12c61062-9f4f-487e-8029-f0f61abe3e82	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:39:47.41054	2025-11-28 20:39:47.41054	PENDING	f	Dr. Smith	LOW	f	0
68e3ea71-385d-4668-990d-44faa880569d	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:43:46.220682	2025-11-28 20:43:46.220682	PENDING	f	Dr. Smith	LOW	f	0
2b04834f-7397-44aa-8115-2a07d17a405c	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:46:51.262381	2025-11-28 20:46:51.262381	PENDING	f	Dr. Smith	LOW	f	0
47a48f59-1c60-4df7-b3ac-09296d1dd2cf	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:48:24.036857	2025-11-28 20:48:24.036857	PENDING	f	Dr. Smith	LOW	f	0
2385ea7f-4b64-4b02-8d2b-9f1f0a9ee7a0	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:52:44.694499	2025-11-28 20:52:44.694499	PENDING	f	Dr. Smith	LOW	f	0
16119f8f-cade-4179-b028-667f3d3ac5ed	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1234567	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-28 20:54:11.249683	2025-11-28 20:54:11.249683	PENDING	f	Dr. Smith	LOW	f	0
a5ba706d-a04e-4f8a-86f2-e1e7fcd50cc7	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1	Consultation	2025-12-01 14:30:00+05:30	booked	2025-11-28 21:30:44.968348	2025-11-28 21:30:44.968348	PENDING	f	Dr. Smith	LOW	f	0
517b6214-5199-4ecf-8d61-ad00205fa57f	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1	Consultation	2025-12-01 14:30:00+05:30	booked	2025-11-28 21:33:19.862915	2025-11-28 21:33:19.862915	PENDING	f	Dr. Smith	LOW	f	0
31c3d133-c48a-4657-9f02-869b046e934c	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1	Consultation	2025-12-01 14:30:00+05:30	booked	2025-11-28 21:39:51.477105	2025-11-28 21:39:51.477105	PENDING	f	Dr. Smith	LOW	f	0
324f3e85-8230-4c76-af2f-6544743ebb1e	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:20:08.566052	2025-11-29 21:20:08.566052	PENDING	f	Dr. Smith	LOW	f	0
88942436-257c-4548-8e79-27bd0fdd20b4	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:21:25.689791	2025-11-29 21:21:25.689791	PENDING	f	Dr. Smith	LOW	f	0
f219ff3e-2775-4851-a83d-53650668caf3	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:21:30.097695	2025-11-29 21:21:30.097695	PENDING	f	Dr. Smith	LOW	f	0
6ec7efd9-6d28-4810-84a1-af3bcc3ace47	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:22:08.442218	2025-11-29 21:22:08.442218	PENDING	f	Dr. Smith	LOW	f	0
42a7f01f-62a3-4413-bfe2-40a95efd0c65	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:26:50.322168	2025-11-29 21:26:50.322168	PENDING	f	Dr. Smith	LOW	f	0
83fca0ef-a63d-4cce-bca6-6387f727ec26	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:26:52.435337	2025-11-29 21:26:52.435337	PENDING	f	Dr. Smith	LOW	f	0
5ecd7f9e-d2de-45cd-9152-bafa3a02de12	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:28:40.364129	2025-11-29 21:28:40.364129	PENDING	f	Dr. Smith	LOW	f	0
3744c125-5cd7-4414-844d-d87f96e4e763	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:29:02.666153	2025-11-29 21:29:02.666153	PENDING	f	Dr. Smith	LOW	f	0
f11b0bd9-6b7a-49bc-a2ef-29819a3516f2	20d94532-4285-449d-90c5-8bd6dbd117e2	some-doctor-uuid	some-slot-uuid	Consultation	2025-11-30 16:00:00+05:30	booked	2025-11-29 21:29:29.272257	2025-11-29 21:29:29.272257	PENDING	f	Dr. Smith	LOW	f	0
b2855189-677e-40b2-a29d-efc8ec00fe3d	e6ed4101-f9eb-463c-af15-b427ea5bd120	D001	1	Consultation	2025-12-01 14:30:00+05:30	completed	2025-11-28 22:03:01.189211	2025-11-29 23:12:40.683061	PRESENT	f	Dr. Smith	LOW	f	0
597853b4-a97e-4d28-8768-aeef52d3790e	e6ed4101-f9eb-463c-af15-b427ea5bd120	DOC-001	SLOT-102	General Consultation	2025-12-02 17:00:00+05:30	cancelled	2025-11-29 22:50:34.380435	2025-11-30 08:42:44.347266	PRESENT	f	Dr. Rahul	MEDIUM	f	0
06d1aeec-5c1b-441a-8fc1-c222f44681b5	e6ed4101-f9eb-463c-af15-b427ea5bd120	DOC-101	SLOT-55	General Consultation	2025-12-01 16:30:00+05:30	booked	2025-11-30 09:03:09.544623	2025-11-30 09:03:09.544623	PENDING	f	Dr. Priya Sharma	MEDIUM	f	0
7d041320-03e5-47eb-816e-f9aceca6b2e4	e6ed4101-f9eb-463c-af15-b427ea5bd120	DOC-101	SLOT-55	General Consultation	2025-12-01 16:30:00+05:30	booked	2025-11-30 09:12:12.817257	2025-11-30 09:12:12.817257	PENDING	f	Dr. Priya Sharma	MEDIUM	f	0
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: nanthinik
--

COPY public.doctors (id, name, specialty, email, phone) FROM stdin;
D001	Dr. Smith	Cardiologist	smith@clinic.com	9876543210
D002	Dr. Jane	Dermatologist	jane@clinic.com	9876543211
D003	Dr. Raj	Neurologist	raj@clinic.com	9876543212
D004	Dr. Priya	Pediatrician	priya@clinic.com	9876543213
D005	Dr. Arjun	Orthopedic	arjun@clinic.com	9876543214
D006	Dr. Kavya	ENT	kavya@clinic.com	9876543215
D007	Dr. Anil	Gastroenterologist	anil@clinic.com	9876543216
D008	Dr. Meena	Ophthalmologist	meena@clinic.com	9876543217
D009	Dr. Vikram	Endocrinologist	vikram@clinic.com	9876543218
D010	Dr. Sneha	Psychiatrist	sneha@clinic.com	9876543219
D011	Dr. Rohit	Pulmonologist	rohit@clinic.com	9876543220
D012	Dr. Aisha	Nephrologist	aisha@clinic.com	9876543221
D013	Dr. Karthik	Urologist	karthik@clinic.com	9876543222
D014	Dr. Latha	Rheumatologist	latha@clinic.com	9876543223
D015	Dr. Suresh	Oncologist	suresh@clinic.com	9876543224
D016	Dr. Priyanka	Cardiologist	priyanka@clinic.com	9876543225
D017	Dr. Harish	Dermatologist	harish@clinic.com	9876543226
D018	Dr. Nisha	Pediatrician	nisha@clinic.com	9876543227
D019	Dr. Kiran	ENT	kiran@clinic.com	9876543228
D020	Dr. Divya	Orthopedic	divya@clinic.com	9876543229
D021	Dr. Ramesh	Neurologist	ramesh@clinic.com	9876543230
D022	Dr. Ananya	Ophthalmologist	ananya@clinic.com	9876543231
D023	Dr. Vinay	Gastroenterologist	vinay@clinic.com	9876543232
D024	Dr. Mehul	Endocrinologist	mehul@clinic.com	9876543233
D025	Dr. Tanvi	Psychiatrist	tanvi@clinic.com	9876543234
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: nanthinik
--

COPY public.notes (id, visitor_id, operator_id, note, created_at) FROM stdin;
\.


--
-- Data for Name: notifications_log; Type: TABLE DATA; Schema: public; Owner: nanthinik
--

COPY public.notifications_log (id, booking_id, type, to_contact, payload, created_at) FROM stdin;
1	389921a6-cafa-4e4e-b530-55c505404c09	booking_confirm	9876543210	{"bookingId": "389921a6-cafa-4e4e-b530-55c505404c09"}	2025-11-28 20:30:17.971994
2	7063afcc-57b5-41fd-a39d-5c45e9d513db	booking_confirm	9876543210	{"bookingId": "7063afcc-57b5-41fd-a39d-5c45e9d513db"}	2025-11-28 20:36:28.584116
3	12c61062-9f4f-487e-8029-f0f61abe3e82	booking_confirm	9876543210	{"bookingId": "12c61062-9f4f-487e-8029-f0f61abe3e82"}	2025-11-28 20:39:49.573418
4	68e3ea71-385d-4668-990d-44faa880569d	booking_confirm	9876543210	{"bookingId": "68e3ea71-385d-4668-990d-44faa880569d"}	2025-11-28 20:43:47.563668
5	2b04834f-7397-44aa-8115-2a07d17a405c	booking_confirm	9876543210	{"bookingId": "2b04834f-7397-44aa-8115-2a07d17a405c"}	2025-11-28 20:46:52.113115
6	47a48f59-1c60-4df7-b3ac-09296d1dd2cf	booking_confirm	9876543210	{"bookingId": "47a48f59-1c60-4df7-b3ac-09296d1dd2cf"}	2025-11-28 20:48:30.010992
7	2385ea7f-4b64-4b02-8d2b-9f1f0a9ee7a0	booking_confirm	9876543210	{"bookingId": "2385ea7f-4b64-4b02-8d2b-9f1f0a9ee7a0"}	2025-11-28 20:52:47.984646
8	16119f8f-cade-4179-b028-667f3d3ac5ed	booking_confirm	9876543210	{"bookingId": "16119f8f-cade-4179-b028-667f3d3ac5ed"}	2025-11-28 20:54:14.335835
9	a5ba706d-a04e-4f8a-86f2-e1e7fcd50cc7	booking_confirm	9876543210	{"bookingId": "a5ba706d-a04e-4f8a-86f2-e1e7fcd50cc7"}	2025-11-28 21:30:50.475243
10	517b6214-5199-4ecf-8d61-ad00205fa57f	booking_confirm	9876543210	{"bookingId": "517b6214-5199-4ecf-8d61-ad00205fa57f"}	2025-11-28 21:33:24.742254
11	31c3d133-c48a-4657-9f02-869b046e934c	booking_confirm	9876543210	{"bookingId": "31c3d133-c48a-4657-9f02-869b046e934c"}	2025-11-28 21:39:57.537892
12	b2855189-677e-40b2-a29d-efc8ec00fe3d	booking_confirm	9876543210	{"bookingId": "b2855189-677e-40b2-a29d-efc8ec00fe3d"}	2025-11-28 22:03:05.888515
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: nanthinik
--

COPY public.otps (phone, otp_code, expires_at, send_count_hour, send_count_day, last_sent_at) FROM stdin;
9876543210	283168	2025-11-29 20:46:43.352	1	0	2025-11-29 20:41:43.273
\.


--
-- Data for Name: slots; Type: TABLE DATA; Schema: public; Owner: nanthinik
--

COPY public.slots (id, doctor_id, date, "time", duration, status, slot_type) FROM stdin;
1	D001	2025-12-01	09:00:00	30	available	morning
2	D001	2025-12-01	15:00:00	30	available	afternoon
3	D002	2025-12-01	09:30:00	30	available	morning
4	D002	2025-12-01	15:30:00	30	available	afternoon
5	D003	2025-12-01	10:00:00	30	available	morning
6	D003	2025-12-01	16:00:00	30	available	afternoon
7	D004	2025-12-01	10:30:00	30	available	morning
8	D004	2025-12-01	16:30:00	30	available	afternoon
9	D005	2025-12-01	11:00:00	30	available	morning
10	D005	2025-12-01	17:00:00	30	available	afternoon
11	D006	2025-12-01	11:30:00	30	available	morning
12	D006	2025-12-01	17:30:00	30	available	afternoon
13	D007	2025-12-01	09:15:00	30	available	morning
14	D007	2025-12-01	15:15:00	30	available	afternoon
15	D008	2025-12-01	09:45:00	30	available	morning
16	D008	2025-12-01	15:45:00	30	available	afternoon
17	D009	2025-12-01	10:15:00	30	available	morning
18	D009	2025-12-01	16:15:00	30	available	afternoon
19	D010	2025-12-01	10:45:00	30	available	morning
20	D010	2025-12-01	16:45:00	30	available	afternoon
21	D011	2025-12-01	09:20:00	30	available	morning
22	D011	2025-12-01	15:20:00	30	available	afternoon
23	D012	2025-12-01	09:50:00	30	available	morning
24	D012	2025-12-01	15:50:00	30	available	afternoon
25	D013	2025-12-01	10:10:00	30	available	morning
26	D013	2025-12-01	16:10:00	30	available	afternoon
27	D014	2025-12-01	10:40:00	30	available	morning
28	D014	2025-12-01	16:40:00	30	available	afternoon
29	D015	2025-12-01	11:05:00	30	available	morning
30	D015	2025-12-01	17:05:00	30	available	afternoon
31	D016	2025-12-01	11:35:00	30	available	morning
32	D016	2025-12-01	17:35:00	30	available	afternoon
33	D017	2025-12-01	09:10:00	30	available	morning
34	D017	2025-12-01	15:10:00	30	available	afternoon
35	D018	2025-12-01	09:40:00	30	available	morning
36	D018	2025-12-01	15:40:00	30	available	afternoon
37	D019	2025-12-01	10:05:00	30	available	morning
38	D019	2025-12-01	16:05:00	30	available	afternoon
39	D020	2025-12-01	10:35:00	30	available	morning
40	D020	2025-12-01	16:35:00	30	available	afternoon
41	D021	2025-12-01	11:00:00	30	available	morning
42	D021	2025-12-01	17:00:00	30	available	afternoon
43	D022	2025-12-01	11:30:00	30	available	morning
44	D022	2025-12-01	17:30:00	30	available	afternoon
45	D023	2025-12-01	09:25:00	30	available	morning
46	D023	2025-12-01	15:25:00	30	available	afternoon
47	D024	2025-12-01	09:55:00	30	available	morning
48	D024	2025-12-01	15:55:00	30	available	afternoon
49	D025	2025-12-01	10:20:00	30	available	morning
50	D025	2025-12-01	16:20:00	30	available	afternoon
\.


--
-- Data for Name: visitors; Type: TABLE DATA; Schema: public; Owner: nanthinik
--

COPY public.visitors (id, name, email, phone, created_at, age, gender) FROM stdin;
5da85719-4ed6-4d05-ac01-592484797d55	\N	\N	9876543210	2025-11-28 19:23:50.348512	\N	\N
20542ebc-e655-4d23-8a1a-f2e5492151bb	\N	\N	9876543210	2025-11-29 20:42:58.052362	\N	\N
ec1404a8-47e9-46fa-a783-2ac748cefc71	Nanthini	\N	9876543210	2025-11-29 20:43:44.654048	\N	\N
e609ba45-9bfb-45b0-bd8d-0c9148951e0e	Nanthini	nanthini19052005@gmail.com	9876543210	2025-11-29 20:44:51.605436	21	\N
20d94532-4285-449d-90c5-8bd6dbd117e2	Nanthini	nanthini19052005+1@gmail.com	9876543211	2025-11-29 20:47:54.764721	21	\N
e6ed4101-f9eb-463c-af15-b427ea5bd120	Darshan Kumar	darshan@example.com	9876543210	2025-11-28 19:44:30.670966	24	male
\.


--
-- Name: notifications_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanthinik
--

SELECT pg_catalog.setval('public.notifications_log_id_seq', 12, true);


--
-- Name: slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nanthinik
--

SELECT pg_catalog.setval('public.slots_id_seq', 50, true);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: notifications_log notifications_log_pkey; Type: CONSTRAINT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.notifications_log
    ADD CONSTRAINT notifications_log_pkey PRIMARY KEY (id);


--
-- Name: slots slots_pkey; Type: CONSTRAINT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_pkey PRIMARY KEY (id);


--
-- Name: visitors visitors_email_key; Type: CONSTRAINT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.visitors
    ADD CONSTRAINT visitors_email_key UNIQUE (email);


--
-- Name: visitors visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.visitors
    ADD CONSTRAINT visitors_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_visitor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_visitor_id_fkey FOREIGN KEY (visitor_id) REFERENCES public.visitors(id);


--
-- Name: slots slots_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nanthinik
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);


--
-- PostgreSQL database dump complete
--

\unrestrict dzEonpeetWsDDQsa7gGWvogdC2jdrSrw7h7b9XHcplhnk4NHkPb8PmEq5GkJCAW

