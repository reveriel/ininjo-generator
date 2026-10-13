/* =========================================================
   委任状ジェネレーター — script.js
   純粋なフロントエンドのみ。外部通信は行いません。
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     ユーティリティ
     --------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function todayISO() {
    return dateToISO(new Date());
  }

  function dateToISO(d) {
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }

  // "2026-10-13" に n 日を足した ISO 文字列を返す
  function addDays(iso, n) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setDate(d.getDate() + Number(n));
    return dateToISO(d);
  }

  /* 元号（ISO 文字列は辞書順比較で日付比較になる） */
  var ERAS = [
    { name: '令和', start: '2019-05-01', base: 2018 },
    { name: '平成', start: '1989-01-08', base: 1988 },
    { name: '昭和', start: '1926-12-25', base: 1925 }
  ];

  // "2026-10-13" → "令和8年10月13日" / "2026年10月13日"
  function formatDate(iso, style) {
    if (!iso) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
    if (!m) return String(iso);
    var y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);

    if (style === 'era') {
      for (var i = 0; i < ERAS.length; i++) {
        if (iso >= ERAS[i].start) {
          var ey = y - ERAS[i].base;
          return ERAS[i].name + (ey === 1 ? '元' : ey) + '年' + mo + '月' + d + '日';
        }
      }
    }
    return y + '年' + mo + '月' + d + '日';
  }

  /* ---------------------------------------------------------
     委任事項の文例
     --------------------------------------------------------- */

  var MATTERS_PRESETS = {
    bank:       '銀行窓口における各種手続き（入出金、振込、口座開設・解約、住所変更、諸届の提出など）一切',
    contract:   '各種契約の締結・変更・解除およびこれに付随する一切の手続き',
    admin:      '行政機関に対する各種申請・届出・証明書の請求および受領に関する一切の手続き',
    inkan:      '印鑑登録の申請および印鑑登録証明書の交付請求に関する一切の手続き',
    realestate: '不動産の登記申請（所有権移転登記・抵当権設定登記など）およびこれに付随する一切の手続き',
    mail:       '郵便物・宅配便その他の荷物の受領および転送に関する一切の手続き'
  };

  /* ---------------------------------------------------------
     サンプルデータ
     --------------------------------------------------------- */

  var DEFAULTS = {
    principalName:    '山田 太郎',
    principalAddress: '〒530-0001 大阪府大阪市北区梅田1-2-3 サンプルマンション101',
    principalContact: '090-1234-5678',
    agentName:        '鈴木 花子',
    agentAddress:     '〒530-0002 大阪府大阪市北区梅田4-5-6 サンプルビル5F',
    agentContact:     '080-9876-5432',
    mattersPreset:    'bank',
    matters:          MATTERS_PRESETS.bank,
    periodType:       'range',
    eraStyle:         'era',
    recipient:        'サンプル銀行 本店営業部',
    recipientHonorific: '御中'
  };

  /* ---------------------------------------------------------
     多言語（UI のみ。生成される委任状は常に日本語）
     --------------------------------------------------------- */

  var I18N = {
    brandName:  { ja: '委任状ジェネレーター', zh: '委任状生成器' },
    tagline:    { ja: '無料・登録不要・ブラウザ内で完結', zh: '免费・无需注册・浏览器内完成' },
    btnPrint:   { ja: '印刷 / PDF保存', zh: '打印 / 保存 PDF' },
    btnReset:   { ja: 'リセット', zh: '清空重填' },

    formTitle:  { ja: '委任状の内容を入力', zh: '填写委任状内容' },
    formHint:   { ja: '入力すると右のプレビューにすぐ反映されます。最初からサンプルデータが入っています。',
                  zh: '输入后右侧预览会立即更新。初始已填入示例数据。' },

    legendPrincipal:    { ja: '委任者（委任する人）の情報', zh: '委任者（委托方）信息' },
    legendAgent:        { ja: '受任者（委任される人）の情報', zh: '受任者（受托方）信息' },
    legendMatters:      { ja: '委任事項', zh: '委任事项' },
    legendPeriod:       { ja: '委任期間', zh: '委任期间' },
    legendDoc:          { ja: '書類の情報', zh: '文件信息' },

    req:                { ja: '必須', zh: '必填' },
    lblPrincipalName:   { ja: '氏名', zh: '姓名' },
    lblPrincipalAddress:{ ja: '住所', zh: '地址' },
    lblAgentName:       { ja: '氏名', zh: '姓名' },
    lblAgentAddress:    { ja: '住所', zh: '地址' },
    lblContact:         { ja: '連絡先（電話番号など・任意）', zh: '联系方式（电话等・选填）' },

    phPrincipalName:    { ja: '例：山田 太郎', zh: '例：山田 太郎' },
    phPrincipalAddress: { ja: '例：〒530-0001 大阪府大阪市北区梅田1-2-3 サンプルマンション101', zh: '例：〒530-0001 大阪府大阪市北区梅田1-2-3 サンプルマンション101' },
    phAgentName:        { ja: '例：鈴木 花子', zh: '例：鈴木 花子' },
    phAgentAddress:     { ja: '例：〒530-0002 大阪府大阪市北区梅田4-5-6 サンプルビル5F', zh: '例：〒530-0002 大阪府大阪市北区梅田4-5-6 サンプルビル5F' },
    phContact:          { ja: '例：090-1234-5678', zh: '例：090-1234-5678' },

    lblMattersPreset:   { ja: 'よくある委任事項（文例）', zh: '常见委任事项（文例）' },
    optMattersChoose:   { ja: '—— 選択してください（または自由に入力）——', zh: '—— 请选择（或自由输入）——' },
    presetBank:         { ja: '銀行窓口の各種手続き', zh: '银行窗口的各种手续' },
    presetContract:     { ja: '契約の締結・解除', zh: '合同的签订・解除' },
    presetAdmin:        { ja: '行政機関への申請・届出', zh: '向行政机关申请・申报' },
    presetInkan:        { ja: '印鑑登録に関する手続き', zh: '印章登记相关手续' },
    presetRealestate:   { ja: '不動産の登記に関する手続き', zh: '不动产登记相关手续' },
    presetMail:         { ja: '郵便物の受領・転送', zh: '邮件的领取・转送' },
    helpMattersPreset:  { ja: '選ぶと下の欄に文例が入ります。そのまま使うことも、書き換えることもできます。',
                          zh: '选择后会在下方填入文例，可直接使用，也可自行修改。' },
    lblMatters:         { ja: '委任する事項', zh: '委任的事项' },
    phMatters:          { ja: '例：銀行窓口における各種手続き（入出金、振込、口座開設・解約、住所変更など）一切',
                          zh: '例：銀行窓口における各種手続き（入出金、振込、口座開設・解約、住所変更など）一切' },

    optPeriodRange:     { ja: '期間を指定する', zh: '指定期间' },
    optPeriodNone:      { ja: '期間の定めなし', zh: '不设期限' },
    lblPeriodFrom:      { ja: '開始日', zh: '开始日期' },
    lblPeriodTo:        { ja: '終了日', zh: '结束日期' },
    helpPeriod:         { ja: '終了日を空にすると「開始日から」とだけ表示されます。',
                          zh: '结束日期留空时，只显示「自开始日期起」。' },

    lblIssueDate:       { ja: '作成日', zh: '作成日期' },
    lblEraStyle:        { ja: '日付の表示', zh: '日期显示方式' },
    optEraJa:           { ja: '元号（令和）', zh: '年号（令和）' },
    optEraWest:         { ja: '西暦', zh: '公历' },
    lblRecipient:       { ja: '提出先（宛名・任意）', zh: '提交对象（抬头・选填）' },
    phRecipient:        { ja: '例：サンプル銀行 本店営業部', zh: '例：サンプル銀行 本店営業部' },
    lblHonorific:       { ja: '宛名の敬称', zh: '抬头敬称' },

    privacy:            { ja: '入力した内容はサーバーに送信されません。すべてお使いのブラウザ内だけで処理されます。',
                          zh: '输入内容不会发送到服务器，全部只在你的浏览器内处理。' },

    previewBar:         { ja: 'プレビュー（A4）', zh: '预览（A4）' },
    shareTitle:         { ja: 'このツールをシェアする', zh: '分享这个工具' },
    shareX:             { ja: 'X で共有', zh: '分享到 X' },
    shareLine:          { ja: 'LINE で共有', zh: '分享到 LINE' },
    shareCopy:          { ja: 'リンクをコピー', zh: '复制链接' },
    shareSave:          { ja: '画像を保存', zh: '保存图片' },

    // プレビュー内のプレースホルダ（画面のみ・印刷時は非表示）
    phPvName:           { ja: '氏名を入力', zh: '请输入姓名' },
    phPvDate:           { ja: '未入力', zh: '未输入' },
    phPvMatters:        { ja: '委任する事項を入力', zh: '请输入委任事项' },
    phPvPeriod:         { ja: '日付を入力', zh: '请输入日期' }
  };

  var lang = 'ja';

  function t(key) {
    var entry = I18N[key];
    if (!entry) return '';
    return entry[lang] || entry.ja || '';
  }

  function applyI18n(next) {
    lang = next;
    document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'ja';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = I18N[el.getAttribute('data-i18n')];
      if (entry && entry[lang]) el.textContent = entry[lang];
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var entry = I18N[el.getAttribute('data-i18n-ph')];
      if (entry && entry[lang]) el.setAttribute('placeholder', entry[lang]);
    });

    var langBtn = $('langBtn');
    if (langBtn) langBtn.textContent = (lang === 'zh') ? '日本語' : '中文';
  }

  /* ---------------------------------------------------------
     プレビューの描画
     --------------------------------------------------------- */

  function placeholder(text) {
    return '<span class="ph">' + escapeHtml(text) + '</span>';
  }

  function setLine(lineId, valueId, text) {
    var line = $(lineId);
    var value = $(valueId);
    if (value) value.textContent = text;
    if (line) line.hidden = !String(text || '').trim();
  }

  function currentEraStyle() {
    var sel = $('eraStyle');
    return sel && sel.value === 'west' ? 'west' : 'era';
  }

  function currentPeriodType() {
    var radios = document.querySelectorAll('input[name="periodType"]');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return 'range';
  }

  function buildPeriodText() {
    if (currentPeriodType() === 'none') return '期間の定めなし';

    var style = currentEraStyle();
    var from = formatDate($('periodFrom').value, style);
    var to = formatDate($('periodTo').value, style);

    if (from && to) return from + 'から' + to + 'まで';
    if (from) return from + 'から';
    if (to) return to + 'まで';
    return '';
  }

  function renderPreview() {
    var style = currentEraStyle();

    /* --- 日付（上部・署名欄） --- */
    var dateISO = $('issueDate').value;
    var dateHtml = dateISO ? escapeHtml(formatDate(dateISO, style)) : placeholder(t('phPvDate'));
    $('pvDate').innerHTML = dateHtml;
    $('pvSignDate').innerHTML = dateHtml;

    /* --- 提出先（宛名） --- */
    var recipient = $('recipient').value.trim();
    $('pvRecipientLine').hidden = !recipient;
    $('pvRecipient').innerHTML = recipient ? escapeHtml(recipient) : '';
    $('pvRecipientHonorific').textContent = recipient ? $('recipientHonorific').value : '';

    /* --- 委任事項 --- */
    var matters = $('matters').value.trim();
    $('pvMatters').innerHTML = matters ? escapeHtml(matters) : placeholder(t('phPvMatters'));

    /* --- 委任期間 --- */
    var period = buildPeriodText();
    $('pvPeriod').innerHTML = period ? escapeHtml(period) : placeholder(t('phPvPeriod'));

    /* --- 受任者 --- */
    setLine('pvAgentAddressLine', 'pvAgentAddress', $('agentAddress').value.trim());
    var agentName = $('agentName').value.trim();
    $('pvAgentName').innerHTML = agentName ? escapeHtml(agentName) : placeholder(t('phPvName'));
    setLine('pvAgentContactLine', 'pvAgentContact', $('agentContact').value.trim());

    /* --- 委任者（署名欄） --- */
    setLine('pvPrincipalAddressLine', 'pvPrincipalAddress', $('principalAddress').value.trim());
    var principalName = $('principalName').value.trim();
    $('pvPrincipalName').innerHTML = principalName ? escapeHtml(principalName) : placeholder(t('phPvName'));
    setLine('pvPrincipalContactLine', 'pvPrincipalContact', $('principalContact').value.trim());
  }

  /* ---------------------------------------------------------
     フォーム操作
     --------------------------------------------------------- */

  function syncPeriodFields() {
    var isRange = currentPeriodType() === 'range';
    $('periodFields').hidden = !isRange;
  }

  function applyFieldDefaults() {
    $('principalName').value = DEFAULTS.principalName;
    $('principalAddress').value = DEFAULTS.principalAddress;
    $('principalContact').value = DEFAULTS.principalContact;
    $('agentName').value = DEFAULTS.agentName;
    $('agentAddress').value = DEFAULTS.agentAddress;
    $('agentContact').value = DEFAULTS.agentContact;
    $('mattersPreset').value = DEFAULTS.mattersPreset;
    $('matters').value = DEFAULTS.matters;
    $('eraStyle').value = DEFAULTS.eraStyle;
    $('recipient').value = DEFAULTS.recipient;
    $('recipientHonorific').value = DEFAULTS.recipientHonorific;

    var radios = document.querySelectorAll('input[name="periodType"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = (radios[i].value === DEFAULTS.periodType);
    }

    var today = todayISO();
    $('issueDate').value = today;
    $('periodFrom').value = today;
    $('periodTo').value = addDays(today, 30);
    syncPeriodFields();
  }

  function resetForm() {
    applyFieldDefaults();
    renderPreview();
  }

  /* ---------------------------------------------------------
     初期化
     --------------------------------------------------------- */

  function init() {
    applyFieldDefaults();
    applyI18n(lang);

    $('delegationForm').addEventListener('input', function (event) {
      if (event.target.id === 'mattersPreset') return; // change 側で処理
      renderPreview();
    });

    $('delegationForm').addEventListener('change', function (event) {
      var target = event.target;

      if (target.id === 'mattersPreset') {
        var preset = MATTERS_PRESETS[target.value];
        if (preset) $('matters').value = preset;
      } else if (target.name === 'periodType') {
        syncPeriodFields();
      }
      renderPreview();
    });

    $('printBtn').addEventListener('click', function () { window.print(); });
    $('resetBtn').addEventListener('click', resetForm);

    $('langBtn').addEventListener('click', function () {
      applyI18n(lang === 'ja' ? 'zh' : 'ja');
      renderPreview();
    });

    renderPreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =========================================================
   シェア（バイラル導線） — 既存機能には触れない独立モジュール
   ========================================================= */
(function () {
  'use strict';

  var SHARE_URL  = "https://www.reveriel.com/ininjo-generator/";
  var CARD_TITLE = "委任状ジェネレーター";
  var CARD_SUB   = "無料で使える委任状PDF作成ツール";
  var CARD_FOOT  = "www.reveriel.com/ininjo-generator";
  var FILE_NAME  = "ininjo-generator.png";

  var SHARE_TEXT = "無料で使える委任状（委任状・委任書）PDF作成ツール";

  function byId(id) { return document.getElementById(id); }

  function openExternal(url) {
    if (!url) return;
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function buildTweetUrl() {
    return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(SHARE_TEXT) +
      '&url=' + encodeURIComponent(SHARE_URL);
  }
  function buildLineUrl() {
    return 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(SHARE_URL);
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copyText(text) {
    return new Promise(function (resolve) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(
            function () { resolve(true); },
            function () { resolve(fallbackCopy(text)); }
          );
          return;
        }
      } catch (e) { /* fallthrough */ }
      resolve(fallbackCopy(text));
    });
  }

  /* ---- 共有カード（1200 x 630） ---- */
  var CARD_W = 1200, CARD_H = 630;
  var FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif';

  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCard(ctx) {
    var g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    g.addColorStop(0, '#1e3a8a');
    g.addColorStop(1, '#2f5bd0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.fillStyle = 'rgba(255,255,255,.07)';
    ctx.beginPath(); ctx.arc(CARD_W - 130, 80, 230, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(CARD_W - 300, CARD_H + 10, 160, 0, Math.PI * 2); ctx.fill();

    var PAD = 80;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.font = '600 24px ' + FONT;
    ctx.fillText('FREE TOOL — BROWSER ONLY', PAD, 106);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 74px ' + FONT;
    ctx.fillText(CARD_TITLE, PAD, 260);

    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = '500 34px ' + FONT;
    ctx.fillText(CARD_SUB, PAD, 336);

    ctx.fillStyle = 'rgba(255,255,255,.85)';
    roundRect(ctx, PAD, CARD_H - 138, 64, 6, 3);
    ctx.fill();

    ctx.fillStyle = '#dbe6ff';
    ctx.font = '700 30px ' + FONT;
    ctx.fillText(CARD_FOOT, PAD, CARD_H - 80);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.font = '500 22px ' + FONT;
    ctx.fillText('無料・登録不要', CARD_W - PAD, CARD_H - 80);
    ctx.textAlign = 'left';
  }

  function renderCardBlob() {
    return new Promise(function (resolve) {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = CARD_W;
        canvas.height = CARD_H;
        var ctx = canvas.getContext('2d');
        var finish = function () {
          if (canvas.toBlob) canvas.toBlob(function (b) { resolve(b); }, 'image/png');
          else resolve(null);
        };
        var draw = function () {
          try { drawCard(ctx); } catch (e) {}
          finish();
        };
        if (document.fonts && document.fonts.ready) {
          var drawn = false;
          var once = function () { if (drawn) { return; } drawn = true; draw(); };
          document.fonts.ready.then(once).catch(once);
          // fonts.ready が解決しない環境でも保存ボタンが固まらないようタイムアウト競走させる
          setTimeout(once, 1500);
        } else {
          draw();
        }
      } catch (e) { resolve(null); }
    });
  }

  function flash(el, text) {
    if (!el) return;
    var old = el.textContent;
    el.textContent = text;
    setTimeout(function () { el.textContent = old; }, 1800);
  }

  function init() {
    var xBtn = byId('shareXBtn');
    var lBtn = byId('shareLineBtn');
    var cBtn = byId('shareCopyBtn');
    var sBtn = byId('shareSaveBtn');
    var urlText = byId('shareUrlText');
    if (!xBtn || !lBtn || !cBtn) return;

    if (urlText) urlText.textContent = SHARE_URL;

    xBtn.addEventListener('click', function () { openExternal(buildTweetUrl()); });
    lBtn.addEventListener('click', function () { openExternal(buildLineUrl()); });

    var copyLabel = byId('shareCopyLabel');
    var resetTimer = null;
    cBtn.addEventListener('click', function () {
      var original = copyLabel ? copyLabel.textContent : '';
      copyText(SHARE_URL).then(function (ok) {
        if (!copyLabel) return;
        copyLabel.textContent = ok ? 'コピーしました' : 'コピーできませんでした';
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(function () { copyLabel.textContent = original; }, 1800);
      });
    });

    if (sBtn) {
      var saveLabel = byId('shareSaveLabel');
      sBtn.addEventListener('click', function () {
        if (sBtn.disabled) return;
        sBtn.disabled = true;
        renderCardBlob().then(function (blob) {
          sBtn.disabled = false;
          if (!blob) { flash(saveLabel, '画像を生成できませんでした'); return; }
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = FILE_NAME;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
