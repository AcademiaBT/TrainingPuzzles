// Supabase Edge Function: ai-debrief
// Generează un feedback personalizat (via Gemini) pentru o sesiune
// Decision Lab ÎNCHEIATĂ, la cererea explicită a jucătorului (buton).
// Nu se apelează niciodată automat — costul/cota se consumă doar
// când cineva chiar apasă butonul.
//
// Folosește @supabase/server (withSupabase), care gestionează automat
// auth-ul, CORS-ul și clienții Supabase (user-scoped + admin).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";

export default {
  // auth: "user" — jucătorul e autentificat (chiar și anonim, prin
  // signInAnonymously din joc, tot primește un JWT valid). ctx.supabase
  // respectă RLS (vede doar propriile sesiuni); ctx.supabaseAdmin
  // ocolește RLS, folosit strict pentru textele de nod/opțiune, care
  // sunt blocate normal pentru jucători.
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    try {
      const { session_id } = await req.json();
      if (!session_id) throw new Error("session_id lipsă din cerere.");

      const { data: session, error: sessionError } = await ctx.supabase
        .from("decision_sessions")
        .select("id, scenario_id, total_score, status, profile, debrief, history")
        .eq("id", session_id)
        .single();

      if (sessionError || !session) {
        throw new Error("Sesiunea nu a fost găsită sau nu îți aparține.");
      }
      if (session.status !== "completed") {
        throw new Error("Scenariul trebuie finalizat înainte de a genera feedback AI.");
      }

      const { data: scenario } = await ctx.supabaseAdmin
        .from("decision_scenarios")
        .select("title, description")
        .eq("id", session.scenario_id)
        .single();

      const history = (session.history as any[]) ?? [];
      const choiceIds = history.map((h) => h.choice_id).filter(Boolean);

      const { data: choices } = await ctx.supabaseAdmin
        .from("decision_choices")
        .select("id, choice_text, feedback, score, node_id")
        .in("id", choiceIds);

      const nodeIds = [...new Set((choices ?? []).map((c) => c.node_id))];
      const { data: nodes } = await ctx.supabaseAdmin
        .from("decision_nodes")
        .select("id, node_text")
        .in("id", nodeIds);

      const choiceMap = new Map((choices ?? []).map((c) => [c.id, c]));
      const nodeMap = new Map((nodes ?? []).map((n) => [n.id, n.node_text]));

      const stepsText = history
        .map((h, i) => {
          const choice = choiceMap.get(h.choice_id);
          if (!choice) return null;
          const situationText = nodeMap.get(choice.node_id);
          return [
            `Pasul ${i + 1}:`,
            `Situație: ${situationText ?? "(necunoscută)"}`,
            `Alegerea făcută: ${choice.choice_text}`,
            `Consecință: ${choice.feedback ?? "(fără)"}`,
            `Punctaj la acest pas: ${choice.score > 0 ? "+" : ""}${choice.score}`,
          ].join("\n");
        })
        .filter(Boolean)
        .join("\n\n");

      const prompt = `Ești un formator de gândire critică și decizională, care oferă
feedback constructiv, cald dar onest, unui angajat care tocmai a parcurs o
simulare de decizie la locul de muncă.

Scenariul: "${scenario?.title ?? ""}" — ${scenario?.description ?? ""}

Parcursul complet al deciziilor lui, în ordine:

${stepsText}

Scor final: ${session.total_score}
Profil dominant identificat automat: ${session.profile ?? "neclar"}

Scrie un feedback personalizat, de 3-5 propoziții, în limba română, la
persoana a II-a singular. Menționează tiparul observat în alegerile lui
(nu doar eticheta generică de profil), un moment concret din parcurs unde
ar fi putut decide diferit (dacă există un pas cu scor negativ sau zero),
și un aspect pe care l-a gestionat bine. Ton constructiv, non-punitiv,
orientat spre dezvoltare, ca într-un debrief de training corporate. Nu
repeta mecanic textele de consecință de mai sus — sintetizează-le.`;

      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) throw new Error("GEMINI_API_KEY nu e configurată pe server.");

      // Retry cu backoff pentru 503 ("model supraîncărcat") — eroare
      // temporară, frecventă pe nivelul gratuit în orele de vârf. De obicei
      // dispare în 1-3 secunde; încercăm de până la 3 ori înainte să renunțăm.
      const delays = [500, 1500, 3000];
      let text: string | null = null;

      for (let attempt = 0; attempt <= delays.length; attempt++) {
        const geminiResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );

        if (geminiResp.ok) {
          const geminiJson = await geminiResp.json();
          text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
          break;
        }

        if (geminiResp.status === 429) {
          throw new Error(
            "Serviciul AI e ocupat momentan (limită de utilizare atinsă). Încearcă din nou peste câteva minute."
          );
        }

        const errText = await geminiResp.text();
        console.error(`Gemini error (attempt ${attempt + 1}):`, errText);

        const isOverloaded = geminiResp.status === 503;
        if (!isOverloaded || attempt === delays.length) break;

        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }

      if (!text) {
        throw new Error(
          "Serviciul AI e temporar supraîncărcat (foarte cerut acum, pe nivelul gratuit). Încearcă din nou în câteva secunde."
        );
      }

      return Response.json({ feedback: text.trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: message }, { status: 400 });
    }
  }),
};
