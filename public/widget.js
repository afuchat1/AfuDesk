(function() {
  'use strict';

  var SITE_ID = null;
  var allScripts = document.querySelectorAll('script[src*="widget.js"]');
  for (var i = 0; i < allScripts.length; i++) {
    var s = allScripts[i].getAttribute('src') || '';
    if (s.indexOf('site_id=') !== -1) {
      var params = new URLSearchParams(s.split('?')[1] || '');
      SITE_ID = params.get('site_id');
      break;
    }
  }

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
  var activeTab = 'chat';
  var unreadCount = 0;

  var COLOR = '#00C2CB';

  function supabaseGet(table, query) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' }
    }).then(function(r) { return r.json(); });
  }

  function supabasePost(table, body) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });
  }

  function supabasePatch(table, query, body) {
    return fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });
  }

  function loadConfig() {
    return supabaseGet('websites', 'id=eq.' + SITE_ID + '&select=name,widget_color,widget_greeting,is_online')
      .then(function(data) {
        if (data && data.length > 0) {
          websiteConfig = data[0];
          if (websiteConfig.widget_color) COLOR = websiteConfig.widget_color;
        } else {
          websiteConfig = { name: 'Support', widget_color: COLOR, widget_greeting: 'Hi there! How can we help you today?', is_online: true };
        }
      });
  }

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
        if (websiteConfig && websiteConfig.widget_greeting) {
          appendMessage(websiteConfig.widget_greeting, 'agent');
        }
      }
    });
  }

  function sendMessage(content) {
    if (!chatId || !content.trim()) return;
    var trimmed = content.trim();
    supabasePost('messages', { chat_id: chatId, sender: 'visitor', content: trimmed });
    appendMessage(trimmed, 'visitor');
    // Trigger email notification to website owner
    fetch(SUPABASE_URL + '/functions/v1/notify-new-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
      body: JSON.stringify({ chat_id: chatId, message_content: trimmed, visitor_name: visitorName })
    }).catch(function() {});
  }

  function subscribeRealtime() {
    if (!chatId) return;
    var wsUrl = SUPABASE_URL.replace('https://', 'wss://') + '/realtime/v1/websocket?apikey=' + SUPABASE_KEY + '&vsn=1.0.0';
    realtimeWs = new WebSocket(wsUrl);
    realtimeWs.onopen = function() {
      realtimeWs.send(JSON.stringify({
        topic: 'realtime:public:messages:chat_id=eq.' + chatId,
        event: 'phx_join',
        payload: { config: { broadcast: { self: false }, presence: { key: '' }, postgres_changes: [{ event: 'INSERT', schema: 'public', table: 'messages', filter: 'chat_id=eq.' + chatId }] } },
        ref: '1'
      }));
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
            if (!isOpen) { unreadCount++; updateBadge(); }
          }
        }
      } catch(err) {}
    };
  }

  var lastMsgCount = 0;
  function pollMessages() {
    if (!chatId) return;
    supabaseGet('messages', 'chat_id=eq.' + chatId + '&order=created_at.asc&select=id,content,sender,created_at')
      .then(function(msgs) {
        if (msgs && msgs.length > lastMsgCount) {
          for (var i = lastMsgCount; i < msgs.length; i++) {
            if (msgs[i].sender === 'agent') appendMessage(msgs[i].content, 'agent');
          }
          lastMsgCount = msgs.length;
        }
      });
  }
  setInterval(pollMessages, 5000);

  function updateBadge() {
    var badge = document.getElementById('afu-badge');
    if (!badge) return;
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function appendMessage(text, sender) {
    var container = document.getElementById('afu-messages');
    if (!container) return;
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;margin-bottom:12px;align-items:flex-end;gap:8px;' + (sender === 'visitor' ? 'flex-direction:row-reverse;' : '');

    if (sender === 'agent') {
      var avatar = document.createElement('div');
      avatar.style.cssText = 'width:28px;height:28px;border-radius:50%;background:' + COLOR + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;color:#fff;font-weight:700;';
      avatar.textContent = (websiteConfig && websiteConfig.name) ? websiteConfig.name.charAt(0).toUpperCase() : 'S';
      wrapper.appendChild(avatar);
    }

    var bubble = document.createElement('div');
    bubble.style.cssText = 'max-width:75%;padding:10px 14px;font-size:13.5px;line-height:1.5;word-wrap:break-word;' +
      (sender === 'visitor'
        ? 'background:' + COLOR + ';color:#fff;border-radius:18px 18px 4px 18px;'
        : 'background:#f0f2f5;color:#1a1a2e;border-radius:18px 18px 18px 4px;');
    bubble.textContent = text;
    wrapper.appendChild(bubble);

    var time = document.createElement('div');
    var now = new Date();
    time.textContent = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    time.style.cssText = 'font-size:10px;color:#999;flex-shrink:0;';
    wrapper.appendChild(time);

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }

  // ========== HELP ARTICLES ==========
  function loadHelpArticles() {
    var container = document.getElementById('afu-help-content');
    if (!container) return;
    container.innerHTML = '<div style="padding:24px;text-align:center;color:#999;">Loading...</div>';
    supabaseGet('help_articles', 'website_id=eq.' + SITE_ID + '&is_published=eq.true&order=sort_order.asc&select=id,title,excerpt,category,content')
      .then(function(articles) {
        if (!articles || articles.length === 0) {
          container.innerHTML = '<div style="padding:40px 24px;text-align:center;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin:0 auto 12px;display:block;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p style="color:#999;font-size:13px;">No help articles available yet.</p></div>';
          return;
        }
        var categories = {};
        articles.forEach(function(a) {
          var cat = a.category || 'General';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(a);
        });
        var html = '';
        Object.keys(categories).forEach(function(cat) {
          html += '<div style="padding:0 16px;margin-bottom:8px;"><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#999;padding:8px 0;">' + escapeHtml(cat) + '</p>';
          categories[cat].forEach(function(a) {
            html += '<div class="afu-help-item" data-id="' + a.id + '" style="padding:12px;margin-bottom:6px;background:#f8f9fa;border-radius:10px;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background=\'#eef0f2\'" onmouseleave="this.style.background=\'#f8f9fa\'">' +
              '<p style="font-size:14px;font-weight:600;color:#1a1a2e;margin:0 0 4px 0;">' + escapeHtml(a.title) + '</p>' +
              (a.excerpt ? '<p style="font-size:12px;color:#777;margin:0;line-height:1.4;">' + escapeHtml(a.excerpt) + '</p>' : '') +
              '</div>';
          });
          html += '</div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.afu-help-item').forEach(function(el) {
          el.addEventListener('click', function() {
            var id = this.getAttribute('data-id');
            var article = articles.find(function(a) { return a.id === id; });
            if (article) showArticleDetail(article);
          });
        });
      });
  }

  function showArticleDetail(article) {
    var container = document.getElementById('afu-help-content');
    if (!container) return;
    container.innerHTML = '<div style="padding:16px;">' +
      '<button id="afu-help-back" style="background:none;border:none;cursor:pointer;color:' + COLOR + ';font-size:13px;font-weight:600;padding:0;margin-bottom:12px;display:flex;align-items:center;gap:4px;">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Back</button>' +
      '<h3 style="font-size:17px;font-weight:700;color:#1a1a2e;margin:0 0 12px 0;">' + escapeHtml(article.title) + '</h3>' +
      '<div style="font-size:13.5px;color:#444;line-height:1.7;">' + (article.content || '<p style="color:#999;">No content available.</p>') + '</div>' +
      '</div>';
    document.getElementById('afu-help-back').addEventListener('click', function() { loadHelpArticles(); });
  }

  // ========== TICKETS ==========
  function loadTickets() {
    var container = document.getElementById('afu-tickets-content');
    if (!container) return;
    container.innerHTML = '<div style="padding:16px;">' +
      '<div style="margin-bottom:16px;">' +
      '<h3 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 4px 0;">Submit a Ticket</h3>' +
      '<p style="font-size:12px;color:#999;margin:0;">We\'ll get back to you via email</p></div>' +
      '<input id="afu-ticket-name" placeholder="Your name *" style="' + inputStyle() + '" />' +
      '<input id="afu-ticket-email" type="email" placeholder="Email address *" style="' + inputStyle() + '" />' +
      '<input id="afu-ticket-subject" placeholder="Subject *" style="' + inputStyle() + '" />' +
      '<select id="afu-ticket-priority" style="' + inputStyle() + 'color:#666;appearance:none;-webkit-appearance:none;">' +
      '<option value="low">Low Priority</option><option value="medium" selected>Medium Priority</option><option value="high">High Priority</option><option value="urgent">Urgent</option></select>' +
      '<textarea id="afu-ticket-desc" placeholder="Describe your issue... *" rows="4" style="' + inputStyle() + 'resize:none;min-height:80px;"></textarea>' +
      '<button id="afu-ticket-submit" style="width:100%;padding:11px;background:' + COLOR + ';color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.15s;" onmouseenter="this.style.opacity=\'0.9\'" onmouseleave="this.style.opacity=\'1\'">Submit Ticket</button>' +
      '<div id="afu-ticket-status" style="margin-top:10px;font-size:13px;text-align:center;"></div>' +
      '</div>';

    document.getElementById('afu-ticket-submit').addEventListener('click', submitTicket);
  }

  function inputStyle() {
    return 'width:100%;padding:10px 14px;margin-bottom:10px;background:#f8f9fa;color:#1a1a2e;border:1.5px solid #e8eaed;border-radius:10px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color 0.15s;';
  }

  function submitTicket() {
    var name = document.getElementById('afu-ticket-name').value.trim();
    var email = document.getElementById('afu-ticket-email').value.trim();
    var subject = document.getElementById('afu-ticket-subject').value.trim();
    var priority = document.getElementById('afu-ticket-priority').value;
    var desc = document.getElementById('afu-ticket-desc').value.trim();
    var status = document.getElementById('afu-ticket-status');

    if (!name || !email || !subject || !desc) {
      status.innerHTML = '<span style="color:#e53e3e;">Please fill in all required fields.</span>';
      return;
    }

    var btn = document.getElementById('afu-ticket-submit');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    btn.style.opacity = '0.6';

    supabasePost('support_tickets', {
      website_id: SITE_ID,
      visitor_name: name,
      visitor_email: email,
      subject: subject,
      priority: priority,
      description: desc,
      status: 'open'
    }).then(function(data) {
      if (data && data.length > 0) {
        status.innerHTML = '<span style="color:#22c55e;">✓ Ticket submitted successfully! We\'ll respond via email.</span>';
        document.getElementById('afu-ticket-name').value = '';
        document.getElementById('afu-ticket-email').value = '';
        document.getElementById('afu-ticket-subject').value = '';
        document.getElementById('afu-ticket-desc').value = '';
      } else {
        status.innerHTML = '<span style="color:#e53e3e;">Failed to submit. Please try again.</span>';
      }
      btn.disabled = false;
      btn.textContent = 'Submit Ticket';
      btn.style.opacity = '1';
    }).catch(function() {
      status.innerHTML = '<span style="color:#e53e3e;">Network error. Please try again.</span>';
      btn.disabled = false;
      btn.textContent = 'Submit Ticket';
      btn.style.opacity = '1';
    });
  }

  // ========== UPDATES ==========
  function loadUpdates() {
    var container = document.getElementById('afu-updates-content');
    if (!container) return;
    container.innerHTML = '<div style="padding:24px;text-align:center;color:#999;">Loading...</div>';
    supabaseGet('support_updates', 'website_id=eq.' + SITE_ID + '&is_published=eq.true&order=published_at.desc&select=id,title,summary,label,published_at,content')
      .then(function(updates) {
        if (!updates || updates.length === 0) {
          container.innerHTML = '<div style="padding:40px 24px;text-align:center;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin:0 auto 12px;display:block;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p style="color:#999;font-size:13px;">No updates posted yet.</p></div>';
          return;
        }
        var html = '';
        updates.forEach(function(u) {
          var date = new Date(u.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          var labelColors = { improvement: '#3b82f6', fix: '#22c55e', feature: '#8b5cf6', announcement: '#f59e0b' };
          var labelColor = labelColors[(u.label || '').toLowerCase()] || '#999';
          html += '<div class="afu-update-item" data-id="' + u.id + '" style="padding:14px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background=\'#f8f9fa\'" onmouseleave="this.style.background=\'transparent\'">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            (u.label ? '<span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#fff;background:' + labelColor + ';padding:2px 8px;border-radius:4px;">' + escapeHtml(u.label) + '</span>' : '') +
            '<span style="font-size:11px;color:#999;">' + date + '</span></div>' +
            '<p style="font-size:14px;font-weight:600;color:#1a1a2e;margin:0 0 4px 0;">' + escapeHtml(u.title) + '</p>' +
            (u.summary ? '<p style="font-size:12px;color:#777;margin:0;line-height:1.4;">' + escapeHtml(u.summary) + '</p>' : '') +
            '</div>';
        });
        container.innerHTML = html;
        container.querySelectorAll('.afu-update-item').forEach(function(el) {
          el.addEventListener('click', function() {
            var id = this.getAttribute('data-id');
            var update = updates.find(function(u) { return u.id === id; });
            if (update) showUpdateDetail(update);
          });
        });
      });
  }

  function showUpdateDetail(update) {
    var container = document.getElementById('afu-updates-content');
    if (!container) return;
    var date = new Date(update.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    container.innerHTML = '<div style="padding:16px;">' +
      '<button id="afu-update-back" style="background:none;border:none;cursor:pointer;color:' + COLOR + ';font-size:13px;font-weight:600;padding:0;margin-bottom:12px;display:flex;align-items:center;gap:4px;">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> Back</button>' +
      '<p style="font-size:12px;color:#999;margin:0 0 8px 0;">' + date + '</p>' +
      '<h3 style="font-size:17px;font-weight:700;color:#1a1a2e;margin:0 0 12px 0;">' + escapeHtml(update.title) + '</h3>' +
      '<div style="font-size:13.5px;color:#444;line-height:1.7;">' + (update.content || '<p style="color:#999;">No details available.</p>') + '</div>' +
      '</div>';
    document.getElementById('afu-update-back').addEventListener('click', function() { loadUpdates(); });
  }

  // ========== TABS ==========
  function switchTab(tab) {
    activeTab = tab;
    var tabs = ['chat', 'help', 'tickets', 'updates'];
    tabs.forEach(function(t) {
      var panel = document.getElementById('afu-panel-' + t);
      var btn = document.getElementById('afu-tab-' + t);
      if (panel) panel.style.display = t === tab ? 'flex' : 'none';
      if (btn) {
        btn.style.color = t === tab ? COLOR : '#999';
        btn.style.borderBottom = t === tab ? '2px solid ' + COLOR : '2px solid transparent';
      }
    });
    if (tab === 'help') loadHelpArticles();
    if (tab === 'tickets') loadTickets();
    if (tab === 'updates') loadUpdates();
  }

  // ========== BUILD WIDGET ==========
  function buildWidget() {
    if (document.getElementById('afu-root')) return;

    var greeting = (websiteConfig && websiteConfig.widget_greeting) || 'Hi there! How can we help you today?';
    var siteName = (websiteConfig && websiteConfig.name) || 'Support';
    var isOnline = websiteConfig ? websiteConfig.is_online : true;

    // Inject styles
    var style = document.createElement('style');
    style.textContent = '#afu-root *{box-sizing:border-box;margin:0;padding:0;}' +
      '#afu-root input:focus,#afu-root textarea:focus{border-color:' + COLOR + ' !important;outline:none;}' +
      '#afu-root ::-webkit-scrollbar{width:5px;}#afu-root ::-webkit-scrollbar-track{background:transparent;}#afu-root ::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px;}' +
      '@keyframes afuSlideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}' +
      '@keyframes afuPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}}' +
      '.afu-animate-in{animation:afuSlideUp 0.3s ease-out;}';
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.id = 'afu-root';
    root.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;';

    // Chat window
    var win = document.createElement('div');
    win.id = 'afu-window';
    win.className = 'afu-animate-in';
    win.style.cssText = 'display:none;width:380px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100vh - 100px);background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;flex-direction:column;margin-bottom:12px;box-shadow:0 8px 24px rgba(15,23,42,0.12);';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'padding:16px 18px;background:' + COLOR + ';position:relative;';
    header.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;">' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
      '<div style="width:36px;height:36px;background:rgba(255,255,255,0.18);border-radius:8px;display:flex;align-items:center;justify-content:center;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>' +
      '<div><div style="color:#fff;font-weight:700;font-size:16px;letter-spacing:-0.2px;">' + escapeHtml(siteName) + '</div>' +
      '<div style="display:flex;align-items:center;gap:5px;margin-top:2px;">' +
      '<div style="width:7px;height:7px;border-radius:50%;background:' + (isOnline ? '#4ade80' : '#999') + ';"></div>' +
      '<span style="color:rgba(255,255,255,0.85);font-size:12px;">' + (isOnline ? 'Online now' : 'Away') + '</span></div></div></div>' +
      '<button id="afu-close" style="background:rgba(255,255,255,0.15);border:none;cursor:pointer;padding:6px;border-radius:8px;transition:background 0.15s;" onmouseenter="this.style.background=\'rgba(255,255,255,0.25)\'" onmouseleave="this.style.background=\'rgba(255,255,255,0.15)\'">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';

    // Tab bar
    var tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;background:#fff;border-bottom:1px solid #f0f0f0;';
    var tabDefs = [
      { id: 'chat', label: 'Chat', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
      { id: 'help', label: 'Help', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
      { id: 'tickets', label: 'Tickets', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
      { id: 'updates', label: 'News', icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' }
    ];
    tabDefs.forEach(function(t) {
      var btn = document.createElement('button');
      btn.id = 'afu-tab-' + t.id;
      btn.style.cssText = 'flex:1;padding:10px 0 8px;background:none;border:none;border-bottom:2px solid ' + (t.id === 'chat' ? COLOR : 'transparent') + ';cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;color:' + (t.id === 'chat' ? COLOR : '#999') + ';font-size:10px;font-weight:600;transition:color 0.15s,border-color 0.15s;';
      btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + t.icon + '</svg>' + t.label;
      btn.addEventListener('click', function() { switchTab(t.id); });
      tabBar.appendChild(btn);
    });

    // ====== CHAT PANEL ======
    var chatPanel = document.createElement('div');
    chatPanel.id = 'afu-panel-chat';
    chatPanel.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0;';

    var prechat = document.createElement('div');
    prechat.id = 'afu-prechat';
    prechat.style.cssText = 'padding:24px 20px;flex:1;display:flex;flex-direction:column;justify-content:center;';
    prechat.innerHTML = '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="width:56px;height:56px;background:' + COLOR + '15;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="' + COLOR + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>' +
      '<h3 style="font-size:16px;font-weight:700;color:#1a1a2e;margin:0 0 6px 0;">Start a conversation</h3>' +
      '<p style="color:#999;font-size:13px;margin:0;line-height:1.4;">' + escapeHtml(greeting) + '</p></div>' +
      '<input id="afu-name" placeholder="Your name *" style="' + inputStyle() + '" />' +
      '<input id="afu-email" type="email" placeholder="Email (optional)" style="' + inputStyle() + '" />' +
      '<button id="afu-start" style="width:100%;padding:12px;background:' + COLOR + ';color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;transition:opacity 0.15s;" onmouseenter="this.style.opacity=\'0.9\'" onmouseleave="this.style.opacity=\'1\'">Start chat</button>'; 

    var messagesArea = document.createElement('div');
    messagesArea.id = 'afu-messages';
    messagesArea.style.cssText = 'flex:1;overflow-y:auto;padding:16px;display:none;background:#fff;';

    var inputArea = document.createElement('div');
    inputArea.id = 'afu-input-area';
    inputArea.style.cssText = 'display:none;padding:12px 16px;background:#fff;border-top:1px solid #f0f0f0;';
    inputArea.innerHTML = '<form id="afu-form" style="display:flex;gap:8px;align-items:center;">' +
      '<input id="afu-input" type="text" placeholder="Type your message..." autocomplete="off" style="flex:1;padding:10px 14px;background:#f8f9fa;color:#1a1a2e;border:1.5px solid #e8eaed;border-radius:24px;font-size:13.5px;outline:none;font-family:inherit;transition:border-color 0.15s;" />' +
      '<button type="submit" style="width:38px;height:38px;background:' + COLOR + ';border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity 0.15s;flex-shrink:0;" onmouseenter="this.style.opacity=\'0.9\'" onmouseleave="this.style.opacity=\'1\'">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></form>';

    chatPanel.appendChild(prechat);
    chatPanel.appendChild(messagesArea);
    chatPanel.appendChild(inputArea);

    // ====== HELP PANEL ======
    var helpPanel = document.createElement('div');
    helpPanel.id = 'afu-panel-help';
    helpPanel.style.cssText = 'display:none;flex-direction:column;flex:1;min-height:0;';
    var helpSearch = document.createElement('div');
    helpSearch.style.cssText = 'padding:12px 16px;border-bottom:1px solid #f0f0f0;';
    helpSearch.innerHTML = '<div style="position:relative;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '<input id="afu-help-search" placeholder="Search help articles..." style="width:100%;padding:10px 14px 10px 38px;background:#f8f9fa;color:#1a1a2e;border:1.5px solid #e8eaed;border-radius:10px;font-size:13.5px;outline:none;font-family:inherit;" /></div>';
    var helpContent = document.createElement('div');
    helpContent.id = 'afu-help-content';
    helpContent.style.cssText = 'flex:1;overflow-y:auto;';
    helpPanel.appendChild(helpSearch);
    helpPanel.appendChild(helpContent);

    // ====== TICKETS PANEL ======
    var ticketsPanel = document.createElement('div');
    ticketsPanel.id = 'afu-panel-tickets';
    ticketsPanel.style.cssText = 'display:none;flex-direction:column;flex:1;min-height:0;overflow-y:auto;';
    var ticketsContent = document.createElement('div');
    ticketsContent.id = 'afu-tickets-content';
    ticketsPanel.appendChild(ticketsContent);

    // ====== UPDATES PANEL ======
    var updatesPanel = document.createElement('div');
    updatesPanel.id = 'afu-panel-updates';
    updatesPanel.style.cssText = 'display:none;flex-direction:column;flex:1;min-height:0;overflow-y:auto;';
    var updatesContent = document.createElement('div');
    updatesContent.id = 'afu-updates-content';
    updatesPanel.appendChild(updatesContent);

    // Footer
    var footer = document.createElement('div');
    footer.style.cssText = 'padding:8px;text-align:center;background:#fafafa;border-top:1px solid #f0f0f0;';
    footer.innerHTML = '<span style="color:#bbb;font-size:10.5px;">Powered by <a href="https://support.afuchat.com" target="_blank" rel="noopener" style="color:' + COLOR + ';text-decoration:none;font-weight:700;">AfuDesk</a></span>';

    // Assemble window
    win.appendChild(header);
    win.appendChild(tabBar);
    win.appendChild(chatPanel);
    win.appendChild(helpPanel);
    win.appendChild(ticketsPanel);
    win.appendChild(updatesPanel);
    win.appendChild(footer);

    // Bubble
    var bubble = document.createElement('button');
    bubble.id = 'afu-bubble';
    bubble.style.cssText = 'width:56px;height:56px;border-radius:14px;background:' + COLOR + ';border:1px solid rgba(255,255,255,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(15,23,42,0.14);transition:opacity 0.2s;float:right;position:relative;';
    bubble.innerHTML = '<svg id="afu-bubble-chat" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<svg id="afu-bubble-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    bubble.onmouseenter = function() { bubble.style.opacity = '0.92'; };
    bubble.onmouseleave = function() { bubble.style.opacity = '1'; };

    var badge = document.createElement('div');
    badge.id = 'afu-badge';
    badge.style.cssText = 'display:none;position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;background:#ef4444;color:#fff;border-radius:10px;font-size:11px;font-weight:700;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff;';
    bubble.appendChild(badge);

    root.appendChild(win);
    root.appendChild(bubble);
    document.body.appendChild(root);

    // Events
    bubble.addEventListener('click', function() {
      isOpen = !isOpen;
      win.style.display = isOpen ? 'flex' : 'none';
      document.getElementById('afu-bubble-chat').style.display = isOpen ? 'none' : 'block';
      document.getElementById('afu-bubble-close').style.display = isOpen ? 'block' : 'none';
      if (isOpen) { unreadCount = 0; updateBadge(); }
    });

    document.getElementById('afu-close').addEventListener('click', function() {
      isOpen = false;
      win.style.display = 'none';
      document.getElementById('afu-bubble-chat').style.display = 'block';
      document.getElementById('afu-bubble-close').style.display = 'none';
    });

    document.getElementById('afu-start').addEventListener('click', function() {
      visitorName = document.getElementById('afu-name').value.trim();
      visitorEmail = document.getElementById('afu-email').value.trim();
      if (!visitorName) {
        document.getElementById('afu-name').style.borderColor = '#e53e3e';
        return;
      }
      hasStarted = true;
      prechat.style.display = 'none';
      messagesArea.style.display = 'block';
      inputArea.style.display = 'block';
      createChat();
    });

    document.getElementById('afu-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var input = document.getElementById('afu-input');
      var msg = input.value;
      if (msg.trim()) {
        sendMessage(msg);
        input.value = '';
        lastMsgCount++;
      }
    });
  }

  function adjustColor(hex, amount) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return '#' + [r,g,b].map(function(c) { return c.toString(16).padStart(2,'0'); }).join('');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { loadConfig().then(buildWidget); });
  } else {
    loadConfig().then(buildWidget);
  }
})();
