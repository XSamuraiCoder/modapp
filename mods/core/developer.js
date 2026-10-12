/**
 * Core: Developer settings section.
 *
 * Auto-refresh mods: while on, a mod is reloaded as soon as one of its files changes on disk (the main process
 * watches the mods folder; bootstrap.js applies the change with ModAPI.refreshMods). Other mods keep running.
 */
(function () {
  'use strict';

  const KEY = 'devAutoRefreshMods';

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function field(label, description, control) {
    const wrap = el('div', 'settings-field-wrap');
    const row = el('div', 'settings-field');
    const text = el('div', 'settings-field-text');
    text.append(el('div', 'settings-field-label', label), el('div', 'settings-field-desc', description));
    row.append(text, control);
    wrap.appendChild(row);
    return wrap;
  }

  const time = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  function describe(detail) {
    const parts = [];
    if (detail.unloaded?.length) parts.push(`reloaded or removed ${detail.unloaded.join(', ')}`);
    if (detail.loaded?.length) parts.push(`loaded ${detail.loaded.join(', ')}`);
    return parts.length ? `${time()}: ${parts.join('; ')}` : `${time()}: nothing to change`;
  }

  ModAPI.registerSettingsSection({
    id: 'developer',
    label: 'Developer',
    icon: 'code',
    async render(container) {
      let settings = {};
      try { settings = await ModAPI.native.settings.read(); } catch { /* shown as off */ }
      let enabled = settings[KEY] === true;

      container.append(el('div', 'settings-section-title', 'Developer'));

      const toggle = el('button', 'toggle');
      toggle.type = 'button';
      const paint = () => {
        toggle.textContent = enabled ? 'On' : 'Off';
        toggle.classList.toggle('on', enabled);
        toggle.setAttribute('aria-pressed', String(enabled));
      };
      paint();

      const status = el('div', 'settings-field-desc', '');
      status.style.padding = '8px 0';

      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          await ModAPI.native.settings.write({ [KEY]: !enabled });
          enabled = !enabled;
          paint();
          status.textContent = enabled ? 'Watching the mods folder.' : '';
        } catch (error) {
          status.textContent = `Could not save: ${error.message || error}`;
        } finally {
          toggle.disabled = false;
        }
      });

      const refresh = el('button', 'theme-reset-btn', 'Refresh now');
      refresh.type = 'button';
      refresh.style.marginTop = '0';
      refresh.addEventListener('click', async () => {
        refresh.disabled = true;
        try { status.textContent = describe(await ModAPI.refreshMods()); }
        catch (error) { status.textContent = `Refresh failed: ${error.message || error}`; }
        finally { refresh.disabled = false; }
      });

      container.append(
        field('Auto-refresh mods', 'Reload a mod as soon as one of its files changes. Other mods keep running. Changes to the Core mod need a full reload.', toggle),
        field('Refresh mods now', 'Apply installs, removals and file changes right away.', refresh),
        status,
      );

      // Report automatic refreshes while this panel is open.
      const onRefreshed = (event) => {
        if (!container.isConnected) { document.removeEventListener('mods:refreshed', onRefreshed); return; }
        status.textContent = describe(event.detail || {});
      };
      document.addEventListener('mods:refreshed', onRefreshed);
    },
  });
})();