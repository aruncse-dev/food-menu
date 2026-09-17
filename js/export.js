/* ------------------------------------------------------------------
   Export: the week as a picture for the fridge or the family group.

   Drawn straight onto a canvas rather than with a screenshot library,
   so there is nothing to install and it works offline. Portrait and
   phone-shaped, because it is going into a chat app.
   ------------------------------------------------------------------ */

var Exporter = (function () {
  'use strict';

  var W = 1080;
  var PAD = 52;
  var HEADER_H = 216;
  var DAY_HEAD_H = 68;
  var ROW_H = 100;
  var ROW_GAP = 10;
  var DAY_GAP = 26;
  var FOOTER_H = 96;

  var MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
  var MEAL_SHORT = { breakfast: 'B', lunch: 'L', dinner: 'D' };

  /* The exported image is always light: it gets printed, and it lands
     in chat threads on someone else's phone. */
  var C = {
    bg: '#fbf7f0', surface: '#ffffff', border: '#e7ddcd',
    ink: '#221d19', soft: '#6b6055', faint: '#9a8d7f',
    green: '#2e6b41', greenBg: '#e6f0e7', greenInk: '#1f4b2d',
    amber: '#b2741a', amberBg: '#fbefdb',
    rust: '#b84e2a', rustBg: '#fae6de'
  };

  var MEAL_COLOR = {
    breakfast: { fg: C.amber, bg: C.amberBg },
    lunch:     { fg: C.greenInk, bg: C.greenBg },
    dinner:    { fg: C.rust, bg: C.rustBg }
  };

  function font(weight, size) {
    return weight + ' ' + size + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* Cuts text to fit with an ellipsis. Long side-lists are the norm,
     so this is load-bearing rather than defensive. */
  function fit(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) { return text; }
    var t = text;
    while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) {
      t = t.slice(0, -1);
    }
    return t.replace(/[\s·]+$/, '') + '…';
  }

  function rangeLabel(monday) {
    var start = monday ? new Date(monday) : new Date();
    if (!monday) {
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    }
    var end = new Date(start);
    end.setDate(start.getDate() + 6);

    var opts = { day: 'numeric', month: 'short' };
    return start.toLocaleDateString('en-GB', opts) + ' – ' +
           end.toLocaleDateString('en-GB', opts);
  }

  function render(canvas, week, opts) {
    opts = opts || {};

    var height = HEADER_H + DAY_GAP +
                 week.length * (DAY_HEAD_H + 3 * ROW_H + 2 * ROW_GAP + DAY_GAP) +
                 FOOTER_H;

    canvas.width = W;
    canvas.height = height;

    var ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, height);

    /* ---- header ---- */
    ctx.fillStyle = C.green;
    ctx.fillRect(0, 0, W, HEADER_H);

    /* soft disc, matching the app's hero card */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, HEADER_H);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.arc(W - 90, -40, 230, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = font(700, 24);
    ctx.fillText("WHAT'S COOKING", PAD, 74);

    ctx.fillStyle = '#ffffff';
    ctx.font = font(750, 52);
    ctx.fillText("This week's menu", PAD, 134);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = font(600, 27);
    ctx.fillText(rangeLabel(opts.monday), PAD, 178);

    /* ---- days ---- */
    var y = HEADER_H + DAY_GAP;
    var innerW = W - PAD * 2;

    week.forEach(function (row) {
      var weekend = row.day === 'Sat' || row.day === 'Sun';
      var name = (DAY_FULL[row.day] || row.day).toUpperCase();

      ctx.fillStyle = weekend ? C.rust : C.soft;
      ctx.font = font(750, 25);
      ctx.fillText(name, PAD, y + 40);

      var nameW = ctx.measureText(name).width;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PAD + nameW + 20, y + 32);
      ctx.lineTo(W - PAD, y + 32);
      ctx.stroke();

      y += DAY_HEAD_H;

      MEAL_ORDER.forEach(function (meal, mi) {
        var slot = row[meal];
        var top = y + mi * (ROW_H + ROW_GAP);
        var colors = MEAL_COLOR[meal];

        ctx.fillStyle = C.surface;
        roundRect(ctx, PAD, top, innerW, ROW_H, 18);
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.stroke();

        /* meal badge */
        ctx.fillStyle = colors.bg;
        roundRect(ctx, PAD + 20, top + 20, 60, 60, 16);
        ctx.fill();

        ctx.fillStyle = colors.fg;
        ctx.font = font(750, 28);
        ctx.textAlign = 'center';
        ctx.fillText(MEAL_SHORT[meal], PAD + 50, top + 60);
        ctx.textAlign = 'left';

        if (!slot) { return; }

        /* cooking time, right-aligned — measure it so the dish name
           never runs underneath */
        var timeText = slot.mins + ' min';
        ctx.font = font(600, 22);
        var timeW = ctx.measureText(timeText).width;
        ctx.fillStyle = C.faint;
        ctx.textAlign = 'right';
        ctx.fillText(timeText, W - PAD - 24, top + 44);
        ctx.textAlign = 'left';

        var textX = PAD + 100;
        var textW = innerW - 100 - timeW - 52;

        ctx.fillStyle = C.ink;
        ctx.font = font(700, 33);
        ctx.fillText(fit(ctx, slot.dish, textW), textX, top + 46);

        if (slot.sides && slot.sides.length) {
          ctx.fillStyle = C.soft;
          ctx.font = font(400, 24);
          ctx.fillText(fit(ctx, slot.sides.join(' · '), innerW - 100 - 40), textX, top + 78);
        }

        /* non-veg is the one thing worth spotting at a glance */
        if (slot.badges && slot.badges.indexOf('nonveg') !== -1) {
          ctx.font = font(750, 17);
          var label = 'NON-VEG';
          var lw = ctx.measureText(label).width;
          ctx.fillStyle = C.rustBg;
          roundRect(ctx, W - PAD - 24 - lw - 20, top + 58, lw + 20, 28, 8);
          ctx.fill();
          ctx.fillStyle = C.rust;
          ctx.fillText(label, W - PAD - 24 - lw - 10, top + 78);
        }
      });

      y += 3 * ROW_H + 2 * ROW_GAP + DAY_GAP;
    });

    ctx.fillStyle = C.faint;
    ctx.font = font(400, 22);
    ctx.fillText('Planned at home · one less thing to argue about', PAD, y + 34);

    return canvas;
  }

  /* ---------------- text ---------------- */

  function asText(week) {
    var out = ["What's cooking this week", ''];

    week.forEach(function (row) {
      out.push((DAY_FULL[row.day] || row.day).toUpperCase());
      MEAL_ORDER.forEach(function (meal) {
        var slot = row[meal];
        if (!slot) { return; }
        var line = '  ' + MEAL_LABEL[meal] + ': ' + slot.dish;
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

  /* The native share sheet is what actually gets this into a family
     chat from a phone. It needs HTTPS, so it is dead on file://. */
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

  return { render: render, asText: asText, download: download, share: share };
})();
