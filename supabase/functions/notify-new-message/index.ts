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

    // Get owner email from auth.users
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

    // Try to enqueue email if email infrastructure exists
    const { error: enqueueError } = await supabaseAdmin.rpc("enqueue_email", {
      p_queue_name: "transactional_emails",
      p_message_id: `new-msg-${chat_id}-${Date.now()}`,
      p_template_name: "new-message-notification",
      p_recipient_email: ownerEmail,
      p_subject: `New message from ${senderName} on ${siteName}`,
      p_html_body: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
          <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:#00C2CB;padding:24px 28px;">
              <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">💬 New Message</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${senderName} sent a message on ${siteName}</p>
            </div>
            <div style="padding:24px 28px;">
              <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin-bottom:20px;">
                <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${message_content}</p>
              </div>
              ${chat.visitor_email ? `<p style="font-size:13px;color:#777;margin:0 0 8px;">📧 ${chat.visitor_email}</p>` : ""}
              <a href="https://support.afuchat.com/chats" style="display:inline-block;padding:10px 24px;background:#00C2CB;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Reply in Dashboard</a>
            </div>
            <div style="padding:16px 28px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#bbb;">Sent by AfuDesk • support.afuchat.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (enqueueError) {
      // If email queue not set up yet, log but don't fail
      console.log("Email enqueue failed (infrastructure may not be set up):", enqueueError.message);
      return new Response(
        JSON.stringify({ success: false, reason: "email_infra_not_ready", details: enqueueError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
