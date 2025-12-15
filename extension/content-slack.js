function createAIButton() {
  const button = document.createElement('button');
  button.className = 'textmate-ai-btn ai-reply-button';
  button.type = 'button';
  button.setAttribute('aria-label', 'AI Reply');
  button.style.border = '0';
  button.style.padding = '6px 10px';
  button.style.borderRadius = '8px';
  button.style.fontSize = '13px';
  button.style.lineHeight = '1';
  button.style.cursor = 'pointer';
  button.style.minWidth = '44px';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.gap = '6px';
  button.style.boxSizing = 'border-box';
  button.style.backgroundColor = '#4A154B';
  button.style.color = '#fff';
  button.style.fontWeight = '600'; 
  button.style.height = '32px';
  button.innerText = 'AI Reply';
  return button;
}

function getLatestSlackMessage() {
  const selectors = [
    'div.c-virtual_list__scroll_container .c-message_kit__blocks',
    'div.c-virtual_list__scroll_container .c-message__content',
    'div.c-message_kit__blocks',
    '.c-message__body',
    '.p-message_list .c-message_kit__blocks',
    'p-rich_text_selection'
  ];

  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll(sel));
    if (nodes.length) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const txt = (n.innerText || '').trim();
        if (txt) return txt;
      }
    }
  }

  const alt = Array.from(document.querySelectorAll('.c-message__body, .p-rich_text_section'))
    .map(n => (n.innerText || '').trim())
    .filter(Boolean);
  if (alt.length) return alt[alt.length - 1];

  return '';  //nothing found
}

function findSlackCompose() {
  const selectors = [
    'div[contenteditable="true"][data-qa="message_input"]',
    'div.p-message_input_field[contenteditable="true"]',
    'div.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"].p-message_input_field',
    'div[contenteditable="true"]'
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function findSlackToolbarContainers() {
  const footerSelectors = [
    'div.c-wysiwyg_container__footer',              
    'div.c-wysiwyg_container__footer-with_formatting',
    'div.p-message_input__footer',
    'div.p-message_input_toolbar',
    '.p-message_input'                          
  ];

  const containers = [];
  for (const sel of footerSelectors) {
    const nodes = Array.from(document.querySelectorAll(sel)).filter(Boolean);
    if (nodes.length) {
      containers.push(...nodes);
    }
  }
  return containers;
}

async function callBackend(payload) {
  const BACKEND = 'http://localhost:8080/api/email/generate';
  const resp = await fetch(BACKEND, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    const err = new Error(`Backend error: ${resp.status} ${txt}`);
    err.status = resp.status;
    throw err;
  }
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const j = await resp.json();
    return j.reply || j.text || JSON.stringify(j);
  }
  return resp.text();
}

function insertTextIntoCompose(compose, text) {
  compose.focus();
  try {
    document.execCommand('insertText', false, text);
  } catch (e) {
    if (compose.isContentEditable) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        compose.innerText = text;
      }
    } else if (compose.tagName === 'TEXTAREA' || compose.tagName === 'INPUT') {
      compose.value = text;
    } else {
      compose.innerText = text;
    }
  }
}

function injectSlackButton() {
  const footers = findSlackToolbarContainers();
  if (!footers.length) return;

  footers.forEach(footer => {
    try {
      if (footer.dataset.textmateInjected === 'true') return;

      const suffix = footer.querySelector('.c-wysiwyg_container__suffix, .c-wysiwyg_container__toolbar_buttons, .p-message_input_buttons, .c-message_input__actions');
      const toolbarParent = suffix || footer;

      const sendBtnSelectors = [
        'button[data-qa="texty_send_button"]',   
        'button[data-qa="texty_send_icon"]',
        'button.p-message_input_send',
        'button.c-texty_send_button',
        'button[aria-label="Send message"]'
      ];
      let sendBtn = null;
      for (const sel of sendBtnSelectors) {
        const found = toolbarParent.querySelector(sel) || footer.querySelector(sel);
        if (found) { sendBtn = found; break; }
      }

      const btn = createAIButton();
      btn.dataset.textmateBtn = 'true';

      btn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        try {
          btn.disabled = true;
          const prev = btn.innerText;
          btn.innerText = '…';
          const latest = (typeof getLatestSlackMessage === 'function') ? getLatestSlackMessage() : '';
          if (!latest) {
            alert('TextMate: no recent message found to reply to.');
            return;
          }
          const payload = {
            site: 'slack',
            emailContent: latest,
            latestMessage: latest,
            tone: 'professional',
            maxTokens: 400
          };
          console.log('TextMate -> sending payload', payload);
          const generated = await callBackend(payload);
          const compose = findSlackCompose();
          if (compose) insertTextIntoCompose(compose, generated);
          else alert('TextMate: compose box not found to paste reply.');
        } catch (err) {
          console.error('TextMate Slack error', err);
          if (err && err.status === 429) alert('TextMate: service busy (rate limit). Try again shortly.');
          else alert('TextMate: failed to generate reply.');
        } finally {
          btn.disabled = false;
          btn.innerText = 'AI';
        }
      });

      if (sendBtn && sendBtn.parentElement) {
        sendBtn.parentElement.insertBefore(btn, sendBtn);
      } else {
        toolbarParent.appendChild(btn);
      }

      footer.dataset.textmateInjected = 'true';

    } catch (e) {
      console.debug('TextMate: injectSlackButton failed for footer', e);
    }
  });
}
const slackObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.addedNodes && m.addedNodes.length) {
      const added = Array.from(m.addedNodes);
      const shouldTry = added.some(n =>
        n.nodeType === 1 && (
          (n.matches && (n.matches('div.p-message_input') || n.matches('[data-qa="message_input"]') || n.matches('div.p-message_input_field'))) ||
          (n.querySelector && n.querySelector('div[contenteditable="true"]'))
        )
      );
      if (shouldTry) {
        setTimeout(injectSlackButton, 300);
        return;
      }
    }
  }
});

slackObserver.observe(document.body, { childList: true, subtree: true });
setTimeout(injectSlackButton, 1000);
