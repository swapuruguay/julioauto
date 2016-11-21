var express = require('express')
var hbs = require('express-handlebars')
var handleb = require('handlebars')
var fs = require('fs')
var app = express()
var bd = require('./bd')
var clientes = require('./clientes')
var unidades = require('./unidades')
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}))
app.set('view engine', 'hbs')

handleb.registerPartial('footer', fs.readFileSync(__dirname + '/views/partials/footer.hbs', 'utf8'))
handleb.registerPartial('header', fs.readFileSync(__dirname + '/views/partials/header.hbs', 'utf8'))

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

app.get('/unidades/listar', function(req, res) {
      unidades.listar(' WHERE anio = 2016 and estado = 1', null, function( err, rows) {
        if(err) {
          console.log(err)
        } else {
          console.log(rows)
          res.render('unidades-listar', {titulo: 'Formulario de Unidades', unidades: rows})
          
        }
      })



})

app.listen(3000, function() {
  console.log(' Escuchando el puerto 3000')
})
