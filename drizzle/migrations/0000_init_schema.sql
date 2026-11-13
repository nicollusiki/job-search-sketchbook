
-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '' CHECK (char_length(first_name) <= 80),
  last_name text NOT NULL DEFAULT '' CHECK (char_length(last_name) <= 80),
  location text NOT NULL DEFAULT '' CHECK (char_length(location) <= 120),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
  date_of_birth date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.profiles_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth THEN
    RAISE EXCEPTION 'Date of birth cannot be changed';
  END IF;
  IF NEW.date_of_birth > (current_date - interval '18 years')::date THEN
    RAISE EXCEPTION 'You must be 18 or older to use this app';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_guard BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_guard();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE dob date;
BEGIN
  BEGIN
    dob := (NEW.raw_user_meta_data->>'date_of_birth')::date;
  EXCEPTION WHEN others THEN dob := NULL;
  END;
  IF dob IS NULL THEN
    RAISE EXCEPTION 'Date of birth is required';
  END IF;
  INSERT INTO public.profiles (id, first_name, last_name, location, phone, date_of_birth)
  VALUES (NEW.id,
    left(coalesce(NEW.raw_user_meta_data->>'first_name',''),80),
    left(coalesce(NEW.raw_user_meta_data->>'last_name',''),80),
    left(coalesce(NEW.raw_user_meta_data->>'location',''),120),
    left(coalesce(NEW.raw_user_meta_data->>'phone',''),30),
    dob);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- VERIFICATION RESULT (server-written only)
CREATE TABLE public.verifications (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'none' CHECK (status IN ('none','passed','failed','manual_review')),
  verified_at timestamptz,
  provider_ref text,
  over_18 boolean,
  name_match boolean,
  dob_match boolean,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own verification select" ON public.verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.kyc_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  passed boolean NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.kyc_attempts (user_id, created_at);
GRANT SELECT ON public.kyc_attempts TO authenticated;
GRANT ALL ON public.kyc_attempts TO service_role;
ALTER TABLE public.kyc_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts select" ON public.kyc_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- CV ANSWERS
CREATE TABLE public.cv_answers (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step int NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7),
  completed boolean NOT NULL DEFAULT false,
  ai_filled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pg_column_size(data) < 60000)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_answers TO authenticated;
GRANT ALL ON public.cv_answers TO service_role;
ALTER TABLE public.cv_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cv select" ON public.cv_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own cv insert" ON public.cv_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cv update" ON public.cv_answers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cv delete" ON public.cv_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- JOBS (shared sample catalogue, read-only for signed-in users)
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  company text NOT NULL,
  city text NOT NULL,
  remote text NOT NULL CHECK (remote IN ('remote','hybrid','on-site')),
  contract_type text NOT NULL CHECK (contract_type IN ('internship','part-time','full-time')),
  pay_min int NOT NULL,
  pay_max int NOT NULL,
  pay_period text NOT NULL DEFAULT 'year',
  description text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  source_name text NOT NULL,
  source_url text NOT NULL,
  is_sample boolean NOT NULL DEFAULT true,
  posted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed-in read jobs" ON public.jobs FOR SELECT TO authenticated USING (true);

-- MATCHES (written by server AI only; logged for transparency)
CREATE TABLE public.job_matches (
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score BETWEEN 0 AND 100),
  reason text NOT NULL CHECK (char_length(reason) <= 300),
  model text NOT NULL,
  cv_version timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);
