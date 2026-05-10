// popup.js — Chinese Calendar Extension Popup
(function () {
  var Cal = Calendar;

  function init() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var weekDay = now.getDay();

    var data = Cal.getDayData(year, month, day);
    var currentHourIdx = Cal.getChineseHourIndex(hour);

    Cal.renderDayDetail(document.getElementById('day-detail'), data, {
      currentHourIdx: currentHourIdx,
      weekDay: weekDay,
      showFooter: true
    });

    var btn = document.getElementById('open-options-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
