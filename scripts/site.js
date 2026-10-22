(function () {
  var MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile-Menü
  var btn = $(".menu-btn"), nav = $("#nav");
  if (btn && nav) btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });

  // Untermenü: per Pfeil-Schalter (Touch, Tastatur), Escape, Klick daneben oder Tab hinaus schließen
  function closeSubs(focusToggle) {
    $$(".has-sub.open").forEach(function (li) {
      li.classList.remove("open");
      var t = $(".sub-toggle", li);
      t.setAttribute("aria-expanded", "false");
      if (focusToggle) t.focus();
    });
  }
  $$(".sub-toggle").forEach(function (t) {
    var li = t.parentNode;
    t.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !li.classList.contains("open");
      closeSubs(false);
      li.classList.toggle("open", open);
      t.setAttribute("aria-expanded", open);
    });
    li.addEventListener("focusout", function (e) {
      if (!li.contains(e.relatedTarget)) closeSubs(false);
    });
  });
  document.addEventListener("click", function () { closeSubs(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeSubs(true);
    // auch bei ruhender Maus über dem Menü schließen, bis der Zeiger den Bereich verlässt
    $$(".has-sub").forEach(function (li) { li.classList.add("esc"); });
  });
  $$(".has-sub").forEach(function (li) {
    li.addEventListener("mouseleave", function () { li.classList.remove("esc"); });
  });

  // YouTube erst nach Klick laden
  $$(".yt").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.className = "yt-frame";
      f.src = "https://www.youtube-nocookie.com/embed/" + b.dataset.id + "?autoplay=1";
      f.title = b.dataset.title;
      f.allow = "autoplay; encrypted-media; picture-in-picture";
      f.allowFullscreen = true;
      b.parentNode.replaceChild(f, b);
    });
  });

  function endOfDay(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59); }
  var now = new Date();

  // Nächster Termin
  var next = $("#next");
  if (next && window.EVENTS) {
    var upcoming = window.EVENTS.filter(function (e) { return endOfDay(e.iso) >= now; })
      .sort(function (a, b) { return a.iso.localeCompare(b.iso); })[0];
    if (upcoming) {
      var p = upcoming.iso.split("-");
      $(".next-date b", next).textContent = +p[2] + ".";
      $(".next-date span", next).textContent = MONTHS[+p[1] - 1];
      $("h2", next).textContent = upcoming.title;
      $("p", next).textContent = [upcoming.place, upcoming.time].filter(Boolean).join(" · ");
      $("a", next).href = upcoming.href;
      var days = Math.ceil((endOfDay(upcoming.iso) - now) / 864e5) - 1;
      $(".count", next).textContent = days <= 0 ? "Heute" : days === 1 ? "Morgen" : "In " + days + " Tagen";
      next.hidden = false;
    }
  }

  // Vergangene Termine markieren
  $$(".event[data-date]").forEach(function (e) {
    if (endOfDay(e.dataset.date) < now) e.classList.add("past");
  });

  // Filter und Suche (Aktuelles)
  var list = $("#list");
  if (list) {
    var cat = "alle", q = $("#q"), empty = $("#empty");
    var render = function () {
      var term = q.value.trim().toLowerCase(), shown = 0, month = null, monthHas = false;
      Array.prototype.forEach.call(list.children, function (el) {
        if (el.hasAttribute("data-month")) {
          if (month) month.hidden = !monthHas;
          month = el; monthHas = false; return;
        }
        var ok = (cat === "alle" || el.dataset.cat === cat) && (!term || el.dataset.text.indexOf(term) > -1);
        el.hidden = !ok;
        if (ok) { shown++; monthHas = true; }
      });
      if (month) month.hidden = !monthHas;
      empty.hidden = shown > 0;
    };
    $$(".chip").forEach(function (c) {
      c.addEventListener("click", function () {
        $$(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === c); });
        cat = c.dataset.cat; render();
      });
    });
    q.addEventListener("input", render);
  }
})();
