const express = require('express');
const router = express.Router();
const Db = require('../bd')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const formData = require("express-form-data")

// parsing data with connect-multiparty. Result set on req.body and req.files
router.use(formData.parse());
// clear all empty files
router.use(formData.format());
// change file objects to node stream.Readable
router.use(formData.stream());
// union body and files
router.use(formData.union());

function ensureAuth(req, res, next) {
    if(req.isAuthenticated()) {

        return next()
    }
    res.redirect('/login')
}



router.get('/listar', ensureAuth, async(function(req, res) {
  let db = new Db()// parsing data with connect-multiparty. Result set on req.body and req.files
router.use(formData.parse());
// clear all empty files
router.use(formData.format());
// change file objects to node stream.Readable
router.use(formData.stream());
// union body and files
router.use(formData.union());

  let clientes = await(db.getClientes(null,' ORDER BY apellido, nombre'))
  db.disconnect()

      res.render('clientes-listar', {titulo: 'Formulario de Clientes', datos:{clientes: clientes, user: req.user}})



}))

router.get('/nuevo', ensureAuth, function(req, res) {

  var nro = 0
  res.render('clientes', {titulo: 'Formulario de Clientes', datos: {user: req.user}})
})

router.post('/save', async(function(req, res) {
      let db = new Db()
     // console.log(req.body)
     let id = (req.body.id == '')? 0 : req.body.id
     let fechaNacimiento = req.body.fechanacimiento.split('/')
     fechaNacimiento = `${fechaNacimiento[2]}-${fechaNacimiento[1]}-${fechaNacimiento[0]}`
      let cliente = {
        id_cliente: id,
        nombre: req.body.nombre.toUpperCase(),
        apellido: req.body.apellido.toUpperCase(),
        documento: req.body.documento.toUpperCase(),
        domicilio: req.body.domicilio.toUpperCase(),
        telefono: req.body.telefono,
        celular: req.body.celular,
        ciudad: req.body.ciudad.toUpperCase(),
        aclaraciones: req.body.aclaraciones.toUpperCase(),
        fecha_nacimiento: fechaNacimiento,
        categoria: req.body.categoria.toUpperCase(),
      }

      res.send(await(db.saveCliente(cliente)))
      db.disconnect()
     //res.send({ok: 'OK'})

    }))


router.get('/', function(req, res) {
  res.end("Con router")
})

router.post('/', async(function(req, res) {
      let criterio = req.body.criterio
      let texto = req.body.texto
      let db = new Db()
      let clientes = await(db.getClientes(` WHERE ${criterio} LIKE '${texto}%'`, null))
      db.disconnect()
        clientes = clientes.map(c => {
          if(c.categoria == 'M') {
            c.clase = 'danger'
          } else if(c.categoria == 'R') {
            c.clase = 'warning'
          } else {
            c.clase = ''
          }
          return c
        })
        let resultado = {
          clientes
        }
        res.send({res: resultado})

    }))


router.get('/:id', ensureAuth,  async(function (req, res) {
  let db = new Db()
  let id = req.params.id
  let row = await(db.getCliente(id))[0]
  /*let fechaNacimiento = row.fecha_nacimiento.split('-')
  fechaNacimiento = `${fechaNacimiento[2]}/${fechaNacimiento[1]}/${fechaNacimiento[0]}`*/
  let fecha = null
  if(row.fecha_nacimiento) {
    fecha = new Intl.NumberFormat("es-UY", {minimumIntegerDigits: 2}).format(row.fecha_nacimiento.getDate()) + '/'
                + new Intl.NumberFormat("es-UY", {minimumIntegerDigits: 2}).format((row.fecha_nacimiento.getMonth() + 1)) + '/' + row.fecha_nacimiento.getFullYear()

  }

  db.disconnect()
  let cliente = {
    id_cliente: id,
    nombre: row.nombre,
    apellido: row.apellido,
    aclaraciones: row.aclaraciones,
    domicilio: row.domicilio,
    telefono: row.telefono,
    documento: row.documento,
    celular: row.celular,
    ciudad: row.ciudad,
    fechaNacimiento: fecha,
    categoria: row.categoria
  }

  res.render('clientes-edit', {titulo: 'Formulario de clientes', datos:{cliente: cliente, user: req.user}} )

}))

module.exports = router
