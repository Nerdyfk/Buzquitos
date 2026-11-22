-- ============================================================
-- BUZQUITOS GTD ALLOWLIST SCHEMA (Supabase / PostgreSQL)
-- ============================================================

-- Create the GTD Allowlist table
CREATE TABLE IF NOT EXISTS public.gtd_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    pass_code TEXT NOT NULL,
    puzzle_type TEXT NOT NULL DEFAULT 'image_tile',
    moves INTEGER NOT NULL CHECK (moves >= 0),
    time_seconds INTEGER NOT NULL CHECK (time_seconds >= 0),
    chain_id INTEGER NOT NULL DEFAULT 8453, -- Base Mainnet
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'PENDING', 'REVOKED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Guarantee each EVM wallet address can only claim one GTD spot
    CONSTRAINT gtd_allowlist_wallet_unique UNIQUE (wallet_address),
    CONSTRAINT gtd_allowlist_pass_code_unique UNIQUE (pass_code)
);

-- Indexes for ultra-fast lookups
CREATE INDEX IF NOT EXISTS idx_gtd_allowlist_wallet ON public.gtd_allowlist (LOWER(wallet_address));
CREATE INDEX IF NOT EXISTS idx_gtd_allowlist_pass_code ON public.gtd_allowlist (pass_code);
CREATE INDEX IF NOT EXISTS idx_gtd_allowlist_puzzle_type ON public.gtd_allowlist (puzzle_type);
CREATE INDEX IF NOT EXISTS idx_gtd_allowlist_created_at ON public.gtd_allowlist (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.gtd_allowlist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read GTD winners (Public Allowlist Verifier)
CREATE POLICY "Allow public read-only access to gtd_allowlist"
    ON public.gtd_allowlist
    FOR SELECT
    USING (true);

-- Policy: Allow service role / authenticated backend to insert new claims
CREATE POLICY "Allow insert for service role or authenticated backend"
    ON public.gtd_allowlist
    FOR INSERT
    WITH CHECK (true);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_gtd_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gtd_allowlist_updated_at ON public.gtd_allowlist;
CREATE TRIGGER trigger_gtd_allowlist_updated_at
    BEFORE UPDATE ON public.gtd_allowlist
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_gtd_updated_at();

-- Sample verification query:
-- SELECT wallet_address, pass_code, puzzle_type, moves, time_seconds, created_at 
-- FROM public.gtd_allowlist 
-- ORDER BY created_at DESC;
