// calendar.js — Shared Chinese Calendar logic for popup & options
(function(global) {
  var WEEKS = ['日', '一', '二', '三', '四', '五', '六'];

  // ============================================================
  // HELPERS
  // ============================================================

  function pad(n) { return String(n).padStart(2, '0'); }

  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function getChineseHourIndex(hour) {
    if (hour === 23) return 12;
    return Math.floor((hour + 1) / 2);
  }

  // Shared term + festival extraction for day cells
  function getDayCellExtras(solar, lunar) {
    var termText = '', festText = '';
    try {
      var termDay = solar.getTermDay();
      if (termDay.getDayIndex() === 0) termText = termDay.getName();
      var fests = [];
      if (solar.getFestival()) fests.push(solar.getFestival().getName());
      if (lunar && lunar.getFestival()) fests.push(lunar.getFestival().getName());
      festText = fests.join(' ');
    } catch (e) {}
    return { termText: termText, festText: festText };
  }

  // ============================================================
  // DAY DATA
  // ============================================================

  function getDayData(year, month, day) {
    var solar = SolarDay.fromYmd(year, month, day);
    var scd = solar.getSixtyCycleDay();
    var lunar = solar.getLunarDay();

    var yearGZ = lunar.getYearSixtyCycle();
    var monthGZ = lunar.getMonthSixtyCycle();
    var dayGZ = scd.getSixtyCycle();
    var animal = yearGZ.getEarthBranch().getZodiac().getName();

    var rec = scd.getRecommends().map(function(r) { return r.getName(); });
    var avo = scd.getAvoids().map(function(a) { return a.getName(); });

    var nayin = dayGZ.getSound().getName();

    var eb = dayGZ.getEarthBranch();
    var chong = eb.getOpposite().toString();
    var shaDir = eb.getOpposite().getDirection().getName();

    var twelveStar = scd.getTwelveStar();
    var tsLuck = twelveStar.getEcliptic().getLuck().getName();

    var duty = scd.getDuty().getName();
    var fetus = scd.getFetusDay().getName();

    var star28 = scd.getTwentyEightStar();
    var s28Luck = '';
    try { s28Luck = star28.getLuck().getName(); } catch (e) {}

    var hours = scd.getHours();
    var nextScd = solar.next(1).getSixtyCycleDay();
    hours.push(nextScd.getHours()[0]);

    var gods = scd.getGods();
    var godsGood = [];
    var godsBad = [];
    gods.forEach(function(god) {
      if (god.getLuck().getName() === '吉') {
        godsGood.push(god.getName());
      } else {
        godsBad.push(god.getName());
      }
    });

    var pengzu = dayGZ.getPengZu();
    var pengzuText = pengzu.getPengZuHeavenStem().toString() + '  ' + pengzu.getPengZuEarthBranch().toString();

    var solarFest = solar.getFestival();
    var lunarFest = lunar.getFestival();
    var termDay = solar.getTermDay();
    var termName = termDay.getName();
    var termIdx = termDay.getDayIndex();
    var nextTerm = termDay.getSolarTerm().next(1);
    var nextTermDistance = nextTerm.getSolarDay().subtract(solar);

    return {
      year: year, month: month, day: day,
      lunarName: lunar.toString(),
      yearGZ: yearGZ.toString(),
      monthGZ: monthGZ.toString(),
      dayGZ: dayGZ.toString(),
      animal: animal,
      rec: rec, avo: avo,
      nayin: nayin,
      chong: chong,
      shaDir: shaDir,
      twelveStar: twelveStar.getName(),
      tsLuck: tsLuck,
      duty: duty,
      fetus: fetus,
      star28: star28.getName(),
      s28Luck: s28Luck,
      hours: hours,
      godsGood: godsGood,
      godsBad: godsBad,
      pengzuText: pengzuText,
      solarFest: solarFest,
      lunarFest: lunarFest,
      termName: termName,
      termIdx: termIdx,
      nextTermName: nextTerm,
      nextTermDistance: nextTermDistance
    };
  }

  // ============================================================
  // DAY DETAIL PANEL
  // ============================================================

  function renderDayDetail(container, data, options) {
    options = options || {};
    var currentHourIdx = options.currentHourIdx;
    var showFooter = options.showFooter;
    var weekDay = options.weekDay;

    var termTag = '';
    if (data.termName) {
      var dayLabel = data.termIdx > 0 ? '第' + (data.termIdx + 1) + '天' : '';
      var nextName = data.nextTermName ? data.nextTermName.getName() : '';
      var distLabel = (nextName && data.nextTermDistance != null)
        ? ' · 距' + nextName + data.nextTermDistance + '天'
        : '';
      termTag = '<span class="term-tag">节气 · ' + data.termName + dayLabel + distLabel + '</span>';
    }

    var tagsHTML = [
      data.solarFest ? '<span class="festival-tag">' + data.solarFest.getName() + '</span>' : '',
      data.lunarFest ? '<span class="festival-tag">' + data.lunarFest.getName() + '</span>' : '',
      termTag
    ].filter(function(s) { return s; }).join('');

    var hoursHTML = data.hours.map(function(h, i) {
      var gz = h.getSixtyCycle().toString();
      var hRec = h.getRecommends();
      var hAvo = h.getAvoids();
      var isGood = hRec.length >= hAvo.length;
      var isCurrent = i === currentHourIdx;
      var luckClass = isCurrent ? '' : (isGood ? 'hour-good' : 'hour-bad');
      return '<div class="hour-cell' + (isCurrent ? ' current' : '') + '">' +
        '<div class="hour-gz">' + gz.charAt(0) + '</div>' +
        '<div class="hour-gz">' + gz.charAt(1) + '</div>' +
        '<div class="hour-luck ' + luckClass + '">' + (isGood ? '吉' : '凶') + '</div>' +
        '</div>';
    }).join('');

    var godsGoodHTML = data.godsGood.length
      ? data.godsGood.map(function(n) { return '<span class="g god-good">' + n + '</span>'; }).join('')
      : '—';
    var godsBadHTML = data.godsBad.length
      ? data.godsBad.map(function(n) { return '<span class="g god-ji">' + n + '</span>'; }).join('')
      : '—';

    var wd = weekDay !== undefined ? '星期' + WEEKS[weekDay] : '';

    container.innerHTML =
      '<div class="date-bar">' +
        '<div class="date-lunar">' +
          '<div class="date-lunar-title">' + data.lunarName + '</div>' +
          '<div class="date-lunar-gz">' + data.yearGZ + '(' + data.animal + ')年 ' + data.monthGZ + '月 ' + data.dayGZ + '日</div>' +
        '</div>' +
        '<div class="date-solar">' +
          '<div class="date-solar-num">' + data.day + '</div>' +
          '<div class="date-solar-info">' +
            '<div class="date-solar-ym">' + data.year + '年' + data.month + '月</div>' +
            (wd ? '<div class="date-solar-wd">' + wd + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tags-row">' + (tagsHTML || '') + '</div>' +
      '<div class="yiji-row">' +
        '<div class="yiji-cell">' +
          '<div class="yiji-label"><span class="yiji-dot yi-dot"></span><span class="yi-label">宜</span></div>' +
          '<div class="yiji-items">' + (data.rec.length ? data.rec.join('  ') : '—') + '</div>' +
        '</div>' +
        '<div class="yiji-cell">' +
          '<div class="yiji-label"><span class="yiji-dot ji-dot"></span><span class="ji-label">忌</span></div>' +
          '<div class="yiji-items">' + (data.avo.length ? data.avo.join('  ') : '—') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="info-row">' +
        '<div class="info-col"><div class="info-label">纳音</div><div class="info-value">' + data.nayin + '</div></div>' +
        '<div class="info-col"><div class="info-label">冲煞</div><div class="info-value">冲' + data.chong + ' 煞' + data.shaDir + '</div></div>' +
        '<div class="info-col"><div class="info-label">值神</div><div class="info-value">' + data.twelveStar + '</div><div class="info-sub ' + (data.tsLuck === '吉' ? 'luck-good' : 'luck-ji') + '">' + data.tsLuck + '</div></div>' +
        '<div class="info-col"><div class="info-label">建除</div><div class="info-value">' + data.duty + '</div></div>' +
        '<div class="info-col"><div class="info-label">胎神</div><div class="info-value">' + data.fetus + '</div></div>' +
        '<div class="info-col"><div class="info-label">星宿</div><div class="info-value">' + data.star28 + '</div><div class="info-sub ' + (data.s28Luck === '吉' ? 'luck-good' : 'luck-ji') + '">' + data.s28Luck + '</div></div>' +
      '</div>' +
      '<div class="hours-header">时辰</div>' +
      '<div class="hours-grid">' + hoursHTML + '</div>' +
      '<div class="gods-section">' +
        '<div class="gods-half"><div class="gods-label">吉神宜趋</div><div class="gods-items">' + godsGoodHTML + '</div></div>' +
        '<div class="gods-half"><div class="gods-label">凶神宜忌</div><div class="gods-items">' + godsBadHTML + '</div></div>' +
      '</div>' +
      '<div class="pengzu"><div class="pengzu-title">彭祖百忌</div><div>' + data.pengzuText + '</div></div>' +
      (showFooter
        ? '<div class="footer"><button class="footer-btn" id="open-options-btn">打开月历 &amp; 提醒设置</button></div>'
        : '');
  }

  // ============================================================
  // CALENDAR GRID — WESTERN VIEW
  // ============================================================

  // Appends one western-style day cell to a grid element.
  // onSelect(year, month, day, dateStr) is called on click (skipped for other-month cells).
  function renderWesternDayCell(grid, year, month, day, otherMonth, todayStr, selectedDate, onSelect) {
    var dateStr = year + '-' + pad(month) + '-' + pad(day);
    var cell = document.createElement('div');
    cell.className = 'cal-day' +
      (otherMonth ? ' other-month' : '') +
      (dateStr === todayStr ? ' today' : '') +
      (selectedDate === dateStr ? ' selected' : '');

    var lunarText = '', termText = '', festText = '';
    try {
      var solar = SolarDay.fromYmd(year, month, day);
      var lunar = solar.getLunarDay();
      lunarText = lunar.getName() === '初一' ? lunar.getLunarMonth().getName() : lunar.getName();
      var extras = getDayCellExtras(solar, lunar);
      termText = extras.termText;
      festText = extras.festText;
    } catch (e) {}

    cell.innerHTML =
      '<div class="day-solar">' + day + '</div>' +
      '<div class="day-lunar">' + lunarText + '</div>' +
      (termText ? '<div class="day-term">' + termText + '</div>' : '') +
      (festText ? '<div class="day-festival">' + festText + '</div>' : '');

    if (!otherMonth) {
      cell.addEventListener('click', function() { onSelect(year, month, day, dateStr); });
    }
    grid.appendChild(cell);
  }

  // Renders a full western-style month into grid, updating titleEl and lunarEl.
  // onSelect(year, month, day, dateStr) is called when the user clicks a day.
  function renderWesternCalendar(grid, titleEl, lunarEl, year, month, selectedDate, onSelect) {
    var todayStr = getTodayStr();
    titleEl.textContent = year + '年 ' + month + '月';

    try {
      var firstDay = SolarDay.fromYmd(year, month, 1);
      lunarEl.textContent = firstDay.getLunarDay().getLunarMonth().toString();
    } catch (e) { lunarEl.textContent = ''; }

    grid.innerHTML = '';
    grid.className = 'cal-grid';

    // Weekday headers
    WEEKS.forEach(function(w) {
      var el = document.createElement('div');
      el.className = 'cal-weekday';
      el.textContent = w;
      grid.appendChild(el);
    });

    var daysInMonth = new Date(year, month, 0).getDate();
    var firstWeekday = new Date(year, month - 1, 1).getDay();
    var prevMonth = month === 1 ? 12 : month - 1;
    var prevYear  = month === 1 ? year - 1 : year;
    var daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

    // Leading cells from previous month
    for (var i = 0; i < firstWeekday; i++) {
      renderWesternDayCell(grid, prevYear, prevMonth, daysInPrevMonth - firstWeekday + 1 + i, true, todayStr, selectedDate, onSelect);
    }
    // Current month
    for (var d = 1; d <= daysInMonth; d++) {
      renderWesternDayCell(grid, year, month, d, false, todayStr, selectedDate, onSelect);
    }
    // Trailing cells from next month
    var totalCells = firstWeekday + daysInMonth;
    var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    var nextMonth = month === 12 ? 1 : month + 1;
    var nextYear  = month === 12 ? year + 1 : year;
    for (var d = 1; d <= remaining; d++) {
      renderWesternDayCell(grid, nextYear, nextMonth, d, true, todayStr, selectedDate, onSelect);
    }
  }

  // ============================================================
  // CALENDAR GRID — LUNAR VIEW
  // ============================================================

  // Appends one lunar-style day cell to a row element.
  function renderLunarDayCell(container, lunarDay, todayStr, selectedDate, onSelect) {
    var solar = lunarDay.getSolarDay();
    var year = solar.getYear(), month = solar.getMonth(), day = solar.getDay();
    var dateStr = year + '-' + pad(month) + '-' + pad(day);

    var cell = document.createElement('div');
    cell.className = 'cal-day xun-day' +
      (dateStr === todayStr ? ' today' : '') +
      (selectedDate === dateStr ? ' selected' : '');

    var wdIdx = new Date(year, month - 1, day).getDay();
    var secondaryText = day === 1 ? month + '月' + day + '日' : String(day);
    var extras = getDayCellExtras(solar, lunarDay);

    cell.innerHTML =
      '<div class="day-lunar-main">' + lunarDay.getName() + '</div>' +
      '<div class="day-solar-sub">' + secondaryText + ' (' +
        '<span class="day-weekday' + (wdIdx === 0 || wdIdx === 6 ? ' weekend' : '') + '">周' + WEEKS[wdIdx] + '</span>' +
      ')</div>' +
      (extras.termText ? '<div class="day-term">' + extras.termText + '</div>' : '') +
      (extras.festText ? '<div class="day-festival">' + extras.festText + '</div>' : '');

    cell.addEventListener('click', function() { onSelect(year, month, day, dateStr); });
    container.appendChild(cell);
  }

  // Renders a full lunar-style month into grid, updating titleEl and lunarEl.
  function renderLunarCalendar(grid, titleEl, lunarEl, lunarYear, lunarMonth, selectedDate, onSelect) {
    var todayStr = getTodayStr();
    var lunarMonthObj = LunarMonth.fromYm(lunarYear, lunarMonth);
    var lunarDays = lunarMonthObj.getDays();

    var yearGZ = lunarMonthObj.getLunarYear().getSixtyCycle().getName();
    titleEl.textContent = '农历' + yearGZ + '年 ' + lunarMonthObj.getName();

    var firstSolar = lunarDays[0].getSolarDay();
    var lastSolar  = lunarDays[lunarDays.length - 1].getSolarDay();
    lunarEl.textContent =
      firstSolar.getMonth() + '月' + firstSolar.getDay() + '日 — ' +
      lastSolar.getMonth()  + '月' + lastSolar.getDay()  + '日';

    grid.innerHTML = '';
    grid.className = 'cal-grid cal-grid-lunar';

    var xunGroups = [
      { name: '上旬', filter: function(ld) { return ld.getDay() <= 10; } },
      { name: '中旬', filter: function(ld) { return ld.getDay() > 10 && ld.getDay() <= 20; } },
      { name: '下旬', filter: function(ld) { return ld.getDay() > 20; } }
    ];

    xunGroups.forEach(function(group) {
      var row = document.createElement('div');
      row.className = 'xun-row';

      var label = document.createElement('div');
      label.className = 'xun-label';
      label.textContent = group.name;
      row.appendChild(label);

      var days = lunarDays.filter(group.filter);
      days.forEach(function(ld) {
        renderLunarDayCell(row, ld, todayStr, selectedDate, onSelect);
      });
      // Pad to 10 slots so rows align
      for (var i = 0; i < 10 - days.length; i++) {
        var blank = document.createElement('div');
        blank.className = 'xun-day xun-blank';
        row.appendChild(blank);
      }
      grid.appendChild(row);
    });
  }

  // ============================================================
  // NAVIGATION & JUMP SELECTS
  // ============================================================

  // Pure function: advance a lunar year/month by delta steps.
  // Returns { year, month } for the new position.
  function navigateLunar(lunarYear, lunarMonth, delta) {
    try {
      var m = LunarMonth.fromYm(lunarYear, lunarMonth).next(delta);
      return { year: m.getYear(), month: m.getMonthWithLeap() };
    } catch (e) {
      return { year: lunarYear + delta, month: lunarMonth };
    }
  }

  // Populate year and month <select> elements for the jump bar.
  // state = { viewMode, year, month, lunarYear, lunarMonth }
  function populateJumpSelects(yearSel, monthSel, state) {
    yearSel.innerHTML = '';
    monthSel.innerHTML = '';

    if (state.viewMode === 'western') {
      for (var y = state.year - 30; y <= state.year + 30; y++) {
        var opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '年';
        if (y === state.year) opt.selected = true;
        yearSel.appendChild(opt);
      }
      for (var m = 1; m <= 12; m++) {
        var opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m + '月';
        if (m === state.month) opt.selected = true;
        monthSel.appendChild(opt);
      }
    } else {
      for (var y = state.lunarYear - 30; y <= state.lunarYear + 30; y++) {
        try {
          var ly = LunarYear.fromYear(y);
          var opt = document.createElement('option');
          opt.value = y;
          opt.textContent = ly.getSixtyCycle().getName() + '(' + y + ')';
          if (y === state.lunarYear) opt.selected = true;
          yearSel.appendChild(opt);
        } catch (e) {}
      }
      try {
        LunarYear.fromYear(state.lunarYear).getMonths().forEach(function(lm) {
          var opt = document.createElement('option');
          opt.value = lm.getMonthWithLeap();
          opt.textContent = lm.getName();
          if (lm.getMonthWithLeap() === state.lunarMonth) opt.selected = true;
          monthSel.appendChild(opt);
        });
      } catch (e) {}
    }
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  global.Calendar = {
    WEEKS: WEEKS,
    getTodayStr: getTodayStr,
    getChineseHourIndex: getChineseHourIndex,
    getDayCellExtras: getDayCellExtras,
    getDayData: getDayData,
    renderDayDetail: renderDayDetail,
    renderWesternCalendar: renderWesternCalendar,
    renderLunarCalendar: renderLunarCalendar,
    navigateLunar: navigateLunar,
    populateJumpSelects: populateJumpSelects
  };
})(window);
