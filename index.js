var express = require('express')
var hbs = require('express-handlebars')
var app = express()

app.engine('hbs', hbs({extname: 'hbs'}))
app.set('view engine', 'hbs')

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