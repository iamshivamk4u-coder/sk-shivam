import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://srfwcfaurnkyrwmkuqam.supabase.co";
const supabasePublishableKey = "sb_publishable_QYrIUFRZoZNOu6GuQKJHZw_qHm30cCT";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
export const siteUrl = window.location.origin;
