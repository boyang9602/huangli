// calendar.js — Shared Chinese Calendar logic for popup & options
(function(global) {
  var WEEKS = ['日', '一', '二', '三', '四', '五', '六'];

  function getChineseHourIndex(hour) {
    if (hour === 23) return 12;
    return Math.floor((hour + 1) / 2);
  }

  function getDayData(year, month, day) {
    var solar = SolarDay.fromYmd(year, month, day);
    var scd = solar.getSixtyCycleDay();
    var lunar = solar.getLunarDay();

    var lunarYear = lunar.getLunarMonth().getLunarYear();
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
    var nextTermName = nextTerm.getName();
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

  global.Calendar = {
    WEEKS: WEEKS,
    getChineseHourIndex: getChineseHourIndex,
    getDayData: getDayData,
    renderDayDetail: renderDayDetail
  };
})(window);
