var express = require('express')
var hbs = require('express-handlebars')
var handleb = require('handlebars')
var fs = require('fs')
var app = express()

app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}))
app.set('view engine', 'hbs')

handleb.registerPartial('footer', fs.readFileSync(__dirname + '/views/partials/footer.hbs', 'utf8'))
handleb.registerPartial('header', fs.readFileSync(__dirname + '/views/partials/header.hbs', 'utf8'))

app.use(express.static(__dirname + '/public'))
app.get('/', function(req, res) {
  res.render('index', { titulo: "Julio Automóviles"})
})

app.get('/senias', function(req, res) {
  res.render('senias', {titulo: 'Formulario de señas'})
})

app.listen(3000, function() {
  console.log(' Escuchando el puerto 3000')
})
