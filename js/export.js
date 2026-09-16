/* ------------------------------------------------------------------
   Export: the week as a picture for the fridge or the family group.

   Drawn straight onto a canvas rather than with a screenshot library,
   so there is nothing to install and it works offline. The output is
   portrait and phone-shaped, because it is going into WhatsApp.
   ------------------------------------------------------------------ */

var Exporter = (function () {
  'use strict';

  var W = 1080;
  var PAD = 56;
  var HEADER_H = 210;
  var DAY_HEAD_H = 64;
  var ROW_H = 92;
  var ROW_GAP = 9;
  var DAY_GAP = 24;
  var FOOTER_H = 92;

  var MEAL_LABEL = { breakfast: 'BREAKFAST', lunch: 'LUNCH', dinner: 'DINNER' };

  var LIGHT = {
    bg: '#fdf8f0', surface: '#ffffff', border: '#e8ded0',
    text: '#2a2320', soft: '#7a6d60',
    leaf: '#2f6b3f', turmeric: '#b9781a', terracotta: '#c2542e'
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* Cuts text to fit, with an ellipsis. Long side-lists are common, so
     this is load-bearing rather than defensive. */
  function fit(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) { return text; }
    var t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
      t = t.slice(0, -1);
    }
    return t + '…';
  }

  function mealColor(meal, c) {
    if (meal === 'breakfast') { return c.turmeric; }
    if (meal === 'lunch') { return c.leaf; }
    return c.terracotta;
  }

  function weekOfLabel(date) {
    var d = date || new Date();
    var monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    var opts = { day: 'numeric', month: 'short' };
    return monday.toLocaleDateString('en-GB', opts) + ' – ' +
           sunday.toLocaleDateString('en-GB', opts);
  }

  /* Draws the week onto `canvas` and returns it. */
  function render(canvas, week, opts) {
    opts = opts || {};
    var c = LIGHT;
    var height = HEADER_H + DAY_GAP +
                 week.length * (DAY_HEAD_H + 3 * ROW_H + 2 * ROW_GAP + DAY_GAP) +
                 FOOTER_H;

    var dpr = 1;
    canvas.width = W * dpr;
    canvas.height = height * dpr;

    var ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';

    /* background */
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, height);

    /* header */
    ctx.fillStyle = c.leaf;
    ctx.fillRect(0, 0, W, HEADER_H);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 46px system-ui, "Noto Sans Tamil", sans-serif';
    ctx.fillText('இன்று என்ன சமையல்?', PAD, 86);

    ctx.font = '400 28px system-ui, sans-serif';
    ctx.globalAlpha = .85;
    ctx.fillText("This week's menu", PAD, 130);

    ctx.font = '600 26px system-ui, sans-serif';
    ctx.globalAlpha = .7;
    ctx.fillText(weekOfLabel(opts.date), PAD, 172);
    ctx.globalAlpha = 1;

    var y = HEADER_H + DAY_GAP;
    var innerW = W - PAD * 2;

    week.forEach(function (row) {
      var isWeekend = row.day === 'Sat' || row.day === 'Sun';

      /* day heading */
      ctx.fillStyle = isWeekend ? c.terracotta : c.soft;
      ctx.font = '700 26px system-ui, sans-serif';
      ctx.fillText((DAY_FULL[row.day] || row.day).toUpperCase(), PAD, y + 38);

      /* hairline to the right of the day name */
      var nameW = ctx.measureText((DAY_FULL[row.day] || row.day).toUpperCase()).width;
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PAD + nameW + 18, y + 30);
      ctx.lineTo(W - PAD, y + 30);
      ctx.stroke();

      y += DAY_HEAD_H;

      MEAL_ORDER.forEach(function (meal, mi) {
        var slot = row[meal];
        var top = y + mi * (ROW_H + ROW_GAP);

        ctx.fillStyle = c.surface;
        roundRect(ctx, PAD, top, innerW, ROW_H, 16);
        ctx.fill();
        ctx.strokeStyle = c.border;
        ctx.lineWidth = 2;
        ctx.stroke();

        /* colour bar down the left edge */
        ctx.fillStyle = mealColor(meal, c);
        roundRect(ctx, PAD, top, 8, ROW_H, 4);
        ctx.fill();

        ctx.fillStyle = c.soft;
        ctx.font = '700 20px system-ui, sans-serif';
        ctx.fillText(MEAL_LABEL[meal], PAD + 30, top + 40);

        if (!slot) { return; }

        var textX = PAD + 220;
        var textW = innerW - 220 - 40;

        ctx.fillStyle = c.text;
        ctx.font = '700 34px system-ui, sans-serif';
        ctx.fillText(fit(ctx, slot.dish, textW), textX, top + 42);

        if (slot.sides && slot.sides.length) {
          ctx.fillStyle = c.soft;
          ctx.font = '400 25px system-ui, sans-serif';
          ctx.fillText(fit(ctx, slot.sides.join(' · '), textW), textX, top + 76);
        }

        /* non-veg is the one thing worth flagging at a glance */
        if (slot.badges && slot.badges.indexOf('nonveg') !== -1) {
          ctx.fillStyle = c.terracotta;
          ctx.font = '700 18px system-ui, sans-serif';
          ctx.fillText('NON-VEG', PAD + 30, top + 68);
        }
      });

      y += 3 * ROW_H + 2 * ROW_GAP + DAY_GAP;
    });

    ctx.fillStyle = c.soft;
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillText('இன்று என்ன சமையல்? · generated at home, not by a restaurant', PAD, y + 34);

    return canvas;
  }

  /* ---------------- text ---------------- */

  function asText(week) {
    var out = ["🍛 This week's menu", ''];

    week.forEach(function (row) {
      out.push(DAY_FULL[row.day] || row.day);
      MEAL_ORDER.forEach(function (meal) {
        var slot = row[meal];
        if (!slot) { return; }
        var line = '  ' + MEAL_LABEL[meal].charAt(0) + MEAL_LABEL[meal].slice(1).toLowerCase() +
                   ': ' + slot.dish;
        if (slot.sides && slot.sides.length) { line += ' — ' + slot.sides.join(', '); }
        out.push(line);
      });
      out.push('');
    });

    return out.join('\n').trim();
  }

  /* ---------------- sharing ---------------- */

  function toBlob(canvas) {
    return new Promise(function (resolve) {
      if (canvas.toBlob) { canvas.toBlob(resolve, 'image/png'); }
      else { resolve(null); }
    });
  }

  function download(canvas, filename) {
    return toBlob(canvas).then(function (blob) {
      if (!blob) { return false; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename || 'menu-week.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    });
  }

  /* Native share sheet where the browser has one — that is the path
     that actually puts this in a WhatsApp group from a phone. */
  function share(canvas, text) {
    return toBlob(canvas).then(function (blob) {
      if (!blob || !navigator.share) { return 'unsupported'; }

      var file = new File([blob], 'menu-week.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: "This week's menu" })
          .then(function () { return 'shared'; })
          .catch(function (e) { return e && e.name === 'AbortError' ? 'cancelled' : 'failed'; });
      }

      return navigator.share({ title: "This week's menu", text: text })
        .then(function () { return 'shared'; })
        .catch(function (e) { return e && e.name === 'AbortError' ? 'cancelled' : 'failed'; });
    });
  }

  return {
    render: render,
    asText: asText,
    download: download,
    share: share
  };
})();
