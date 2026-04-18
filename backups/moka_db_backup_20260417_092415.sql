--
-- PostgreSQL database cluster dump
--

\restrict chfeCHVLhIlpIjTAzmRdEQnyzgHjTt8rIqb1Wb4ZL7rERVv5W8IzYzVksw7fCOP

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE moka;
ALTER ROLE moka WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:bUP/tvYAv1CAV3nKLuvY+Q==$GPFO2JfHysPAH9FU51UvkS8jCCDy8SCbjTm0aHJD+F4=:SmQBx4X01fzaAt9NS7KdG0oihOEGgWuCYvrM4DAnwKk=';

--
-- User Configurations
--








\unrestrict chfeCHVLhIlpIjTAzmRdEQnyzgHjTt8rIqb1Wb4ZL7rERVv5W8IzYzVksw7fCOP

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict dbRFPMsGX0pbHw2OvbkmqmO4ggznA3jayl0JSX5MOdmKlfhcHCDl5OwTMjJ3xPN

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict dbRFPMsGX0pbHw2OvbkmqmO4ggznA3jayl0JSX5MOdmKlfhcHCDl5OwTMjJ3xPN

--
-- Database "moka_db" dump
--

--
-- PostgreSQL database dump
--

\restrict NVbF9reh9d5SvaVJMQeycqJLgom01cgi8ocHH7Z3a1LxK8FbE4KNaZju0F5a6n9

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: moka_db; Type: DATABASE; Schema: -; Owner: moka
--

CREATE DATABASE moka_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE moka_db OWNER TO moka;

\unrestrict NVbF9reh9d5SvaVJMQeycqJLgom01cgi8ocHH7Z3a1LxK8FbE4KNaZju0F5a6n9
\connect moka_db
\restrict NVbF9reh9d5SvaVJMQeycqJLgom01cgi8ocHH7Z3a1LxK8FbE4KNaZju0F5a6n9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CandidateSource; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."CandidateSource" AS ENUM (
    'BOSS',
    'REFERRAL',
    'HEADHUNTER',
    'WEBSITE'
);


ALTER TYPE public."CandidateSource" OWNER TO moka;

--
-- Name: CandidateStatus; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."CandidateStatus" AS ENUM (
    'PENDING',
    'SCREENING',
    'INTERVIEW_1',
    'INTERVIEW_2',
    'INTERVIEW_3',
    'HIRED',
    'REJECTED'
);


ALTER TYPE public."CandidateStatus" OWNER TO moka;

--
-- Name: FeedbackResult; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."FeedbackResult" AS ENUM (
    'PASS',
    'FAIL',
    'PENDING'
);


ALTER TYPE public."FeedbackResult" OWNER TO moka;

--
-- Name: InterviewFormat; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."InterviewFormat" AS ENUM (
    'ONLINE',
    'OFFLINE'
);


ALTER TYPE public."InterviewFormat" OWNER TO moka;

