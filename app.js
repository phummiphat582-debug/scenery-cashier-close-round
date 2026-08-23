/* Loader for the split application bundle. */
(function () {
  const parts = ["app-v4-part-01.js","app-v4-part-02.js","app-v4-part-03.js","app-v4-part-04.js","app-v4-part-05.js","app-v4-part-06.js","app-v4-part-07.js","app-v4-part-08.js","app-v4-part-09.js","app-v4-part-10.js","app-v4-part-11.js"];
  parts.forEach((src) => document.write('<script src="' + src + '"><\/script>'));
}());
