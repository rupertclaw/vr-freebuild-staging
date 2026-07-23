// Inject Mooney GED file into family-builder page
(function() {
  var gedUrl = 'http://localhost:8899/doc_ad4f2d954110_2025_mooney.ged';
  fetch(gedUrl)
    .then(function(r) { return r.text(); })
    .then(function(text) {
      var blob = new Blob([text], {type: 'text/plain'});
      var file = new File([blob], '2025_mooney.ged', {type: 'text/plain'});
      var input = document.getElementById('gedcomInput');
      var dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', {bubbles: true}));
      console.log('GED file injected: ' + text.length + ' chars');
    })
    .catch(function(e) { console.error('Inject failed:', e); });
})();
