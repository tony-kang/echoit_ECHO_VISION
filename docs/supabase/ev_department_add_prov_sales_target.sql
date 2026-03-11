-- ev_department에 가결산 대상 부서 플래그 추가
ALTER TABLE public.ev_department ADD COLUMN IF NOT EXISTS prov_sales_target BOOLEAN NOT NULL DEFAULT false;
