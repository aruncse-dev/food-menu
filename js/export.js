/* ==================================================================
   Export: the week as a timetable.

   A real grid — days down the side, meals across the top — rather
   than a long list. That is the shape people already read on a
   school timetable, and it is what gets stuck on a fridge.

   Drawn straight onto a canvas, so there is nothing to install and
   it works offline.
   ================================================================== */

var Exporter = (function () {
  'use strict';

  var W = 1240;
  var PAD = 40;
  var HEADER_H = 176;
  var COLHEAD_H = 50;
  var DAYCOL_W = 132;
  var GAP = 8;
  var ROW_H = 152;
  var FOOTER_H = 74;

  /* The exported image is always light: it gets printed, and it lands
     on someone else's phone in a chat thread. */
  var C = {
    bg: '#faf5ec', surface: '#ffffff', alt: '#f6efe3', border: '#e4d7c3',
    ink: '#1b1714', soft: '#6a5d4f', faint: '#9c8e7d',
    saffron: '#b4620a', saffronDeep: '#8f4d06', saffronBg: '#fbebd5',
    sage: '#43734f', sageBg: '#e5efe7',
    chilli: '#b23a2b', chilliBg: '#fae4df'
  };

  var SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, serif';
  var SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  function font(weight, size, family) {
    return weight + ' ' + size + 'px ' + (family || SANS);
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

  /* Word wrap, capped. Cells are narrow, so this decides whether the
     timetable reads or turns to mush. */
  function wrap(ctx, text, maxWidth, maxLines) {
    var words = String(text).split(/\s+/);
    var lines = [];
    var line = '';

    for (var i = 0; i < words.length; i++) {
      var next = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(next).width <= maxWidth || !line) {
        line = next;
      } else {
        lines.push(line);
        line = words[i];
        if (lines.length === maxLines) { break; }
      }
    }

    if (lines.length < maxLines && line) { lines.push(line); }

    /* Anything that did not fit gets an ellipsis on the last line. */
    if (lines.length === maxLines) {
      var consumed = lines.join(' ').split(/\s+/).length;
      if (consumed < words.length) {
        var last = lines[maxLines - 1];
        while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
          last = last.slice(0, -1);
        }
        lines[maxLines - 1] = last.replace(/[\s,·]+$/, '') + '…';
      }
    }

    return lines;
  }

  function rangeLabel(monday) {
    var start = monday ? new Date(monday) : new Date();
    if (!monday) { start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); }
    var end = new Date(start);
    end.setDate(start.getDate() + 6);
    var o = { day: 'numeric', month: 'short' };
    return start.toLocaleDateString(I18N.locale(), o) + ' – ' +
           end.toLocaleDateString(I18N.locale(), o);
  }

  function render(canvas, week, opts) {
    opts = opts || {};

    var height = HEADER_H + COLHEAD_H + week.length * ROW_H + FOOTER_H;
    canvas.width = W;
    canvas.height = height;

    var ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, height);

    /* ---- header ---- */
    var grad = ctx.createLinearGradient(0, 0, W, HEADER_H);
    grad.addColorStop(0, C.saffron);
    grad.addColorStop(1, C.saffronDeep);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, HEADER_H);

    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, HEADER_H); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.arc(W - 110, -50, 230, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = font(700, 21);
    ctx.fillText(I18N.t('export.brand'), PAD, 62);

    ctx.fillStyle = '#ffffff';
    ctx.font = font(700, 48, SERIF);
    ctx.fillText(opts.title || 'Menu for the week', PAD, 116);

    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = font(600, 24);
    ctx.fillText(opts.subtitle || rangeLabel(opts.monday), PAD, 152);

    /* ---- column headings ---- */
    var colW = (W - PAD * 2 - DAYCOL_W - GAP * 3) / 3;
    var colX = function (i) { return PAD + DAYCOL_W + GAP + i * (colW + GAP); };
    var headY = HEADER_H;

    MEAL_ORDER.forEach(function (meal, i) {
      var tint = meal === 'breakfast' ? C.saffronBg : meal === 'lunch' ? C.sageBg : C.chilliBg;
      var fg = meal === 'breakfast' ? C.saffron : meal === 'lunch' ? C.sage : C.chilli;

      ctx.fillStyle = tint;
      roundRect(ctx, colX(i), headY + 8, colW, COLHEAD_H - 14, 10);
      ctx.fill();

      ctx.fillStyle = fg;
      ctx.font = font(700, 19);
      ctx.textAlign = 'center';
      ctx.fillText(I18N.mealName(meal).toUpperCase(), colX(i) + colW / 2, headY + 36);
      ctx.textAlign = 'left';
    });

    /* ---- rows ---- */
    var y = HEADER_H + COLHEAD_H;

    week.forEach(function (row, ri) {
      var weekend = row.day === 'Sat' || row.day === 'Sun';

      /* zebra banding, so the eye tracks across a wide row */
      if (ri % 2 === 1) {
        ctx.fillStyle = C.alt;
        roundRect(ctx, PAD, y, W - PAD * 2, ROW_H - GAP, 12);
        ctx.fill();
      }

      ctx.fillStyle = weekend ? C.chilli : C.soft;
      ctx.font = font(700, 25, SERIF);
      ctx.fillText(I18N.dayShort(row.day), PAD + 14, y + 46);

      ctx.fillStyle = C.faint;
      ctx.font = font(600, 16);
      ctx.fillText(I18N.t(weekend ? 'export.weekend' : 'export.weekday'), PAD + 14, y + 70);

      MEAL_ORDER.forEach(function (meal, ci) {
        var slot = row[meal];
        var x = colX(ci);
        var h = ROW_H - GAP;

        ctx.fillStyle = C.surface;
        roundRect(ctx, x, y, colW, h, 12);
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.stroke();

        var inner = colW - 28;
        var tx = x + 14;
        var ty = y + 34;

        if (!slot) {
          ctx.fillStyle = C.faint;
          ctx.font = font(400, 19);
          ctx.fillText('—', tx, ty);
          return;
        }

        /* dish name */
        ctx.fillStyle = C.ink;
        ctx.font = font(700, 24, SERIF);
        wrap(ctx, I18N.dish('main', slot.id, slot.main), inner, 2).forEach(function (line) {
          ctx.fillText(line, tx, ty);
          ty += 28;
        });

        /* the protein, called out — it is what people scan for */
        if (slot.addon) {
          ctx.font = font(700, 17);
          var label = I18N.addonName(slot.addon);
          var lw = Math.min(ctx.measureText(label).width, inner - 22);
          ctx.fillStyle = C.chilliBg;
          roundRect(ctx, tx, ty - 15, lw + 22, 26, 7);
          ctx.fill();
          ctx.fillStyle = C.chilli;
          ctx.save();
          ctx.beginPath(); ctx.rect(tx, ty - 16, lw + 20, 28); ctx.clip();
          ctx.fillText(label, tx + 11, ty + 3);
          ctx.restore();
          ty += 30;
        }

        /* sides */
        if (slot.sides && slot.sides.length) {
          ctx.fillStyle = C.soft;
          ctx.font = font(400, 17);
          var room = Math.max(1, Math.floor((y + h - 12 - ty) / 21));
          wrap(ctx, I18N.sideNames(slot.sides).join(' · '), inner, Math.min(room, 3))
            .forEach(function (line) {
              ctx.fillText(line, tx, ty);
              ty += 21;
            });
        }

        /* cooking time, bottom right */
        ctx.fillStyle = C.faint;
        ctx.font = font(600, 16);
        ctx.textAlign = 'right';
        ctx.fillText(I18N.minutes(slot.mins), x + colW - 14, y + h - 12);
        ctx.textAlign = 'left';
      });

      y += ROW_H;
    });

    ctx.fillStyle = C.faint;
    ctx.font = font(400, 19);
    ctx.fillText(I18N.t('export.footer'), PAD, y + 34);

    return canvas;
  }

  /* ---------------- text ---------------- */

  function slotText(slot) {
    if (!slot) { return '—'; }
    var s = I18N.dish('main', slot.id, slot.main);
    if (slot.addon) { s += ' + ' + I18N.addonName(slot.addon); }
    if (slot.sides && slot.sides.length) {
      s += ' (' + I18N.sideNames(slot.sides).join(', ') + ')';
    }
    return s;
  }

  /* Takes any number of day rows, so one day exports exactly like
     seven — the timetable just has a single line. */
  function asText(week, title) {
    var out = [title || 'Menu for the week', ''];

    week.forEach(function (row) {
      out.push(I18N.dayName(row.day).toUpperCase());
      MEAL_ORDER.forEach(function (meal) {
        out.push('  ' + I18N.mealName(meal) + ': ' + slotText(row[meal]));
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

  /* Handing the browser a file, whatever the file is — the timetable
     image here, a database backup from the settings screen. */
  function save(blob, filename) {
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
  }

  function download(canvas, filename) {
    return toBlob(canvas).then(function (blob) { return save(blob, filename); });
  }

  /* The native share sheet needs HTTPS, so it is dead on file://. */
  function share(canvas, text) {
    return toBlob(canvas).then(function (blob) {
      if (!blob || !navigator.share) { return 'unsupported'; }
      var file = new File([blob], 'menu-week.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: text.split('\n')[0] })
          .then(function () { return 'shared'; })
          .catch(function (e) { return e && e.name === 'AbortError' ? 'cancelled' : 'failed'; });
      }

      return navigator.share({ title: text.split('\n')[0], text: text })
        .then(function () { return 'shared'; })
        .catch(function (e) { return e && e.name === 'AbortError' ? 'cancelled' : 'failed'; });
    });
  }

  return { render: render, asText: asText, download: download, save: save, share: share };
})();
