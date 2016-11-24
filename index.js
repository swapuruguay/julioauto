var express = require('express')
var hbs = require('express-handlebars')
var handleb = require('handlebars')
const fs = require('fs')
const app = express()
const bodyParser = require('body-parser')
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Db = require('./bd')

app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}))
app.set('view engine', 'hbs')

handleb.registerPartial('footer', fs.readFileSync(__dirname + '/views/partials/footer.hbs', 'utf8'))
handleb.registerPartial('header', fs.readFileSync(__dirname + '/views/partials/header.hbs', 'utf8'))

app.use(bodyParser.urlencoded({extended:true}))

app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
  res.render('index', { titulo: "Julio Automóviles"})
})

app.get('/senias', function(req, res) {
  var date = new Date()
  var fecha = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear()
  res.render('senias', {titulo: 'Formulario de señas', fecha: fecha})
})

app.get('/clientes/nuevo', function(req, res) {

  var nro = 0
  res.render('clientes', {titulo: 'Formulario de Clientes', nro: nro})
})

app.get('/clientes/listar', function(req, res) {
  clientes.listar(null, null, function(err, rows) {
    if(err) {
      console.log(err)
      res.end()
    } else {
      //  console.log(rows)
      res.render('clientes-listar', {titulo: 'Formulario de Clientes', clientes: rows})

    }

  })


})

app.get('/unidades/nuevo', function(req, res) {

  var nro = 0
  res.render('unidades', {titulo: 'Formulario de Unidades', nro: nro})
})

app.get('/unidades/listar', async(function(req, res) {
   let db = new Db()
   let sucursales = await(db.getSucursales())

  res.render('unidades-listar', {titulo: 'Formulario de Unidades', sucursales: sucursales})

      
}))

app.post('/unidades/', async(function(req, res) {
  let criterio = req.body.criterio
  let texto = req.body.texto
  let db = new Db()
  let rows = await(db.getUnidades(` WHERE estado = 1 AND ${criterio} LIKE '${texto}%'`, null))
  console.log(rows)
    res.send({unidades: rows})
 
}))

app.get('/unidad/:id', async(function(req, res) {
    let id = req.params.id
    let db = new Db()
    let rows = await(db.getUnidad(id))
    let fila = rows[0]
    let unidad = {
      id_unidad: id,
      marca: fila.marca,
      modelo: fila.modelo,
      nro_motor: fila.nro_motor,
      matricula: fila.matricula,
      anio: fila.anio,
      precio: fila.precio,
      padron: fila.padron,
      sucursal: fila.sucursal
    }
    
    let suc = await(db.getSucursales())

    suc = suc.map(function(s) {
      s.selected = ''
      if(s.id_sucursal == unidad.sucursal)
        s.selected =  'SELECTED'


        return s
    })
   
    res.render('unidades-edit', {titulo: "Formulario de Unidades", unidad: unidad, sucursales: suc})
    
    
    
}))

app.listen(3000, function() {
  console.log(' Escuchando el puerto 3000')
})
