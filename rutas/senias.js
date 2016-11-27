const express = require('express');
const router = express.Router();
const Db = require('../bd')
const async = require('asyncawait/async')
const await = require('asyncawait/await')

function ensureAuth(req, res, next) {
    if(req.isAuthenticated()) {

        return next()
    }
    res.redirect('/login')
}

router.get('/', ensureAuth, function(req, res) {
  var date = new Date()
  var fecha = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
  res.render('senias', {titulo: 'Formulario de señas', fecha: fecha})
})

module.exports = router