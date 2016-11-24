$('#find-unidad').click(function(evt) {
  var valor = $('#busquedau').val()
  var criterio = $('#criterio').val()
  console.log(valor + ' ' + criterio)
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
        elemento += `<tr><td><a href="/unidad/${un.id_unidad}">${un.id_unidad}</a></td><td>${un.marca}</td><td>${un.nro_motor}</td><td>${un.matricula}</td><td>${un.anio}</td></tr>`
      })
      elemento += `</table>`
      obj.html(elemento)
  }, 'json')
        
})

function mostrar() {
  let oculto = document.getElementById('oculto')
    
  if(document.getElementById('criterio').value == 'sucursal') {
    console.log('Aca estoy')
    oculto.classList.remove('oculto')
    oculto.classList.add('visto')
    let sucursales = document.getElementById('sucursales')
    document.getElementById('busquedau').value = sucursales.value
  } else {
    oculto.classList.add('oculto')
    oculto.classList.remove('visto')
  }
}

function cambiarTexto() {
  let sucursales = document.getElementById('sucursales')
    document.getElementById('busquedau').value = sucursales.options[sucursales.selectedIndex].text
    document.getElementById('busquedau').value = sucursales.value
}
