import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, language, languageName } = await req.json();

    if (!transcript || !languageName) {
      return new Response(JSON.stringify({ error: "Missing transcript or languageName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a compassionate TB (Tuberculosis) screening assistant for rural India. The user has spoken their symptoms in ${languageName}. 

Your task:
1. Extract all symptoms mentioned from their speech
2. Assess TB risk level as exactly one of: Low, Medium, or High
3. Provide exactly 3 personalized next steps based on their specific symptoms

Rules:
- Respond ONLY in ${languageName} — never mix languages
- Use simple everyday words — no medical jargon
- Write as if speaking to a farmer or daily wage worker
- Keep total response under 120 words
- Start your response with exactly: "RISK: Low" or "RISK: Medium" or "RISK: High" (always in English so it can be parsed)
- Then on next line write the 3 next steps in ${languageName}
- Never say you are an AI
- Never diagnose TB — only assess risk
- Always end with recommending a DOTS clinic visit
- Be warm, caring, not scary`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User symptoms (spoken in ${languageName}): "${transcript}"` },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content || "";

    // Parse risk level
    let riskLevel = "Medium";
    const riskMatch = fullText.match(/RISK:\s*(High|Medium|Low)/i);
    if (riskMatch) {
      riskLevel = riskMatch[1].charAt(0).toUpperCase() + riskMatch[1].slice(1).toLowerCase();
    }

    // Remove the RISK: line from the response
    const aiResponse = fullText.replace(/^RISK:\s*(High|Medium|Low)\s*\n?/i, "").trim();

    return new Response(JSON.stringify({ riskLevel, aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tb-screen error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
