-- ============================================================
-- FIX: GRANT-uri explicite (defensiv, nu strică dacă deja există)
-- Rulează în Supabase SQL Editor
-- ============================================================

grant execute on function generate_puzzle(text) to anon, authenticated;
grant execute on function submit_guess(uuid, text[]) to anon, authenticated;
grant execute on function reveal_puzzle(uuid) to anon, authenticated;
grant execute on function start_new_session(text) to anon, authenticated;

grant select, insert, update on game_sessions to authenticated;
grant select on user_game_stats to authenticated;
grant select on puzzle_public to anon, authenticated;