GRANT SELECT ON public.job_matches TO authenticated;
GRANT ALL ON public.job_matches TO service_role;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own matches select" ON public.job_matches FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- USER JOBS (saved / applied / dismissed / tracker)
CREATE TABLE public.user_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  external_role text CHECK (char_length(external_role) <= 120),
  external_company text CHECK (char_length(external_company) <= 120),
  stage text NOT NULL CHECK (stage IN ('saved','applied','interview','offer','rejected','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (job_id IS NOT NULL OR (external_role IS NOT NULL AND external_company IS NOT NULL))
);
CREATE UNIQUE INDEX user_jobs_unique ON public.user_jobs (user_id, job_id) WHERE job_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_jobs TO authenticated;
GRANT ALL ON public.user_jobs TO service_role;
ALTER TABLE public.user_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own uj select" ON public.user_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own uj insert" ON public.user_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own uj update" ON public.user_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own uj delete" ON public.user_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- REJECTIONS (private)
CREATE TABLE public.rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_job_id uuid REFERENCES public.user_jobs(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (char_length(role) <= 120),
  company text NOT NULL CHECK (char_length(company) <= 120),
  rejected_on date NOT NULL DEFAULT current_date,
  stage_at text NOT NULL CHECK (stage_at IN ('cv_screen','assessment','interview','final_round')),
  reason text CHECK (char_length(reason) <= 500),
  note text CHECK (char_length(note) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rejections TO authenticated;
GRANT ALL ON public.rejections TO service_role;
ALTER TABLE public.rejections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rej select" ON public.rejections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own rej insert" ON public.rejections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rej update" ON public.rejections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own rej delete" ON public.rejections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- REVIEWS (written by server after KYC check; public view only through safe function)
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  contract_type text NOT NULL CHECK (contract_type IN ('internship','part-time','full-time')),
  months_worked int NOT NULL CHECK (months_worked BETWEEN 1 AND 600),
  year int NOT NULL,
  overall int NOT NULL CHECK (overall BETWEEN 1 AND 5),
  pay_fairness int NOT NULL CHECK (pay_fairness BETWEEN 1 AND 5),
  workload int NOT NULL CHECK (workload BETWEEN 1 AND 5),
  learning int NOT NULL CHECK (learning BETWEEN 1 AND 5),
  management int NOT NULL CHECK (management BETWEEN 1 AND 5),
  recommend boolean NOT NULL,
  comment text NOT NULL CHECK (char_length(comment) <= 2000),
  proof_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  moderation_reason text,
  is_sample boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reviews_one_per_person ON public.reviews (user_id, job_id) WHERE user_id IS NOT NULL;
GRANT SELECT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reviews select" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, review_id)
);
GRANT SELECT, INSERT ON public.review_reports TO authenticated;
GRANT ALL ON public.review_reports TO service_role;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own report select" ON public.review_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own report insert" ON public.review_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RATE LIMIT LOG (server-only, no personal data besides user id)
CREATE TABLE public.rate_events (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.rate_events (user_id, action, created_at);
GRANT ALL ON public.rate_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rate_events_id_seq TO service_role;
ALTER TABLE public.rate_events ENABLE ROW LEVEL SECURITY;

-- Safe public read of approved reviews: no user id, no name, no proof
CREATE OR REPLACE FUNCTION public.get_job_reviews(_job_id uuid)
RETURNS TABLE (id uuid, contract_type text, year int, overall int, pay_fairness int, workload int, learning int, management int, recommend boolean, comment text, is_sample boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.contract_type, r.year, r.overall, r.pay_fairness, r.workload, r.learning, r.management, r.recommend, r.comment, r.is_sample, r.created_at
  FROM public.reviews r WHERE r.job_id = _job_id AND r.status = 'approved'
  ORDER BY r.created_at DESC LIMIT 50
$$;
CREATE OR REPLACE FUNCTION public.get_job_ratings()
RETURNS TABLE (job_id uuid, avg_rating numeric, review_count int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.job_id, round(avg(r.overall)::numeric, 1), count(*)::int
  FROM public.reviews r WHERE r.status = 'approved' GROUP BY r.job_id
$$;
REVOKE ALL ON FUNCTION public.get_job_reviews(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.get_job_ratings() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_job_reviews(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_ratings() TO authenticated;

-- SAMPLE DATA (made-up companies)
INSERT INTO public.jobs (id, role, company, city, remote, contract_type, pay_min, pay_max, pay_period, description, skills, languages, source_name, source_url, posted_at) VALUES
('a0000000-0000-4000-8000-000000000001','Junior Data Analyst','Pinecone Pickle Co.','Madrid','hybrid','full-time',26000,30000,'year','Build weekly sales dashboards and clean messy spreadsheets for the commercial team.','{Excel,SQL,"Power BI"}','{Spanish,English}','Sample feed','https://example.com/sample/1', now()-interval '1 day'),
('a0000000-0000-4000-8000-000000000002','Marketing Intern','Moonbeam Muffins','Barcelona','on-site','internship',900,1100,'month','Help run social media campaigns and write short copy for a bakery chain.','{"Social media",Copywriting,Canva}','{Spanish,Catalan}','Sample feed','https://example.com/sample/2', now()-interval '2 days'),
('a0000000-0000-4000-8000-000000000003','AI Analyst','Quokka Quantum Labs','Remote','remote','full-time',32000,38000,'year','Test machine-learning models and write clear reports on their results.','{Python,Statistics,Excel}','{English}','Sample feed','https://example.com/sample/3', now()-interval '3 days'),
('a0000000-0000-4000-8000-000000000004','Customer Support Associate','Glowworm Gadgets','Valencia','hybrid','part-time',14,16,'hour','Answer customer chats and emails about smart lamps.','{Communication,Zendesk}','{Spanish,English,French}','Sample feed','https://example.com/sample/4', now()-interval '4 days'),
('a0000000-0000-4000-8000-000000000005','Finance Intern','Tidepool Treasury','Madrid','on-site','internship',1000,1200,'month','Support month-end close, reconcile invoices and update Excel models.','{Excel,Accounting}','{Spanish}','Sample feed','https://example.com/sample/5', now()-interval '5 days'),
('a0000000-0000-4000-8000-000000000006','Junior UX Designer','Velvet Otter Studio','Remote','remote','full-time',28000,33000,'year','Design app screens in Figma and run quick user tests.','{Figma,"User research",Prototyping}','{English}','Sample feed','https://example.com/sample/6', now()-interval '6 days'),
('a0000000-0000-4000-8000-000000000007','Barista Team Member','Cosmic Cactus Coffee','Sevilla','on-site','part-time',10,12,'hour','Make drinks, run the till and keep the cafe tidy.','{"Customer service",Teamwork}','{Spanish}','Sample feed','https://example.com/sample/7', now()-interval '7 days'),
('a0000000-0000-4000-8000-000000000008','Software Engineering Intern','Bramble Byte Systems','Bilbao','hybrid','internship',1200,1500,'month','Fix bugs and ship small features in a React and Node codebase.','{JavaScript,React,Git}','{English,Spanish}','Sample feed','https://example.com/sample/8', now()-interval '8 days'),
('a0000000-0000-4000-8000-000000000009','Operations Assistant','Lemonade Lighthouse Logistics','Valencia','on-site','full-time',22000,25000,'year','Plan delivery routes and keep stock levels up to date.','{Excel,Organisation,Logistics}','{Spanish,English}','Sample feed','https://example.com/sample/9', now()-interval '9 days'),
('a0000000-0000-4000-8000-000000000010','Content Writer (Part-time)','Paper Crane Press','Remote','remote','part-time',15,18,'hour','Write blog posts and newsletters about travel and books.','{Writing,SEO,Research}','{English,Spanish}','Sample feed','https://example.com/sample/10', now()-interval '10 days');

INSERT INTO public.reviews (job_id, job_title, contract_type, months_worked, year, overall, pay_fairness, workload, learning, management, recommend, comment, status, is_sample) VALUES
('a0000000-0000-4000-8000-000000000001','Data Analyst Intern','internship',6,2025,4,3,4,5,4,true,'Sample review: lots of SQL practice and friendly team.','approved',true),
('a0000000-0000-4000-8000-000000000001','Junior Data Analyst','full-time',12,2024,5,4,3,5,5,true,'Sample review: great learning curve, busy at month end.','approved',true),
('a0000000-0000-4000-8000-000000000002','Marketing Intern','internship',4,2025,3,2,4,4,3,true,'Sample review: fun projects, pay is low.','approved',true),
('a0000000-0000-4000-8000-000000000003','AI Analyst','full-time',18,2025,5,5,3,5,4,true,'Sample review: interesting work and flexible hours.','approved',true),
('a0000000-0000-4000-8000-000000000004','Support Associate','part-time',8,2024,2,3,2,2,2,false,'Sample review: very repetitive shifts.','approved',true),
('a0000000-0000-4000-8000-000000000006','UX Design Intern','internship',6,2025,4,3,4,5,4,true,'Sample review: real projects from week one.','approved',true),
('a0000000-0000-4000-8000-000000000007','Barista','part-time',10,2024,3,3,2,3,4,true,'Sample review: busy mornings, kind colleagues.','approved',true),
('a0000000-0000-4000-8000-000000000008','Software Intern','internship',6,2025,5,4,4,5,5,true,'Sample review: good mentoring and code reviews.','approved',true);
