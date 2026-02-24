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
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ accessible: false, error: "URL inválida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);

      const contentType = response.headers.get("content-type") || "";
      const isVideo = contentType.includes("video") || 
                      contentType.includes("application/octet-stream") ||
                      contentType.includes("application/vnd.apple.mpegurl") ||
                      url.endsWith(".m3u8") || url.endsWith(".mp4") || url.endsWith(".mkv");

      return new Response(
        JSON.stringify({
          accessible: response.ok,
          status: response.status,
          contentType,
          isVideo,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchError) {
      clearTimeout(timeout);
      const message = fetchError.name === "AbortError" ? "Timeout - URL demorou demais" : fetchError.message;
      return new Response(
        JSON.stringify({ accessible: false, error: message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ accessible: false, error: e.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
