import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROJECT_CONTEXT = `
Você é o assistente de IA do RezeFlix, uma plataforma de streaming construída com as seguintes tecnologias:

## Stack Técnico
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — banco de dados PostgreSQL, autenticação, edge functions, storage
- **Hospedagem**: Lovable Cloud com deploy automático
- **PWA**: Suporte a instalação como app nativo via vite-plugin-pwa
- **Player**: HLS.js para streaming de vídeo

## Estrutura do Banco de Dados
Tabelas existentes:
- **videos** (id, title, slug, description, type[movie/series/trailer], year, duration_minutes, poster_url, banner_url, video_url, category_id, is_featured)
- **categories** (id, name, slug)
- **seasons** (id, video_id, season_number, title, poster_url)
- **episodes** (id, season_id, episode_number, title, description, video_url, poster_url, banner_url, duration_minutes)
- **favorites** (id, user_id, video_id)
- **watch_progress** (id, user_id, video_id, episode_id, progress_seconds, duration_seconds, completed, last_watched_at)
- **live_channels** (id, name, slug, logo_url, stream_url, category, is_active)
- **user_profiles** (id, user_id, name, avatar_id, avatar_url, is_kids, display_order)
- **user_roles** (id, user_id, role[admin/user])
- **user_preferences** (id, user_id, color_theme)
- **b2_accounts** (id, label, key_id, app_key, bucket_name, endpoint, max_storage_bytes, used_storage_bytes, is_active, priority)
- **profiles** (id, user_id, display_name, avatar_url)
- **avatars** (id, section_id, name, emoji, image_url, bg_class, display_order)
- **avatar_sections** (id, name, slug, display_order)
- **watch_parties** (id, host_id, video_id, episode_id, name, code, is_active, is_playing, current_time_seconds, custom_url, custom_title)
- **watch_party_messages** e **watch_party_participants**

## Funcionalidades Existentes
- Catálogo de filmes, séries e trailers com categorias
- Player de vídeo com HLS, legendas, e progresso salvo
- Sistema de favoritos
- TV ao vivo com canais m3u8
- Watch Party (assistir junto com chat em tempo real)
- Sistema de perfis múltiplos (estilo Netflix, até 5 por conta)
- Avatares personalizáveis com seções
- Temas de cores personalizáveis
- Pool de contas Backblaze B2 para armazenamento com rotação automática
- PWA com suporte a instalação
- Painel admin completo
- Autenticação com email/senha e OTP

## Edge Functions Existentes
- **b2-storage**: Upload/download com pool de contas B2
- **check-video-url**: Verifica se URL de vídeo está acessível
- **generate-subtitles**: Geração de legendas
- **gemini-chat**: Este chat de IA

## Arquitetura de Armazenamento
- Lovable Cloud Storage (buckets: posters, videos, avatars)
- Pool de contas Backblaze B2 (10GB gratuitos por conta)
- Protocolo b2://label/path para resolver URLs via edge function
- Links externos (Google Drive, YouTube, CDNs)

## Como criar novas funcionalidades
Quando o usuário pedir uma nova funcionalidade, você deve:
1. Explicar o que será necessário (tabelas, edge functions, componentes)
2. Fornecer o SQL de migração para novas tabelas (com RLS policies)
3. Fornecer o código da edge function (se necessário)
4. Fornecer o código dos componentes React
5. Explicar como integrar no projeto existente

Sempre use:
- Tokens semânticos do Tailwind (bg-primary, text-foreground, etc.)
- Componentes shadcn/ui existentes
- Supabase client de @/integrations/supabase/client
- TypeScript
- Padrões React Query para data fetching
- RLS policies em todas as tabelas

IMPORTANTE: Você gera código e instruções. O usuário vai copiar suas sugestões e colar no Lovable para eu (o agente Lovable) executar. Então formate tudo em blocos de código claros e organizados.

Responda SEMPRE em português brasileiro. Use markdown rico com blocos de código.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { messages, model } = await req.json();

    const geminiModel = model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    // Build Gemini contents
    const contents = messages
      .filter((m: any) => m.role !== "system")
      .map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: any = {
      contents,
      systemInstruction: { parts: [{ text: PROJECT_CONTEXT }] },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Gemini API error", details: errText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("gemini-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
