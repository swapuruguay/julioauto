const express = require('express');
const router = express.Router();
const Db = require('../bd')
const co = require('co')

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

router.use(ensureAuth,co.wrap(function * (req, res, next) {
      datosVista = {}
      let db = new Db()
      datosVista.sucursal = (yield db.getSucursal(req.user.sucursal))[0]
      db.disconnect()
      datosVista.user = req.user
      next();
}));

router.get('/nueva', ensureAuth, function(req, res) {
  var date = new Date()
  var fecha = new Intl.NumberFormat("es-UY", {minimumIntegerDigits: 2}).format(date.getDate()) + '/' + new Intl.NumberFormat("es-UY", {minimumIntegerDigits: 2}).format((date.getMonth() + 1)) + '/' + date.getFullYear()
  res.render('senias', {titulo: 'Formulario de señas', fecha: fecha, datos: datosVista})
})

router.post('/new', co.wrap(function * (req, res) {
    console.log('ok')
    let db = new Db()
    let fec = new Date()
    let nuevo = ((req.body.nuevo == 'on') ? 1 : 0)
    let unidad = {
        id_unidad:0,
        marca: req.body.marca.toUpperCase(),
        modelo: req.body.modelo.toUpperCase(),
        color: req.body.color.toUpperCase(),
        sucursal: req.user.sucursal,
        combustible: req.body.combustible,
        estado: 2,
        nuevo: nuevo,
        tipo: req.body.tipo,
        precio: req.body.precio,
        nro_motor: 'sen_'+req.user.sucursal+'_'+(fec.getMonth()+1)+fec.getFullYear()+Math.round(Math.random()*1000)

    }

    let result = yield db.saveUnidad(unidad)


    let senia = {
        id_cliente_fk: req.body.id,
        sucursal: req.user.sucursal,
        id_unidad_fk: result.insertId,
        importe: req.body.importe,
        negocio: req.body.negocio,
        tipo: req.body.entrega,
        observaciones: req.body.observaciones,
        fecha:  new Date().toJSON().slice(0,10)
    }

    let rs = yield db.saveSenia(senia)
    if(senia.tipo == 'U') {
        yield db.saveUnidadSenia({id_unidad_fk: req.body.oculto, id_senia_fk: rs.insertId})
    }
   // console.log(rs)
    db.disconnect()
    res.redirect('/senias/nueva')
}))

router.post('/asignar', ensureAuth, co.wrap(function * (req, res) {
  let db = new Db()
  let senia = (yield db.getSenia(req.body.idsenia))[0]

  if(senia.tipo == 'U') {
    senia.seniada = (yield db.getUnidadSeniada(senia.id_senia))[0]
  }

  let unidadSenia

  if(senia.seniada) {
    unidadSenia = {id_unidad: senia.seniada.id_unidad_fk, estado: 1}
    yield db.saveUnidad(unidadSenia)
  }

  let unidad = (yield db.getUnidades(` WHERE nro_motor = '${req.body.old}'`))[0]
  unidad.nro_motor = req.body.nromotor.toUpperCase(),
  unidad.estado= 3
  yield db.saveUnidad(unidad)
  yield db.saveVenta({id_unidad_fk: unidad.id_unidad, id_sucursal_fk: req.user.sucursal, fecha: new Date().toJSON().slice(0,10)})
  db.disconnect()
  res.send('ok')
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

    let where = (req.user.habilitado) ? '' : ` AND senias.sucursal = ${req.user.sucursal}`

    let listado = yield db.getSenias(where)
    //console.log(listado)
    if(listado) {
    yield (listado.map(co.wrap(function * (item) {
        let mes = item.fecha.getMonth()+1 > 9 ? item.fecha.getMonth()+1 : '0' + (item.fecha.getMonth()+1)
        let dia = item.fecha.getDate() > 9 ? item.fecha.getDate() : '0' + item.fecha.getDate()
        item.fecha = `${dia}/${mes}/${item.fecha.getFullYear()}`
        item.cliente = (yield db.getCliente(item.id_cliente_fk))[0]
        item.unidad = (yield db.getUnidad(item.id_unidad_fk))[0]
        item.sucursal = ( yield db.getSucursal(item.sucursal))[0]
        return item
    })))
  } else {
    listado = []
  }
    db.disconnect()
    res.render('senias-listar', {titulo: 'Listado de Señas', datos: datosVista, senias: listado })

}))

router.get('/:id', ensureAuth, co.wrap(function * (req, res) {
    let db = new Db()
    let senia = (yield db.getSenia(req.params.id))[0]
    senia.unidad = (yield db.getUnidad(senia.id_unidad_fk))[0]
    senia.cliente = (yield db.getCliente(senia.id_cliente_fk))[0]
    db.disconnect()


    let tipos = [
      {id: 1, tipo: 'Auto', selected: (senia.unidad.tipo == 1)? 'SELECTED': ''},
      {id: 2, tipo: 'Camioneta', selected: (senia.unidad.tipo == 2)? 'SELECTED': ''},
      {id: 3, tipo: 'Camión', selected: (senia.unidad.tipo == 3)? 'SELECTED': ''},
      {id: 4, tipo: 'Moto', selected: (senia.unidad.tipo == 4)? 'SELECTED': ''},
      {id: 5, tipo: 'Triciclo', selected: (senia.unidad.tipo == 5)? 'SELECTED': ''},
      {id: 6, tipo: 'Cuatriciclo', selected: (senia.unidad.tipo == 6)? 'SELECTED': ''},
    ]

    let combustibles = [
      {id: 'N' , comb: 'Nafta', selected: (senia.unidad.combustible == 'N')? 'SELECTED': ''},
      {id: 'D' , comb: 'Diesel', selected: (senia.unidad.combustible == 'D')? 'SELECTED': ''},
    ]

    let negocio = [
      {id: 'C', negocio: 'Contado', selected: (senia.negocio == 'C')? 'SELECTED':''},
      {id: 'F', negocio: 'Financiado', selected: (senia.negocio == 'F')? 'SELECTED':''},
      {id: 'L', negocio: 'Leasing', selected: (senia.negocio == 'L')? 'SELECTED':''}
    ]

    let entrega = [
        {id: 'E', entrega: 'Efectivo', selected: (senia.tipo == 'E')? 'SELECTED':''},
        {id: 'U', entrega: 'Unidad', selected: (senia.tipo == 'U')? 'SELECTED':''},
    ]

    senia.tipo = entrega
    senia.negocio = negocio
    let date = new Date(senia.fecha)
    date = new Intl.NumberFormat("es-UY", {minimumIntegerDigits: 2}).format(date.getDate()) + '/' + new Intl.NumberFormat("es-UY", {minimumIntegerDigits: 2}).format((date.getMonth() + 1)) + '/' + date.getFullYear()
    senia.fecha = date

    datosVista.senia = senia
    datosVista.comb = combustibles
    datosVista.tipos = tipos

    res.render('senias-edit', {titulo: 'Formulario de Señas', datos: datosVista })

    }))



module.exports = router
