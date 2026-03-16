(function() {
  'use strict';

  // Extract site_id from script tag
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  var src = currentScript.getAttribute('src') || '';
  var params = new URLSearchParams(src.split('?')[1] || '');
  var SITE_ID = params.get('site_id');

  if (!SITE_ID) {
    console.error('AfuDesk: Missing site_id parameter');
    return;
  }

  var SUPABASE_URL = 'https://dzmfdfvundfxyejcunix.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWZkZnZ1bmRmeHllamN1bml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTk2NDcsImV4cCI6MjA4OTE5NTY0N30.THUutzgFmXckgRAi4omRkMzxKrcuCTY8n2LKgoi540o';

  var chatId = null;
  var websiteConfig = null;
  var isOpen = false;
  var visitorName = '';
  var visitorEmail = '';
  var hasStarted = false;
  var realtimeWs = null;

  // Supabase REST helpers
  function supabaseGet(table, query) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    }).then(function(r) { return r.json(); });
  }

  function supabasePost(table, body) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });
  }

  // Load website config
  function loadConfig() {
    return supabaseGet('websites', 'id=eq.' + SITE_ID + '&select=name,widget_color,widget_greeting,is_online')
      .then(function(data) {
        if (data && data.length > 0) {
          websiteConfig = data[0];
        } else {
          websiteConfig = { name: 'Support', widget_color: '#f97316', widget_greeting: 'Hi! How can we help you?', is_online: true };
        }
      });
  }

  // Create chat session
  function createChat() {
    return supabasePost('chats', {
      website_id: SITE_ID,
      visitor_name: visitorName || null,
      visitor_email: visitorEmail || null,
      status: 'open'
    }).then(function(data) {
      if (data && data.length > 0) {
        chatId = data[0].id;
        subscribeRealtime();
        // Send auto-greeting as first message from agent
        if (websiteConfig && websiteConfig.widget_greeting) {
          appendMessage(websiteConfig.widget_greeting, 'agent');
        }
      }
    });
  }

  // Send message
  function sendMessage(content) {
    if (!chatId || !content.trim()) return;
    supabasePost('messages', {
      chat_id: chatId,
      sender: 'visitor',
      content: content.trim()
    });
    appendMessage(content.trim(), 'visitor');
  }

  // Subscribe to realtime messages
  function subscribeRealtime() {
    if (!chatId) return;

    var wsUrl = SUPABASE_URL.replace('https://', 'wss://') + '/realtime/v1/websocket?apikey=' + SUPABASE_KEY + '&vsn=1.0.0';
    realtimeWs = new WebSocket(wsUrl);

    realtimeWs.onopen = function() {
      // Join channel
      var joinMsg = {
        topic: 'realtime:public:messages:chat_id=eq.' + chatId,
        event: 'phx_join',
        payload: { config: { broadcast: { self: false }, presence: { key: '' }, postgres_changes: [{ event: 'INSERT', schema: 'public', table: 'messages', filter: 'chat_id=eq.' + chatId }] } },
        ref: '1'
      };
      realtimeWs.send(JSON.stringify(joinMsg));

      // Heartbeat
      setInterval(function() {
        if (realtimeWs && realtimeWs.readyState === 1) {
          realtimeWs.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: 'hb' }));
        }
      }, 30000);
    };

    realtimeWs.onmessage = function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.event === 'postgres_changes' && msg.payload && msg.payload.data) {
          var record = msg.payload.data.record;
          if (record && record.sender === 'agent') {
            appendMessage(record.content, 'agent');
          }
        }
      } catch(err) {}
    };
  }

  // Poll for new messages as fallback
  var lastMsgCount = 0;
  function pollMessages() {
    if (!chatId) return;
    supabaseGet('messages', 'chat_id=eq.' + chatId + '&order=created_at.asc&select=id,content,sender,created_at')
      .then(function(msgs) {
        if (msgs && msgs.length > lastMsgCount) {
          for (var i = lastMsgCount; i < msgs.length; i++) {
            if (msgs[i].sender === 'agent') {
              appendMessage(msgs[i].content, 'agent');
            }
          }
          lastMsgCount = msgs.length;
        }
      });
  }
  setInterval(pollMessages, 4000);

  // Append message to UI
  function appendMessage(text, sender) {
    var container = document.getElementById('afudesk-messages');
    if (!container) return;

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;margin-bottom:8px;' + (sender === 'visitor' ? 'justify-content:flex-end;' : 'justify-content:flex-start;');

    var bubble = document.createElement('div');
    var color = (websiteConfig && websiteConfig.widget_color) || '#f97316';
    bubble.style.cssText = 'max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.4;word-wrap:break-word;' +
      (sender === 'visitor'
        ? 'background:' + color + ';color:#fff;border-bottom-right-radius:4px;'
        : 'background:#1e1e2e;color:#e0e0e0;border-bottom-left-radius:4px;');
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }

  // Build widget UI
  function buildWidget() {
    var color = (websiteConfig && websiteConfig.widget_color) || '#f97316';
    var greeting = (websiteConfig && websiteConfig.widget_greeting) || 'Hi! How can we help you?';

    // Container
    var root = document.createElement('div');
    root.id = 'afudesk-root';
    root.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';

    // Chat window
    var chatWindow = document.createElement('div');
    chatWindow.id = 'afudesk-window';
    chatWindow.style.cssText = 'display:none;width:360px;max-width:calc(100vw - 32px);height:500px;max-height:calc(100vh - 100px);background:#0f1019;border-radius:16px;overflow:hidden;flex-direction:column;margin-bottom:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'padding:16px 20px;background:' + color + ';display:flex;align-items:center;justify-content:space-between;';
    header.innerHTML = '<div style="display:flex;align-items:center;gap:10px;">' +
      '<div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>' +
      '<div><div style="color:#fff;font-weight:600;font-size:15px;">' + escapeHtml(websiteConfig ? websiteConfig.name : 'Support') + '</div>' +
      '<div style="color:rgba(255,255,255,0.8);font-size:12px;">We typically reply instantly</div></div></div>' +
      '<button id="afudesk-close" style="background:none;border:none;cursor:pointer;padding:4px;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

    // Messages area
    var messages = document.createElement('div');
    messages.id = 'afudesk-messages';
    messages.style.cssText = 'flex:1;overflow-y:auto;padding:16px;background:#0f1019;';

    // Pre-chat form
    var prechat = document.createElement('div');
    prechat.id = 'afudesk-prechat';
    prechat.style.cssText = 'padding:20px;background:#0f1019;';
    prechat.innerHTML = '<p style="color:#a0a0b0;font-size:13px;margin-bottom:16px;">' + escapeHtml(greeting) + '</p>' +
      '<input id="afudesk-name" type="text" placeholder="Your name" style="width:100%;padding:10px 14px;margin-bottom:10px;background:#1a1a2e;color:#e0e0e0;border:none;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;" />' +
      '<input id="afudesk-email" type="email" placeholder="Your email" style="width:100%;padding:10px 14px;margin-bottom:14px;background:#1a1a2e;color:#e0e0e0;border:none;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;" />' +
      '<button id="afudesk-start" style="width:100%;padding:10px;background:' + color + ';color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Start Chat</button>';

    // Input area
    var inputArea = document.createElement('div');
    inputArea.id = 'afudesk-input-area';
    inputArea.style.cssText = 'display:none;padding:12px 16px;background:#0f1019;';
    inputArea.innerHTML = '<form id="afudesk-form" style="display:flex;gap:8px;">' +
      '<input id="afudesk-input" type="text" placeholder="Type a message..." autocomplete="off" style="flex:1;padding:10px 14px;background:#1a1a2e;color:#e0e0e0;border:none;border-radius:8px;font-size:14px;outline:none;" />' +
      '<button type="submit" style="width:40px;height:40px;background:' + color + ';border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></form>';

    // Footer
    var footer = document.createElement('div');
    footer.style.cssText = 'padding:8px;text-align:center;background:#0a0a12;';
    footer.innerHTML = '<span style="color:#555;font-size:11px;">Powered by <a href="https://afudesk.com" target="_blank" style="color:' + color + ';text-decoration:none;font-weight:600;">AfuDesk</a></span>';

    chatWindow.appendChild(header);
    chatWindow.appendChild(prechat);
    chatWindow.appendChild(messages);
    chatWindow.appendChild(inputArea);
    chatWindow.appendChild(footer);

    // Bubble button
    var bubble = document.createElement('button');
    bubble.id = 'afudesk-bubble';
    bubble.style.cssText = 'width:60px;height:60px;border-radius:50%;background:' + color + ';border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:transform 0.2s;float:right;';
    bubble.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    bubble.onmouseenter = function() { bubble.style.transform = 'scale(1.1)'; };
    bubble.onmouseleave = function() { bubble.style.transform = 'scale(1)'; };

    // Unread badge
    var badge = document.createElement('div');
    badge.id = 'afudesk-badge';
    badge.style.cssText = 'display:none;position:absolute;top:-4px;right:-4px;width:20px;height:20px;background:#ef4444;color:#fff;border-radius:50%;font-size:11px;font-weight:700;display:none;align-items:center;justify-content:center;';
    bubble.style.position = 'relative';
    bubble.appendChild(badge);

    root.appendChild(chatWindow);
    root.appendChild(bubble);
    document.body.appendChild(root);

    // Events
    bubble.addEventListener('click', function() {
      isOpen = !isOpen;
      chatWindow.style.display = isOpen ? 'flex' : 'none';
      if (isOpen) {
        badge.style.display = 'none';
      }
    });

    document.getElementById('afudesk-close').addEventListener('click', function() {
      isOpen = false;
      chatWindow.style.display = 'none';
    });

    document.getElementById('afudesk-start').addEventListener('click', function() {
      visitorName = document.getElementById('afudesk-name').value.trim();
      visitorEmail = document.getElementById('afudesk-email').value.trim();

      if (!visitorName) {
        document.getElementById('afudesk-name').style.outline = '2px solid #ef4444';
        return;
      }

      hasStarted = true;
      prechat.style.display = 'none';
      messages.style.display = 'block';
      inputArea.style.display = 'block';

      createChat();
    });

    document.getElementById('afudesk-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var input = document.getElementById('afudesk-input');
      var msg = input.value;
      if (msg.trim()) {
        sendMessage(msg);
        input.value = '';
        lastMsgCount++;
      }
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      loadConfig().then(buildWidget);
    });
  } else {
    loadConfig().then(buildWidget);
  }
})();
