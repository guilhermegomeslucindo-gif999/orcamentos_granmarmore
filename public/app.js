/* Gerador de Orçamentos · Marmoraria Granmármore
   Aplicação estática: os dados ficam salvos no navegador (localStorage). */
(function () {
  "use strict";

  /* ================= Utilidades ================= */
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pad(n, l) { n = String(n); while (n.length < l) n = "0" + n; return n; }
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2); }
  function parseISO(s) { var p = String(s || "").split("-"); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : new Date(); }
  function addDays(iso, n) { var d = parseISO(iso); d.setDate(d.getDate() + (parseInt(n, 10) || 0)); return d; }
  function fmtDate(d) { if (!(d instanceof Date)) d = parseISO(d); return pad(d.getDate(), 2) + "/" + pad(d.getMonth() + 1, 2) + "/" + d.getFullYear(); }
  function parseNum(v) {
    if (typeof v === "number") return isFinite(v) ? v : 0;
    var s = String(v == null ? "" : v).trim().replace(/[R$\s]/g, "");
    if (!s) return 0;
    if (s.indexOf(",") > -1) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    var n = parseFloat(s);
    return isFinite(n) ? n : 0;
  }
  var BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  function money(n) { return BRL.format(n || 0); }
  function num(n, d) { return (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function moneyInput(n) { return n ? num(n, 2) : ""; }
  // Medida: aceita metros (1,90) ou centímetros (190)
  function meters(v) { var n = parseNum(v); return n >= 10 ? n / 100 : n; }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function waNumber(s) { var d = digits(s); if (!d) return ""; if (d.length <= 11) d = "55" + d; return d; }
  function firstName(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }
  function joinPt(arr) { arr = arr.filter(Boolean); if (arr.length <= 1) return arr.join(""); return arr.slice(0, -1).join(", ") + " e " + arr[arr.length - 1]; }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }

  var ICON = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    pdf: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    chat: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    down: '<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>',
    up: '<path d="M12 20V8M6 13l6-6 6 6M5 4h14"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + "</svg>"; }

  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ================= Listas e padrões ================= */
  var AMBIENTES = ["Cozinha", "Área gourmet", "Ilha", "Banheiro social", "Banheiro suíte", "Lavabo", "Lavanderia", "Varanda", "Sala de estar", "Escada", "Área externa", "Churrasqueira"];
  var PECAS = ["Bancada", "Ilha", "Lavatório", "Tampo", "Frontão", "Saia", "Soleira", "Peitoril", "Nicho", "Revestimento", "Piso", "Rodapé", "Degrau", "Prateleira", "Mesa"];
  var MATERIAIS = ["Quartzo Branco", "Quartzo Cinza", "Quartzo Preto", "Quartzito Taj Mahal", "Quartzito Branco", "Quartzito Perla Venata", "Granito Preto São Gabriel", "Granito Branco Itaúnas", "Granito Cinza Corumbá", "Granito Verde Ubatuba", "Mármore Carrara", "Mármore Branco Piguês", "Mármore Travertino", "Nanoglass", "Superfície Ultracompacta", "Porcelanato"];
  var ACABAMENTOS = ["Polido", "Escovado", "Levigado", "Flameado", "Apicoado", "Acetinado"];
  var ESPESSURAS = ["1 cm", "2 cm", "3 cm", "4 cm"];
  var DETALHES = ["Testeira 4 cm", "Saia", "Rodobanca", "Frontão", "Furo de cuba", "Furo de torneira", "Recorte de cooktop", "Cuba esculpida", "Borda reta", "Borda boleada", "Meia-esquadria", "Pés laterais"];
  var PAGAMENTOS = ["50% de entrada e 50% na instalação", "À vista no PIX com 5% de desconto", "Entrada + saldo em até 10x no cartão", "A combinar"];
  var MOTIVOS = ["Preço", "Prazo", "Foi para a concorrência", "Desistiu ou adiou a obra", "Não respondeu", "Outro"];

  var DEFAULT_SETTINGS = {
    empresa: {
      nome: "Marmoraria Granmármore",
      cnpj: "12.579.026/0001-15",
      whatsapp: "(37) 8817-2422",
      instagram: "",
      email: "",
      endereco: "Av. Paraná, 3302 - São José",
      cidade: "Divinópolis/MG · CEP 35501-170"
    },
    vendedores: [],
    proximoNumero: 1,
    validadeDias: 10,
    prazoProducao: "15 dias úteis após a medição final",
    pagamento: "50% de entrada e 50% na instalação",
    inclusos: [
      "Medição técnica no local da obra",
      "Corte, acabamentos e furos descritos",
      "Entrega no endereço da obra",
      "Instalação das pedras"
    ],
    naoInclusos: [
      "Cubas, torneiras, cooktop e acessórios",
      "Serviços hidráulicos e elétricos",
      "Retirada de bancadas antigas",
      "Içamento por escada ou guindaste"
    ],
    termos: [
      "A medição final é feita em obra, com reboco, pontos elétricos e hidráulicos prontos. Os valores podem ser ajustados conforme as medidas finais.",
      "Cubas, cooktop e demais acessórios que serão embutidos nas pedras devem estar no local na data da medição.",
      "Pedras naturais têm variações de cor, veios e tonalidade, que fazem parte do material. Imagens são ilustrativas e o lote depende da disponibilidade.",
      "O prazo de produção começa a contar após a aprovação do orçamento, o pagamento da entrada e a medição final.",
      "Na entrega, confira o material com a nossa equipe. Trincas, lascas ou diferenças devem ser apontadas no ato.",
      "Após a instalação, siga as orientações de uso e limpeza passadas pela nossa equipe."
    ]
  };

  // Explicações curtas dos materiais (aparecem no documento)
  function matInfo(name) {
    var n = String(name || "").toLowerCase();
    if (!n) return null;
    if (/nanoglass|nano glass/.test(n)) return "Vidro cristalizado industrializado. Branco uniforme, brilho intenso e baixa absorção de líquidos.";
    if (/ultracompact|sinteriz|dekton|laminam|neolith/.test(n)) return "Superfície ultracompacta. Altíssima resistência a calor, riscos e manchas, permite peças finas e de grande formato.";
    if (/taj mahal/.test(n)) return "Quartzito natural de tom claro com veios suaves. Muito duro e resistente ao calor, ideal para cozinhas e ilhas. Recomenda-se impermeabilização periódica.";
    if (/quartzito/.test(n)) return "Rocha natural de alta dureza, resistente a riscos e ao calor, com o visual nobre do mármore. Recomenda-se impermeabilização periódica.";
    if (/quartzo|silestone/.test(n)) return "Superfície de quartzo industrializada. Cor uniforme, baixa absorção e fácil limpeza, dispensa impermeabilização. Evite panelas muito quentes direto na peça.";
    if (/s[ãa]o gabriel/.test(n)) return "Granito preto de grão fino, muito resistente e de fácil manutenção. Ótimo para cozinhas, áreas gourmet e lavatórios.";
    if (/granito/.test(n)) return "Rocha natural muito resistente a riscos, calor e uso intenso. Excelente custo-benefício para cozinhas, áreas gourmet e lavatórios.";
    if (/travertino/.test(n)) return "Mármore de textura porosa e tons terrosos, muito usado em revestimentos e pisos. Requer impermeabilização.";
    if (/m[áa]rmore|carrara|calacatta|piguês|pigues/.test(n)) return "Rocha natural elegante, de veios marcantes. Mais sensível a ácidos (limão, vinagre) e riscos, ideal para banheiros, lavabos e revestimentos. Requer impermeabilização.";
    if (/porcelanato/.test(n)) return "Placa cerâmica de baixa absorção e fácil manutenção, com grande variedade de padrões.";
    return null;
  }

  /* ================= Banco de dados (API) ================= */
  var K = { draft: "granmarmore.draft.v1", token: "granmarmore.token.v1" };
  function read(key, fb) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { toast("O rascunho ficou grande demais para este aparelho. Remova alguma imagem."); return false; }
  }
  var TOKEN = read(K.token, "");
  function mergeSettings(s) {
    var d = clone(DEFAULT_SETTINGS);
    if (!s || typeof s !== "object") return d;
    var out = Object.assign(d, s);
    out.empresa = Object.assign({}, DEFAULT_SETTINGS.empresa, s.empresa || {});
    ["vendedores", "inclusos", "naoInclusos", "termos"].forEach(function (k) { if (!Array.isArray(out[k])) out[k] = clone(DEFAULT_SETTINGS[k]); });
    return out;
  }
  var S = mergeSettings(null);
  var LIST = null; // cache da lista de orçamentos (sem imagens)

  function api(method, path, body) {
    var opts = { method: method, headers: { "Content-Type": "application/json" } };
    if (TOKEN) opts.headers.Authorization = "Bearer " + TOKEN;
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch("/api/" + path, opts).then(function (r) {
      return r.text().then(function (t) {
        var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = null; }
        if (r.status === 401 && path !== "login") { logout(true); throw new Error((d && d.error) || "Sessão expirada."); }
        if (!r.ok) {
          var msg = (d && d.error) || (r.status === 404 ? "API não encontrada. O sistema precisa estar publicado na Vercel." : r.status === 413 ? "O orçamento ficou grande demais. Remova alguma imagem." : "Erro " + r.status + " no servidor.");
          var err = new Error(msg); err.status = r.status; throw err;
        }
        return d;
      });
    }, function () { throw new Error("Sem conexão com o servidor. Confira a internet e tente de novo."); });
  }
  function logout(expired) {
    TOKEN = ""; try { localStorage.removeItem(K.token); } catch (e) {}
    LIST = null; viewLogin(expired ? "Sua sessão expirou. Entre novamente." : "");
  }
  function loading(msg) { app.innerHTML = '<div class="loading"><span class="spin"></span>' + esc(msg || "Carregando…") + "</div>"; }
  function failView(err, retry) {
    app.innerHTML = '<div class="empty" style="margin-top:20px"><strong>Não foi possível carregar</strong>' + esc(err.message || err) + '<div style="margin-top:14px"><button class="btn" id="retry">Tentar de novo</button></div></div>';
    $("#retry").addEventListener("click", retry);
  }
  function fetchList() { return api("GET", "quotes").then(function (l) { LIST = l || []; return LIST; }); }
  function fetchQuote(id) { return api("GET", "quotes?id=" + encodeURIComponent(id)).then(function (q) { migrate(q); return q; }); }
  function saveSettings() { return api("PUT", "settings", S).then(function (d) { S = mergeSettings(d); return S; }); }

  /* ================= Modelo do orçamento ================= */
  function newItem(peca) {
    return { id: uid(), peca: peca || "Bancada", comp: "", larg: "", qtd: "1", espessura: "2 cm", acabamento: "Polido", detalhes: [], obs: "", matA: "", precoA: "", valA: "", matB: "", precoB: "", valB: "" };
  }
  function newAmb(nome) { return { id: uid(), nome: nome || "", itens: [newItem()] }; }
  function newQuote() {
    var v = S.vendedores[0] || { nome: "", tel: "" };
    return {
      id: uid(), numero: null, titulo: "", data: todayISO(), validadeDias: S.validadeDias,
      vendedor: { nome: v.nome, tel: v.tel },
      cliente: { nome: "", tel: "", email: "" }, arquiteto: "",
      obra: { endereco: "", bairro: "", cidade: "" },
      comparar: false, opcoes: ["Opção 1", "Opção 2"],
      ambientes: [newAmb("Cozinha")],
      servicos: [{ id: uid(), desc: "Entrega no endereço da obra", valor: "", incluso: true }, { id: uid(), desc: "Instalação", valor: "", incluso: true }],
      desconto: { tipo: "%", valor: "" },
      pagamento: S.pagamento, prazo: S.prazoProducao,
      inclusos: S.inclusos.map(function (t) { return { id: uid(), t: t, on: true }; }),
      naoInclusos: S.naoInclusos.map(function (t) { return { id: uid(), t: t, on: true }; }),
      explicarMateriais: true, observacoes: "", termos: S.termos.join("\n"), imagens: [],
      status: "aberto", motivo: "", createdAt: Date.now(), updatedAt: Date.now()
    };
  }

  function itemArea(it) { return meters(it.comp) * meters(it.larg) * (parseNum(it.qtd) || 1); }
  function sameInB(it) { return !String(it.matB || "").trim() && !String(it.valB || "").trim(); }
  function itemVal(it, opt, comparar) {
    if (opt === "B") return sameInB(it) ? parseNum(it.valA) : parseNum(it.valB);
    return parseNum(it.valA);
  }
  function calc(q) {
    var r = { amb: [], pecasA: 0, pecasB: 0, serv: 0 };
    q.ambientes.forEach(function (a) {
      var A = 0, B = 0;
      a.itens.forEach(function (it) { A += itemVal(it, "A"); B += itemVal(it, "B"); });
      r.amb.push({ A: A, B: B }); r.pecasA += A; r.pecasB += B;
    });
    q.servicos.forEach(function (s) { if (!s.incluso) r.serv += parseNum(s.valor); });
    function fin(pecas) {
      var sub = pecas + r.serv, dv = parseNum(q.desconto.valor);
      var d = q.desconto.tipo === "%" ? sub * Math.min(dv, 100) / 100 : Math.min(dv, sub);
      return { sub: sub, desc: d, total: sub - d };
    }
    r.A = fin(r.pecasA); r.B = fin(r.pecasB);
    return r;
  }
  function numLabel(q) { return q.numero ? pad(q.numero, 4) : "Rascunho"; }
  function totalLabel(q) {
    var c = calc(q);
    return q.comparar ? money(c.A.total) + " / " + money(c.B.total) : money(c.A.total);
  }

  /* ================= Estado da edição ================= */
  var Q = null;
  function loadDraft() { Q = read(K.draft, null) || newQuote(); migrate(Q); }
  function migrate(q) {
    q.opcoes = q.opcoes || ["Opção 1", "Opção 2"];
    q.imagens = q.imagens || []; q.servicos = q.servicos || [];
    q.inclusos = q.inclusos || []; q.naoInclusos = q.naoInclusos || [];
    q.desconto = q.desconto || { tipo: "%", valor: "" };
    if (q.termos == null) q.termos = S.termos.join("\n");
    if (q.titulo == null) q.titulo = "";
    q.ambientes = q.ambientes || [];
  }
  function defaultTitle(q) {
    var amb = joinPt(q.ambientes.map(function (a) { return String(a.nome || "").trim(); }));
    var cli = String(q.cliente && q.cliente.nome || "").trim();
    return [amb, cli].filter(Boolean).join(" · ") || "Orçamento";
  }
  function titleOf(q) { return String(q.titulo || "").trim() || defaultTitle(q); }
  function isDirty(q) {
    return !!(q && (String(q.cliente.nome || "").trim() || q.ambientes.some(function (a) { return a.itens.some(function (it) { return String(it.valA || it.matA || "").trim(); }); })));
  }
  var draftTimer = null;
  function saveDraft(now) {
    clearTimeout(draftTimer);
    var go = function () { if (!Q) return; Q.updatedAt = Date.now(); write(K.draft, Q); };
    if (now) go(); else draftTimer = setTimeout(go, 350);
  }
  function getPath(o, path) { return path.split(".").reduce(function (x, k) { return x == null ? x : x[k]; }, o); }
  function setPath(o, path, v) {
    var ks = path.split("."), last = ks.pop();
    var t = ks.reduce(function (x, k) { return x[k]; }, o);
    t[last] = v;
  }

  /* ================= Roteamento ================= */
  var app = $("#app");
  function route() {
    if (!TOKEN) return viewLogin();
    var h = location.hash.replace(/^#\/?/, "") || "novo";
    var parts = h.split("/"), view = parts[0], id = decodeURIComponent(parts[1] || "");
    var tab = view === "orcamento" || view === "historico" ? "historico" : view === "config" ? "config" : "novo";
    $(".tabs").hidden = false;
    $$(".tabs a").forEach(function (a) { a.classList.toggle("on", a.dataset.tab === tab); a.setAttribute("aria-current", a.dataset.tab === tab ? "page" : "false"); });
    closeModal();
    if (view === "orcamento" && id) return viewDoc(id);
    if (view === "editar" && id) return startEdit(id);
    if (view === "historico") return viewHistorico();
    if (view === "config") return viewConfig();
    return viewNovo();
  }
  function startEdit(id) {
    if (Q && Q.id === id) { location.replace("#/novo"); return; }
    loading("Abrindo orçamento…");
    fetchQuote(id).then(function (q) {
      var cur = read(K.draft, null);
      if (cur && cur.id !== q.id && isDirty(cur) && !confirm("Você tem um orçamento em andamento que ainda não foi salvo. Descartar e editar o " + numLabel(q) + "?")) { history.back(); return; }
      Q = clone(q); delete Q.nImagens; saveDraft(true);
      location.replace("#/novo");
    }, function (e) { failView(e, function () { startEdit(id); }); });
  }

  /* ================= Tela: entrar ================= */
  function viewLogin(msg) {
    $(".tabs").hidden = true;
    app.innerHTML = '<div class="login"><form class="login-card" id="login-form" autocomplete="on">' +
      '<img src="assets/logo.png" alt="Gran Mármore Marmoraria" class="login-logo"><p>Gerador de orçamentos</p>' +
      (msg ? '<div class="alert" style="text-align:left">' + ico("info") + "<div>" + esc(msg) + "</div></div>" : "") +
      '<label class="field"><span>Senha de acesso</span><input type="password" id="login-pw" autocomplete="current-password" required placeholder="Digite a senha da equipe"></label>' +
      '<button class="btn primary wide" type="submit" id="login-btn">Entrar</button><p class="login-err" id="login-err" role="alert"></p></form></div>';
    var pw = $("#login-pw"); setTimeout(function () { pw.focus(); }, 50);
    $("#login-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = $("#login-btn"), er = $("#login-err"); btn.disabled = true; btn.textContent = "Entrando…"; er.textContent = "";
      api("POST", "login", { password: pw.value }).then(function (d) {
        TOKEN = d.token; write(K.token, TOKEN); boot();
      }, function (err) { btn.disabled = false; btn.textContent = "Entrar"; er.textContent = err.message; pw.select(); });
    });
  }

  window.addEventListener("hashchange", function () { route(); window.scrollTo(0, 0); });
  function topbarH() { var t = $(".topbar"); document.documentElement.style.setProperty("--topbar-h", (getComputedStyle(t).position === "sticky" ? t.offsetHeight : 0) + "px"); }
  window.addEventListener("resize", topbarH);

  /* ================= Tela: Novo orçamento ================= */
  function datalists() {
    function dl(id, arr) { return '<datalist id="' + id + '">' + arr.map(function (v) { return '<option value="' + esc(v) + '">'; }).join("") + "</datalist>"; }
    return dl("dl-amb", AMBIENTES) + dl("dl-peca", PECAS) + dl("dl-mat", MATERIAIS) + dl("dl-acab", ACABAMENTOS) + dl("dl-esp", ESPESSURAS) +
      dl("dl-vend", S.vendedores.map(function (v) { return v.nome; }));
  }
  function fld(label, k, val, opts) {
    opts = opts || {};
    var attrs = ' data-k="' + k + '" value="' + esc(val) + '"' + (opts.list ? ' list="' + opts.list + '"' : "") + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : "") +
      (opts.mode ? ' inputmode="' + opts.mode + '"' : "") + (opts.id ? ' id="' + opts.id + '"' : "") + (opts.ac ? ' autocomplete="' + opts.ac + '"' : ' autocomplete="off"');
    var input = '<input type="' + (opts.type || "text") + '"' + attrs + ">";
    if (opts.prefix) input = '<div class="input-affix"><span class="affix">' + opts.prefix + "</span>" + input + "</div>";
    if (opts.suffix) input = '<div class="input-affix right">' + input + '<span class="affix">' + opts.suffix + "</span></div>";
    return '<label class="field' + (opts.cls ? " " + opts.cls : "") + '"><span>' + label + (opts.req ? ' <b class="req">*</b>' : "") + "</span>" + input + (opts.hint ? "<small>" + opts.hint + "</small>" : "") + "</label>";
  }

  function viewNovo() {
    if (!Q) loadDraft();
    var editing = !!Q.numero;
    app.innerHTML =
      '<div class="page-head"><div><h1>' + (editing ? "Editando orçamento " + esc(numLabel(Q)) : "Novo orçamento") + "</h1>" +
      "<p>" + (editing ? "Altere o que precisar e toque em <b>Salvar alterações</b>. O número do orçamento continua o mesmo." : "Preencha os dados, as peças e as condições. O rascunho fica guardado enquanto você digita.") + "</p></div>" +
      '<div class="head-actions">' + (editing ? '<button class="btn sm ghost" data-act="cancelEdit">' + ico("x") + "Cancelar edição</button>" : '<button class="btn sm ghost" data-act="limpar">' + ico("plus") + "Começar outro</button>") + "</div></div>" +
      datalists() +
      sec(1, "Cliente e obra", "Quem recebe o orçamento e onde é a obra.", formCliente()) +
      sec(2, "Ambientes e peças", "Separe por ambiente, como o cliente pensa a obra.", formAmbientes(), compareSwitch()) +
      sec(3, "Serviços, desconto e total", "Entrega, instalação e desconto.", formServicos()) +
      sec(4, "Condições", "Pagamento, prazo, validade e o que está incluso.", formCondicoes()) +
      sec(5, "Imagens e observações", "Opcional: projeto, chapa ou referência.", formExtras()) +
      '<div class="actionbar"><div class="actionbar-inner"><div class="totals-mini" id="totals-mini"></div>' +
      '<button class="btn gold" data-act="gerar" id="btn-gerar">' + ico(editing ? "check" : "file") + (editing ? '<span>Salvar <span class="hide-sm">alterações</span></span>' : '<span>Gerar <span class="hide-sm">orçamento</span></span>') + "</button></div></div>";
    updateTotals();
    topbarH();
  }
  function sec(n, title, sub, body, extra) {
    return '<section class="card"><div class="card-head"><span class="num">' + n + '</span><div class="grow"><h2>' + title + "</h2><p>" + sub + "</p></div>" + (extra || "") + '</div><div class="card-body">' + body + "</div></section>";
  }
  function compareSwitch() {
    return '<label class="switch" title="Mostrar duas opções de material lado a lado"><input type="checkbox" data-k="comparar"' + (Q.comparar ? " checked" : "") + ' data-rerender="1"><span class="track"></span><span class="switch-text">Comparar 2 opções<small class="hide-xs">de material</small></span></label>';
  }
  function formCliente() {
    return '<div class="grid g3">' +
      fld("Nome do orçamento", "titulo", Q.titulo, { ph: defaultTitle(Q), cls: "span3", id: "f-titulo", hint: "Aparece na lista de orçamentos e no nome do PDF. Em branco, usamos o sugerido." }) +
      fld("Nome do cliente", "cliente.nome", Q.cliente.nome, { req: true, ph: "Ex.: Carla Mendes", cls: "span2", id: "f-cliente", ac: "name" }) +
      fld("WhatsApp do cliente", "cliente.tel", Q.cliente.tel, { type: "tel", mode: "tel", ph: "(37) 99999-9999", ac: "tel" }) +
      fld("Arquiteto(a) ou designer", "arquiteto", Q.arquiteto, { ph: "Opcional" }) +
      fld("E-mail do cliente", "cliente.email", Q.cliente.email, { type: "email", mode: "email", ph: "Opcional" }) +
      fld("Data do orçamento", "data", Q.data, { type: "date" }) +
      fld("Endereço da obra", "obra.endereco", Q.obra.endereco, { ph: "Rua, número, condomínio", cls: "span2" }) +
      fld("Bairro", "obra.bairro", Q.obra.bairro, {}) +
      fld("Cidade", "obra.cidade", Q.obra.cidade, { ph: "Ex.: Divinópolis/MG" }) +
      fld("Vendedor responsável", "vendedor.nome", Q.vendedor.nome, { list: "dl-vend", ph: "Seu nome" }) +
      fld("WhatsApp do vendedor", "vendedor.tel", Q.vendedor.tel, { type: "tel", mode: "tel", ph: "(37) 99999-9999" }) +
      "</div>";
  }
  function formAmbientes() {
    var h = "";
    if (Q.comparar) {
      h += '<div class="grid g2" style="margin-bottom:16px">' +
        fld("Nome da opção 1", "opcoes.0", Q.opcoes[0], { ph: "Ex.: Quartzo Branco" }) +
        fld("Nome da opção 2", "opcoes.1", Q.opcoes[1], { ph: "Ex.: Taj Mahal" }) + "</div>";
    }
    if (!Q.ambientes.length) h += '<div class="empty"><strong>Nenhum ambiente ainda</strong>Adicione o primeiro ambiente da obra.</div>';
    Q.ambientes.forEach(function (a, ai) {
      h += '<div class="amb"><div class="amb-head">' +
        '<input type="text" data-k="ambientes.' + ai + '.nome" value="' + esc(a.nome) + '" list="dl-amb" placeholder="Nome do ambiente" aria-label="Nome do ambiente" autocomplete="off" style="flex:1;min-width:0">' +
        '<span class="amb-sub" data-amb-sub="' + ai + '"></span>' +
        '<button class="icon-btn" data-act="delAmb" data-a="' + ai + '" title="Remover ambiente" aria-label="Remover ambiente">' + ico("trash") + "</button></div>" +
        '<div class="amb-body">';
      a.itens.forEach(function (it, ii) { h += formItem(ai, ii, it); });
      h += '<div class="add-row"><button class="btn sm" data-act="addItem" data-a="' + ai + '">' + ico("plus") + "Adicionar peça</button></div></div></div>";
    });
    h += '<div class="add-row"><button class="btn" data-act="addAmb">' + ico("plus") + "Adicionar ambiente</button></div>";
    return h;
  }
  function formItem(ai, ii, it) {
    var p = "ambientes." + ai + ".itens." + ii + ".";
    var area = itemArea(it);
    var chips = DETALHES.map(function (d) {
      var on = it.detalhes.indexOf(d) > -1;
      return '<button type="button" class="chip' + (on ? " on" : "") + '" data-act="det" data-a="' + ai + '" data-i="' + ii + '" data-v="' + esc(d) + '" aria-pressed="' + on + '">' + (on ? ico("check") : "") + esc(d) + "</button>";
    }).join("");
    var optA =
      '<div class="opt-box"><div class="opt-title">' + (Q.comparar ? esc(Q.opcoes[0] || "Opção 1") : "Material e valor") + "</div>" +
      '<div class="opt-row">' + fld("Material", p + "matA", it.matA, { list: "dl-mat", ph: "Ex.: Quartzito Taj Mahal" }) +
      '<div class="grid g2">' + fld("R$ por m² <small>(opcional)</small>", p + "precoA", it.precoA, { mode: "decimal", prefix: "R$", ph: "0,00" }) +
      fld("Valor da peça", p + "valA", it.valA, { mode: "decimal", prefix: "R$", ph: "0,00", req: true }) + "</div></div></div>";
    var optB = Q.comparar ?
      '<div class="opt-box"><div class="opt-title">' + esc(Q.opcoes[1] || "Opção 2") + "</div>" +
      '<div class="opt-row">' + fld("Material", p + "matB", it.matB, { list: "dl-mat", ph: "Em branco = igual à opção 1" }) +
      '<div class="grid g2">' + fld("R$ por m² <small>(opcional)</small>", p + "precoB", it.precoB, { mode: "decimal", prefix: "R$", ph: "0,00" }) +
      fld("Valor da peça", p + "valB", it.valB, { mode: "decimal", prefix: "R$", ph: "0,00" }) + "</div></div>" +
      '<div class="subnote">Deixe material e valor em branco se esta peça for igual nas duas opções.</div></div>' : "";
    return '<div class="item"><div class="item-top"><span class="tag">Peça ' + (ii + 1) + '</span><span class="item-area" data-area="' + ai + "-" + ii + '">' + (area ? num(area, 2) + " m²" : "") + '</span><span class="grow"></span>' +
      '<button class="icon-btn" data-act="dupItem" data-a="' + ai + '" data-i="' + ii + '" title="Duplicar peça" aria-label="Duplicar peça">' + ico("copy") + "</button>" +
      '<button class="icon-btn danger" data-act="delItem" data-a="' + ai + '" data-i="' + ii + '" title="Remover peça" aria-label="Remover peça">' + ico("trash") + "</button></div>" +
      '<div class="grid g4" style="margin-bottom:14px">' +
      fld("Peça", p + "peca", it.peca, { list: "dl-peca", ph: "Ex.: Bancada" }) +
      fld("Comprimento", p + "comp", it.comp, { mode: "decimal", suffix: "m", ph: "1,90" }) +
      fld("Largura", p + "larg", it.larg, { mode: "decimal", suffix: "m", ph: "0,65" }) +
      fld("Quantidade", p + "qtd", it.qtd, { mode: "numeric", ph: "1" }) +
      fld("Espessura", p + "espessura", it.espessura, { list: "dl-esp" }) +
      fld("Acabamento", p + "acabamento", it.acabamento, { list: "dl-acab" }) +
      fld("Observação da peça", p + "obs", it.obs, { ph: "Ex.: recorte para cuba de embutir 50 cm", cls: "span2" }) +
      '</div><div class="field" style="margin-bottom:14px"><span>Detalhes de acabamento</span><div class="chips">' + chips + "</div></div>" +
      '<div class="grid" style="gap:12px">' + optA + optB + "</div>" +
      '<div class="subnote" style="margin-top:8px">Medidas em metros (1,90) ou centímetros (190). Preencha o R$/m² para o valor ser calculado sozinho.</div></div>';
  }
  function formServicos() {
    var h = '<div class="row-list">';
    Q.servicos.forEach(function (s, i) {
      h += '<div class="srv"><input class="srv-desc" type="text" data-k="servicos.' + i + '.desc" value="' + esc(s.desc) + '" placeholder="Descrição do serviço" aria-label="Descrição do serviço" autocomplete="off">' +
        '<div class="input-affix srv-val"><span class="affix">R$</span><input type="text" inputmode="decimal" data-k="servicos.' + i + '.valor" value="' + esc(s.valor) + '" placeholder="0,00" aria-label="Valor"' + (s.incluso ? " disabled" : "") + "></div>" +
        '<label class="switch"><input type="checkbox" data-k="servicos.' + i + '.incluso"' + (s.incluso ? " checked" : "") + ' data-rerender="1"><span class="track"></span><span class="switch-text">Incluso</span></label>' +
        '<button class="icon-btn danger" data-act="delSrv" data-i="' + i + '" aria-label="Remover serviço">' + ico("trash") + "</button></div>";
    });
    h += '</div><div class="add-row" style="margin:12px 0 22px"><button class="btn sm" data-act="addSrv">' + ico("plus") + "Adicionar serviço</button></div>";
    h += '<div class="grid g3" style="margin-bottom:20px"><label class="field"><span>Tipo de desconto</span><select data-k="desconto.tipo"><option value="%"' + (Q.desconto.tipo === "%" ? " selected" : "") + '>Porcentagem (%)</option><option value="R$"' + (Q.desconto.tipo === "R$" ? " selected" : "") + ">Valor (R$)</option></select></label>" +
      fld("Desconto", "desconto.valor", Q.desconto.valor, { mode: "decimal", ph: "0" }) + "</div>";
    h += '<div id="sum-box"></div>';
    return h;
  }
  function formCondicoes() {
    var h = '<div class="grid g3" style="margin-bottom:12px">' +
      fld("Validade (dias)", "validadeDias", Q.validadeDias, { mode: "numeric", hint: '<span id="val-date"></span>' }) +
      fld("Prazo de produção", "prazo", Q.prazo, { cls: "span2", ph: "Ex.: 15 dias úteis após a medição" }) + "</div>";
    h += '<label class="field" style="margin-bottom:8px"><span>Forma de pagamento</span><textarea data-k="pagamento" rows="2" style="min-height:64px" placeholder="Como o cliente pode pagar">' + esc(Q.pagamento) + "</textarea></label>";
    h += '<div class="chips" style="margin-bottom:22px">' + PAGAMENTOS.map(function (p) { return '<button type="button" class="chip" data-act="pay" data-v="' + esc(p) + '">' + esc(p) + "</button>"; }).join("") + "</div>";
    h += '<div class="two-col">' + incList("inclusos", "O que está incluso") + incList("naoInclusos", "O que não está incluso") + "</div>";
    return h;
  }
  function incList(key, title) {
    var h = '<div><p class="col-title">' + title + '</p><div class="row-list">';
    Q[key].forEach(function (x, i) {
      h += '<div class="check-row"><input class="cbox" type="checkbox" data-k="' + key + "." + i + '.on"' + (x.on ? " checked" : "") + ' aria-label="Mostrar no orçamento">' +
        '<input type="text" data-k="' + key + "." + i + '.t" value="' + esc(x.t) + '" autocomplete="off" aria-label="Item">' +
        '<button class="icon-btn danger" data-act="delInc" data-key="' + key + '" data-i="' + i + '" aria-label="Remover item">' + ico("x") + "</button></div>";
    });
    return h + '</div><button class="btn sm ghost" style="margin-top:8px" data-act="addInc" data-key="' + key + '">' + ico("plus") + "Adicionar item</button></div>";
  }
  function formExtras() {
    var h = '<div class="img-grid" style="margin-bottom:18px">';
    Q.imagens.forEach(function (im, i) {
      h += '<div class="img-card"><img src="' + im.src + '" alt=""><div class="img-meta"><input type="text" data-k="imagens.' + i + '.legenda" value="' + esc(im.legenda) + '" placeholder="Legenda (ex.: projeto da cozinha)" aria-label="Legenda da imagem" autocomplete="off">' +
        '<button class="icon-btn danger" data-act="delImg" data-i="' + i + '" aria-label="Remover imagem">' + ico("trash") + "</button></div></div>";
    });
    if (Q.imagens.length < MAX_IMGS) {
      h += '<label class="dropzone" id="dropzone">' + ico("image") + "<strong>Adicionar imagens</strong><span>Projeto, chapa real ou referência</span>" +
        '<input type="file" accept="image/*" multiple hidden id="img-input"></label>';
    }
    h += "</div>";
    h += '<label class="switch" style="margin-bottom:18px"><input type="checkbox" data-k="explicarMateriais"' + (Q.explicarMateriais ? " checked" : "") + '><span class="track"></span><span class="switch-text">Explicar os materiais no orçamento<small>Inclui um resumo de cada pedra (resistência, cuidados) para o cliente entender a diferença de preço.</small></span></label>';
    h += '<label class="field" style="margin-bottom:16px"><span>Observações para o cliente</span><textarea data-k="observacoes" placeholder="Ex.: valores consideram a chapa reservada do lote atual.">' + esc(Q.observacoes) + "</textarea></label>";
    h += '<label class="field"><span>Condições gerais <small>(uma por linha)</small></span><textarea data-k="termos" rows="6">' + esc(Q.termos) + "</textarea></label>";
    return h;
  }

  function updateTotals() {
    var c = calc(Q);
    var mini = $("#totals-mini");
    if (mini) {
      mini.innerHTML = Q.comparar ?
        '<div class="tm"><small>' + esc(Q.opcoes[0] || "Opção 1") + "</small><strong>" + money(c.A.total) + '</strong></div><div class="tm"><small>' + esc(Q.opcoes[1] || "Opção 2") + "</small><strong>" + money(c.B.total) + "</strong></div>" :
        '<div class="tm"><small>Total do orçamento</small><strong>' + money(c.A.total) + "</strong></div>";
    }
    $$("[data-amb-sub]").forEach(function (el) {
      var r = c.amb[+el.dataset.ambSub]; if (!r) return;
      el.textContent = Q.comparar ? money(r.A) + " · " + money(r.B) : money(r.A);
    });
    var box = $("#sum-box");
    if (box) {
      var cols = Q.comparar ? [["A", Q.opcoes[0] || "Opção 1"], ["B", Q.opcoes[1] || "Opção 2"]] : [["A", "Valor"]];
      var row = function (lbl, f) { return "<tr><td>" + lbl + "</td>" + cols.map(function (k) { return "<td>" + f(k[0]) + "</td>"; }).join("") + "</tr>"; };
      box.innerHTML = '<table class="sum-table"><tr><th>Resumo</th>' + cols.map(function (k) { return "<th>" + esc(k[1]) + "</th>"; }).join("") + "</tr>" +
        row("Peças", function (k) { return money(k === "A" ? c.pecasA : c.pecasB); }) +
        row("Serviços", function () { return c.serv ? money(c.serv) : "Incluso"; }) +
        (c.A.desc || c.B.desc ? row("Desconto", function (k) { return "− " + money(c[k].desc); }) : "") +
        '<tr class="total"><td>Total</td>' + cols.map(function (k) { return "<td>" + money(c[k[0]].total) + "</td>"; }).join("") + "</tr></table>";
    }
    var vd = $("#val-date");
    if (vd) vd.textContent = "Vale até " + fmtDate(addDays(Q.data, Q.validadeDias));
  }

  // Edição: entrada de texto
  app.addEventListener("input", function (e) {
    var el = e.target, k = el.dataset && el.dataset.k;
    if (!k || !Q || !document.querySelector(".actionbar")) return;
    if (el.type === "checkbox") return;
    setPath(Q, k, el.value);
    el.classList.remove("invalid");
    var m = k.match(/^ambientes\.(\d+)\.itens\.(\d+)\.(comp|larg|qtd|precoA|precoB)$/);
    if (m) {
      var it = Q.ambientes[+m[1]].itens[+m[2]], area = itemArea(it);
      var lab = $('[data-area="' + m[1] + "-" + m[2] + '"]'); if (lab) lab.textContent = area ? num(area, 2) + " m²" : "";
      ["A", "B"].forEach(function (o) {
        if (/^preco/.test(m[3]) && m[3] !== "preco" + o) return;
        var preco = parseNum(it["preco" + o]);
        if (preco && area) {
          it["val" + o] = moneyInput(Math.round(area * preco * 100) / 100);
          var inp = $('[data-k="ambientes.' + m[1] + ".itens." + m[2] + ".val" + o + '"]'); if (inp) { inp.value = it["val" + o]; inp.classList.remove("invalid"); }
        }
      });
    }
    if (k === "cliente.nome" || /^ambientes\.\d+\.nome$/.test(k)) { var ft = $("#f-titulo"); if (ft) ft.placeholder = defaultTitle(Q); }
    updateTotals(); saveDraft();
  });
  app.addEventListener("change", function (e) {
    var el = e.target, k = el.dataset && el.dataset.k;
    if (el.id === "img-input") { addImages(el.files); el.value = ""; return; }
    if (!k || !Q || !document.querySelector(".actionbar")) return;
    if (el.type === "checkbox") {
      setPath(Q, k, el.checked);
      if (el.dataset.rerender) { var y = window.scrollY; viewNovo(); window.scrollTo(0, y); }
      updateTotals(); saveDraft(); return;
    }
    if (/^opcoes\./.test(k)) { var y2 = window.scrollY; viewNovo(); window.scrollTo(0, y2); }
    if (/\.(valA|valB|valor)$/.test(k) || k === "desconto.valor") {
      var n = parseNum(el.value); if (n) { el.value = moneyInput(n); setPath(Q, k, el.value); }
    }
    if (k === "vendedor.nome") {
      var v = S.vendedores.filter(function (x) { return x.nome === el.value; })[0];
      if (v && v.tel) { Q.vendedor.tel = v.tel; var t = $('[data-k="vendedor.tel"]'); if (t) t.value = v.tel; }
    }
    updateTotals(); saveDraft();
  });

  function rerender() { var y = window.scrollY; viewNovo(); window.scrollTo(0, y); saveDraft(); }

  // Ações (cliques)
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var act = b.dataset.act, a = +b.dataset.a, i = +b.dataset.i;
    switch (act) {
      case "addAmb": Q.ambientes.push(newAmb("")); rerender(); focusLast('[data-k$=".nome"][list="dl-amb"]'); break;
      case "delAmb":
        if (Q.ambientes[a].itens.some(function (x) { return x.valA || x.matA; }) && !confirm("Remover o ambiente “" + (Q.ambientes[a].nome || "sem nome") + "” e suas peças?")) return;
        Q.ambientes.splice(a, 1); rerender(); break;
      case "addItem": Q.ambientes[a].itens.push(newItem("")); rerender(); break;
      case "dupItem": var c2 = clone(Q.ambientes[a].itens[i]); c2.id = uid(); Q.ambientes[a].itens.splice(i + 1, 0, c2); rerender(); toast("Peça duplicada"); break;
      case "delItem": Q.ambientes[a].itens.splice(i, 1); rerender(); break;
      case "det":
        var it = Q.ambientes[a].itens[i], v = b.dataset.v, p = it.detalhes.indexOf(v);
        if (p > -1) it.detalhes.splice(p, 1); else it.detalhes.push(v);
        b.classList.toggle("on", p < 0); b.setAttribute("aria-pressed", p < 0); b.innerHTML = (p < 0 ? ico("check") : "") + esc(v); saveDraft(); break;
      case "addSrv": Q.servicos.push({ id: uid(), desc: "", valor: "", incluso: false }); rerender(); break;
      case "delSrv": Q.servicos.splice(i, 1); rerender(); break;
      case "addInc": Q[b.dataset.key].push({ id: uid(), t: "", on: true }); rerender(); break;
      case "delInc": Q[b.dataset.key].splice(i, 1); rerender(); break;
      case "pay": Q.pagamento = b.dataset.v; var ta = $('[data-k="pagamento"]'); if (ta) ta.value = Q.pagamento; saveDraft(); break;
      case "delImg": Q.imagens.splice(i, 1); rerender(); break;
      case "cancelEdit":
        if (!confirm("Cancelar a edição? As alterações que ainda não foram salvas serão descartadas.")) return;
        var back = Q.id; clearTimeout(draftTimer); try { localStorage.removeItem(K.draft); } catch (e2) {} Q = null; location.hash = "#/orcamento/" + back; break;
      case "limpar":
        if (!confirm("Começar um orçamento novo? O que está na tela será descartado (orçamentos já gerados continuam salvos).")) return;
        Q = newQuote(); saveDraft(true); viewNovo(); window.scrollTo(0, 0); break;
      case "gerar": gerar(); break;
      case "print": printDoc(b.dataset.id); break;
      case "msgs": openMessages(b.dataset.id); break;
      case "closeModal": closeModal(); break;
      case "copyMsg": copyText(b.closest(".msg").querySelector(".msg-text").textContent); break;
      case "dup": duplicate(b.dataset.id); break;
      case "del": delQuote(b.dataset.id); break;
      case "csv": exportCSV(); break;
      case "addVend": collectConfig(); S.vendedores.push({ nome: "", tel: "" }); viewConfig(); break;
      case "delVend": collectConfig(); S.vendedores.splice(i, 1); viewConfig(); break;
      case "saveCfg": saveConfig(); break;
      case "export": exportJSON(); break;
      case "rename": openRename(b.dataset.id); break;
      case "logout": if (confirm("Sair deste aparelho? Para entrar de novo, será pedida a senha da equipe.")) logout(); break;
    }
  });
  function focusLast(sel) { var els = $$(sel); var el = els[els.length - 1]; if (el) el.focus(); }

  // Imagens: reduz no navegador para caber no armazenamento
  var MAX_IMGS = 6;
  function addImages(files) {
    var list = Array.prototype.slice.call(files || []).slice(0, MAX_IMGS - Q.imagens.length);
    if (!list.length) return;
    toast("Processando " + list.length + (list.length > 1 ? " imagens…" : " imagem…"));
    var done = 0;
    list.forEach(function (f) {
      var fr = new FileReader();
      fr.onload = function () {
        var img = new Image();
        img.onload = function () {
          var max = 1200, w = img.width, h = img.height, s = Math.min(1, max / Math.max(w, h));
          var cv = document.createElement("canvas"); cv.width = Math.round(w * s); cv.height = Math.round(h * s);
          var cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
          Q.imagens.push({ id: uid(), src: cv.toDataURL("image/jpeg", 0.72), legenda: f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 60) });
          if (++done === list.length) { rerender(); toast("Imagem adicionada"); }
        };
        img.onerror = function () { if (++done === list.length) rerender(); toast("Não consegui abrir uma das imagens."); };
        img.src = fr.result;
      };
      fr.readAsDataURL(f);
    });
  }
  app.addEventListener("dragover", function (e) { var dz = e.target.closest && e.target.closest("#dropzone"); if (dz) { e.preventDefault(); dz.classList.add("drag"); } });
  app.addEventListener("dragleave", function (e) { var dz = e.target.closest && e.target.closest("#dropzone"); if (dz) dz.classList.remove("drag"); });
  app.addEventListener("drop", function (e) { var dz = e.target.closest && e.target.closest("#dropzone"); if (dz) { e.preventDefault(); dz.classList.remove("drag"); addImages(e.dataTransfer.files); } });

  function gerar() {
    var problems = [];
    var nome = $("#f-cliente");
    if (!String(Q.cliente.nome).trim()) { problems.push(nome); }
    var anyItem = false;
    Q.ambientes.forEach(function (a, ai) {
      a.itens.forEach(function (it, ii) {
        if (parseNum(it.valA) > 0) anyItem = true;
        else { var el = $('[data-k="ambientes.' + ai + ".itens." + ii + '.valA"]'); if (el) problems.push(el); }
      });
    });
    if (!Q.ambientes.length || !Q.ambientes.some(function (a) { return a.itens.length; })) { toast("Adicione pelo menos uma peça ao orçamento."); return; }
    problems = problems.filter(Boolean);
    if (problems.length) {
      problems.forEach(function (el) { el.classList.add("invalid"); });
      problems[0].scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { problems[0].focus({ preventScroll: true }); }, 350);
      toast(!String(Q.cliente.nome).trim() ? "Preencha o nome do cliente." : "Preencha o valor de todas as peças.");
      return;
    }
    if (!anyItem) return;
    var btn = $("#btn-gerar"), editing = !!Q.numero;
    if (btn) { btn.disabled = true; btn.lastChild.textContent = "Salvando…"; }
    var c = calc(Q), payload = clone(Q);
    payload.titulo = titleOf(Q); payload.totalA = Math.round(c.A.total * 100) / 100; payload.totalB = Math.round(c.B.total * 100) / 100;
    if (JSON.stringify(payload).length > 4200000) {
      toast("O orçamento ficou grande demais por causa das imagens. Remova alguma."); if (btn) { btn.disabled = false; viewNovo(); } return;
    }
    api("POST", "quotes", payload).then(function (saved) {
      clearTimeout(draftTimer); try { localStorage.removeItem(K.draft); } catch (e) {} Q = null; LIST = null;
      if (saved.vendedor && saved.vendedor.nome && !S.vendedores.some(function (v) { return v.nome === saved.vendedor.nome; })) {
        S.vendedores.push({ nome: saved.vendedor.nome, tel: saved.vendedor.tel || "" }); saveSettings().catch(function () {});
      }
      if (!editing && saved.numero) S.proximoNumero = saved.numero + 1;
      CUR = saved; migrate(CUR);
      toast(editing ? "Alterações salvas" : "Orçamento " + numLabel(saved) + " gerado");
      location.hash = "#/orcamento/" + saved.id;
    }, function (err) {
      toast(err.message);
      if (btn) { btn.disabled = false; btn.lastChild.textContent = editing ? "Salvar alterações" : "Gerar orçamento"; }
    });
  }

  /* ================= Documento ================= */
  function docHTML(q) {
    var e = S.empresa, c = calc(q), cmp = q.comparar;
    var o1 = q.opcoes[0] || "Opção 1", o2 = q.opcoes[1] || "Opção 2";
    var validade = addDays(q.data, q.validadeDias);
    var h = '<article class="doc">';
    h += '<header class="doc-head"><img class="doc-logo" src="assets/logo.png" alt="Gran Mármore Marmoraria"><div class="doc-brand"><div class="s">Proposta comercial</div></div>' +
      '<div class="doc-num"><div class="l">Orçamento nº</div><div class="v">' + esc(numLabel(q)) + '</div><div class="d">Emitido em ' + fmtDate(q.data) + "</div></div></header>";
    h += '<div class="doc-body">';
    var fn = firstName(q.cliente.nome);
    h += '<div class="doc-title">' + esc(titleOf(q)) + "</div>";
    h += '<p class="doc-hello">Olá, <strong>' + esc(fn) + "</strong>! Preparamos esta proposta com base no projeto e nas medidas que conversamos. Abaixo estão as peças de cada ambiente, o que está incluso e as condições. Qualquer dúvida, é só chamar" + (q.vendedor.nome ? " " + esc(firstName(q.vendedor.nome)) : " a nossa equipe") + ".</p>";

    var cells = [["Cliente", q.cliente.nome], ["WhatsApp", q.cliente.tel], ["E-mail", q.cliente.email], ["Arquiteto(a)", q.arquiteto],
      ["Responsável", [q.vendedor.nome, q.vendedor.tel].filter(Boolean).join(" · ")], ["Validade", "Até " + fmtDate(validade)]].filter(function (x) { return String(x[1] || "").trim(); });
    var addr = [q.obra.endereco, q.obra.bairro, q.obra.cidade].filter(function (x) { return String(x || "").trim(); }).join(" · ");
    h += '<div class="doc-info">';
    cells.forEach(function (x, i) {
      var span = "";
      if (i === cells.length - 1) { var rest = 3 - (cells.length % 3 || 3); if (rest) span = " s" + (rest + 1); }
      h += '<div class="' + span.trim() + '"><div class="k">' + x[0] + '</div><div class="v">' + esc(x[1]) + "</div></div>";
    });
    if (addr) h += '<div class="s3"><div class="k">Endereço da obra</div><div class="v">' + esc(addr) + "</div></div>";
    h += "</div>";

    // Ambientes
    h += '<div class="doc-sec-title"><h3>Peças por ambiente</h3>' + (cmp ? '<span class="sub">' + esc(o1) + " × " + esc(o2) + "</span>" : "") + "</div>";
    q.ambientes.forEach(function (a, ai) {
      if (!a.itens.length) return;
      var r = c.amb[ai];
      h += '<div class="doc-amb"><div class="doc-amb-head"><span class="t">' + esc(a.nome || "Ambiente " + (ai + 1)) + '</span><span class="c">' +
        (cmp ? esc(o1) + " " + money(r.A) + " · " + esc(o2) + " " + money(r.B) : "Subtotal " + money(r.A)) + "</span></div>";
      h += '<table class="doc-table"><thead><tr>' + (cmp ?
        '<th style="width:31%">Peça</th><th style="width:15%">Medidas</th><th style="width:27%">' + esc(o1) + '</th><th style="width:27%">' + esc(o2) + "</th>" :
        '<th style="width:40%">Peça</th><th style="width:17%">Medidas</th><th style="width:28%">Material</th><th class="r" style="width:15%">Valor</th>') + "</tr></thead><tbody>";
      a.itens.forEach(function (it) {
        var area = itemArea(it), q2 = parseNum(it.qtd) || 1;
        var det = it.detalhes.slice(); if (String(it.obs || "").trim()) det.push(it.obs.trim());
        var peca = '<div class="peca">' + esc(it.peca || "Peça") + "</div>" + (det.length ? '<div class="det">' + esc(det.join(" · ")) + "</div>" : "");
        var meas = '<td class="meas">' + (meters(it.comp) && meters(it.larg) ? num(meters(it.comp), 2) + " × " + num(meters(it.larg), 2) + " m" : "–") +
          (q2 > 1 ? "<small>" + q2 + " unidades</small>" : "") + (area ? "<small>" + num(area, 2) + " m²</small>" : "") + "</td>";
        var sub = [it.acabamento, it.espessura].filter(function (x) { return String(x || "").trim(); }).join(" · ");
        var matCell = function (m, v) {
          return '<td><div class="mat">' + esc(m || "A definir") + (sub ? "<small>" + esc(sub) + "</small>" : "") + '</div><div class="val" style="margin-top:4px">' + money(v) + "</div></td>";
        };
        if (cmp) {
          var same = sameInB(it);
          h += "<tr><td>" + peca + "</td>" + meas + matCell(it.matA, itemVal(it, "A")) + matCell(same ? it.matA : it.matB || it.matA, itemVal(it, "B")) + "</tr>";
        } else {
          h += "<tr><td>" + peca + "</td>" + meas + '<td><div class="mat">' + esc(it.matA || "A definir") + (sub ? "<small>" + esc(sub) + "</small>" : "") + '</div></td><td class="r val">' + money(itemVal(it, "A")) + "</td></tr>";
        }
      });
      h += "</tbody></table></div>";
    });

    // Serviços
    var srv = q.servicos.filter(function (s) { return String(s.desc || "").trim(); });
    if (srv.length) {
      h += '<div class="doc-sec"><div class="doc-sec-title"><h3>Serviços</h3></div><table class="doc-table" style="border-top:1px solid #e3dccf"><tbody>';
      srv.forEach(function (s) { h += "<tr><td>" + esc(s.desc) + '</td><td class="r val">' + (s.incluso ? '<span style="color:#2f7a4f">Incluso</span>' : money(parseNum(s.valor))) + "</td></tr>"; });
      h += "</tbody></table></div>";
    }

    // Resumo
    function totalCard(label, k, pecas) {
      var x = c[k];
      return '<div class="doc-total-card"><div class="h">' + esc(label) + '</div><div class="rows">' +
        '<div class="row"><span>Peças</span><span>' + money(pecas) + "</span></div>" +
        (c.serv ? '<div class="row"><span>Serviços</span><span>' + money(c.serv) + "</span></div>" : '<div class="row"><span>Serviços</span><span>Incluso</span></div>') +
        (x.desc ? '<div class="row neg"><span>Desconto' + (q.desconto.tipo === "%" ? " (" + num(parseNum(q.desconto.valor), 0) + "%)" : "") + "</span><span>− " + money(x.desc) + "</span></div>" : "") +
        '</div><div class="grand"><span>Total</span><strong>' + money(x.total) + "</strong></div></div>";
    }
    h += '<div class="doc-sec"><div class="doc-sec-title"><h3>Investimento</h3></div><div class="doc-summary' + (cmp ? " two" : "") + '">' +
      (cmp ? totalCard(o1, "A", c.pecasA) + totalCard(o2, "B", c.pecasB) : totalCard("Resumo do investimento", "A", c.pecasA)) + "</div></div>";

    // Condições
    h += '<div class="doc-sec"><div class="doc-sec-title"><h3>Condições</h3></div><div class="doc-cond">' +
      '<div><div class="k">Pagamento</div><div class="v">' + esc(q.pagamento || "A combinar") + "</div></div>" +
      '<div><div class="k">Prazo de produção</div><div class="v">' + esc(q.prazo || "A combinar") + "</div></div>" +
      '<div><div class="k">Validade da proposta</div><div class="v">' + (parseInt(q.validadeDias, 10) || 0) + " dias · até " + fmtDate(validade) + "</div></div></div></div>";

    var inc = q.inclusos.filter(function (x) { return x.on && String(x.t).trim(); }), ninc = q.naoInclusos.filter(function (x) { return x.on && String(x.t).trim(); });
    if (inc.length || ninc.length) {
      var li = function (arr, ic) { return arr.map(function (x) { return '<li><svg viewBox="0 0 24 24">' + ICON[ic] + "</svg><span>" + esc(x.t) + "</span></li>"; }).join(""); };
      h += '<div class="doc-sec"><div class="doc-inc">' +
        (inc.length ? '<div class="yes"><h4>Está incluso</h4><ul>' + li(inc, "check") + "</ul></div>" : "<div></div>") +
        (ninc.length ? '<div class="no"><h4>Não está incluso</h4><ul>' + li(ninc, "x") + "</ul></div>" : "<div></div>") + "</div></div>";
    }

    // Materiais
    if (q.explicarMateriais) {
      var seen = {}, mats = [];
      q.ambientes.forEach(function (a) { a.itens.forEach(function (it) { [it.matA, q.comparar ? it.matB : ""].forEach(function (m) { m = String(m || "").trim(); if (m && !seen[m.toLowerCase()]) { seen[m.toLowerCase()] = 1; var inf = matInfo(m); if (inf) mats.push([m, inf]); } }); }); });
      if (mats.length) {
        h += '<div class="doc-sec"><div class="doc-sec-title"><h3>Sobre os materiais</h3></div><div class="doc-mats">' +
          mats.map(function (m) { return '<div class="doc-mat"><div><b>' + esc(m[0]) + "</b><span>" + esc(m[1]) + "</span></div></div>"; }).join("") + "</div></div>";
      }
    }
    if (String(q.observacoes || "").trim()) h += '<div class="doc-sec"><div class="doc-sec-title"><h3>Observações</h3></div><div class="doc-obs">' + esc(q.observacoes.trim()) + "</div></div>";
    if (q.imagens.length) {
      h += '<div class="doc-sec-title"><h3>Imagens e referências</h3></div><div class="doc-imgs" style="margin-bottom:22px">' +
        q.imagens.map(function (im) { return '<figure class="doc-img" style="margin:0"><img src="' + im.src + '" alt="">' + (String(im.legenda || "").trim() ? '<figcaption class="cap">' + esc(im.legenda) + "</figcaption>" : "") + "</figure>"; }).join("") + "</div>";
    }
    var termos = String(q.termos || "").split("\n").map(function (t) { return t.trim(); }).filter(Boolean);
    if (termos.length) h += '<div class="doc-sec"><div class="doc-sec-title"><h3>Condições gerais</h3></div><ol class="doc-terms">' + termos.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol></div>";

    h += '<div class="doc-sign"><div><b>' + esc(q.cliente.nome) + "</b>De acordo · data ____/____/______</div><div><b>" + esc(e.nome) + "</b>" + esc(q.vendedor.nome || "Responsável") + "</div></div>";
    h += "</div>";
    var foot = [["", e.nome], ["CNPJ", e.cnpj], ["WhatsApp", e.whatsapp], ["Instagram", e.instagram], ["E-mail", e.email], ["", [e.endereco, e.cidade].filter(Boolean).join(" · ")]].filter(function (x) { return String(x[1] || "").trim(); });
    h += '<footer class="doc-foot">' + foot.map(function (x) { return "<span>" + (x[0] ? x[0] + " " : "") + (x[0] ? esc(x[1]) : "<b>" + esc(x[1]) + "</b>") + "</span>"; }).join("") + "</footer>";
    h += "</article>";
    return h;
  }

  var CUR = null; // orçamento aberto na tela do documento
  function viewDoc(id) {
    if (CUR && CUR.id === id) return renderDoc(CUR);
    loading("Abrindo orçamento…");
    fetchQuote(id).then(function (q) { CUR = q; renderDoc(q); }, function (e) {
      if (e.status === 404) { app.innerHTML = '<div class="empty" style="margin-top:20px"><strong>Orçamento não encontrado</strong>Ele pode ter sido excluído.<div style="margin-top:14px"><a class="btn" href="#/historico">Ver orçamentos</a></div></div>'; return; }
      failView(e, function () { viewDoc(id); });
    });
  }
  function renderDoc(q) {
    app.innerHTML =
      '<div class="preview-bar">' +
      '<a class="btn sm ghost" href="#/historico">' + ico("back") + "Orçamentos</a>" +
      '<span class="grow"></span>' +
      '<button class="btn sm" data-act="rename" data-id="' + q.id + '">' + ico("tag") + "Renomear</button>" +
      '<a class="btn sm" href="#/editar/' + q.id + '">' + ico("edit") + "Editar</a>" +
      '<button class="btn sm" data-act="dup" data-id="' + q.id + '">' + ico("copy") + "Duplicar</button>" +
      '<button class="btn sm primary" data-act="print" data-id="' + q.id + '">' + ico("pdf") + "Baixar PDF</button>" +
      '<button class="btn sm gold" data-act="msgs" data-id="' + q.id + '">' + ico("chat") + "Enviar ao cliente</button></div>" +
      '<div class="doc-name"><span class="q-num">' + esc(numLabel(q)) + '</span><h1>' + esc(titleOf(q)) + '</h1><span class="pill ' + (q.status || "aberto") + '">' + statusLabel(q.status) + "</span></div>" +
      '<div class="alert">' + ico("info") + "<div>Salvo para toda a equipe. Use <b>Baixar PDF</b> e depois <b>Enviar ao cliente</b>: o orçamento nunca vai sozinho.</div></div>" +
      '<div class="doc-stage" id="doc-stage"><div id="doc-wrap"><div class="doc-scale doc-shadow" id="doc-scale">' + docHTML(q) + "</div></div></div>";
    fitDoc(); topbarH();
    $$("#doc-scale img").forEach(function (im) { if (!im.complete) im.addEventListener("load", fitDoc); });
  }
  function fitDoc() {
    var stage = $("#doc-stage"), sc = $("#doc-scale"), wrap = $("#doc-wrap");
    if (!stage || !sc) return;
    var w = stage.clientWidth, s = Math.min(1, w / 794);
    sc.style.transform = "scale(" + s + ")";
    wrap.style.width = 794 * s + "px"; wrap.style.height = sc.offsetHeight * s + "px";
  }
  window.addEventListener("resize", fitDoc);
  function statusLabel(st) { return { aberto: "Em aberto", fechou: "Fechou", perdeu: "Perdeu" }[st || "aberto"]; }

  // Busca o orçamento completo (com imagens) quando ele não está aberto na tela
  function withFull(id, fn) {
    if (CUR && CUR.id === id && CUR.imagens) return fn(CUR);
    toast("Carregando orçamento…");
    fetchQuote(id).then(function (q) { CUR = q; fn(q); }, function (e) { toast(e.message); });
  }

  function printDoc(id) {
    withFull(id, function (q) {
      var root = $("#print-root"); root.innerHTML = docHTML(q);
      var old = document.title;
      document.title = (titleOf(q) + " - Orçamento " + numLabel(q) + " - Gran Mármore").replace(/[\\/:*?"<>|]+/g, "-");
      var imgs = $$("img", root), pending = imgs.filter(function (i) { return !i.complete; }).length;
      var go = function () {
        setTimeout(function () {
          window.print();
          setTimeout(function () { document.title = old; }, 500);
        }, 150);
      };
      if (!pending) go(); else imgs.forEach(function (i) { if (!i.complete) { var done = function () { if (--pending === 0) go(); }; i.addEventListener("load", done); i.addEventListener("error", done); } });
    });
  }

  /* ================= Mensagens de WhatsApp ================= */
  function messages(q) {
    var fn = firstName(q.cliente.nome) || "tudo bem", vend = firstName(q.vendedor.nome);
    var amb = joinPt(q.ambientes.map(function (a) { return String(a.nome || "").trim().toLowerCase(); }));
    var val = fmtDate(addDays(q.data, q.validadeDias));
    var dois = q.comparar ? " Coloquei duas opções de material para você comparar." : "";
    return [
      { step: "1 · Antes de enviar", when: "Na hora do envio", text: "Oi, " + fn + "! " + (vend ? "Aqui é " + vend + ", da Marmoraria Gran Mármore. " : "") + "Finalizei a cotação" + (amb ? " (" + amb + ")" : "") + " com as medidas que conversamos. Vou te mandar o orçamento agora." },
      { step: "2 · Envie o PDF", when: "Logo em seguida", tip: "pdf", text: "Anexe o PDF do orçamento " + numLabel(q) + " na conversa (botão Baixar PDF)." },
      { step: "3 · Pergunta depois", when: "Logo após o PDF", text: "Conseguiu dar uma olhada?" + dois + " Se quiser, te explico a diferença entre os materiais ou ajusto alguma coisa." },
      { step: "4 · Follow-up", when: "1 dia depois, se não respondeu", text: "Oi, " + fn + "! Conseguiu ver o orçamento " + numLabel(q) + "? Fico à disposição para qualquer ajuste ou dúvida." },
      { step: "5 · Ligação", when: "2 a 3 dias depois", tip: "call", text: "Ligue, de preferência para quem decide. Voz fecha mais que texto." },
      { step: "6 · Antes de vencer", when: "Perto de " + val, text: fn + ", passando para lembrar que seu orçamento vale até " + val + ". Quer que eu já reserve o material para você?" }
    ];
  }
  function quoteById(id) {
    if (CUR && CUR.id === id) return CUR;
    return (LIST || []).filter(function (q) { return q.id === id; })[0] || null;
  }
  function openMessages(id) {
    var q = quoteById(id); if (!q) return;
    var wa = waNumber(q.cliente.tel);
    var h = '<div class="modal-back" data-modal><div class="modal" role="dialog" aria-modal="true" aria-label="Enviar ao cliente"><div class="modal-head"><h2>Enviar para ' + esc(firstName(q.cliente.nome) || "o cliente") + "</h2>" +
      '<button class="icon-btn" data-act="closeModal" aria-label="Fechar">' + ico("x") + "</button></div>" +
      (wa ? "" : '<div class="alert">' + ico("info") + "<div>Cadastre o WhatsApp do cliente no orçamento para abrir a conversa direto. Você ainda pode copiar as mensagens.</div></div>");
    messages(q).forEach(function (m) {
      h += '<div class="msg' + (m.tip ? " tip" : "") + '"><div class="msg-head"><span class="step">' + esc(m.step) + '</span><span class="when">' + esc(m.when) + "</span></div>" +
        '<div class="msg-text">' + esc(m.text) + "</div>" +
        (m.tip === "pdf" ? '<div class="msg-actions"><button class="btn sm primary" data-act="print" data-id="' + q.id + '">' + ico("pdf") + "Baixar PDF</button></div>" :
          m.tip === "call" ? (wa ? '<div class="msg-actions"><a class="btn sm" href="tel:+' + wa + '">' + ico("phone") + "Ligar</a></div>" : "") :
          '<div class="msg-actions"><button class="btn sm" data-act="copyMsg">' + ico("copy") + "Copiar</button>" +
          (wa ? '<a class="btn sm gold" target="_blank" rel="noopener" href="https://wa.me/' + wa + "?text=" + encodeURIComponent(m.text) + '">' + ico("send") + "Abrir no WhatsApp</a>" : "") + "</div>") + "</div>";
    });
    h += "</div></div>";
    openModal(h);
  }
  function openModal(html) { closeModal(); document.body.insertAdjacentHTML("beforeend", html); document.body.style.overflow = "hidden"; }
  function closeModal() { $$("[data-modal]").forEach(function (m) { m.remove(); }); document.body.style.overflow = ""; }
  document.addEventListener("click", function (e) { if (e.target.matches && e.target.matches("[data-modal]")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  function copyText(t) {
    var ok = function () { toast("Mensagem copiada"); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, fallback); else fallback();
    function fallback() { var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch (e) { toast("Não foi possível copiar"); } ta.remove(); }
  }

  /* ================= Renomear ================= */
  function openRename(id) {
    var q = quoteById(id); if (!q) return;
    openModal('<div class="modal-back" data-modal><form class="modal" id="rename-form" role="dialog" aria-modal="true" aria-label="Renomear orçamento"><div class="modal-head"><h2>Renomear orçamento ' + esc(numLabel(q)) + "</h2>" +
      '<button type="button" class="icon-btn" data-act="closeModal" aria-label="Fechar">' + ico("x") + "</button></div>" +
      '<label class="field"><span>Nome do orçamento</span><input type="text" id="rename-input" maxlength="160" value="' + esc(titleOf(q)) + '" autocomplete="off"><small>Aparece na lista e no nome do arquivo PDF.</small></label>' +
      '<div class="add-row" style="margin-top:18px;justify-content:flex-end"><button type="button" class="btn ghost" data-act="closeModal">Cancelar</button><button type="submit" class="btn primary" id="rename-btn">' + ico("check") + "Salvar nome</button></div></form></div>");
    var inp = $("#rename-input"); setTimeout(function () { inp.focus(); inp.select(); }, 50);
    $("#rename-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = inp.value.trim(); if (!v) { inp.classList.add("invalid"); inp.focus(); return; }
      var btn = $("#rename-btn"); btn.disabled = true;
      api("PATCH", "quotes?id=" + encodeURIComponent(id), { titulo: v }).then(function (u) {
        applyUpdate(u); closeModal(); toast("Nome atualizado"); rerenderCurrent();
      }, function (err) { btn.disabled = false; toast(err.message); });
    });
  }
  function applyUpdate(u) {
    if (LIST) LIST.forEach(function (q, i) { if (q.id === u.id) LIST[i] = Object.assign(q, { titulo: u.titulo, status: u.status, motivo: u.motivo, updatedAt: u.updatedAt }); });
    if (CUR && CUR.id === u.id) Object.assign(CUR, { titulo: u.titulo, status: u.status, motivo: u.motivo, updatedAt: u.updatedAt });
  }
  function rerenderCurrent() {
    var y = window.scrollY;
    if (location.hash.indexOf("#/orcamento/") === 0 && CUR) renderDoc(CUR);
    else if (location.hash.indexOf("#/historico") === 0) renderHistorico();
    window.scrollTo(0, y);
  }

  /* ================= Lista de orçamentos ================= */
  var filt = { q: "", st: "" };
  function viewHistorico() {
    if (!LIST) loading("Carregando orçamentos…");
    else renderHistorico();
    fetchList().then(function () { if (location.hash.indexOf("#/historico") === 0) { var y = window.scrollY; renderHistorico(); window.scrollTo(0, y); } },
      function (e) { if (!LIST) failView(e, viewHistorico); else toast(e.message); });
  }
  function renderHistorico() {
    var list = (LIST || []).slice();
    var fech = list.filter(function (q) { return q.status === "fechou"; }), perd = list.filter(function (q) { return q.status === "perdeu"; }), ab = list.filter(function (q) { return q.status !== "fechou" && q.status !== "perdeu"; });
    var sum = function (arr) { return arr.reduce(function (s, q) { return s + calc(q).A.total; }, 0); };
    var taxa = fech.length + perd.length ? Math.round(fech.length / (fech.length + perd.length) * 100) : 0;
    var motivos = {}; perd.forEach(function (q) { if (q.motivo) motivos[q.motivo] = (motivos[q.motivo] || 0) + 1; });
    var topM = Object.keys(motivos).sort(function (a, b) { return motivos[b] - motivos[a]; })[0];
    var h = '<div class="page-head"><div><h1>Orçamentos</h1><p>Todos os orçamentos gerados pela equipe. Abra, edite, renomeie, baixe o PDF de novo e registre se fechou ou perdeu.</p></div>' +
      '<div class="head-actions"><button class="btn sm" data-act="csv"' + (list.length ? "" : " disabled") + ">" + ico("down") + 'Planilha (CSV)</button><a class="btn sm primary" href="#/novo">' + ico("plus") + "Novo orçamento</a></div></div>";
    h += '<div class="stats">' +
      '<div class="stat"><small>Enviados</small><strong>' + list.length + "</strong><span>" + money(sum(list)) + "</span></div>" +
      '<div class="stat"><small>Em aberto</small><strong>' + ab.length + "</strong><span>" + money(sum(ab)) + " para acompanhar</span></div>" +
      '<div class="stat"><small>Fechados</small><strong>' + fech.length + "</strong><span>" + money(sum(fech)) + " · " + taxa + "% de conversão</span></div>" +
      '<div class="stat"><small>Perdidos</small><strong>' + perd.length + "</strong><span>" + (topM ? "Principal motivo: " + esc(topM) : "Registre o motivo de cada perda") + "</span></div></div>";
    if (!list.length) {
      h += '<div class="empty"><strong>Nenhum orçamento gerado ainda</strong>Os orçamentos que a equipe gerar aparecem aqui, para editar e baixar de novo quando quiser.<div style="margin-top:14px"><a class="btn primary" href="#/novo">' + ico("plus") + "Gerar o primeiro</a></div></div>";
      app.innerHTML = h; return;
    }
    h += '<div class="toolbar"><input class="search" type="search" id="h-search" placeholder="Buscar orçamento, cliente ou número" value="' + esc(filt.q) + '" autocomplete="off">' +
      '<select id="h-status" aria-label="Filtrar por status"><option value="">Todos os status</option><option value="aberto"' + (filt.st === "aberto" ? " selected" : "") + '>Em aberto</option><option value="fechou"' + (filt.st === "fechou" ? " selected" : "") + '>Fechou</option><option value="perdeu"' + (filt.st === "perdeu" ? " selected" : "") + ">Perdeu</option></select></div>";
    h += '<div class="q-list" id="q-list"></div>';
    app.innerHTML = h;
    renderList();
    $("#h-search").addEventListener("input", function (e) { filt.q = e.target.value; renderList(); });
    $("#h-status").addEventListener("change", function (e) { filt.st = e.target.value; renderList(); });
  }
  function renderList() {
    var term = filt.q.trim().toLowerCase();
    var list = (LIST || []).filter(function (q) {
      if (filt.st && (q.status || "aberto") !== filt.st) return false;
      if (!term) return true;
      return [titleOf(q), q.cliente.nome, numLabel(q), q.arquiteto, q.vendedor.nome, q.ambientes.map(function (a) { return a.nome; }).join(" ")].join(" ").toLowerCase().indexOf(term) > -1;
    });
    var el = $("#q-list"); if (!el) return;
    if (!list.length) { el.innerHTML = '<div class="empty"><strong>Nada encontrado</strong>Tente outra busca ou outro status.</div>'; return; }
    el.innerHTML = list.map(function (q) {
      var st = q.status || "aberto", venc = addDays(q.data, q.validadeDias), vencido = st === "aberto" && venc < new Date(new Date().toDateString());
      return '<div class="q-card" data-id="' + q.id + '"><div class="q-main"><div class="q-title"><span class="q-num">' + esc(numLabel(q)) + '</span><a class="q-name" href="#/orcamento/' + q.id + '">' + esc(titleOf(q)) + '</a><span class="pill ' + st + '">' + statusLabel(st) + "</span></div>" +
        '<div class="q-meta">' + esc(q.cliente.nome || "Sem cliente") + " · " + fmtDate(q.data) + (q.vendedor.nome ? " · " + esc(q.vendedor.nome) : "") +
        (st === "aberto" ? " · " + (vencido ? '<b style="color:#b0412e">validade vencida</b>' : "vale até " + fmtDate(venc)) : "") + (st === "perdeu" && q.motivo ? " · motivo: " + esc(q.motivo) : "") +
        (q.updatedAt && q.createdAt && q.updatedAt - q.createdAt > 60000 ? " · editado em " + fmtDate(new Date(q.updatedAt)) : "") + "</div></div>" +
        '<div class="q-total">' + totalLabel(q) + "</div>" +
        '<div class="q-actions"><select data-st="' + q.id + '" aria-label="Status"><option value="aberto"' + (st === "aberto" ? " selected" : "") + '>Em aberto</option><option value="fechou"' + (st === "fechou" ? " selected" : "") + '>Fechou</option><option value="perdeu"' + (st === "perdeu" ? " selected" : "") + ">Perdeu</option></select>" +
        (st === "perdeu" ? '<select data-mot="' + q.id + '" aria-label="Motivo da perda"><option value="">Motivo da perda…</option>' + MOTIVOS.map(function (m) { return "<option" + (q.motivo === m ? " selected" : "") + ">" + m + "</option>"; }).join("") + "</select>" : "") +
        '<span class="grow"></span>' +
        '<a class="btn sm" href="#/orcamento/' + q.id + '">' + ico("eye") + "Abrir</a>" +
        '<a class="btn sm" href="#/editar/' + q.id + '">' + ico("edit") + '<span class="hide-xs">Editar</span></a>' +
        '<button class="btn sm" data-act="print" data-id="' + q.id + '">' + ico("pdf") + '<span class="hide-xs">PDF</span></button>' +
        '<button class="icon-btn" data-act="rename" data-id="' + q.id + '" title="Renomear" aria-label="Renomear">' + ico("tag") + "</button>" +
        '<button class="icon-btn" data-act="dup" data-id="' + q.id + '" title="Duplicar" aria-label="Duplicar">' + ico("copy") + "</button>" +
        '<button class="icon-btn danger" data-act="del" data-id="' + q.id + '" title="Excluir" aria-label="Excluir">' + ico("trash") + "</button></div></div>";
    }).join("");
  }
  app.addEventListener("change", function (e) {
    var el = e.target, id = el.dataset && (el.dataset.st || el.dataset.mot);
    if (!id) return;
    var body = el.dataset.st ? { status: el.value } : { motivo: el.value };
    el.disabled = true;
    api("PATCH", "quotes?id=" + encodeURIComponent(id), body).then(function (u) {
      applyUpdate(u); renderListKeep();
      if (el.dataset.st && el.value === "perdeu") { toast("Registre o motivo da perda"); var s2 = $('[data-mot="' + id + '"]'); if (s2) s2.focus(); }
      else toast("Status atualizado");
    }, function (err) { el.disabled = false; toast(err.message); renderListKeep(); });
  });
  function renderListKeep() { var y = window.scrollY; renderHistorico(); window.scrollTo(0, y); }
  function duplicate(id) {
    withFull(id, function (q) {
      var cur = read(K.draft, null);
      if (cur && isDirty(cur) && !confirm("Você tem um orçamento em andamento que ainda não foi salvo. Descartar e criar a cópia?")) return;
      var c = clone(q); c.id = uid(); c.numero = null; c.data = todayISO(); c.status = "aberto"; c.motivo = ""; c.titulo = c.titulo ? c.titulo + " (cópia)" : "";
      delete c.nImagens; delete c.createdAt; delete c.updatedAt;
      migrate(c); Q = c; saveDraft(true); location.hash = "#/novo"; toast("Cópia criada. Ajuste e gere o novo orçamento.");
    });
  }
  function delQuote(id) {
    var q = quoteById(id); if (!q) return;
    if (!confirm("Excluir o orçamento " + numLabel(q) + " (" + titleOf(q) + ")? Ele some para toda a equipe e não pode ser recuperado.")) return;
    api("DELETE", "quotes?id=" + encodeURIComponent(id)).then(function () {
      if (LIST) LIST = LIST.filter(function (x) { return x.id !== id; });
      if (CUR && CUR.id === id) CUR = null;
      toast("Orçamento excluído");
      if (location.hash.indexOf("orcamento") > -1) location.hash = "#/historico"; else renderListKeep();
    }, function (err) { toast(err.message); });
  }
  function download(name, content, type) {
    var blob = new Blob([content], { type: type }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportCSV() {
    var rows = [["Número", "Nome do orçamento", "Data", "Cliente", "WhatsApp", "Arquiteto(a)", "Ambientes", "Vendedor", "Total opção 1", "Total opção 2", "Status", "Motivo da perda", "Validade"]];
    (LIST || []).forEach(function (q) {
      var c = calc(q);
      rows.push([numLabel(q), titleOf(q), fmtDate(q.data), q.cliente.nome, q.cliente.tel, q.arquiteto, q.ambientes.map(function (a) { return a.nome; }).join(", "), q.vendedor.nome,
        num(c.A.total, 2), q.comparar ? num(c.B.total, 2) : "", statusLabel(q.status), q.motivo || "", fmtDate(addDays(q.data, q.validadeDias))]);
    });
    var csv = rows.map(function (r) { return r.map(function (v) { v = String(v == null ? "" : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(";"); }).join("\r\n");
    download("orcamentos-granmarmore-" + todayISO() + ".csv", "﻿" + csv, "text/csv;charset=utf-8");
  }

  /* ================= Ajustes ================= */
  function viewConfig() {
    var e = S.empresa;
    var cf = function (label, k, v, o) { o = o || {}; return '<label class="field' + (o.cls ? " " + o.cls : "") + '"><span>' + label + '</span><input type="' + (o.type || "text") + '" data-s="' + k + '" value="' + esc(v) + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : "") + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + ' autocomplete="off">' + (o.hint ? "<small>" + o.hint + "</small>" : "") + "</label>"; };
    var h = '<div class="page-head"><div><h1>Ajustes</h1><p>Dados que aparecem em todos os orçamentos e os textos padrão. Valem para toda a equipe.</p></div><div class="head-actions"><button class="btn primary" data-act="saveCfg" id="btn-cfg">' + ico("check") + "Salvar ajustes</button></div></div>";
    h += sec("A", "Dados da marmoraria", "Aparecem no rodapé de todo orçamento.",
      '<div class="grid g3">' + cf("Nome", "empresa.nome", e.nome) + cf("CNPJ", "empresa.cnpj", e.cnpj) + cf("WhatsApp", "empresa.whatsapp", e.whatsapp, { type: "tel", mode: "tel" }) +
      cf("Instagram", "empresa.instagram", e.instagram) + cf("E-mail", "empresa.email", e.email, { type: "email", ph: "contato@..." }) + cf("Cidade", "empresa.cidade", e.cidade, { ph: "Ex.: Divinópolis/MG" }) +
      cf("Endereço", "empresa.endereco", e.endereco, { cls: "span3", ph: "Rua, número, bairro" }) + "</div>");
    var vh = '<div class="row-list">';
    S.vendedores.forEach(function (v, i) {
      vh += '<div class="srv" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto"><input type="text" data-s="vendedores.' + i + '.nome" value="' + esc(v.nome) + '" placeholder="Nome" aria-label="Nome do vendedor"><input type="tel" inputmode="tel" data-s="vendedores.' + i + '.tel" value="' + esc(v.tel) + '" placeholder="WhatsApp" aria-label="WhatsApp do vendedor"><button class="icon-btn danger" data-act="delVend" data-i="' + i + '" aria-label="Remover vendedor">' + ico("trash") + "</button></div>";
    });
    if (!S.vendedores.length) vh += '<div class="subnote">Nenhum vendedor cadastrado. Quem gerar um orçamento é adicionado aqui automaticamente.</div>';
    vh += '</div><button class="btn sm" style="margin-top:12px" data-act="addVend">' + ico("plus") + "Adicionar vendedor</button>";
    h += sec("B", "Vendedores", "O primeiro da lista vem preenchido em cada orçamento novo.", vh);
    h += sec("C", "Padrões dos orçamentos", "Valores que já vêm preenchidos.",
      '<div class="grid g3">' + cf("Próximo número", "proximoNumero", S.proximoNumero, { mode: "numeric", hint: "Número do próximo orçamento gerado" }) +
      cf("Validade (dias)", "validadeDias", S.validadeDias, { mode: "numeric" }) + cf("Prazo de produção", "prazoProducao", S.prazoProducao) +
      '<label class="field span3"><span>Forma de pagamento padrão</span><input type="text" data-s="pagamento" value="' + esc(S.pagamento) + '"></label></div>' +
      '<div class="two-col" style="margin-top:16px"><label class="field"><span>Incluso (um por linha)</span><textarea data-s="inclusos" rows="5">' + esc(S.inclusos.join("\n")) + '</textarea></label><label class="field"><span>Não incluso (um por linha)</span><textarea data-s="naoInclusos" rows="5">' + esc(S.naoInclusos.join("\n")) + "</textarea></label></div>" +
      '<label class="field" style="margin-top:16px"><span>Condições gerais (uma por linha)</span><textarea data-s="termos" rows="7">' + esc(S.termos.join("\n")) + "</textarea></label>");
    h += sec("D", "Dados e acesso", "Os orçamentos ficam no banco de dados, disponíveis em qualquer aparelho com a senha da equipe.",
      '<div class="add-row"><button class="btn" data-act="export">' + ico("down") + 'Exportar cópia de segurança (JSON)</button><span class="grow" style="flex:1"></span><button class="btn danger" data-act="logout">' + ico("back") + "Sair deste aparelho</button></div>");
    app.innerHTML = h;
  }
  function collectConfig() {
    $$("[data-s]").forEach(function (el) {
      var k = el.dataset.s, v = el.value;
      if (k === "inclusos" || k === "naoInclusos" || k === "termos") v = v.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
      if (k === "proximoNumero" || k === "validadeDias") v = Math.max(1, parseInt(v, 10) || 1);
      setPath(S, k, v);
    });
  }
  function saveConfig() {
    collectConfig();
    S.vendedores = S.vendedores.filter(function (v) { return String(v.nome || "").trim(); });
    var b = $("#btn-cfg"); if (b) b.disabled = true;
    saveSettings().then(function () { toast("Ajustes salvos para toda a equipe"); viewConfig(); }, function (err) { if (b) b.disabled = false; toast(err.message); });
  }
  function exportJSON() {
    toast("Preparando cópia…");
    api("GET", "quotes?full=1").then(function (all) {
      download("backup-orcamentos-granmarmore-" + todayISO() + ".json", JSON.stringify({ app: "granmarmore-orcamentos", v: 2, settings: S, quotes: all }, null, 1), "application/json");
    }, function (err) { toast(err.message); });
  }

  /* ================= Início ================= */
  window.addEventListener("beforeunload", function () { if (Q && document.querySelector(".actionbar")) saveDraft(true); });
  function boot() {
    topbarH();
    if (!TOKEN) return viewLogin();
    loading("Conectando…");
    api("GET", "settings").then(function (d) { S = mergeSettings(d); route(); }, function (e) {
      if (!TOKEN) return; // já foi para o login
      failView(e, boot);
    });
  }
  boot();
})();
