import { useLayoutEffect } from "react";

const base = {
  alert: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 8v5"/><path d="M12 17h.01"/>',
  analytics: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-8"/>',
  arrowBack: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  arrowForward: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  route: '<path d="M6 4v6a4 4 0 0 0 4 4h4"/><path d="M14 10l4 4-4 4"/><circle cx="6" cy="4" r="2"/><circle cx="18" cy="20" r="2"/>',
  badge: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6"/><path d="M9 12h6"/><circle cx="12" cy="16" r="1.5"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3v.4A3.6 3.6 0 0 0 4 11a3.6 3.6 0 0 0 2 3.2V17a3 3 0 0 0 5 2.2V4Z"/><path d="M15 4a3 3 0 0 1 3 3v.4a3.6 3.6 0 0 1 2 3.6 3.6 3.6 0 0 1-2 3.2V17a3 3 0 0 1-5 2.2V4Z"/><path d="M8 9h3"/><path d="M13 9h3"/><path d="M8 14h3"/><path d="M13 14h3"/>',
  chart: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 16v-4"/><path d="M12 16V8"/><path d="M16 16v-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  circleCheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  code: '<path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 4-4 16"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><rect x="4" y="4" width="11" height="11" rx="2"/>',
  database: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  delete: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/>',
  document: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h5"/><path d="M9 14h6"/><path d="M9 18h6"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="m3 3 18 18"/><path d="M10.6 10.6A3 3 0 0 0 14 14"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.8"/><path d="M6.5 6.8C3.7 8.6 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5-1.2"/>',
  fileJson: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h5"/><path d="M10 13c-1 0-1.5.5-1.5 1.5S8 16 7 16"/><path d="M14 13c1 0 1.5.5 1.5 1.5S16 16 17 16"/>',
  fingerprint: '<path d="M7 10a5 5 0 0 1 10 0"/><path d="M6 14a9 9 0 0 1 1-6"/><path d="M18 14a9 9 0 0 0-1-6"/><path d="M9 15c0-2 1-4 3-4s3 2 3 4"/><path d="M9 19c2-1 3-2.5 3-5"/><path d="M15 19c-1-1-1.5-2.5-1.5-4"/><path d="M12 3c4 0 7 3 7 7"/><path d="M5 10c0-4 3-7 7-7"/>',
  gavel: '<path d="m14 6 4 4"/><path d="m5 15 4 4"/><path d="m16 4 4 4-10 10-4-4 10-10Z"/><path d="M3 21h10"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
  grid: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
  inbox: '<path d="M4 4h16v16H4z"/><path d="M4 14h4l2 3h4l2-3h4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8"/><path d="m16 7 2 2"/><path d="m14 9 2 2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  logout: '<path d="M10 5H5v14h5"/><path d="M15 8l4 4-4 4"/><path d="M9 12h10"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  message: '<path d="M4 5h16v12H8l-4 4V5Z"/><path d="M8 9h8"/><path d="M8 13h5"/>',
  pdf: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h5"/><path d="M9 16h6"/><path d="M9 13h3"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  police: '<path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z"/><path d="M9 12h6"/><path d="M12 9v6"/>',
  rocket: '<path d="M13 3c4 1 6 3 8 8l-6 6c-5-2-7-4-8-8l6-6Z"/><path d="M7 14 4 17l3 1 1 3 3-3"/><circle cx="15" cy="9" r="1.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  searchOff: '<path d="m3 3 18 18"/><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a8 8 0 0 0 .1-6l2-1.5-2-3.5-2.4 1a8 8 0 0 0-5.2-3L11.5 0h-4l-.4 3a8 8 0 0 0-5.2 3L-.5 5l-2 3.5L-.5 10a8 8 0 0 0 0 4l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 5.2 3l.4 3h4l.4-3a8 8 0 0 0 5.2-3l2.4 1 2-3.5-2.1-1.5Z" transform="translate(2 0) scale(.82)"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.8 6.8-4.1"/><path d="m8.6 13.2 6.8 4.1"/>',
  shield: '<path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16Z"/>',
  terminal: '<path d="m5 7 5 5-5 5"/><path d="M12 17h7"/><rect x="3" y="4" width="18" height="16" rx="2"/>',
  text: '<path d="M4 6h16"/><path d="M12 6v12"/><path d="M8 18h8"/>',
  thumbDown: '<path d="M10 14v5a3 3 0 0 0 3 3l4-8V4H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4Z"/><path d="M17 4h3v10h-3"/>',
  thumbUp: '<path d="M14 10V5a3 3 0 0 0-3-3l-4 8v10h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-4Z"/><path d="M7 20H4V10h3"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 13V9"/><path d="M12 13l3 2"/><path d="M9 2h6"/>',
  tune: '<path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/>',
  upload: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/><path d="M4 21h16"/>',
  verified: '<path d="m12 2 2.4 2 3.1-.3.9 3 2.6 1.8-1.2 2.9 1.2 2.9-2.6 1.8-.9 3-3.1-.3-2.4 2-2.4-2-3.1.3-.9-3L3 14.3l1.2-2.9L3 8.5l2.6-1.8.9-3 3.1.3L12 2Z"/><path d="m8 12 3 3 5-6"/>',
  tree: '<path d="M12 4v6"/><path d="M6 14v6"/><path d="M18 14v6"/><path d="M12 10H6v4"/><path d="M12 10h6v4"/><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="3" y="18" width="6" height="4" rx="1"/><rect x="15" y="18" width="6" height="4" rx="1"/>',
  timeline: '<path d="M4 6h4"/><path d="M4 12h10"/><path d="M4 18h16"/><circle cx="10" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="20" cy="18" r="2"/>',
};

