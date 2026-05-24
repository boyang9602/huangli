// options.js — Chinese Calendar Extension Options Page
// Responsible for: page state, event wiring, and day-detail side effects.
// All calendar rendering is delegated to calendar.js.
(function () {
  var Cal = Calendar;

  // ============================================================
  // STATE
  // ============================================================

  var viewMode = 'lunar';

  // Western view state
  var currentDate = new Date();
  var currentYear  = currentDate.getFullYear();
  var currentMonth = currentDate.getMonth() + 1;
  var currentDay = currentDate.getDate();

  // Lunar view state
  var currentLunarYear, currentLunarMonth;

  // Currently selected date string "YYYY-MM-DD" (or null)
  var selectedDate = null;

  function $(id) { return document.getElementById(id); }

  // ============================================================
  // CALENDAR RENDERING
  // ============================================================

  function renderCalendar() {
    var grid     = $('cal-grid');
    var titleEl  = $('cal-month-title');
    var lunarEl  = $('cal-month-lunar');
    var yearSel  = $('jump-year');
    var monthSel = $('jump-month');

    if (viewMode === 'western') {
      Cal.renderWesternCalendar(grid, titleEl, lunarEl, currentYear, currentMonth, selectedDate, onDaySelect);
    } else {
      Cal.renderLunarCalendar(grid, titleEl, lunarEl, currentLunarYear, currentLunarMonth, selectedDate, onDaySelect);
    }

    Cal.populateJumpSelects(yearSel, monthSel, {
      viewMode: viewMode,
      year: currentYear, month: currentMonth,
      lunarYear: currentLunarYear, lunarMonth: currentLunarMonth
    });
  }

  function onDaySelect(year, month, day, dateStr) {
    selectedDate = dateStr;
    renderCalendar();
    showDayDetail(year, month, day);
  }

  // ============================================================
  // DAY DETAIL + CALENDAR LINKS
  // ============================================================

  function showDayDetail(year, month, day) {
    var detail = $('day-detail');
    detail.style.display = 'block';
    var cl = $('cal-links');
    cl.style.display = 'flex';
    try {
      var data = Cal.getDayData(year, month, day);
      var now = new Date();
      var isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
      Cal.renderDayDetail(detail, data, {
        weekDay: new Date(year, month - 1, day).getDay(),
        currentHourIdx: isToday ? Cal.getChineseHourIndex(now.getHours()) : undefined,
        showFooter: false
      });
    } catch (e) {
      detail.innerHTML = '<div style="padding:16px;color:#888">无法加载日期信息</div>';
    }

    var ms = String(month).padStart(2, '0');
    var ds = String(day).padStart(2, '0');
    var iso = year + '-' + ms + '-' + ds;

    var cl = $('cal-links');
    cl.innerHTML = '';
    var atcb = document.createElement('add-to-calendar-button');
    atcb.setAttribute('name', '黄历\u00b7' + iso);
    atcb.setAttribute('startDate', iso);
    atcb.setAttribute('options', "['Apple','Google','iCal','Outlook.com','Microsoft365','Yahoo']");
    atcb.setAttribute('language', 'zh');
    atcb.setAttribute('lightMode', 'light');
    atcb.setAttribute('label', '添加到日历');
    atcb.setAttribute('trigger', 'click');
    atcb.setAttribute('hideBranding', '');
    atcb.setAttribute('size', '5|5|4');
    atcb.setAttribute('styleLight',
      '--btn-background:#FDF6E3;--btn-text:#1A1A1A;' +
      '--btn-border:1px solid #C4A35A;--btn-border-radius:4px;' +
      '--btn-padding-x:13px;--btn-padding-y:5px;' +
      '--btn-hover-background:#F5E6C8;--btn-hover-text:#1A1A1A;--btn-hover-border:#C0392B;' +
      "--font:'Noto Serif SC','Songti SC',SimSun,serif;" +
      '--btn-font-weight:600;--btn-shadow:none;--btn-hover-shadow:none;--btn-active-shadow:none;' +
      '--base-font-size-m:12px;' +
      '--list-background:#FDF6E3;--list-text:#1A1A1A;' +
      '--list-border:1px solid #C4A35A;' +
      '--list-hover-background:#F5E6C8;--list-hover-text:#C0392B;--list-border-radius:4px;'
    );
    cl.appendChild(atcb);
  }

  function clearSelection() {
    selectedDate = null;
    $('day-detail').style.display = 'none';
    $('cal-links').style.display = 'none';
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  $('prev-month').addEventListener('click', function () {
    if (viewMode === 'western') {
      if (currentMonth === 1) { currentYear--; currentMonth = 12; }
      else currentMonth--;
    } else {
      var r = Cal.navigateLunar(currentLunarYear, currentLunarMonth, -1);
      currentLunarYear = r.year; currentLunarMonth = r.month;
    }
    clearSelection();
    renderCalendar();
  });

  $('next-month').addEventListener('click', function () {
    if (viewMode === 'western') {
      if (currentMonth === 12) { currentYear++; currentMonth = 1; }
      else currentMonth++;
    } else {
      var r = Cal.navigateLunar(currentLunarYear, currentLunarMonth, 1);
      currentLunarYear = r.year; currentLunarMonth = r.month;
    }
    clearSelection();
    renderCalendar();
  });

  // ============================================================
  // VIEW TOGGLE (lunar ↔ western)
  // ============================================================

  function setViewMode(mode) {
    viewMode = mode;
    chrome.storage.local.set({ viewMode: mode });

    var isLunar = mode === 'lunar';
    document.querySelector('.toggle-label-lunar').classList.toggle('active', isLunar);
    document.querySelector('.toggle-label-western').classList.toggle('active', !isLunar);
    $('toggle-track').classList.toggle('active', isLunar);

    if (isLunar) {
      // Derive lunar position from today's date
      var d = new Date();
      try {
        var lunarDay = SolarDay.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate()).getLunarDay();
        var lunarMonthObj = lunarDay.getLunarMonth();
        currentLunarYear  = lunarMonthObj.getYear();
        currentLunarMonth = lunarMonthObj.getMonthWithLeap();
      } catch (e) {
        currentLunarYear  = d.getFullYear();
        currentLunarMonth = 1;
      }
    } else {
      currentYear  = new Date().getFullYear();
      currentMonth = new Date().getMonth() + 1;
    }

    clearSelection();
    renderCalendar();
  }

  $('view-toggle').addEventListener('click', function () {
    setViewMode(viewMode === 'lunar' ? 'western' : 'lunar');
  });

  // ============================================================
  // JUMP SELECTS
  // ============================================================

  $('jump-year').addEventListener('change', function () {
    if (viewMode === 'western') {
      currentYear = parseInt(this.value);
    } else {
      currentLunarYear = parseInt(this.value);
      // Ensure the current lunar month is valid in the newly selected year
      try {
        var valid = LunarYear.fromYear(currentLunarYear)
          .getMonths()
          .map(function(lm) { return lm.getMonthWithLeap(); });
        if (valid.indexOf(currentLunarMonth) === -1) currentLunarMonth = valid[0];
      } catch (e) {}
    }
    clearSelection();
    renderCalendar();
  });

  $('jump-month').addEventListener('change', function () {
    if (viewMode === 'western') currentMonth = parseInt(this.value);
    else currentLunarMonth = parseInt(this.value);
    clearSelection();
    renderCalendar();
  });

  $('btn-today').addEventListener('click', function () {
    // 1. Get the freshest date in case the page has been open for a while
    var d = new Date();
    currentYear = d.getFullYear();
    currentMonth = d.getMonth() + 1;
    currentDay = d.getDate();

    // 2. setViewMode already has the built-in logic to reset the calendar grid 
    // to the current month/year for whatever viewMode is currently active.
    setViewMode(viewMode);

    // 3. Select today's date
    onDaySelect(currentYear, currentMonth, currentDay, Cal.getTodayStr());
  });

  // ============================================================
  // INIT
  // ============================================================

  chrome.storage.local.get('viewMode', function (data) {
    setViewMode(data.viewMode || 'lunar');
    onDaySelect(currentYear, currentMonth, currentDay, Cal.getTodayStr());
  });
})();
