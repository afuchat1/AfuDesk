import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { chat_id, message_content, visitor_name } = await req.json();

    if (!chat_id || !message_content) {
      return new Response(
        JSON.stringify({ error: "Missing chat_id or message_content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get chat -> website -> owner
    const { data: chat } = await supabaseAdmin
      .from("chats")
      .select("website_id, visitor_name, visitor_email")
      .eq("id", chat_id)
      .single();

    if (!chat) {
      return new Response(
        JSON.stringify({ error: "Chat not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: website } = await supabaseAdmin
      .from("websites")
      .select("owner_id, name")
      .eq("id", chat.website_id)
      .single();

    if (!website) {
      return new Response(
        JSON.stringify({ error: "Website not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(website.owner_id);

    if (!userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Owner email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ownerEmail = userData.user.email;
    const senderName = visitor_name || chat.visitor_name || "A visitor";
    const siteName = website.name || "your website";

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AfuDesk <notifications@afuchat.com>",
        to: [ownerEmail],
        subject: `New message from ${senderName} on ${siteName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
            <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <div style="background:linear-gradient(135deg,#00C2CB,#00a5ad);padding:28px 28px;">
                <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">New Message</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${senderName} sent a message on <strong>${siteName}</strong></p>
              </div>
              <div style="padding:28px;">
                <div style="background:#f0fffe;border-left:4px solid #00C2CB;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                  <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.6;">${message_content}</p>
                </div>
                ${chat.visitor_email ? `<p style="font-size:13px;color:#666;margin:0 0 16px;">📧 <a href="mailto:${chat.visitor_email}" style="color:#00C2CB;text-decoration:none;">${chat.visitor_email}</a></p>` : ""}
                <a href="https://support.afuchat.com/dashboard/chats" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#00C2CB,#00a5ad);color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Reply in Dashboard →</a>
              </div>
              <div style="padding:16px 28px;border-top:1px solid #f0f0f0;text-align:center;">
                <p style="margin:0;font-size:11px;color:#bbb;">Sent by <a href="https://support.afuchat.com" style="color:#00C2CB;text-decoration:none;">AfuDesk</a> • support.afuchat.com</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ success: false, error: resendData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-new-message error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