--
-- Name: InterviewStatus; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."InterviewStatus" AS ENUM (
    'SCHEDULED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."InterviewStatus" OWNER TO moka;

--
-- Name: InterviewType; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."InterviewType" AS ENUM (
    'INTERVIEW_1',
    'INTERVIEW_2',
    'INTERVIEW_3'
);


ALTER TYPE public."InterviewType" OWNER TO moka;

--
-- Name: MentionStatus; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."MentionStatus" AS ENUM (
    'PENDING',
    'VIEWED',
    'RESPONDED'
);


ALTER TYPE public."MentionStatus" OWNER TO moka;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."NotificationType" AS ENUM (
    'INTERVIEW_REMINDER',
    'FEEDBACK_REQUEST',
    'PROCESS_UPDATE',
    'SYSTEM'
);


ALTER TYPE public."NotificationType" OWNER TO moka;

--
-- Name: PositionStatus; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."PositionStatus" AS ENUM (
    'OPEN',
    'PAUSED',
    'CLOSED'
);


ALTER TYPE public."PositionStatus" OWNER TO moka;

--
-- Name: ProcessStatus; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."ProcessStatus" AS ENUM (
    'IN_PROGRESS',
    'WAITING_HR',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ProcessStatus" OWNER TO moka;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: moka
--

CREATE TYPE public."Role" AS ENUM (
    'HR',
    'INTERVIEWER'
);


ALTER TYPE public."Role" OWNER TO moka;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: InterviewEmailLog; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public."InterviewEmailLog" (
    id text NOT NULL,
    "interviewId" text NOT NULL,
    "candidateId" text NOT NULL,
    "recipientEmail" text NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    "sentBy" text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'sent'::text NOT NULL,
    "errorMessage" text
);


ALTER TABLE public."InterviewEmailLog" OWNER TO moka;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO moka;

--
-- Name: candidate_mentions; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.candidate_mentions (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "interviewerId" text NOT NULL,
    "mentionedById" text NOT NULL,
    message text,
    status public."MentionStatus" DEFAULT 'PENDING'::public."MentionStatus" NOT NULL,
    "viewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.candidate_mentions OWNER TO moka;

--
-- Name: candidate_status_history; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.candidate_status_history (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "oldStatus" public."CandidateStatus",
    "newStatus" public."CandidateStatus" NOT NULL,
    reason text,
    "changedBy" text,
    "relatedInterviewId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.candidate_status_history OWNER TO moka;

--
-- Name: candidates; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.candidates (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    "positionId" text,
    status public."CandidateStatus" DEFAULT 'PENDING'::public."CandidateStatus" NOT NULL,
    source public."CandidateSource",
    "resumeUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.candidates OWNER TO moka;

--
-- Name: feedback_tokens; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.feedback_tokens (
    id text NOT NULL,
    "interviewId" text NOT NULL,
    "interviewerId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "isUsed" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.feedback_tokens OWNER TO moka;

--
-- Name: interview_feedbacks; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.interview_feedbacks (
    id text NOT NULL,
    "interviewId" text NOT NULL,
    "interviewerId" text NOT NULL,
    result public."FeedbackResult" NOT NULL,
    strengths text,
    weaknesses text,
    "overallRating" integer,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.interview_feedbacks OWNER TO moka;

--
-- Name: interview_processes; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.interview_processes (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "positionId" text NOT NULL,
    "currentRound" integer DEFAULT 1 NOT NULL,
    "totalRounds" integer DEFAULT 3 NOT NULL,
    status public."ProcessStatus" DEFAULT 'IN_PROGRESS'::public."ProcessStatus" NOT NULL,
    "hasHRRound" boolean DEFAULT true NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public.interview_processes OWNER TO moka;

--
-- Name: interview_rounds; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.interview_rounds (
    id text NOT NULL,
    "processId" text NOT NULL,
    "roundNumber" integer NOT NULL,
    "interviewerId" text NOT NULL,
    "isHRRound" boolean DEFAULT false NOT NULL,
    "roundType" text NOT NULL
);


ALTER TABLE public.interview_rounds OWNER TO moka;

--
-- Name: interviews; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.interviews (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "positionId" text NOT NULL,
    "interviewerId" text NOT NULL,
    type public."InterviewType" NOT NULL,
    format public."InterviewFormat" NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    location text,
    "meetingUrl" text,
    "meetingNumber" text,
    status public."InterviewStatus" DEFAULT 'SCHEDULED'::public."InterviewStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" text,
    "isHRRound" boolean DEFAULT false NOT NULL,
    "processId" text,
    "roundNumber" integer
);


ALTER TABLE public.interviews OWNER TO moka;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO moka;

--
-- Name: positions; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.positions (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    requirements text,
    "salaryMin" integer,
    "salaryMax" integer,
    headcount integer DEFAULT 1 NOT NULL,
    "hiredCount" integer DEFAULT 0 NOT NULL,
    "inProgressCount" integer DEFAULT 0 NOT NULL,
    status public."PositionStatus" DEFAULT 'OPEN'::public."PositionStatus" NOT NULL,
    location text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.positions OWNER TO moka;

--
-- Name: resume_files; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.resume_files (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "fileName" text NOT NULL,
    "fileType" text NOT NULL,
    "fileSize" integer NOT NULL,
    "filePath" text NOT NULL,
    "fileUrl" text NOT NULL,
    "uploadedBy" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.resume_files OWNER TO moka;

--
-- Name: users; Type: TABLE; Schema: public; Owner: moka
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    email text,
    role public."Role" DEFAULT 'INTERVIEWER'::public."Role" NOT NULL,
    "avatarUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO moka;

--
-- Data for Name: InterviewEmailLog; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public."InterviewEmailLog" (id, "interviewId", "candidateId", "recipientEmail", subject, content, "sentBy", "sentAt", status, "errorMessage") FROM stdin;
204005e6-39bc-4a8a-be57-f65706b252bc	13443001-a6ce-4ac2-bf30-34b73cc4aa2a	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	liuyongneng1015@126.com	面试通知 - AI智能体架构师	<p>尊敬的 <strong>刘永能</strong> 您好：</p><p>\n</p><p>感谢您应聘我司 <strong>AI智能体架构师</strong> 职位。经过初步筛选，我们诚挚邀请您参加面试：</p><p>\n</p><p><br></p><p>\n</p><h3>面试信息</h3><p>\n</p><p><strong>职位：</strong>AI智能体架构师</p><p>\n</p><p><strong>时间：</strong><span style="color: #4371FF;">2026年4月15日 2026年4月15日 10:00 - 11:00</span></p><p>\n</p><p><strong>形式：</strong>线上</p><p>\n\n</p><p><strong>会议链接：</strong><a href="#腾讯会议：351-322-626">#腾讯会议：351-322-626</a></p><p>\n</p><p><strong>面试官：</strong>肖仕杰</p><p>\n</p><p><br></p><p>\n</p><p>请您准时参加。如有任何问题，请随时与我们联系。</p><p>\n</p><p>祝您面试顺利！</p>	system	2026-04-14 09:40:42.657	sent	\N
5d5be081-2432-4914-9279-588b7066d43a	4fa94d00-ae24-4db9-ba46-e3dd71d0dd80	2c16f1b1-543c-4f5b-8e44-55d5af77966a	18883145918@163.com	面试通知 - AI智能体架构师	<p>尊敬的 <strong>曹奇</strong> 您好：</p><p>\n</p><p>感谢您应聘我司 <strong>AI智能体架构师</strong> 职位。经过初步筛选，我们诚挚邀请您参加面试：</p><p>\n</p><p><br></p><p>\n</p><h3>面试信息</h3><p>\n</p><p><strong>职位：</strong>AI智能体架构师</p><p>\n</p><p><strong>时间：</strong><span style="color: #4371FF;">2026年4月15日 2026年4月15日 19:00 - 20:00</span></p><p>\n</p><p><strong>形式：</strong>线上</p><p>\n\n</p><p><strong>会议链接：</strong><a href="#腾讯会议：919-357-453">#腾讯会议：919-357-453</a></p><p>\n</p><p><strong>面试官：</strong>肖仕杰</p><p>\n</p><p><br></p><p>\n</p><p>请您准时参加。如有任何问题，请随时与我们联系。</p><p>\n</p><p>祝您面试顺利！</p>	system	2026-04-14 10:01:10.165	sent	\N
7f9ddaed-1965-429e-b0b8-cbc97d447133	eeac9dba-ec41-4463-9fa4-c49f9a46984f	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	liuyongneng1015@126.com	面试通知 - AI智能体架构师	<p>尊敬的 <strong>刘永能</strong> 您好：</p><p>\n</p><p>感谢您应聘我司 <strong>AI智能体架构师</strong> 职位。经过初步筛选，我们诚挚邀请您参加面试：</p><p>\n</p><p><br></p><p>\n</p><h3>面试信息</h3><p>\n</p><p><strong>职位：</strong>AI智能体架构师</p><p>\n</p><p><strong>时间：</strong><span style="color: #4371FF;">2026年4月16日 2026年4月16日 11:00 - 12:00</span></p><p>\n</p><p><strong>形式：</strong>线上</p><p>\n\n</p><p><strong>会议链接：</strong><a href="#腾讯会议：429-760-917">#腾讯会议：429-760-917</a></p><p>\n</p><p><strong>面试官：</strong>吴素敏</p><p>\n</p><p><br></p><p>\n</p><p>请您准时参加。如有任何问题，请随时与我们联系。</p><p>\n</p><p>祝您面试顺利！</p>	system	2026-04-15 05:45:56.926	sent	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b09e5bb8-5c84-4cd4-b4ab-3945e9019dfa	d7dab9b75b5a7afbb549b876304b9ec302f8959f227593a2002b15842331d5c3	2026-04-09 02:18:35.73539+00	20260212094755_init	\N	\N	2026-04-09 02:18:35.667051+00	1
15bd52e5-ac49-4234-b2dd-bd75ec2140d3	532515a845aa495cc70200cca0c15cdb45c24977221a3dbc0bc1b2f40e6ca8c2	2026-04-09 02:18:35.767227+00	20260220041559_add_interview_process_tables	\N	\N	2026-04-09 02:18:35.737167+00	1
d826b25d-16ef-4d39-8a93-bfd406daba83	a5826493d4008c3f6f6977373866ee34566dde3344ed807933732b6f77c8adcf	2026-04-09 02:18:35.782781+00	20260226020542_add_notification	\N	\N	2026-04-09 02:18:35.768564+00	1
e29af695-6edb-4818-a121-58e2663c7940	eed8dd29da654fd36a3ee8334adb69357b377eec611355124a76adb05ddf489a	2026-04-09 02:18:35.902255+00	20260226030450_add_resume_mention_status_features	\N	\N	2026-04-09 02:18:35.785159+00	1
b29319a3-a9d4-435e-bad1-d6b98ae9bc23	93c77b1877c32281ddb17f205ee78973d450d4d65311ef753664927f9aa4d2f1	2026-04-09 02:18:35.91328+00	20260326080000_add_user_is_active	\N	\N	2026-04-09 02:18:35.904759+00	1
2dd0d111-06b1-41d6-977b-3232e33fcdcd	0deb43844f08e7c54808fb532fa99b1ddc84687f22de5717a5578abbb2042e7a	2026-04-09 03:18:47.697266+00	20260407_add_interview_unique_constraint	\N	\N	2026-04-09 03:18:47.565556+00	1
migration-20260409	sha256:xxx	2026-04-09 06:12:37.184521+00	20260409_add_interview_email_log		\N	2026-04-09 06:12:37.184521+00	1
\.


--
-- Data for Name: candidate_mentions; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.candidate_mentions (id, "candidateId", "interviewerId", "mentionedById", message, status, "viewedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: candidate_status_history; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.candidate_status_history (id, "candidateId", "oldStatus", "newStatus", reason, "changedBy", "relatedInterviewId", "createdAt") FROM stdin;
a1fd0d2d-a5dd-4a91-bf90-4e4846a52415	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	PENDING	INTERVIEW_1	面试安排 - 初试（第1轮）	b90a3c05-8ab8-453f-9850-f3768cdade2b	cde257fa-6763-4b96-96bd-dbee544266b8	2026-04-14 09:19:32.942
1f13a8a0-73ce-4dae-9db0-f68aa830c7cf	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	INTERVIEW_1	INTERVIEW_2	面试安排 - 复试（第2轮）	b90a3c05-8ab8-453f-9850-f3768cdade2b	13443001-a6ce-4ac2-bf30-34b73cc4aa2a	2026-04-14 09:31:36.988
cecddcf0-ab4a-49b7-8514-d2e02bd3b5c3	2c16f1b1-543c-4f5b-8e44-55d5af77966a	PENDING	INTERVIEW_1	面试安排 - 初试（第1轮）	b90a3c05-8ab8-453f-9850-f3768cdade2b	e7b2997c-97c7-4dbd-b751-c3660ac543b1	2026-04-14 09:44:33.838
1349c3ef-d6fd-4dce-bbdc-8466b1a0c544	2c16f1b1-543c-4f5b-8e44-55d5af77966a	INTERVIEW_1	INTERVIEW_2	面试安排 - 复试（第2轮）	b90a3c05-8ab8-453f-9850-f3768cdade2b	4fa94d00-ae24-4db9-ba46-e3dd71d0dd80	2026-04-14 10:00:39.004
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.candidates (id, name, phone, email, "positionId", status, source, "resumeUrl", "createdAt", "updatedAt") FROM stdin;
2c16f1b1-543c-4f5b-8e44-55d5af77966a	曹奇	18883145918	18883145918@163.com	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	INTERVIEW_2	BOSS	/candidates/resumes/2c16f1b1-543c-4f5b-8e44-55d5af77966a	2026-04-14 02:22:46.722	2026-04-14 10:00:39.002
4d866173-d567-484f-a2fe-39cf0523dde8	肖魁	17769397503	cookui@163.com	\N	PENDING	BOSS	/candidates/resumes/4d866173-d567-484f-a2fe-39cf0523dde8	2026-04-13 10:48:31.56	2026-04-13 10:48:31.65
595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	刘永能	18566756943	liuyongneng1015@126.com	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	INTERVIEW_2	BOSS	/candidates/resumes/595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	2026-04-14 02:45:29.973	2026-04-14 09:31:36.985
\.


--
-- Data for Name: feedback_tokens; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.feedback_tokens (id, "interviewId", "interviewerId", token, "expiresAt", "usedAt", "isUsed", "createdAt") FROM stdin;
\.


--
-- Data for Name: interview_feedbacks; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.interview_feedbacks (id, "interviewId", "interviewerId", result, strengths, weaknesses, "overallRating", notes, "createdAt") FROM stdin;
a8472a6f-3975-4571-8674-65106cdc86fa	e7b2997c-97c7-4dbd-b751-c3660ac543b1	b90a3c05-8ab8-453f-9850-f3768cdade2b	PENDING	技术扎实，学习钻研能力强，AI Native 意识较好，带4人小团队，0-1搭建兴小秘智能体、有线运维助手 RAG，服务用户多、调用量大，项目质量高，获公司级一等奖。	毕业后校招进入中兴，仅3 年工作经验，业务视野较窄。	4	\N	2026-04-14 09:56:26.527
e1884346-1332-4aa9-9b3e-dceee216ee0d	cde257fa-6763-4b96-96bd-dbee544266b8	b90a3c05-8ab8-453f-9850-f3768cdade2b	PASS	大厂背景，有带10人以上团队管理经验， 有0 到 1 主导保险智能体 Agent、RAG 知识库等项目方面落地经验。	从 Java 架构切入 AI 体系，候选人自述对大模型、微调方面经验沉淀略欠缺。	4		2026-04-14 09:29:49.812
4bcd4b1e-0d8e-4d29-9e6d-6d8a91fa84df	13443001-a6ce-4ac2-bf30-34b73cc4aa2a	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	PASS	简历描述真实，后端技术和架构能力较强。\n实际的开发经验充足。\n有实际大规模用户量的AI agent架构和优化经验。	vibecoding属于平衡型使用\n对业务场景的理解一般	3	\N	2026-04-15 03:04:32.619
\.


--
-- Data for Name: interview_processes; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.interview_processes (id, "candidateId", "positionId", "currentRound", "totalRounds", status, "hasHRRound", "createdById", "createdAt", "completedAt") FROM stdin;
33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	2c16f1b1-543c-4f5b-8e44-55d5af77966a	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	2	4	IN_PROGRESS	t	b90a3c05-8ab8-453f-9850-f3768cdade2b	2026-04-14 09:43:24.602	\N
120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	3	4	IN_PROGRESS	t	b90a3c05-8ab8-453f-9850-f3768cdade2b	2026-04-14 09:19:00.875	\N
\.


--
-- Data for Name: interview_rounds; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.interview_rounds (id, "processId", "roundNumber", "interviewerId", "isHRRound", "roundType") FROM stdin;
91c885da-fd08-4f6e-8655-b8e9019cb7e6	120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	1	4f0dd80b-c682-480a-ad58-9fbe08e547ad	t	HR_SCREENING
76fbd725-c56c-47c0-8b1b-08221294f570	120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	4	e0d59683-73d7-4306-a967-d023994d533e	f	FINAL
3521b038-ce31-411c-82e4-4d4fd5d79b2b	120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	3	77bfd979-145a-45b2-b874-a63627cabce1	f	TECHNICAL
a116474b-d156-4a67-9137-3369ce8ef26b	120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	f	TECHNICAL
c801dc86-e12c-428b-b9a4-6b8b36027d81	33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	1	4f0dd80b-c682-480a-ad58-9fbe08e547ad	t	HR_SCREENING
0898269f-e413-44e2-be11-c363d235e01c	33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	2	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	f	TECHNICAL
cc34a6e0-f076-459c-9f5f-0de77904bae1	33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	3	77bfd979-145a-45b2-b874-a63627cabce1	f	TECHNICAL
b20f8a06-f269-41a0-9069-a8549f99a72c	33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	4	e0d59683-73d7-4306-a967-d023994d533e	f	FINAL
\.


--
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.interviews (id, "candidateId", "positionId", "interviewerId", type, format, "startTime", "endTime", location, "meetingUrl", "meetingNumber", status, "createdAt", "createdById", "isHRRound", "processId", "roundNumber") FROM stdin;
4fa94d00-ae24-4db9-ba46-e3dd71d0dd80	2c16f1b1-543c-4f5b-8e44-55d5af77966a	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	INTERVIEW_2	ONLINE	2026-04-15 11:01:00	2026-04-15 12:00:00		#腾讯会议：919-357-453		SCHEDULED	2026-04-14 10:00:38.995	\N	f	33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	2
cde257fa-6763-4b96-96bd-dbee544266b8	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	4f0dd80b-c682-480a-ad58-9fbe08e547ad	INTERVIEW_1	ONLINE	2026-04-14 07:00:00	2026-04-14 08:00:00				COMPLETED	2026-04-14 09:19:32.928	\N	t	120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	1
e7b2997c-97c7-4dbd-b751-c3660ac543b1	2c16f1b1-543c-4f5b-8e44-55d5af77966a	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	4f0dd80b-c682-480a-ad58-9fbe08e547ad	INTERVIEW_1	ONLINE	2026-04-14 08:00:00	2026-04-14 09:00:00				COMPLETED	2026-04-14 09:44:33.827	\N	t	33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	1
13443001-a6ce-4ac2-bf30-34b73cc4aa2a	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	INTERVIEW_2	ONLINE	2026-04-15 02:00:00	2026-04-15 03:00:00		#腾讯会议：351-322-626		COMPLETED	2026-04-14 09:31:36.96	\N	f	120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2
eeac9dba-ec41-4463-9fa4-c49f9a46984f	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	80304f3b-ce66-40b9-a5c0-0c4ccdb18853	77bfd979-145a-45b2-b874-a63627cabce1	INTERVIEW_2	ONLINE	2026-04-16 03:00:00	2026-04-16 04:00:00		#腾讯会议：429-760-917		SCHEDULED	2026-04-15 05:44:56.701	\N	f	120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	3
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.notifications (id, "userId", type, title, content, read, link, "createdAt") FROM stdin;
51052aed-cee1-4041-ba62-85cb15f685fa	4f0dd80b-c682-480a-ad58-9fbe08e547ad	INTERVIEW_REMINDER	新面试安排	您有新面试：候选人刘永能，职位AI智能体架构师，第1轮	f	/interview-processes/120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2026-04-14 09:19:32.951
20c120b6-2924-4037-8214-2eeb3346a3a9	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	PROCESS_UPDATE	新一轮面试即将开始	候选人刘永能即将进入您的第2轮面试环节，职位AI智能体架构师	f	/interview-processes/120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2026-04-14 09:29:58.562
c4373446-b710-4c25-a4cd-9c884bb4cc66	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	INTERVIEW_REMINDER	新面试安排	您有新面试：候选人刘永能，职位AI智能体架构师，第2轮	f	/interview-processes/120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2026-04-14 09:31:36.993
b7bd8e62-f65e-43d5-927b-44f9d608151b	4f0dd80b-c682-480a-ad58-9fbe08e547ad	INTERVIEW_REMINDER	新面试安排	您有新面试：候选人曹奇，职位AI智能体架构师，第1轮	f	/interview-processes/33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	2026-04-14 09:44:33.842
ff64bf1e-e1fb-413b-a7bf-bed58b719592	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	PROCESS_UPDATE	新一轮面试即将开始	候选人曹奇即将进入您的第2轮面试环节，职位AI智能体架构师	f	/interview-processes/33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	2026-04-14 09:59:42.998
f1c2cad6-ad99-4b4d-9328-fbd27e89aa93	77bfd979-145a-45b2-b874-a63627cabce1	PROCESS_UPDATE	新一轮面试即将开始	候选人刘永能即将进入您的第3轮面试环节，职位AI智能体架构师	f	/interview-processes/120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2026-04-15 05:43:43.045
653eee3e-5997-4ce2-a8fc-13ea81f1c9c0	77bfd979-145a-45b2-b874-a63627cabce1	INTERVIEW_REMINDER	新面试安排	您有新面试：候选人刘永能，职位AI智能体架构师，第3轮	f	/interview-processes/120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2026-04-15 05:44:59.212
cf1d4cdd-7aea-40e1-a86b-2a42f498326e	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	INTERVIEW_REMINDER	新面试安排	您有新面试：候选人曹奇，职位AI智能体架构师，第2轮	t	/interview-processes/33b7fef3-029d-4a2e-b7bc-cfc4fcaa95ee	2026-04-14 10:00:39.008
59ad8965-597f-455d-9cd0-881d4d18876c	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	INTERVIEW_REMINDER	面试时间调整	候选人曹奇面试时间已调整，请准时参加	f	/interviews/4fa94d00-ae24-4db9-ba46-e3dd71d0dd80	2026-04-15 10:13:15.019
d5a4688d-98ad-4bdc-952b-aa3d43698d86	3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	INTERVIEW_REMINDER	面试时间调整	候选人曹奇面试时间已调整，请准时参加	f	/interviews/4fa94d00-ae24-4db9-ba46-e3dd71d0dd80	2026-04-15 11:12:53.733
210d0c4e-fa81-4c9e-a721-4727ab83f73e	b90a3c05-8ab8-453f-9850-f3768cdade2b	PROCESS_UPDATE	轮次面试已完成	候选人刘永能第1轮面试已完成，请确认下一步操作	t	/interview-processes/120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2026-04-14 09:29:49.832
99b615a9-e629-4632-add4-0f9fd0f1e0de	b90a3c05-8ab8-453f-9850-f3768cdade2b	PROCESS_UPDATE	轮次面试已完成	候选人刘永能第2轮面试已完成，请确认下一步操作	t	/interview-processes/120a543b-cb6a-4e01-aa08-2a6f6ae6e28f	2026-04-15 03:04:32.641
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.positions (id, title, description, requirements, "salaryMin", "salaryMax", headcount, "hiredCount", "inProgressCount", status, location, "createdAt", "updatedAt") FROM stdin;
80304f3b-ce66-40b9-a5c0-0c4ccdb18853	AI智能体架构师	岗位职责 \n1、负责教育 AI 产品中智能体相关功能的技术方案设计与落地 \n2、跟踪 AI 技术发展趋势，评估新技术在业务场景中的应用可能性，为团队提供技术选型建议 \n3、负责 AI 与业务系统的集成方案设计，关注效果、成本和可维护性的平衡 \n4、设计和优化 AI 应用中的信息结构与交互策略，提升 AI 输出质量 \n5、管理 AI 开发小组，负责任务分配、进度把控和交付质量保障 \n6、与产品、测试等部门跨团队协作，将业务需求转化为可落地的技术方案 \n7、沉淀开发流程与最佳实践，带动团队提升 AI 开发效率 \n\n任职要求 \n基本条件 \n1、学历要求：本科及以上学历，计算机科学、人工智能、软件工程等相关专业优先 \n2、工作经验：3 年以上 AI/LLM 相关开发经验，1 年以上团队管理或技术负责人经验 \n3、项目经验：至少主导过 1 个 AI 产品/功能从 0 到 1 的完整交付周期 \n4、语言能力：流利的中文沟通能力，能阅读英文技术文档与论文 \n5、专业技能 \n①学习能力与 AI Native 热情（最看重） 对 AI 技术有发自内心的好奇心和热情，习惯性地关注和尝试新模型、新工具 • 能快速学习和吸收新技术，并主动将所学转化为团队可用的实践经验 • 认同“AI Native”的工作方式：先想“AI 能不能做”再想“怎么写代码” • 不满足于“够用就行”，有持续探索更优解的驱动力 \n②技术能力 • 对当前主流大语言模型的能力和边界有基本认知 • 有 Prompt 工程实践经验，能把业务需求转化为有效的 AI 交互策略 • 后端开发：Node.js / Python 至少熟练一门 • 了解常见的 AI 工程化方案，能设计合理的系统集成架构 \n③团队管理能力 • 有带过小团队的经验，能在快速变化的环境中带领团队保持节奏 • 具备跨部门协作和项目推进能力 \n6、加分项\n• 有教育行业背景，或参与过教育 AI 产品的落地\n• 是 Cursor / Claude Code 等 AI 编程工具的深度用户，日常工作已离不开 AI • 有从 0 到 1 设计 AI 工作流的经历 \n• 有带领团队完成技术转型的经历 \n• 乐于分享，习惯把自己的技术发现和思考整理给团队 简历如下	\N	30000	50000	1	0	0	OPEN	\N	2026-04-14 02:47:36.249	2026-04-14 02:47:36.249
\.


--
-- Data for Name: resume_files; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.resume_files (id, "candidateId", "fileName", "fileType", "fileSize", "filePath", "fileUrl", "uploadedBy", "isActive", "uploadedAt") FROM stdin;
f60a6aff-9077-4191-b799-f5e584b7345a	4d866173-d567-484f-a2fe-39cf0523dde8	ãAI æºè½ä½é«çº§å·¥ç¨å¸_æ¶æå¸_æ·±å³ 30-50Kãèé­ 10å¹´ä»¥ä¸.pdf	application/pdf	259463	/app/uploads/resumes/4d866173-d567-484f-a2fe-39cf0523dde8_1776077311643.pdf	/candidates/resumes/4d866173-d567-484f-a2fe-39cf0523dde8	b90a3c05-8ab8-453f-9850-f3768cdade2b	t	2026-04-13 10:48:31.645
edd53515-b50a-49e8-82f6-8259f6ed99e0	2c16f1b1-543c-4f5b-8e44-55d5af77966a	ãAI æºè½ä½é«çº§å·¥ç¨å¸_æ¶æå¸_æ·±å³ 30-50Kãæ¹å¥ 3å¹´.pdf	application/pdf	207419	/app/uploads/resumes/2c16f1b1-543c-4f5b-8e44-55d5af77966a_1776133409664.pdf	/candidates/resumes/2c16f1b1-543c-4f5b-8e44-55d5af77966a	b90a3c05-8ab8-453f-9850-f3768cdade2b	t	2026-04-14 02:23:29.667
ee2ac9e6-f55c-439f-81f0-ce5c32665f20	595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	ãAI æºè½ä½é«çº§å·¥ç¨å¸_æ¶æå¸_æ·±å³ 30-50Kãåæ°¸è½ 10å¹´ä»¥ä¸.pdf	application/pdf	554437	/app/uploads/resumes/595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0_1776134730345.pdf	/candidates/resumes/595d4aa5-4dd4-491d-b6da-6f1e7a6df8d0	b90a3c05-8ab8-453f-9850-f3768cdade2b	t	2026-04-14 02:45:30.347
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: moka
--

COPY public.users (id, username, password, name, email, role, "avatarUrl", "createdAt", "updatedAt", "isActive") FROM stdin;
b90a3c05-8ab8-453f-9850-f3768cdade2b	hr	$2b$10$KsoeV4sacJIZk1fZc3iseOa9RlNyl4peOAyjzK2lwwzXJtcw4Mdy6	张HR	hr@company.com	HR	\N	2026-04-09 02:18:36.41	2026-04-09 02:18:36.41	t
6e9397fd-4522-4059-b7f9-44982f89adcf	interviewer	$2b$10$Gc7potpIcdggjtSgMG615OIhzW4AlHaJXm/tGNEKDc19/KxwyXuKW	李面试官	interviewer@company.com	INTERVIEWER	\N	2026-04-09 02:18:36.651	2026-04-09 02:18:36.651	t
43a36a18-6230-4a1c-8e78-58b0c92ce415	chenjiyan	$2b$10$2GFuGacscTDkWCisnrYdWu6BVjD12EshfMdGGir7z669dVzUdQf6K	陈继岩	jyc@malong.com	HR	\N	2026-04-14 02:24:24.818	2026-04-14 02:24:24.818	t
3cded7d6-3ef4-4cee-ad6f-7fd2dff75a37	xiaoshijie	$2b$10$GzH5kXrsQAuum2lMqR.3IOzeyd.pg3VsjEHjOI3t0eIjuFxDm3IO.	肖仕杰	shaxiao@malong.com	INTERVIEWER	\N	2026-04-14 09:16:15.691	2026-04-14 09:16:15.691	t
4f0dd80b-c682-480a-ad58-9fbe08e547ad	jinxuelei	$2b$10$wkMah4FVwCZ1lTefs76i0.QbvoICZF9NHMnJ5FdwJadrEfB5H1XsS	金雪蕾	xuejin@malong.com	HR	\N	2026-04-14 09:17:14.127	2026-04-14 09:17:14.127	t
77bfd979-145a-45b2-b874-a63627cabce1	wusumin	$2b$10$61jPL7FEeBE7BG1Ccpd38.mbI2283kUIUbkzT1Hi71zvh9KJUg4q.	吴素敏	suswoo@malong.com	INTERVIEWER	\N	2026-04-14 09:18:04.837	2026-04-14 09:18:04.837	t
e0d59683-73d7-4306-a967-d023994d533e	huangdinglong	$2b$10$go8SWf.xBXRWVY1EgqVzZO5kWHxQkOlF9GJB4dKFqL6olFV68zPjG	黄鼎隆	dlong@malong.com	INTERVIEWER	\N	2026-04-14 09:18:38.083	2026-04-14 09:18:38.083	t
\.


--
-- Name: InterviewEmailLog InterviewEmailLog_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public."InterviewEmailLog"
    ADD CONSTRAINT "InterviewEmailLog_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: candidate_mentions candidate_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidate_mentions
    ADD CONSTRAINT candidate_mentions_pkey PRIMARY KEY (id);


--
-- Name: candidate_status_history candidate_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidate_status_history
    ADD CONSTRAINT candidate_status_history_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: feedback_tokens feedback_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.feedback_tokens
    ADD CONSTRAINT feedback_tokens_pkey PRIMARY KEY (id);


--
-- Name: interview_feedbacks interview_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_feedbacks
    ADD CONSTRAINT interview_feedbacks_pkey PRIMARY KEY (id);


--
-- Name: interview_processes interview_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_processes
    ADD CONSTRAINT interview_processes_pkey PRIMARY KEY (id);


--
-- Name: interview_rounds interview_rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_rounds
    ADD CONSTRAINT interview_rounds_pkey PRIMARY KEY (id);


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- Name: interviews interviews_processId_roundNumber_key; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT "interviews_processId_roundNumber_key" UNIQUE ("processId", "roundNumber");


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: resume_files resume_files_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.resume_files
    ADD CONSTRAINT resume_files_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: InterviewEmailLog_candidateId_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "InterviewEmailLog_candidateId_idx" ON public."InterviewEmailLog" USING btree ("candidateId");


--
-- Name: InterviewEmailLog_interviewId_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "InterviewEmailLog_interviewId_idx" ON public."InterviewEmailLog" USING btree ("interviewId");


--
-- Name: InterviewEmailLog_sentAt_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "InterviewEmailLog_sentAt_idx" ON public."InterviewEmailLog" USING btree ("sentAt");


--
-- Name: candidate_mentions_candidateId_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "candidate_mentions_candidateId_idx" ON public.candidate_mentions USING btree ("candidateId");


--
-- Name: candidate_mentions_interviewerId_status_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "candidate_mentions_interviewerId_status_idx" ON public.candidate_mentions USING btree ("interviewerId", status);


--
-- Name: candidate_status_history_candidateId_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "candidate_status_history_candidateId_idx" ON public.candidate_status_history USING btree ("candidateId");


--
-- Name: candidate_status_history_createdAt_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "candidate_status_history_createdAt_idx" ON public.candidate_status_history USING btree ("createdAt");


--
-- Name: candidates_name_phone_key; Type: INDEX; Schema: public; Owner: moka
--

CREATE UNIQUE INDEX candidates_name_phone_key ON public.candidates USING btree (name, phone);


--
-- Name: feedback_tokens_interviewId_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "feedback_tokens_interviewId_idx" ON public.feedback_tokens USING btree ("interviewId");


--
-- Name: feedback_tokens_interviewId_key; Type: INDEX; Schema: public; Owner: moka
--

CREATE UNIQUE INDEX "feedback_tokens_interviewId_key" ON public.feedback_tokens USING btree ("interviewId");


--
-- Name: feedback_tokens_token_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX feedback_tokens_token_idx ON public.feedback_tokens USING btree (token);


--
-- Name: feedback_tokens_token_key; Type: INDEX; Schema: public; Owner: moka
--

CREATE UNIQUE INDEX feedback_tokens_token_key ON public.feedback_tokens USING btree (token);


--
-- Name: interview_rounds_processId_roundNumber_key; Type: INDEX; Schema: public; Owner: moka
--

CREATE UNIQUE INDEX "interview_rounds_processId_roundNumber_key" ON public.interview_rounds USING btree ("processId", "roundNumber");


--
-- Name: notifications_userId_read_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "notifications_userId_read_idx" ON public.notifications USING btree ("userId", read);


--
-- Name: resume_files_candidateId_idx; Type: INDEX; Schema: public; Owner: moka
--

CREATE INDEX "resume_files_candidateId_idx" ON public.resume_files USING btree ("candidateId");


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: moka
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: InterviewEmailLog InterviewEmailLog_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public."InterviewEmailLog"
    ADD CONSTRAINT "InterviewEmailLog_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public.candidates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InterviewEmailLog InterviewEmailLog_interviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public."InterviewEmailLog"
    ADD CONSTRAINT "InterviewEmailLog_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES public.interviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: candidate_mentions candidate_mentions_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidate_mentions
    ADD CONSTRAINT "candidate_mentions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public.candidates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: candidate_mentions candidate_mentions_interviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidate_mentions
    ADD CONSTRAINT "candidate_mentions_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: candidate_mentions candidate_mentions_mentionedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidate_mentions
    ADD CONSTRAINT "candidate_mentions_mentionedById_fkey" FOREIGN KEY ("mentionedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: candidate_status_history candidate_status_history_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidate_status_history
    ADD CONSTRAINT "candidate_status_history_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public.candidates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: candidate_status_history candidate_status_history_changedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidate_status_history
    ADD CONSTRAINT "candidate_status_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: candidates candidates_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT "candidates_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public.positions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: feedback_tokens feedback_tokens_interviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.feedback_tokens
    ADD CONSTRAINT "feedback_tokens_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES public.interviews(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: feedback_tokens feedback_tokens_interviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.feedback_tokens
    ADD CONSTRAINT "feedback_tokens_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interview_feedbacks interview_feedbacks_interviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_feedbacks
    ADD CONSTRAINT "interview_feedbacks_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES public.interviews(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interview_feedbacks interview_feedbacks_interviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_feedbacks
    ADD CONSTRAINT "interview_feedbacks_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interview_processes interview_processes_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_processes
    ADD CONSTRAINT "interview_processes_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public.candidates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interview_processes interview_processes_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_processes
    ADD CONSTRAINT "interview_processes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interview_processes interview_processes_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_processes
    ADD CONSTRAINT "interview_processes_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public.positions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interview_rounds interview_rounds_interviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_rounds
    ADD CONSTRAINT "interview_rounds_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interview_rounds interview_rounds_processId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interview_rounds
    ADD CONSTRAINT "interview_rounds_processId_fkey" FOREIGN KEY ("processId") REFERENCES public.interview_processes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interviews interviews_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT "interviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public.candidates(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interviews interviews_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT "interviews_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: interviews interviews_interviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT "interviews_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interviews interviews_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT "interviews_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public.positions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: interviews interviews_processId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT "interviews_processId_fkey" FOREIGN KEY ("processId") REFERENCES public.interview_processes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resume_files resume_files_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.resume_files
    ADD CONSTRAINT "resume_files_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public.candidates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resume_files resume_files_uploadedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: moka
--

ALTER TABLE ONLY public.resume_files
    ADD CONSTRAINT "resume_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict NVbF9reh9d5SvaVJMQeycqJLgom01cgi8ocHH7Z3a1LxK8FbE4KNaZju0F5a6n9

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict ouSkBG0lFOwDCB72Vg1vfABrh2z93JgSZesdf3vIF3Qm6aGFJ81BfvaEKgBKhiL

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict ouSkBG0lFOwDCB72Vg1vfABrh2z93JgSZesdf3vIF3Qm6aGFJ81BfvaEKgBKhiL

--
-- PostgreSQL database cluster dump complete
--

