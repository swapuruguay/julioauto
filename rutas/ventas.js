const express = require('express');
const router = express.Router();
const Db = require('../bd')
const config = require('../config')
const request = require('request')
const formData = require('express-form-data');
const co = require('co')

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
      if(req.user.perfil == 1) {
        req.user.habilitado = true
      }

        return next()
    }
    res.redirect('/login')
}

function admin(req, res, next) {
    if(req.user.perfil == 1) {
      return next()
    }
    res.redirect('/')
}

function yo(req, res, next) {
    if(req.user.id_usuario === 1) {
      return next()
    }
    res.redirect('/')
}

router.use(function (req, res, next) {
  datosVista = {}
  datosVista.user = req.user
  next();
})

router.get('/listar', ensureAuth,  co.wrap(function * (req, res) {
  let db = new Db()
  let ventas = yield db.getVentas(` WHERE id_sucursal_fk = ${req.user.sucursal} `)
  let options = {year: "numeric", month: "numeric", day: "numeric"};
  if(ventas) {
    yield (ventas.map(co.wrap(function * (item) {
      item.unidad = (yield db.getUnidad(item.id_unidad_fk))[0]
      item.unidad.nuevo = item.unidad.nuevo == 1 ? 'Sí' : 'No'
      let fechin = new Date(item.fecha)
      let mes = fechin.getMonth()+1 > 9 ? fechin.getMonth()+1 : '0' + (fechin.getMonth()+1)
      let dia = fechin.getDate() > 9 ? fechin.getDate() : '0' + fechin.getDate()
      item.fecha = dia + '/' + mes + '/' + fechin.getFullYear()
      return item
})))
} else {
  ventas = []
}
  db.disconnect()
  datosVista.ventas = ventas
  res.render('ventas', {datos: datosVista})
}))

router.post('/listar', async (req, res) => {
  let db = new Db()
  let ventas = await db.getVentas(` WHERE id_sucursal_fk = ${req.body.sucursal} AND YEAR(fecha) = ${req.body.anio} AND MONTH(fecha) = ${req.body.mes}`)
  let options = {year: "numeric", month: "numeric", day: "numeric"};
  if(ventas) {
    await Promise.all(ventas.map(async item => {
        item.unidad = (await db.getUnidad(item.id_unidad_fk))[0]
        item.unidad.nuevo = item.unidad.nuevo == 1 ? 'Sí' : 'No'
        let fechin = new Date(item.fecha)
        let mes = fechin.getMonth()+1 > 9 ? fechin.getMonth()+1 : '0' + (fechin.getMonth()+1)
        let dia = fechin.getDate() > 9 ? fechin.getDate() : '0' + fechin.getDate()
        item.fecha = dia + '/' + mes + '/' + fechin.getFullYear()
        return item
    }))
  } else {
    ventas = []
  }
  res.send(ventas)
})

router.get('/dia', ensureAuth, admin, (req, res) => {
  res.render('ventas-dia', {titulo: 'Ventas de un dia', datos: datosVista})
})

router.post('/dia', async(req, res) => {
  let db = new Db()
  let listadoNuevos = await db.getVentasAgrupadas(` WHERE fecha = '${req.body.fecha}' AND u.nuevo = 1`)
  let listadoUsados = await db.getVentasAgrupadas(` WHERE fecha = '${req.body.fecha}' AND u.nuevo = 0`)
  let contador = 0
  let listado = []
  let sucursales = await db.getSucursales()
  sucursales = sucursales.filter(s => s.id_surusal != 5)
  sucursales.forEach(s => {
    let usados = 0
    let nuevos = 0
    listadoNuevos.forEach(ln => {
      if(ln.nombre === s.nombre) {
        nuevos = ln.cantidad
      }
    })
    listadoUsados.forEach(lu => {
      if(lu.nombre === s.nombre) {
        usados = lu.cantidad
      }
    })
    listado.push({nombre: s.nombre, nuevos, usados})
  })
  datos = listado
  res.send({ datos })
})

router.get('/acumula', ensureAuth, admin, async (req, res) => {
  const db = new Db()
  const hoy = new Date()
  const mes = hoy.getMonth() + 1
  const anio = hoy.getFullYear()
  //console.log(mes)
  let listadoNuevos = await db.getVentasAgrupadas(` WHERE MONTH(fecha) = ${mes} AND YEAR(fecha) = ${anio} AND u.nuevo = 1`)
  let listadoUsados = await db.getVentasAgrupadas(` WHERE MONTH(fecha) = ${mes} AND YEAR(fecha) = ${anio} AND u.nuevo = 0`)
  let contador = 0
  let listado = []
  let sucursales = await db.getSucursales()
  sucursales = sucursales.filter(s => s.id_surusal != 5)
  sucursales.forEach(s => {
    let usados = 0
    let nuevos = 0
    listadoNuevos.forEach(ln => {
      if(ln.nombre === s.nombre) {
        nuevos = ln.cantidad
      }
    })
    listadoUsados.forEach(lu => {
      if(lu.nombre === s.nombre) {
        usados = lu.cantidad
      }
    })
    listado.push({nombre: s.nombre, nuevos, usados})
  })

  let sumaUsados = listado.reduce((valorAnterior, valorActual, indice, vector) => { return (indice == 1) ? valorAnterior.usados + valorActual.usados : valorAnterior + valorActual.usados})

let sumaNuevos = listado.reduce((valorAnterior, valorActual, indice, vector) => { return (indice == 1) ? valorAnterior.nuevos + valorActual.nuevos : valorAnterior + valorActual.nuevos})

  datosVista.nuevos = sumaNuevos
  datosVista.usados = sumaUsados

  datosVista.listado = listado
  res.render('ventas-acumuladas', {titulo: 'Ventas acumuladas del mes', datos: datosVista})
})


module.exports = router
