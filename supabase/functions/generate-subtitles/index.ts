import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoTitle, context, language = "pt-BR" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um gerador de legendas para vídeos. Sua tarefa é criar legendas descritivas e informativas que ajudem o espectador a entender o que está acontecendo no vídeo.

Regras:
- Gere legendas em ${language === "pt-BR" ? "português brasileiro" : language}
- Mantenha as legendas curtas e claras (máximo 2 linhas por legenda)
- Inclua descrições de ações importantes, diálogos e sons relevantes
- Use formatação [MÚSICA], [SILÊNCIO], [RISOS], etc. para indicar sons não-verbais
- Gere legendas que se encaixem em intervalos de 3-5 segundos

Formato de saída (JSON):
{
  "subtitles": [
    { "start": 0, "end": 3, "text": "Texto da legenda" },
    { "start": 3, "end": 6, "text": "Próxima legenda" }
  ]
}`;

    const userPrompt = `Gere legendas descritivas para este vídeo:
Título: ${videoTitle || "Vídeo sem título"}
Contexto adicional: ${context || "Nenhum contexto fornecido"}

Gere pelo menos 10 legendas genéricas que podem ser usadas durante a reprodução do vídeo. Como não temos acesso ao áudio real, crie legendas descritivas baseadas no título e contexto.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes para gerar legendas." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Try to parse JSON from the response
    let subtitles;
    try {
      // Extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        subtitles = parsed.subtitles || parsed;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      // Fallback: create generic subtitles
      subtitles = [
        { start: 0, end: 5, text: "[Início do vídeo]" },
        { start: 5, end: 10, text: videoTitle || "[Reproduzindo...]" },
        { start: 10, end: 15, text: "[Cena em andamento]" },
      ];
    }

    return new Response(
      JSON.stringify({ subtitles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating subtitles:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
