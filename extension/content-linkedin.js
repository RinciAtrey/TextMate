console.log("TextMate LinkedIn");

function createAIButton() {
  const button = document.createElement('div');
  button.className = 'textmate-ai-btn ai-reply-button';
  button.style.marginRight = '8px';
  button.style.borderRadius = '18px';
  button.style.backgroundColor = '#0b66c3';
  button.style.color = '#fff';
  button.style.padding = '6px 10px';
  button.style.cursor = 'pointer';
  button.innerText = 'AI Reply';
  button.setAttribute('role','button');
  button.setAttribute('data-tooltip','Generate AI Reply');
  return button;
}

function getLatestLinkedInMessage() {
  function nodeTextWithBr(n) {
    // Walk children, convert <br> to \n and assemble visible text nodes
    if (!n) return '';
    const parts = [];
    const walker = document.createTreeWalker(n, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
    let cur;
    while (cur = walker.nextNode()) {
      // skip comment nodes (TreeWalker excludes comments by default when SHOW_TEXT/SHOW_ELEMENT)
      if (cur.nodeType === Node.TEXT_NODE) {
        const txt = cur.nodeValue.replace(/\u00A0/g, ' ');
        if (txt.trim()) parts.push(txt);
      } else if (cur.nodeType === Node.ELEMENT_NODE) {
        const el = cur;
        // if it's a <br> or element styled as break, push newline marker
        if (el.tagName === 'BR') {
          parts.push('\n');
        } else {
          // some elements (span.white-space-pre) may represent preformatted whitespace
          const cs = window.getComputedStyle(el);
          if (cs && (cs.whiteSpace === 'pre' || cs.whiteSpace === 'pre-wrap')) {
            // include the element's innerText but preserve whitespace/newlines
            const t = (el.innerText || '').replace(/\u00A0/g, ' ');
            if (t) parts.push(t);
          }
        }
      }
    }
    // join and normalize newlines: collapse repeated newlines to max two
    return parts.join('').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
  }

  function visible(el) {
    try {
      if (!el) return false;
      if (!el.getClientRects().length) return false;
      const cs = window.getComputedStyle(el);
      return cs && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > 0;
    } catch (e) {
      return true;
    }
  }

  const primarySel = 'p.msg-s-event-listitem__body';
  const nodes = Array.from(document.querySelectorAll(primarySel)).filter(Boolean);
  if (nodes.length) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (!visible(n)) continue;
      const txt = nodeTextWithBr(n);
      if (txt && txt.length >= 3) {
        console.debug('LinkedIn extractor: matched primarySel node index', i, 'textPreview:', txt.slice(0,200));
        return txt;
      }
    }
  }

  const contSel = 'div.msg-s-event__content, div.msg-s-event-with-indicator';
  const conts = Array.from(document.querySelectorAll(contSel)).filter(Boolean);
  for (let i = conts.length - 1; i >= 0; i--) {
    const c = conts[i];
    if (!visible(c)) continue;
    const p = c.querySelector('p.msg-s-event-listitem__body, .msg-s-message__body, p');
    if (p) {
      const txt = nodeTextWithBr(p);
      if (txt && txt.length >= 3) {
        console.debug('LinkedIn extractor: matched container p in contSel index', i, 'preview:', txt.slice(0,200));
        return txt;
      }
    }
    const whole = nodeTextWithBr(c);
    if (whole && whole.length >= 3) {
      console.debug('LinkedIn extractor: matched container fallback index', i, 'preview:', whole.slice(0,200));
      const parts = whole.split(/\n+/).map(s=>s.trim()).filter(Boolean);
      return parts.length ? parts[parts.length-1] : whole;
    }
  }

  const fallbackNodes = Array.from(document.querySelectorAll('div.msg-s-message-list-content, .msg-s-message-list, .msg-s-event-list, div[contenteditable="true"]')).filter(visible);
  for (let i = fallbackNodes.length - 1; i >= 0; i--) {
    const fn = fallbackNodes[i];
    const txt = nodeTextWithBr(fn);
    if (txt && txt.length >= 3) {
      console.debug('LinkedIn extractor: final fallback node index', i, 'preview:', txt.slice(0,200));
      const parts = txt.split(/\n+/).map(s=>s.trim()).filter(Boolean);
      return parts.length ? parts[parts.length-1] : txt;
    }
  }

  console.debug('LinkedIn extractor: nothing found');
  return '';
}

function findLinkedInCompose() {
  const composeSelectors = [
    'div.msg-form__contenteditable[contenteditable="true"]', // standard
    'div.msg-form__contenteditable',
    'div.msg-form__contenteditable .mentions-texteditor__content-editable',
    'div[contenteditable="true"].msg-form__contenteditable',
    'div[contenteditable="true"].msg-s-message-list__reply-box',
    'div.msg-form__reply'
  ];
  for (const sel of composeSelectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return document.querySelector('div[contenteditable="true"]') || null;
}

function findLinkedInToolbar() {
  const toolbarSelectors = [
    '.msg-form__actions',
    '.msg-form__footer',
    '.msg-form__controls',
    '.msg-form__control',
    '.msg-form__actions--left'
  ];
  for (const sel of toolbarSelectors) {
    const node = document.querySelector(sel);
    if (node) return node;
  }
  const compose = findLinkedInCompose();
  return compose ? compose.parentElement : null;
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

function injectLinkedInButton() {
  if (document.querySelector('.textmate-ai-btn.ai-reply-button')) return;

  const toolbar = findLinkedInToolbar();
  if (!toolbar) return;

  const btn = createAIButton();
  btn.addEventListener('click', async () => {
    try {
      btn.innerText = 'Generating...';
      btn.style.pointerEvents = 'none';

      const latest = getLatestLinkedInMessage();
      if (!latest) {
        alert('TextMate: no recent message found to reply to.');
        return;
      }
const payload = {
  site: 'linkedin',
  emailContent: latest,      
  latestMessage: latest,     
  tone: 'professional',
  maxTokens: 600
};
console.log('TextMate -> sending payload', payload);


      const generated = await callBackend(payload);
      const compose = findLinkedInCompose();
      if (compose) {
        insertTextIntoCompose(compose, generated);
      } else {
        alert('TextMate: compose box not found to paste reply.');
      }
    } catch (err) {
      console.error('TextMate LinkedIn error', err);
      if (err && err.status === 429) {
        alert('TextMate: service busy (rate limit). Try again in a few seconds.');
      } else {
        alert('TextMate: failed to generate reply.');
      }
    } finally {
      btn.innerText = 'AI Reply';
      btn.style.pointerEvents = '';
    }
  });

  try {
    toolbar.insertBefore(btn, toolbar.firstChild);
  } catch (e) {
    toolbar.appendChild(btn);
  }
}

const linkedinObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.addedNodes && m.addedNodes.length) {
      const added = Array.from(m.addedNodes);
      const shouldTry = added.some(n => 
        n.nodeType === 1 && (
          (n.matches && (n.matches('.msg-form__contenteditable') || n.matches('.msg-form__actions') || n.matches('[contenteditable="true"]'))) ||
          (n.querySelector && (n.querySelector('.msg-form__contenteditable') || n.querySelector('[contenteditable="true"]')))
        )
      );
      if (shouldTry) {
        setTimeout(injectLinkedInButton, 300);
        return;
      }
    }
  }
});

linkedinObserver.observe(document.body, { childList: true, subtree: true });
setTimeout(injectLinkedInButton, 1000);
