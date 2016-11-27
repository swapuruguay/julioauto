var express = require('express')
var hbs = require('express-handlebars')
var handleb = require('handlebars')
const fs = require('fs')
const app = express()
const bodyParser = require('body-parser')
var passport = require('passport')
var auth = require('./auth')
var session = require('express-session')
var cookie = require('cookie-parser')
const cli = require('./rutas/clientes')
const un = require('./rutas/unidades')
const senias = require('./rutas/senias')

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

app.use('/unidades', un)
app.use('/clientes', cli)
app.use('/senias', senias)

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

app.listen(3000, function() {
  console.log(' Escuchando el puerto 3000')
})
