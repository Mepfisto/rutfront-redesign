(function () {
  var data = window.KOSTUEM;
  var form = document.getElementById("k-form");
  var input = document.getElementById("k-input");
  var result = document.getElementById("k-result");
  var lamps = { red: document.querySelector(".lamp.r"), yellow: document.querySelector(".lamp.y"), green: document.querySelector(".lamp.g") };
  var WORD = { red: "Lieber nicht", yellow: "Kommt drauf an", green: "Läuft!" };
  var ALT_LABEL = { red: "Stattdessen: ", yellow: "Tipp: ", green: "Extra-Tipp: " };
  var SEVERITY = { red: 3, yellow: 2, green: 1 };

  // klein, ä/ö/ü -> ae/oe/ue, ß -> ss, übrige Akzente weg; wer ohne Umlaute tippt, wird ebenfalls erkannt,
  // weil die Stichwörter in der Datei auf dieselbe Weise normalisiert werden
  function norm(s) {
    return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function tokens(s) { return norm(s).split(/[^a-z0-9]+/).filter(Boolean); }

  var rules = data.rules.map(function (r) {
    return {
      rule: r,
      keys: r.keys.map(function (k) {
        var exact = k.charAt(0) === "=";
        return { text: norm(exact ? k.slice(1) : k), exact: exact };
      })
    };
  });

  function evaluate(text) {
    var n = norm(text), toks = tokens(text), hits = [];
    rules.forEach(function (entry) {
      entry.keys.forEach(function (k) {
        var hit = k.exact ? toks.indexOf(k.text) > -1 : n.indexOf(k.text) > -1;
        if (hit) hits.push({ rule: entry.rule, key: k.text });
      });
    });
    if (!hits.length) return data.fallback;
    // Ein spezifischeres Stichwort überstimmt das allgemeinere, das in ihm steckt (stadtsoldat > soldat).
    // Alle übrigen Treffer zählen: die strengste Stufe gewinnt, damit ein harmloses Wort nie ein rotes
    // Stichwort übertönt ("Polizist mit Currywurst" bleibt rot). Bei gleicher Stufe gewinnt das längere.
    var rest = hits.filter(function (h) {
      return !hits.some(function (o) { return o.key.length > h.key.length && o.key.indexOf(h.key) > -1; });
    });
    rest.sort(function (a, b) {
      return SEVERITY[b.rule.level] - SEVERITY[a.rule.level] || b.key.length - a.key.length;
    });
    return rest[0].rule;
  }

  function show(rule, text) {
    Object.keys(lamps).forEach(function (k) { lamps[k].classList.toggle("on", k === rule.level); });
    result.className = "k-result " + rule.level;
    result.innerHTML = "";
    var badge = document.createElement("p");
    badge.className = "k-verdict";
    badge.textContent = WORD[rule.level];
    var title = document.createElement("h2");
    title.textContent = rule.title;
    var body = document.createElement("p");
    body.textContent = rule.text;
    var alt = document.createElement("p");
    alt.className = "k-alt";
    var strong = document.createElement("strong");
    strong.textContent = ALT_LABEL[rule.level];
    alt.appendChild(strong);
    alt.appendChild(document.createTextNode(rule.alt));
    var ask = document.createElement("p");
    ask.className = "k-ask";
    ask.textContent = "Du hast eingegeben: „" + text + "“";
    result.appendChild(badge); result.appendChild(title); result.appendChild(body); result.appendChild(alt); result.appendChild(ask);
    result.hidden = false;
  }

  function run(text) {
    text = text.trim();
    if (!text) return;
    show(evaluate(text), text);
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); run(input.value); });

  document.querySelectorAll(".k-chip").forEach(function (c) {
    c.addEventListener("click", function () { input.value = c.textContent; run(c.textContent); });
  });

  var rnd = document.getElementById("k-random");
  if (rnd) rnd.addEventListener("click", function () {
    var all = data.random && data.random.length ? data.random : data.examples;
    var pick = all[Math.floor(Math.random() * all.length)];
    input.value = pick; run(pick);
  });
})();
