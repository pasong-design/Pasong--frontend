/* PASONG Song Rights Declaration Bridge
 * Add this script to artist-dashboard.html before </body>.
 * It preserves the existing upload handler and only augments /api/songs/create.
 */
(() => {
  'use strict';
  const FORM_SELECTOR = '#uploadForm';
  const form = document.querySelector(FORM_SELECTOR);
  if (!form || form.dataset.pasongRightsBridge === 'installed') return;
  form.dataset.pasongRightsBridge = 'installed';

  const style = document.createElement('style');
  style.textContent = `
    .pasong-rights-declaration{margin:16px 0;padding:16px;border:1px solid rgba(168,85,247,.45);border-radius:14px;background:rgba(88,28,135,.12);color:inherit}
    .pasong-rights-declaration h3{margin:0 0 8px;font-size:1rem}
    .pasong-rights-declaration p{margin:0 0 12px;line-height:1.5;font-size:.92rem}
    .pasong-rights-declaration label{display:block;margin:10px 0 6px;font-weight:600}
    .pasong-rights-declaration select,.pasong-rights-declaration input,.pasong-rights-declaration textarea{width:100%;box-sizing:border-box;padding:11px;border-radius:9px;border:1px solid #6b5b83;background:#171326;color:inherit;font:inherit}
    .pasong-rights-declaration .pasong-rights-help{font-size:.82rem;opacity:.85;margin-top:6px}
  `;
  document.head.appendChild(style);

  const declaration = document.createElement('section');
  declaration.className = 'pasong-rights-declaration';
  declaration.innerHTML = `
    <h3>Rights and collecting-society declaration</h3>
    <p>Tell PASONG whether a collecting society or another party represents or controls any rights in this song. This declaration will be reviewed by PASONG Admin; it does not by itself prove ownership.</p>
    <label for="pasongCollectingSocietyStatus">Which statement applies to this song? *</label>
    <select id="pasongCollectingSocietyStatus" name="collecting_society_status" required>
      <option value="">Choose one</option>
      <option value="none">I am not represented by a collecting society for the relevant rights.</option>
      <option value="registered">I am registered with a collecting society for some or all relevant rights.</option>
      <option value="third_party">Some rights are assigned to or controlled by another party.</option>
      <option value="unsure">I am unsure whether a collecting society or another party controls any rights.</option>
    </select>
    <label for="pasongCollectingSocietyName">Collecting society / rights holder name (if applicable)</label>
    <input id="pasongCollectingSocietyName" name="collecting_society_name" maxlength="200" placeholder="Enter name, or leave blank if not applicable">
    <label for="pasongRightsNotes">Additional rights information (optional)</label>
    <textarea id="pasongRightsNotes" name="rights_notes" rows="3" maxlength="2000" placeholder="Explain which rights are represented or controlled, if known."></textarea>
    <p class="pasong-rights-help">Songs submitted through this form stay pending until PASONG Admin reviews the declaration.</p>
  `;

  const submitButton = form.querySelector('button[type="submit"],input[type="submit"]');
  const terms = form.querySelector('#termsCheck, #contractAccepted, #rightsCheck');
  if (terms && terms.closest('label')) terms.closest('label').before(declaration);
  else if (submitButton) submitButton.before(declaration);
  else form.appendChild(declaration);

  const societyStatus = declaration.querySelector('#pasongCollectingSocietyStatus');
  const societyName = declaration.querySelector('#pasongCollectingSocietyName');
  const rightsNotes = declaration.querySelector('#pasongRightsNotes');

  form.addEventListener('submit', (event) => {
    if (!societyStatus.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
      societyStatus.focus();
      societyStatus.reportValidity();
    }
  }, true);

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (method === 'POST' && /\/api\/songs\/create(?:\?|$)/.test(url) && init && typeof init.body === 'string') {
      try {
        const payload = JSON.parse(init.body);
        const rightsCheckbox = form.querySelector('#rightsCheck, #contractAccepted');
        const termsCheckbox = form.querySelector('#termsCheck');
        const checked = (selector) => {
          const el = form.querySelector(selector);
          return !el || (el.type === 'checkbox' ? el.checked : true);
        };
        const accepted = rightsCheckbox ? rightsCheckbox.checked : (payload.contractAccepted === true);
        const termsAccepted = termsCheckbox ? termsCheckbox.checked : true;
        payload.contractAccepted = Boolean(accepted && termsAccepted);
        payload.collecting_society_status = societyStatus.value || 'unsure';
        payload.collecting_society_name = societyName.value.trim() || null;
        payload.rights_notes = rightsNotes.value.trim() || null;
        init = { ...init, body: JSON.stringify(payload) };
      } catch (err) {
        console.error('PASONG rights declaration could not be attached to song upload:', err);
      }
    }
    return originalFetch(input, init);
  };
  console.info('PASONG song rights declaration bridge installed.');
})();
