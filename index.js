var express = require('express')
var hbs = require('express-handlebars')
var handleb = require('handlebars')
const fs = require('fs')
const app = express()
const bodyParser = require('body-parser')
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Db = require('./bd')
const request = require('request')
var passport = require('passport')
var auth = require('./auth')
var session = require('express-session')
var cookie = require('cookie-parser')

app.use(session({
    secret: 'abc12345',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());


passport.use(auth.strategy)
passport.serializeUser(auth.serialize)
passport.deserializeUser(auth.deserialize)

app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}))
app.set('view engine', 'hbs')

handleb.registerPartial('footer', fs.readFileSync(__dirname + '/views/partials/footer.hbs', 'utf8'))
handleb.registerPartial('header', fs.readFileSync(__dirname + '/views/partials/header.hbs', 'utf8'))

app.use(bodyParser.urlencoded({extended:true}))

app.use(express.static(__dirname + '/public'))

function ensureAuth(req, res, next) {
    if(req.isAuthenticated()) {

        return next()
    }
    res.redirect('/login')
}

app.get('/', ensureAuth, function(req, res) {
  res.render('index', { titulo: "Julio Automóviles", user: req.user})
})

app.get('/login', function(req, res) {

    res.render('login', {layout: 'login'})
})

app.post('/login', passport.authenticate('local', { successRedirect: '/',failureRedirect: '/login',failureFlash: true})

)

app.get('/logout', function(req, res) {
    req.logout()
    res.redirect('/login')
})

app.get('/senias', ensureAuth, function(req, res) {
  var date = new Date()
  var fecha = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear()
  res.render('senias', {titulo: 'Formulario de señas', fecha: fecha})
})

app.get('/clientes/nuevo', ensureAuth, function(req, res) {

  var nro = 0
  res.render('clientes', {titulo: 'Formulario de Clientes', nro: nro})
})

app.get('/clientes/listar', ensureAuth, async(function(req, res) {
  let db = new Db()

  let clientes = await(db.getClientes(null,' ORDER BY apellido, nombre'))
  
      res.render('clientes-listar', {titulo: 'Formulario de Clientes', clientes: clientes})

   

}))

app.get('/cliente/:id', ensureAuth, async(function (req, res) {
  let db = new Db()
  let id = req.params.id
  let fila = await(db.getCliente(id))
  let row = fila[0]
  let cliente = {
    id_cliente: id,
    nombre: row.nombre,
    apellido: row.apellido,
    domicilio: row.domicilio,
    telefono: row.telefono,
    documento: row.documento,
    celular: row.celular,
    ciudad: row.ciudad
  }

  res.render('clientes-edit', {titulo: 'Formulario de clientes', cliente: cliente} )

}))

app.get('/unidades/nuevo', ensureAuth, function(req, res) {

  var nro = 0
  res.render('unidades', {titulo: 'Formulario de Unidades', nro: nro})
})

app.get('/unidades/listar', ensureAuth, async(function(req, res) {
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

app.get('/unidad/:id', ensureAuth, async(function(req, res) {
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

app.get('/unidades/stock/:sucursal', ensureAuth, async(function (req, res) {
  let db = new Db()
  let suc = req.params.sucursal

  let sucursal = await(db.getSucursal(suc))
  sucursal = sucursal[0]

  var unidades = await (db.getUnidades(` WHERE estado = 1 AND sucursal = ${suc}`, ` ORDER BY nuevo, marca, modelo`))
  let fecha = new Date()
    

  let data = {
    template: {shortid:'Skyx99Nzl'}, data: {
      fecha: fecha.getDate() + '/' + (fecha.getMonth() + 1) + '/' + fecha.getFullYear(),
      sucursal: sucursal.nombre,
      unidades
    }
        
  }

  let options = {
    url: 'http://localhost:5488/api/report',
    json: data,
    method: 'POST'
  }
  
  request(options).pipe(res)
 
}))

app.listen(3000, function() {
  console.log(' Escuchando el puerto 3000')
})
