let buscaUnidad = $('#find-unidad')

$('#busquedau').keypress(function(e) {
  if(e.keyCode == 13) {
    buscaU()
    return false
  }
})

buscaUnidad.click(function(evt) {
  buscaU()

})




function buscaU() {
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
                <th>Modelo</th>
                <th>Matrícula</th>
                <th>Año</th>
                <th>Sucursal</th>
                <th>Traspasar</th></tr>`

      res.res.unidades.forEach(function(un) {
        elemento += `<tr><td><a href="/unidades/${un.id_unidad}">${un.id_unidad}</a></td><td>${un.marca}</td><td>${un.modelo}</td>
        <td>${un.matricula}</td><td>${un.anio}</td><td>${un.nombre}</td>`
        if(un.sucursal == res.res.user.sucursal) {
          elemento += `<td><a href="/unidades/traspaso/${un.id_unidad}">Traspasar</a></td>`
        } else {
          elemento += `<td>No permitido</td>`
        }
        elemento += `</tr>`
      })
      elemento += `</table>`
      obj.html(elemento)
  }, 'json')
}

$('#find-cliente').click(function(evt) {
  var valor = $('#busquedac').val()
  var criterio = $('#criterio').val()
  //console.log(valor + ' ' + criterio)
  var data = 'texto=' +valor+'&criterio='+criterio
  $.post('/clientes', data, function(res) {
     var obj = $('#resultado')
     var elemento = '<table class="table table-striped table-condensed">'
     elemento += `<tr>
                <th>Id.Cliente</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Documento</th>
                <th>Celular </th>
                </tr>`

      res.res.clientes.forEach(function(cli) {
        elemento += `<tr><td><a href="/clientes/${cli.id_cliente}">${cli.id_cliente}</a></td><td>${cli.nombre}</td><td>${cli.apellido}</td>
        <td>${cli.documento}</td><td>${cli.celular}</td></tr>`

      })
      elemento += `</table>`
      obj.html(elemento)
  }, 'json')

})

function mostrar() {
  let oculto = document.getElementById('oculto')

  if(document.getElementById('criterio').value == 'sucursal') {
   // console.log('Aca estoy')
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

function clearForm(myFormElement) {

  var elements = myFormElement.elements;

  myFormElement.reset();

  for(i=0; i<elements.length; i++) {

  field_type = elements[i].type.toLowerCase();

  switch(field_type) {

    case "text":
    case "password":
    case "textarea":
          case "hidden":

      elements[i].value = "";
      break;

    case "radio":
    case "checkbox":
        if (elements[i].checked) {
          elements[i].checked = false;
      }
      break;

    case "select-one":
    case "select-multi":
            //    elements[i].selectedIndex = 0;
      break;

    default:
      break;
  }
    }
}


let funi =  document.getElementById("form-unidades")
let fcli = document.getElementById('form-clientes')
if(funi) {
  funi.addEventListener("submit", function(event){
    event.preventDefault()

    let formData = new FormData(funi)
    superagent
    .post('/unidades/save')
    .send(formData)
    .end(function(err, res){
      console.log(res.text)
      if(res.body) {
        clearForm(funi)
      } else {
        document.getElementById('errores').innerHTML = res.text
      }

    });


  });
}

if(fcli) {
  fcli.addEventListener("submit", function(event){
    event.preventDefault()

    let formData = new FormData(fcli)
    superagent
    .post('/clientes/save')
    .send(formData)
    .end(function(err, res){
      //if(res.text == 'Ok') {
      clearForm(fcli)
      //} else {
       // document.getElementById('errores').innerHTML = res.text
     // }
    })


  });
}
