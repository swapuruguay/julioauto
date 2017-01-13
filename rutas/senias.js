const express = require('express');
const router = express.Router();
const Db = require('../bd')
const co = require('co')
const async = require('asyncawait/async')
const await = require('asyncawait/await')

const formData = require("express-form-data");

let datosVista = {} 
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

router.use(function (req, res, next) {
      datosVista = {}
      datosVista.user = req.user
      next();
    });

router.get('/nueva', ensureAuth, function(req, res) {
  var date = new Date()
  var fecha = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
  res.render('senias', {titulo: 'Formulario de señas', fecha: fecha, datos: datosVista})
})

router.post('/new', co.wrap(function * (req, res) {
    console.log('ok')
    let db = new Db()
    let fec = new Date()
    let unidad = {
        id_unidad:0,
        marca: req.body.marca,
        modelo: req.body.modelo,
        color: req.body.color,
        combustible: req.body.combustible,
        tipo: req.body.tipo,
        precio: req.body.precio,
nro_motor: 'sen_'+req.user.sucursal+'_'+(fec.getMonth()+1)+fec.getFullYear()+Math.round(Math.random()*1000)

    }
    
    let result = yield db.saveUnidad(unidad)
    

    let senia = {
        id_cliente_fk: 1,
        sucursal: req.user.sucursal,
        id_unidad_fk: result.insertId,
        importe: req.body.importe,
        fecha:  new Date().toJSON().slice(0,10)
    }

    let rs = db.saveSenia(senia)
    db.disconnect()
    res.redirect('/senias/nueva')
}))

/*router.get('/listar', ensureAuth, async(function  (req, res) {
    let db = new Db()
    let listado = await(db.getSenias())
    //console.log(listado)
    await(listado.map(function(item) {
        item.cliente = await(db.getCliente(item.id_cliente_fk))[0]
        item.unidad = await(db.getUnidad(item.id_unidad_fk))[0]
        return item
    }))
    console.log(listado[0].cliente)
    //datosVista.senias = listado
    db.disconnect()
    res.render('senias-listar', {titulo: 'Listado de Señas', datos: datosVista, senias: listado })
}))*/
router.get('/listar', ensureAuth, co.wrap(function * (req, res) {
    let db = new Db()
    let listado = yield db.getSenias()
    //console.log(listado)
    yield (listado.map(co.wrap(function * (item) {
        item.cliente = (yield db.getCliente(item.id_cliente_fk))[0]
        item.unidad = (yield db.getUnidad(item.id_unidad_fk))[0]
        return item 
    })))
   
    db.disconnect()
    res.render('senias-listar', {titulo: 'Listado de Señas', datos: datosVista, senias: listado })

}))

module.exports = router