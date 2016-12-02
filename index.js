var express = require('express')
var hbs = require('express-handlebars')
var handleb = require('handlebars')
const fs = require('fs')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const passport = require('passport')
const auth = require('./auth')
const session = require('express-session')
const cookie = require('cookie-parser')
const flash = require('connect-flash');
const cli = require('./rutas/clientes')
const un = require('./rutas/unidades')(io)
const senias = require('./rutas/senias')
const bodyParser = require('body-parser')
const multer = require('multer')


app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json());

app.use(session({
    secret: 'abc12345',
    resave: false,
    saveUninitialized: true
}))
app.use(flash())
app.use(passport.initialize());
app.use(passport.session());


passport.use(auth.strategy)
passport.serializeUser(auth.serialize)
passport.deserializeUser(auth.deserialize)

app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}))
app.set('view engine', 'hbs')

handleb.registerPartial('footer', fs.readFileSync(__dirname + '/views/partials/footer.hbs', 'utf8'))
handleb.registerPartial('header', fs.readFileSync(__dirname + '/views/partials/header.hbs', 'utf8'))

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
  res.render('index', { titulo: "Julio Automóviles", datos: {user: req.user}})
})

app.get('/login', function(req, res) {
    res.locals.errors = req.flash();
    console.log(res.locals.errors);
    res.render('login', { 
        errors: res.locals.errors, layout: 'login'
    });
    //res.render('login', {layout: 'login'})
})

 
/*app.post('/login', passport.authenticate('local', { successRedirect: '/',failureRedirect: '/login',failureFlash: 'Invalid username or password.' })
   
)*/

app.post('/login',
    passport.authenticate('local', { 
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
        //failureFlash: 'Invalid username or password.'
    })
)

app.get('/logout', function(req, res) {
    req.logout()
    res.redirect('/login')
})

http.listen(3000, function() {
  console.log(' Escuchando el puerto 3000')
})
