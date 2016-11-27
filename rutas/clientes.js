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



router.get('/listar', ensureAuth, async(function(req, res) {
  let db = new Db()

  let clientes = await(db.getClientes(null,' ORDER BY apellido, nombre'))
  
      res.render('clientes-listar', {titulo: 'Formulario de Clientes', clientes: clientes})

   

}))

router.get('/nuevo', ensureAuth, function(req, res) {

  var nro = 0
  res.render('clientes', {titulo: 'Formulario de Clientes', nro: nro})
})


router.get('/', function(req, res) {
  res.end("Con router")
})

router.get('/:id', ensureAuth,  async(function (req, res) {
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

module.exports = router