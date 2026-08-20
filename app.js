/*
 * Load the application as a normal script.
 *
 * The previous loader assembled app-part-*.js and executed the result with
 * eval(). That is fragile on hosted sites because Content Security Policy
 * commonly blocks eval, leaving the page blank before the login screen can
 * work. app-source.js is already shipped with this static build, so loading
 * it directly keeps the same application without requiring eval or
 * document-time string evaluation.
 */
(function () {
  const build = '20260819-a4-template-2';
  document.write('<script src="app-source.js?v=' + build + '"><\\/script>');
  document.write('<script src="print-fix.js?v=' + build + '"><\\/script>');
}());
