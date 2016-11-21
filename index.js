var express = require('express')
var hbs = require('express-handlebars')
var handleb = require('handlebars')
var fs = require('fs')
var app = express()
var bd = require('./bd')

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
        bd.query('SELECT * FROM clientes ', function(err, rows) {
            if(err) {
                console.log(err)
            } else {
            //  console.log(rows)
                res.render('clientes-listar', {titulo: 'Formulario de Clientes', clientes: rows})
            }
        })

})

app.listen(3000, function() {
  console.log(' Escuchando el puerto 3000')
})
