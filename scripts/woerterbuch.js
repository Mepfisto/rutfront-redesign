(function () {
  var data = window.GLOSSAR;
  if (!data || !data.length) return;

  // Ein gemeinsames Muster für alle Wörter, längere zuerst; die Gruppennummer verrät den Eintrag.
  // Nicht mitten in Wörtern, E-Mail-Adressen oder Web-Adressen (davor kein Buchstabe, @, . oder /).
  var entries = data.slice().sort(function (a, b) { return b.re.length - a.re.length; });
  var big;
  try {
    big = new RegExp("(?<![\\p{L}\\p{N}@./])(?:" + entries.map(function (e) { return "(" + e.re + ")"; }).join("|") + ")", "giu");
  } catch (err) { return; } // ältere Browser ohne Lookbehind/Unicode-Eigenschaften: kein Wörterbuch, Seite bleibt normal
  var seen = {};

  var scope = "main .prose, main .event-body, main .post p, main .card p, main .lede, main .cta p, main .lead";
  var skip = "a, button, script, style, textarea, input, select, time, .kw, .yt-wrap";
  var heading = "h1, h2, h3, h4, h5, h6";

  function mark(node) {
    var text = node.nodeValue;
    big.lastIndex = 0;
    var m, last = 0, frag = null;
    while ((m = big.exec(text))) {
      var idx = -1;
      for (var i = 1; i < m.length; i++) { if (m[i] !== undefined) { idx = i - 1; break; } }
      if (idx < 0 || seen[idx]) continue; // nur das erste Vorkommen pro Seite markieren
      seen[idx] = true;
      frag = frag || document.createDocumentFragment();
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var s = document.createElement("span");
      s.className = "kw";
      s.tabIndex = 0;
      s.dataset.tip = entries[idx].tip;
      s.textContent = m[0];
      frag.appendChild(s);
      last = m.index + m[0].length;
    }
    if (!frag) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  document.querySelectorAll(scope).forEach(function (root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (n.parentNode.closest(skip)) return NodeFilter.FILTER_REJECT;
        // Überschriften bleiben unberührt, außer den Termin-Titeln (dort braucht man z. B. „Wieverfastelovend“)
        var h = n.parentNode.closest(heading);
        return h && !h.closest(".event-body") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(mark);
  });

  // Tooltip: ein gemeinsames Element, bleibt im sichtbaren Bereich
  var tip = document.createElement("div");
  tip.id = "kw-tip";
  tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);
  var cur = null;

  function place(el) {
    var r = el.getBoundingClientRect();
    tip.style.left = "0px"; tip.style.top = "0px";
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), window.innerWidth - w - 8);
    var y = r.top - h - 8;
    if (y < 8) y = r.bottom + 8;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }
  function show(el) {
    if (cur && cur !== el) cur.removeAttribute("aria-describedby");
    cur = el;
    tip.textContent = el.dataset.tip;
    el.setAttribute("aria-describedby", "kw-tip");
    tip.classList.add("on");
    place(el);
  }
  function hide() {
    if (cur) cur.removeAttribute("aria-describedby");
    cur = null;
    tip.classList.remove("on");
  }
  function kwOf(e) { return e.target.closest ? e.target.closest(".kw") : null; }

  document.addEventListener("mouseover", function (e) { var k = kwOf(e); if (k) show(k); });
  document.addEventListener("mouseout", function (e) { if (kwOf(e)) hide(); });
  document.addEventListener("focusin", function (e) { var k = kwOf(e); if (k) show(k); });
  document.addEventListener("focusout", function (e) { if (kwOf(e)) hide(); });
  document.addEventListener("click", function (e) { // Touch: Antippen blendet ein, Tippen daneben aus
    var k = kwOf(e);
    if (k) { if (cur === k && tip.classList.contains("on") && e.detail === 0) hide(); else show(k); }
    else hide();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  window.addEventListener("scroll", hide, { passive: true });
  window.addEventListener("resize", hide);
})();
