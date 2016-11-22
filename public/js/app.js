$('#find-unidad').keyup(function(evt) {
  var valor = this.value
  var criterio = $('#criterio').val();
  var data = 'texto=' +valor+'&criterio='+criterio
  $.post('/unidades', data, function(res) {
     var obj = $('#resultado')
     var elemento = '<table class="table table-striped table-condensed">'
     elemento += `<tr>
                <th>Id.Unidad</th>
                <th>Marca</th>
                <th>Nro.Motor</th>
                <th>Matrícula</th>
                <th>Año</th>
                </tr>`
                
      res.unidades.forEach(function(un) {
        elemento += `<tr><td>${un.id_unidad}</td><td>${un.marca}</td><td>${un.nro_motor}</td><td>${un.matricula}</td><td>${un.anio}</td></tr>`
      })
      elemento += `</table>`
      obj.html(elemento)
  }, 'json')
        
})
