$('#find-unidad').keyup(function(evt) {
  var valor = this.value
  var criterio = $('#criterio').val();
  var data = 'texto=' +valor+'&criterio='+criterio
  $.post('/unidades', data, function(res) {
    $("#tabla-unidades").append('<tr><td>'+res.marca+'</td><td>'+ res.nro_motor+'</td><td>'+res.matricula+'</td><td>'+res.anio+'</td></tr>')
  }, 'json')
})
