-- Enable UUID generation
create extension if not exists pgcrypto;

----------------------------------------------------
-- TABLE: analyses
----------------------------------------------------
create table if not exists analyses (

    id uuid primary key default gen_random_uuid(),

    smiles text not null,

    target text,

    disease text,

    compound_name text,

    molecular_formula text,

    pubchem_cid integer,

    risk_score integer,

    recommendation text
        check (
            recommendation in (
                'Low Patent Risk',
                'Requires Expert Review',
                'High Patent Risk'
            )
        ),

    executive_summary text,

    created_at timestamptz default now()
);

----------------------------------------------------
-- TABLE: patents
----------------------------------------------------
create table if not exists patents (

    id uuid primary key default gen_random_uuid(),

    analysis_id uuid not null references analyses(id) on delete cascade,

    patent_title text not null,

    patent_number text,

    publication_date date,

    assignee text,

    abstract text,

    source text,

    relevance_score numeric(5,2),

    confidence_score numeric(5,2),

    ai_explanation text
);

----------------------------------------------------
-- Indexes
----------------------------------------------------

create index if not exists idx_patents_analysis
on patents(analysis_id);

create index if not exists idx_analysis_created
on analyses(created_at desc);

----------------------------------------------------
-- Report JSON
----------------------------------------------------

alter table analyses
add column report jsonb;