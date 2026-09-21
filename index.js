const SUPABASE_URL = "https://mtufczmjlkvycarxylgh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XDIZ0_nd4PAYJy2Oz4VaxQ_R4Trs3VP";
let pasongSupabase = null;
if(window.supabase){ pasongSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
// ... paste REST of your JS here ...
