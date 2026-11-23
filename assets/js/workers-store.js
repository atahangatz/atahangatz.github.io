/* Loads the workers: the looks in workers.js, with any looks saved by picker.html in this browser laid over them. */
var DuckWorkers = (function () {
  var KEY = 'duck.workers.v1';
  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  return {
    KEY: KEY,
    /* defaults from this file, with any looks saved by the picker in this browser laid over them */
    get: function () {
      var s = saved(), out = {};
      Object.keys(DUCK_WORKERS).forEach(function (id) { var d = DUCK_WORKERS[id]; out[id] = { job: d.job, lines: d.lines, spec: Object.assign({}, (s[id] && s[id].spec) || d.spec) }; });
      return out;
    },
    save: function (all) { var o = {}; Object.keys(all).forEach(function (id) { o[id] = { spec: all[id].spec }; }); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();