const iconPaths = {
  analytics: base.analytics,
  arrow_back: base.arrowBack,
  arrow_downward: base.arrowDown,
  arrow_forward: base.arrowForward,
  arrow_upward: base.arrowUp,
  alt_route: base.route,
  animation: base.sparkle,
  article: base.document,
  auto_awesome: base.sparkle,
  badge: base.badge,
  block: base.close,
  bolt: base.bolt,
  category: base.grid,
  chat: base.message,
  check_circle: base.circleCheck,
  close: base.close,
  code: base.code,
  content_copy: base.copy,
  dashboard: base.grid,
  data_object: base.fileJson,
  delete: base.delete,
  description: base.document,
  dns: base.database,
  do_not_disturb_on: base.close,
  error: base.error,
  error_outline: base.error,
  encrypted: base.lock,
  expand_more: base.arrowDown,
  extension: base.layers,
  fact_check: base.check,
  find_in_page: base.search,
  forum: base.message,
  gavel: base.gavel,
  history: base.history,
  history_toggle_off: base.history,
  help: base.info,
  hourglass_empty: base.timer,
  hub: base.layers,
  inbox: base.inbox,
  info: base.info,
  input: base.upload,
  insights: base.brain,
  ios_share: base.share,
  key: base.key,
  layers: base.layers,
  lightbulb: base.sparkle,
  linear_scale: base.analytics,
  link: base.link,
  local_police: base.police,
  lock: base.lock,
  lock_reset: base.lock,
  logout: base.logout,
  mail: base.mail,
  mark_email_read: base.mail,
  menu: base.menu,
  merge: base.layers,
  model_training: base.brain,
  monitoring: base.analytics,
  notes: base.text,
  output: base.document,
  password: base.key,
  person: base.person,
  picture_as_pdf: base.pdf,
  play_arrow: base.play,
  privacy_tip: base.shield,
  progress_activity: base.timer,
  psychology: base.brain,
  psychology_alt: base.brain,
  public: base.globe,
  radar: base.search,
  refresh: base.history,
  rocket_launch: base.rocket,
  search: base.search,
  search_off: base.searchOff,
  security: base.shield,
  send: base.send,
  settings: base.settings,
  shield: base.shield,
  shield_lock: base.lock,
  shield_locked: base.lock,
  shield_person: base.police,
  smart_button: base.grid,
  speed: base.bolt,
  sync: base.history,
  terminal: base.terminal,
  timeline: base.timeline,
  text_fields: base.text,
  thumb_down: base.thumbDown,
  thumb_up: base.thumbUp,
  timer: base.timer,
  troubleshoot: base.search,
  tune: base.tune,
  account_tree: base.tree,
  task_alt: base.circleCheck,
  verified: base.verified,
  verified_user: base.verified,
  visibility: base.eye,
  visibility_off: base.eyeOff,
  warning: base.alert,
};

function svgFor(name) {
  const paths = iconPaths[name] || base.info;
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function hydrateIcons(root = document) {
  if (root.nodeType === Node.TEXT_NODE) {
    root = root.parentElement || document;
  }
  const nodes = [];
  if (root.matches?.(".material-symbols-outlined")) {
    nodes.push(root);
  }
  root.querySelectorAll?.(".material-symbols-outlined").forEach((node) => nodes.push(node));
  nodes.forEach((node) => {
    const textName = (node.textContent || "").trim();
    const name = (textName || node.dataset.iconName || "").trim();
    if (!name || node.dataset.localIconReady === name) return;
    node.dataset.iconName = name;
    node.dataset.localIconReady = name;
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = svgFor(name);
  });
}

export default function LocalIconProvider({ children }) {
  useLayoutEffect(() => {
    hydrateIcons();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          hydrateIcons(mutation.target);
        }
        if (mutation.type === "childList") {
          hydrateIcons(mutation.target);
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) hydrateIcons(node);
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return children;
}
