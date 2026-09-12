const SUPABASE_URL = "https://dmdxkezndrympnldowdo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_BF1B3NLOLsF3zE8PYZwRsg_FpOVx2R7";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);