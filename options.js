// options.js — Chinese Calendar Extension Options Page
(function () {
  var Cal = Calendar;

  var WEEKS_LABEL = ['日', '一', '二', '三', '四', '五', '六'];

  var currentYear = new Date().getFullYear();
  var currentMonth = new Date().getMonth() + 1;
  var selectedDate = null;

  var viewMode = 'lunar';
  var currentLunarYear, currentLunarMonth;

  function $(id) { return document.getElementById(id); }

  function initLunarFromToday() {
    var d = new Date();
    try {
      var lunarDay = SolarDay.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()).getLunarDay();
      var lunarMonth = lunarDay.getLunarMonth();
      currentLunarYear = lunarMonth.getYear();
      currentLunarMonth = lunarMonth.getMonthWithLeap();
    } catch (e) {
      currentLunarYear = d.getFullYear();
      currentLunarMonth = 1;
    }
  }

  function initGregorianFromToday() {
    var d = new Date();
    currentYear = d.getFullYear();
    currentMonth = d.getMonth() + 1;
  }

  // ============================================================
  // CALENDAR
  // ============================================================
  function renderCalendar() {
    if (viewMode === 'western') {
      renderWesternCalendar();
    } else {
      renderLunarCalendar();
    }
  }

  function renderWesternCalendar() {
    var today = new Date();
    var todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    $('cal-month-title').textContent = currentYear + '年 ' + currentMonth + '月';

    try {
      var firstDay = SolarDay.fromYmd(currentYear, currentMonth, 1);
      var lunarFirst = firstDay.getLunarDay();
      $('cal-month-lunar').textContent = lunarFirst.getLunarMonth().toString();
    } catch (e) {
      $('cal-month-lunar').textContent = '';
    }

    var grid = $('cal-grid');
    grid.innerHTML = '';
    grid.className = 'cal-grid';

    WEEKS_LABEL.forEach(function (w) {
      var el = document.createElement('div');
      el.className = 'cal-weekday';
      el.textContent = w;
      grid.appendChild(el);
    });

    var daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    var firstWeekday = new Date(currentYear, currentMonth - 1, 1).getDay();

    var prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    var prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    var daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

    for (var i = 0; i < firstWeekday; i++) {
      var d = daysInPrevMonth - firstWeekday + 1 + i;
      renderDayCell(grid, prevYear, prevMonth, d, true, todayStr);
    }

    for (var d = 1; d <= daysInMonth; d++) {
      renderDayCell(grid, currentYear, currentMonth, d, false, todayStr);
    }

    var totalCells = firstWeekday + daysInMonth;
    var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    var nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    var nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    for (var d = 1; d <= remaining; d++) {
      renderDayCell(grid, nextYear, nextMonth, d, true, todayStr);
    }

    populateJumpSelects();
  }

  function renderDayCell(grid, year, month, day, otherMonth, todayStr) {
    var dateStr = year + '-' +
      String(month).padStart(2, '0') + '-' +
      String(day).padStart(2, '0');
    var cell = document.createElement('div');
    cell.className = 'cal-day' +
      (otherMonth ? ' other-month' : '') +
      (dateStr === todayStr ? ' today' : '') +
      (selectedDate === dateStr ? ' selected' : '');

    var lunarText = '';
    var termText = '';
    var festText = '';

    try {
      var solar = SolarDay.fromYmd(year, month, day);
      var lunar = solar.getLunarDay();
      var lunarDay = lunar.getName();
      var lunarMonth = lunar.getLunarMonth();

      lunarText = lunarDay === '初一' ? lunarMonth.getName() : lunarDay;

      var termDay = solar.getTermDay();
      if (termDay.getDayIndex() === 0) termText = termDay.getName();

      var solarFest = solar.getFestival();
      var lunarFest = lunar.getFestival();
      var fests = [];
      if (solarFest) fests.push(solarFest.getName());
      if (lunarFest) fests.push(lunarFest.getName());
      festText = fests.join(' ');
    } catch (e) { }

    cell.innerHTML =
      '<div class="day-solar">' + day + '</div>' +
      '<div class="day-lunar">' + lunarText + '</div>' +
      (termText ? '<div class="day-term">' + termText + '</div>' : '') +
      (festText ? '<div class="day-festival">' + festText + '</div>' : '');

    cell.addEventListener('click', function () {
      if (!otherMonth) {
        selectedDate = dateStr;
        renderCalendar();
        showDayDetail(year, month, day);
      }
    });

    grid.appendChild(cell);
  }

  function renderLunarCalendar() {
    var today = new Date();
    var todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    var lunarMonth = LunarMonth.fromYm(currentLunarYear, currentLunarMonth);
    var lunarDays = lunarMonth.getDays();

    var lunarYear = lunarMonth.getLunarYear();
    var yearGZ = lunarYear.getSixtyCycle().getName();
    var monthName = lunarMonth.getName();
    $('cal-month-title').textContent = '农历' + yearGZ + '年 ' + monthName;

    var firstSolar = lunarDays[0].getSolarDay();
    var lastSolar = lunarDays[lunarDays.length - 1].getSolarDay();
    var rangeStr = firstSolar.getMonth() + '月' + firstSolar.getDay() + '日 — ' +
      lastSolar.getMonth() + '月' + lastSolar.getDay() + '日';
    $('cal-month-lunar').textContent = rangeStr;

    var grid = $('cal-grid');
    grid.innerHTML = '';
    grid.className = 'cal-grid cal-grid-lunar';

    var xunGroups = [
      { name: '上旬', days: lunarDays.filter(function (ld) { return ld.getDay() <= 10; }) },
      { name: '中旬', days: lunarDays.filter(function (ld) { return ld.getDay() > 10 && ld.getDay() <= 20; }) },
      { name: '下旬', days: lunarDays.filter(function (ld) { return ld.getDay() > 20; }) }
    ];

    xunGroups.forEach(function (group) {
      var row = document.createElement('div');
      row.className = 'xun-row';

      var label = document.createElement('div');
      label.className = 'xun-label';
      label.textContent = group.name;
      row.appendChild(label);

      group.days.forEach(function (ld) {
        renderLunarDayCell(row, ld, todayStr);
      });

      var fillCount = 10 - group.days.length;
      for (var i = 0; i < fillCount; i++) {
        var blank = document.createElement('div');
        blank.className = 'xun-day xun-blank';
        row.appendChild(blank);
      }

      grid.appendChild(row);
    });

    populateJumpSelects();
  }

  function renderLunarDayCell(container, lunarDay, todayStr) {
    var solarDay = lunarDay.getSolarDay();
    var year = solarDay.getYear();
    var month = solarDay.getMonth();
    var day = solarDay.getDay();

    var dateStr = year + '-' +
      String(month).padStart(2, '0') + '-' +
      String(day).padStart(2, '0');

    var cell = document.createElement('div');
    cell.className = 'cal-day xun-day' +
      (dateStr === todayStr ? ' today' : '') +
      (selectedDate === dateStr ? ' selected' : '');

    var lunarDayName = lunarDay.getName();

    var secondaryText;
    if (day === 1) {
      secondaryText = month + '月' + day + '日';
    } else {
      secondaryText = String(day);
    }

    var weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    var wdIdx = new Date(year, month - 1, day).getDay();
    var weekdayChar = weekDays[wdIdx];

    var termText = '';
    var festText = '';

    try {
      var termDay = solarDay.getTermDay();
      if (termDay.getDayIndex() === 0) termText = termDay.getName();

      var solarFest = solarDay.getFestival();
      var lunarFest = lunarDay.getFestival();
      var fests = [];
      if (solarFest) {
        fests.push(solarFest.getName());
      }
      if (lunarFest) {
        fests.push(lunarFest.getName());
      }
      festText = fests.join(' ');
    } catch (e) { }

    cell.innerHTML =
      '<div class="day-lunar-main">' + lunarDayName + '</div>' +
      '<div class="day-solar-sub">' + secondaryText + ' (' +
      '<span class="day-weekday' + (wdIdx === 0 || wdIdx === 6 ? ' weekend' : '') + '">周' + weekdayChar + '</span>' +
      ')</div>' + 
      (termText ? '<div class="day-term">' + termText + '</div>' : '') +
      (festText ? '<div class="day-festival">' + festText + '</div>' : '');

    cell.addEventListener('click', function () {
      selectedDate = dateStr;
      renderCalendar();
      showDayDetail(year, month, day);
    });

    container.appendChild(cell);
  }

  function showDayDetail(year, month, day) {
    var detail = $('day-detail');
    detail.style.display = 'block';

    try {
      var data = Cal.getDayData(year, month, day);
      var weekDay = new Date(year, month - 1, day).getDay();
      var now = new Date();
      var currentHourIdx = (year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate())
        ? Cal.getChineseHourIndex(now.getHours()) : undefined;
      Cal.renderDayDetail(detail, data, { weekDay: weekDay, currentHourIdx: currentHourIdx, showFooter: false });
    } catch (e) {
      detail.innerHTML = '<div style="padding:16px;color:#888">无法加载日期信息</div>';
    }

    var links = $('cal-links');
    links.style.display = 'flex';
    var ms = String(month).padStart(2, '0');
    var ds = String(day).padStart(2, '0');
    var dateStr = year + '-' + ms + '-' + ds;
    var dateCompact = year + ms + ds;
    links.innerHTML =
      '<span class="cal-links-label">添加到日历</span>' +
      '<a class="cal-link-btn" href="https://calendar.google.com/calendar/render?action=TEMPLATE&dates=' + dateCompact + '/' + dateCompact + '" target="_blank" rel="noopener">Google 日历</a>' +
      '<a class="cal-link-btn" href="https://outlook.live.com/calendar/0/action/compose?startdt=' + dateStr + '&enddt=' + dateStr + '&path=/calendar/action/compose&rru=addevent" target="_blank" rel="noopener">Outlook 日历</a>';
  }

  function navigateLunar(delta) {
    try {
      var lunarMonth = LunarMonth.fromYm(currentLunarYear, currentLunarMonth);
      var newMonth = lunarMonth.next(delta);
      currentLunarYear = newMonth.getYear();
      currentLunarMonth = newMonth.getMonthWithLeap();
    } catch (e) {
      currentLunarYear += delta;
    }
  }

  $('prev-month').addEventListener('click', function () {
    if (viewMode === 'western') {
      if (currentMonth === 1) { currentYear--; currentMonth = 12; }
      else currentMonth--;
    } else {
      navigateLunar(-1);
    }
    selectedDate = null;
    $('day-detail').style.display = 'none';
    $('cal-links').style.display = 'none';
    renderCalendar();
  });

  $('next-month').addEventListener('click', function () {
    if (viewMode === 'western') {
      if (currentMonth === 12) { currentYear++; currentMonth = 1; }
      else currentMonth++;
    } else {
      navigateLunar(1);
    }
    selectedDate = null;
    $('day-detail').style.display = 'none';
    $('cal-links').style.display = 'none';
    renderCalendar();
  });

  // ============================================================
  // VIEW TOGGLE
  // ============================================================
  function setViewMode(mode) {
    viewMode = mode;
    chrome.storage.local.set({ viewMode: mode });

    var lunarLabel = document.querySelector('.toggle-label-lunar');
    var westernLabel = document.querySelector('.toggle-label-western');
    var track = $('toggle-track');

    if (mode === 'lunar') {
      lunarLabel.classList.add('active');
      westernLabel.classList.remove('active');
      track.classList.add('active');
    } else {
      lunarLabel.classList.remove('active');
      westernLabel.classList.add('active');
      track.classList.remove('active');
    }

    if (mode === 'lunar') {
      initLunarFromToday();
    } else {
      initGregorianFromToday();
    }

    selectedDate = null;
    $('day-detail').style.display = 'none';
    $('cal-links').style.display = 'none';
    renderCalendar();
  }

  $('view-toggle').addEventListener('click', function () {
    setViewMode(viewMode === 'lunar' ? 'western' : 'lunar');
  });

  // ============================================================
  // JUMP SELECTS
  // ============================================================
  function populateWesternMonths() {
    var sel = $('jump-month');
    sel.innerHTML = '';
    for (var m = 1; m <= 12; m++) {
      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m + '月';
      if (m === currentMonth) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function populateLunarMonths() {
    var sel = $('jump-month');
    sel.innerHTML = '';
    try {
      var lunarYear = LunarYear.fromYear(currentLunarYear);
      lunarYear.getMonths().forEach(function (lm) {
        var opt = document.createElement('option');
        opt.value = lm.getMonthWithLeap();
        opt.textContent = lm.getName();
        if (lm.getMonthWithLeap() === currentLunarMonth) opt.selected = true;
        sel.appendChild(opt);
      });
    } catch (e) { }
  }

  function populateJumpSelects() {
    var yearSel = $('jump-year');
    yearSel.innerHTML = '';

    if (viewMode === 'western') {
      for (var y = currentYear - 30; y <= currentYear + 30; y++) {
        var opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '年';
        if (y === currentYear) opt.selected = true;
        yearSel.appendChild(opt);
      }
      populateWesternMonths();
    } else {
      for (var y = currentLunarYear - 30; y <= currentLunarYear + 30; y++) {
        try {
          var ly = LunarYear.fromYear(y);
          var opt = document.createElement('option');
          opt.value = y;
          opt.textContent = ly.getSixtyCycle().getName() + '(' + y + ')';
          if (y === currentLunarYear) opt.selected = true;
          yearSel.appendChild(opt);
        } catch (e) { }
      }
      populateLunarMonths();
    }
  }

  $('jump-year').addEventListener('change', function () {
    if (viewMode === 'western') {
      currentYear = parseInt(this.value);
    } else {
      currentLunarYear = parseInt(this.value);
      var ly = LunarYear.fromYear(currentLunarYear);
      var valid = ly.getMonths().map(function (lm) { return lm.getMonthWithLeap(); });
      if (valid.indexOf(currentLunarMonth) === -1) {
        currentLunarMonth = valid[0];
      }
      populateLunarMonths();
    }
    selectedDate = null;
    $('day-detail').style.display = 'none';
    $('cal-links').style.display = 'none';
    renderCalendar();
  });

  $('jump-month').addEventListener('change', function () {
    if (viewMode === 'western') {
      currentMonth = parseInt(this.value);
    } else {
      currentLunarMonth = parseInt(this.value);
    }
    selectedDate = null;
    $('day-detail').style.display = 'none';
    $('cal-links').style.display = 'none';
    renderCalendar();
  });

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    chrome.storage.local.get('viewMode', function (data) {
      setViewMode(data.viewMode || 'lunar');
    });
  }

  init();
})();
