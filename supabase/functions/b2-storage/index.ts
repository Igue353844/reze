import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function hmacSha256(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  return crypto.subtle
    .importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((k) => crypto.subtle.sign("HMAC", k, message))
    .then((sig) => new Uint8Array(sig));
}

async function sha256(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string) {
  const enc = new TextEncoder();
  let key = await hmacSha256(enc.encode("AWS4" + secretKey), enc.encode(dateStamp));
  key = await hmacSha256(key, enc.encode(region));
  key = await hmacSha256(key, enc.encode(service));
  key = await hmacSha256(key, enc.encode("aws4_request"));
  return key;
}

interface S3PresignParams {
  method: string;
  bucket: string;
  key: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  expiresIn?: number;
  contentType?: string;
}

async function generatePresignedUrl(params: S3PresignParams): Promise<string> {
  const { method, bucket, key, endpoint, accessKeyId, secretAccessKey, region, expiresIn = 3600, contentType } = params;
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const shortDate = dateStamp.slice(0, 8);
  const credential = `${accessKeyId}/${shortDate}/${region}/s3/aws4_request`;

  const host = `${bucket}.${endpoint}`;
  const canonicalUri = `/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

  const queryParams: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": dateStamp,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  };

  if (contentType && method === "PUT") {
    queryParams["Content-Type"] = contentType;
  }

  const sortedKeys = Object.keys(queryParams).sort();
  const canonicalQueryString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [method, canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const enc = new TextEncoder();
  const canonicalRequestHash = await sha256(enc.encode(canonicalRequest));
  const stringToSign = ["AWS4-HMAC-SHA256", dateStamp, `${shortDate}/${region}/s3/aws4_request`, canonicalRequestHash].join("\n");

  const signingKey = await getSigningKey(secretAccessKey, shortDate, region, "s3");
  const signature = toHex(await hmacSha256(signingKey, enc.encode(stringToSign)));

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, fileName, contentType, filePath } = body;

    const B2_KEY_ID = Deno.env.get("B2_KEY_ID")!;
    const B2_APP_KEY = Deno.env.get("B2_APP_KEY")!;
    const B2_BUCKET_NAME = Deno.env.get("B2_BUCKET_NAME")!;
    const B2_ENDPOINT = Deno.env.get("B2_ENDPOINT")!;

    // Extract region from endpoint (e.g., s3.us-east-005.backblazeb2.com -> us-east-005)
    const regionMatch = B2_ENDPOINT.match(/s3\.(.+?)\.backblazeb2\.com/);
    const region = regionMatch ? regionMatch[1] : "us-east-005";

    if (action === "get-upload-url") {
      // Generate presigned PUT URL for upload
      const key = filePath || `uploads/${Date.now()}-${fileName}`;
      const url = await generatePresignedUrl({
        method: "PUT",
        bucket: B2_BUCKET_NAME,
        key,
        endpoint: B2_ENDPOINT,
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
        region,
        expiresIn: 3600,
        contentType: contentType || "application/octet-stream",
      });

      return new Response(JSON.stringify({ url, key }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-download-url") {
      // Generate presigned GET URL for download/streaming
      const url = await generatePresignedUrl({
        method: "GET",
        bucket: B2_BUCKET_NAME,
        key: filePath,
        endpoint: B2_ENDPOINT,
        accessKeyId: B2_KEY_ID,
        secretAccessKey: B2_APP_KEY,
        region,
        expiresIn: 7200, // 2 hours for streaming
      });

      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("B2 storage error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
