(function () {
  'use strict';

  var currentScript = document.currentScript;
  var scripts = document.querySelectorAll('script[src*="widget.js"]');
  var scriptSrc = currentScript && currentScript.src;
  var siteId = null;

  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('site_id=') !== -1) {
      scriptSrc = scripts[i].src;
      siteId = new URLSearchParams(src.split('?')[1] || '').get('site_id');
      break;
    }
  }

  if (!siteId) {
    console.error('AfuDesk: Missing site_id parameter');
    return;
  }

  var apiBase = window.location.origin;
  try {
    if (scriptSrc) apiBase = new URL(scriptSrc).origin;
  } catch (err) {}

  var chatId = null;
  var config = null;
  var open = false;
  var visitorName = '';
  var visitorEmail = '';
  var lastMessageCount = 0;
  var color = '#00C2CB';

  function apiGet(path) {
    return fetch(apiBase + path, { headers: { 'Content-Type': 'application/json' } }).then(function (res) { return res.json(); });
  }

  function apiPost(path, body) {
    return fetch(apiBase + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) { return res.json(); });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function loadConfig() {
    return apiGet('/api/public/websites/' + encodeURIComponent(siteId)).then(function (data) {
      config = data && !data.error ? data : {
        name: 'Support',
        widget_color: color,
        widget_greeting: 'Hi there! How can we help you today?',
        is_online: true
      };
      color = config.widget_color || color;
    }).catch(function () {
      config = { name: 'Support', widget_color: color, widget_greeting: 'Hi there! How can we help you today?', is_online: true };
    });
  }

  function createChat() {
    if (chatId) return Promise.resolve();
    return apiPost('/api/public/chats', {
      website_id: siteId,
      visitor_name: visitorName || null,
      visitor_email: visitorEmail || null
    }).then(function (chat) {
      if (chat && chat.id) {
        chatId = chat.id;
        lastMessageCount = 0;
        if (config && config.widget_greeting) appendMessage(config.widget_greeting, 'agent');
      }
    });
  }

  function appendMessage(text, sender) {
    var container = document.getElementById('afudesk-messages');
    if (!container) return;
    var message = document.createElement('div');
    message.style.cssText = 'display:flex;margin:8px 0;' + (sender === 'visitor' ? 'justify-content:flex-end;' : 'justify-content:flex-start;');
    var bubble = document.createElement('div');
    bubble.style.cssText = 'max-width:78%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.4;word-break:break-word;' + (sender === 'visitor' ? 'background:' + color + ';color:white;border-bottom-right-radius:4px;' : 'background:#f1f5f9;color:#111827;border-bottom-left-radius:4px;');
    bubble.textContent = text;
    message.appendChild(bubble);
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
  }

  function pollMessages() {
    if (!chatId) return;
    apiGet('/api/public/chats/' + encodeURIComponent(chatId) + '/messages').then(function (messages) {
      if (!Array.isArray(messages)) return;
      for (var i = lastMessageCount; i < messages.length; i++) {
        if (messages[i].sender === 'agent') appendMessage(messages[i].content, 'agent');
      }
      lastMessageCount = messages.length;
    }).catch(function () {});
  }

  function sendMessage() {
    var input = document.getElementById('afudesk-input');
    var text = input.value.trim();
    if (!text) return;
    createChat().then(function () {
      if (!chatId) return;
      appendMessage(text, 'visitor');
      input.value = '';
      lastMessageCount++;
      apiPost('/api/public/messages', { chat_id: chatId, content: text }).catch(function () {});
    });
  }

  function submitTicket() {
    var name = document.getElementById('afudesk-ticket-name').value.trim();
    var email = document.getElementById('afudesk-ticket-email').value.trim();
    var subject = document.getElementById('afudesk-ticket-subject').value.trim();
    var description = document.getElementById('afudesk-ticket-description').value.trim();
    var status = document.getElementById('afudesk-ticket-status');
    if (!name || !subject || !description) {
      status.textContent = 'Please fill in name, subject, and description.';
      status.style.color = '#dc2626';
      return;
    }
    apiPost('/api/public/support-tickets', {
      website_id: siteId,
      visitor_name: name,
      visitor_email: email || null,
      subject: subject,
      priority: 'medium',
      description: description
    }).then(function (result) {
      status.textContent = result && result.id ? 'Ticket submitted successfully.' : 'Unable to submit ticket.';
      status.style.color = result && result.id ? '#16a34a' : '#dc2626';
    }).catch(function () {
      status.textContent = 'Unable to submit ticket.';
      status.style.color = '#dc2626';
    });
  }

  function renderHelp() {
    var panel = document.getElementById('afudesk-help-panel');
    panel.innerHTML = '<p style="padding:16px;color:#64748b;font-size:13px;">Loading help articles...</p>';
    apiGet('/api/public/help-articles?website_id=' + encodeURIComponent(siteId)).then(function (articles) {
      if (!Array.isArray(articles) || !articles.length) {
        panel.innerHTML = '<p style="padding:16px;color:#64748b;font-size:13px;">No help articles available yet.</p>';
        return;
      }
      panel.innerHTML = articles.map(function (article) {
        return '<details style="padding:12px 16px;border-bottom:1px solid #e5e7eb;"><summary style="cursor:pointer;font-weight:600;font-size:14px;">' + escapeHtml(article.title) + '</summary><div style="font-size:13px;color:#475569;line-height:1.5;margin-top:8px;">' + (article.content || escapeHtml(article.excerpt || '')) + '</div></details>';
      }).join('');
    }).catch(function () {
      panel.innerHTML = '<p style="padding:16px;color:#64748b;font-size:13px;">Unable to load help articles.</p>';
    });
  }

  function setTab(tab) {
    ['chat', 'help', 'ticket'].forEach(function (name) {
      var panel = document.getElementById('afudesk-' + name + '-panel');
      var button = document.getElementById('afudesk-' + name + '-tab');
      if (panel) panel.style.display = tab === name ? 'flex' : 'none';
      if (button) button.style.color = tab === name ? color : '#64748b';
    });
    if (tab === 'help') renderHelp();
  }

  function buildWidget() {
    if (document.getElementById('afudesk-root')) return;
    var style = document.createElement('style');
    style.textContent = '#afudesk-root *{box-sizing:border-box} #afudesk-root button{font-family:inherit}';
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.id = 'afudesk-root';
    root.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
    root.innerHTML = '<div id="afudesk-window" style="display:none;width:340px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 110px);background:white;border-radius:18px;box-shadow:0 20px 60px rgba(15,23,42,.24);overflow:hidden;margin-bottom:14px;border:1px solid #e5e7eb;">' +
      '<div style="background:' + color + ';color:white;padding:16px;"><div style="font-weight:700;font-size:16px;">' + escapeHtml(config.name || 'Support') + '</div><div style="font-size:12px;opacity:.9;margin-top:2px;">' + (config.is_online ? 'Online now' : 'We will reply soon') + '</div></div>' +
      '<div style="display:flex;height:42px;border-bottom:1px solid #e5e7eb;background:#f8fafc;">' +
      '<button id="afudesk-chat-tab" style="flex:1;border:0;background:transparent;color:' + color + ';font-weight:600;cursor:pointer;">Chat</button>' +
      '<button id="afudesk-help-tab" style="flex:1;border:0;background:transparent;color:#64748b;font-weight:600;cursor:pointer;">Help</button>' +
      '<button id="afudesk-ticket-tab" style="flex:1;border:0;background:transparent;color:#64748b;font-weight:600;cursor:pointer;">Ticket</button>' +
      '</div>' +
      '<div id="afudesk-chat-panel" style="height:calc(100% - 106px);display:flex;flex-direction:column;"><div id="afudesk-messages" style="flex:1;overflow:auto;padding:14px;background:white;"></div><div style="display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb;"><input id="afudesk-input" placeholder="Type your message..." style="flex:1;border:1px solid #cbd5e1;border-radius:999px;padding:10px 12px;outline:none;font-size:14px;"><button id="afudesk-send" style="border:0;background:' + color + ';color:white;border-radius:999px;padding:0 16px;font-weight:700;cursor:pointer;">Send</button></div></div>' +
      '<div id="afudesk-help-panel" style="height:calc(100% - 106px);display:none;flex-direction:column;overflow:auto;"></div>' +
      '<div id="afudesk-ticket-panel" style="height:calc(100% - 106px);display:none;flex-direction:column;gap:9px;padding:14px;overflow:auto;"><input id="afudesk-ticket-name" placeholder="Your name *" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px;"><input id="afudesk-ticket-email" placeholder="Email" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px;"><input id="afudesk-ticket-subject" placeholder="Subject *" style="padding:10px;border:1px solid #cbd5e1;border-radius:10px;"><textarea id="afudesk-ticket-description" placeholder="Describe your issue *" style="min-height:100px;padding:10px;border:1px solid #cbd5e1;border-radius:10px;font-family:inherit;"></textarea><button id="afudesk-ticket-submit" style="border:0;background:' + color + ';color:white;border-radius:10px;padding:11px;font-weight:700;cursor:pointer;">Submit Ticket</button><p id="afudesk-ticket-status" style="font-size:12px;margin:0;"></p></div>' +
      '</div><button id="afudesk-toggle" style="height:58px;width:58px;border-radius:50%;border:0;background:' + color + ';color:white;box-shadow:0 12px 30px rgba(15,23,42,.25);font-size:24px;cursor:pointer;">💬</button>';

    document.body.appendChild(root);
    document.getElementById('afudesk-toggle').addEventListener('click', function () {
      open = !open;
      document.getElementById('afudesk-window').style.display = open ? 'block' : 'none';
    });
    document.getElementById('afudesk-send').addEventListener('click', sendMessage);
    document.getElementById('afudesk-input').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') sendMessage();
    });
    document.getElementById('afudesk-chat-tab').addEventListener('click', function () { setTab('chat'); });
    document.getElementById('afudesk-help-tab').addEventListener('click', function () { setTab('help'); });
    document.getElementById('afudesk-ticket-tab').addEventListener('click', function () { setTab('ticket'); });
    document.getElementById('afudesk-ticket-submit').addEventListener('click', submitTicket);
  }

  loadConfig().then(buildWidget);
  setInterval(pollMessages, 5000);
})();
