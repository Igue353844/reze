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

async function generatePresignedUrl(params: {
  method: string;
  bucket: string;
  key: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  expiresIn?: number;
}): Promise<string> {
  const { method, bucket, key, endpoint, accessKeyId, secretAccessKey, region, expiresIn = 3600 } = params;
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

async function configureB2Cors(keyId: string, appKey: string, bucketName: string): Promise<boolean> {
  try {
    const authResp = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      headers: { Authorization: "Basic " + btoa(keyId + ":" + appKey) },
    });
    if (!authResp.ok) return false;
    const authData = await authResp.json();

    const listResp = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: "POST",
      headers: { Authorization: authData.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: authData.accountId, bucketName }),
    });
    if (!listResp.ok) return false;
    const listData = await listResp.json();
    const bucket = listData.buckets?.[0];
    if (!bucket) return false;

    const updateResp = await fetch(`${authData.apiUrl}/b2api/v2/b2_update_bucket`, {
      method: "POST",
      headers: { Authorization: authData.authorizationToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: authData.accountId,
        bucketId: bucket.bucketId,
        corsRules: [{
          corsRuleName: "allowAllUploadsAndDownloads",
          allowedOrigins: ["*"],
          allowedOperations: ["s3_put", "s3_get", "s3_head"],
          allowedHeaders: ["*"],
          exposeHeaders: ["ETag", "x-amz-request-id"],
          maxAgeSeconds: 86400,
        }],
      }),
    });
    return updateResp.ok;
  } catch {
    return false;
  }
}

// ─── Account resolution helpers ─────────────────────────────────────────────

interface B2Account {
  id: string;
  label: string;
  key_id: string;
  app_key: string;
  bucket_name: string;
  endpoint: string;
  max_storage_bytes: number;
  used_storage_bytes: number;
}

/** Get account by label from database using service role */
async function getAccountByLabel(label: string): Promise<B2Account | null> {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data } = await sb
    .from("b2_accounts")
    .select("*")
    .eq("label", label)
    .eq("is_active", true)
    .single();
  return data as B2Account | null;
}

/** Get the best available account (least used, with space remaining) */
async function getBestAccount(): Promise<B2Account | null> {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data } = await sb
    .from("b2_accounts")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("used_storage_bytes", { ascending: true });

  if (!data || data.length === 0) return null;
  // Pick first account that still has space
  for (const acc of data) {
    if (acc.used_storage_bytes < acc.max_storage_bytes) return acc as B2Account;
  }
  return null; // all full
}

/** Increment used_storage_bytes for an account */
async function incrementUsage(accountId: string, bytes: number) {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  // Use rpc or direct update
  const { data: current } = await sb
    .from("b2_accounts")
    .select("used_storage_bytes")
    .eq("id", accountId)
    .single();
  if (current) {
    await sb
      .from("b2_accounts")
      .update({ used_storage_bytes: current.used_storage_bytes + bytes })
      .eq("id", accountId);
  }
}

function getRegion(endpoint: string): string {
  const match = endpoint.match(/s3\.(.+?)\.backblazeb2\.com/);
  return match ? match[1] : "us-east-005";
}

// Fallback to env vars (legacy single-account mode)
function getLegacyAccount(): B2Account {
  return {
    id: "legacy",
    label: "default",
    key_id: Deno.env.get("B2_KEY_ID")!,
    app_key: Deno.env.get("B2_APP_KEY")!,
    bucket_name: Deno.env.get("B2_BUCKET_NAME")!,
    endpoint: Deno.env.get("B2_ENDPOINT")!,
    max_storage_bytes: 10737418240,
    used_storage_bytes: 0,
  };
}

// Track CORS per bucket
const corsConfiguredSet = new Set<string>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, fileName, contentType, filePath, fileSize, accountLabel } = body;

    // ─── GET UPLOAD URL ─────────────────────────────────────────────
    if (action === "get-upload-url") {
      // Pick the best available account from the pool
      let account = await getBestAccount();
      if (!account) {
        // Fallback to legacy env vars
        account = getLegacyAccount();
      }

      const region = getRegion(account.endpoint);
      const bucketKey = `${account.label}:${account.bucket_name}`;

      // Auto-configure CORS if not yet done for this bucket
      if (!corsConfiguredSet.has(bucketKey)) {
        const ok = await configureB2Cors(account.key_id, account.app_key, account.bucket_name);
        if (ok) corsConfiguredSet.add(bucketKey);
      }

      const key = filePath || `uploads/${Date.now()}-${fileName}`;
      const url = await generatePresignedUrl({
        method: "PUT",
        bucket: account.bucket_name,
        key,
        endpoint: account.endpoint,
        accessKeyId: account.key_id,
        secretAccessKey: account.app_key,
        region,
        expiresIn: 3600,
      });

      // Track storage usage estimate
      if (fileSize && account.id !== "legacy") {
        await incrementUsage(account.id, fileSize);
      }

      return new Response(JSON.stringify({ url, key, accountLabel: account.label }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── GET DOWNLOAD URL ───────────────────────────────────────────
    if (action === "get-download-url") {
      let account: B2Account | null = null;

      // If accountLabel is provided, look up that specific account
      if (accountLabel) {
        account = await getAccountByLabel(accountLabel);
      }

      // Fallback to legacy env vars
      if (!account) {
        account = getLegacyAccount();
      }

      const region = getRegion(account.endpoint);
      const url = await generatePresignedUrl({
        method: "GET",
        bucket: account.bucket_name,
        key: filePath,
        endpoint: account.endpoint,
        accessKeyId: account.key_id,
        secretAccessKey: account.app_key,
        region,
        expiresIn: 7200,
      });

      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── CONFIGURE CORS ─────────────────────────────────────────────
    if (action === "configure-cors") {
      let account: B2Account | null = null;
      if (accountLabel) {
        account = await getAccountByLabel(accountLabel);
      }
      if (!account) account = getLegacyAccount();
      const success = await configureB2Cors(account.key_id, account.app_key, account.bucket_name);
      return new Response(JSON.stringify({ success }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── LIST ACCOUNTS (admin only) ─────────────────────────────────
    if (action === "list-accounts") {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      // Check admin
      const { data: roleData } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: accounts } = await sb
        .from("b2_accounts")
        .select("id, label, bucket_name, endpoint, max_storage_bytes, used_storage_bytes, is_active, priority, created_at")
        .order("priority", { ascending: true });

      return new Response(JSON.stringify({ accounts: accounts || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("B2 storage error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
