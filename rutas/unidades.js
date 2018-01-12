
const express = require('express');
const router = express.Router();
const Db = require('../bd')
const config = require('../config')
//const async = require('asyncawait/async')
//const await = require('asyncawait/await')
const co = require('co')
const request = require('request')
const formData = require('express-form-data');

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

let returnRouter = function(io) {
    router.use(function (req, res, next) {
      datosVista = {}
      datosVista.user = req.user
      next();
    });

    io.on('connection', function(socket) {

      socket.on('unir', async function(sala) {
        let db = new Db()
        let autos = await db.getPendientes(sala)
        db.disconnect()
        let regs = autos.length
        socket.emit('devolver', regs)
        socket.join(sala)

      })

        socket.on('enviar', function(msg) {
        socket.broadcast.to(msg).emit('devolver', 1)
      })
    })

    router.get('/nuevo', ensureAuth, async function(req, res) {

      let nro = ''
      let db = new Db()

      let suc = await db.getSucursales()
      db.disconnect()
      datosVista.sucursales = suc
      res.render('unidades', {titulo: 'Formulario de Unidades',datos: datosVista})
    })

    router.get('/retorno', ensureAuth, admin, async function(req, res) {
      let db = new Db()
      let sucursales = await db.getSucursales()
      db.disconnect()
      sucursales = sucursales.filter(function(s) {
        return s.id_sucursal != 5
      })
      datosVista.sucursales = sucursales
      res.render('unidades-retorno', {titulo: 'Formulario de Unidades',datos: datosVista})

  })

    router.post('/retornables', async function(req, res) {
      let db = new Db()
      let nro = req.body.nro
      let uni = (await db.getUnidades(` WHERE (sucursal = 5 OR estado = 3) AND nro_motor = '${nro}'`))[0]
      let sucursal = (await db.getSucursal(uni.sucursal))[0]
      uni.suc = sucursal
      db.disconnect()
      res.send({uni: uni})
    })

    router.post('/retornar', ensureAuth, admin, async function(req, res) {
      let db = new Db()
      let unidad = {
        id_unidad: req.body.id,
        sucursal: req.body.suc,
        estado: 1
      }
      await db.saveUnidad(unidad)
      let historia = {
        id_unidad_fk: unidad.id_unidad,
        id_sucursal_fk: unidad.sucursal,
        fecha: new Date().toJSON().slice(0,10),
        operacion: 'Reingreso'
      }
      await db.saveHistorial(historia)
      db.disconnect()
      res.send('Retornado con éxito')

    })

    router.get('/listar', ensureAuth, async function(req, res) {
      let db = new Db()
      let sucursales = await db.getSucursales()
      db.disconnect()
      datosVista.sucursales = sucursales


     res.render('unidades-listar', {titulo: 'Formulario de Unidades', datos: datosVista})


    })

    router.post('/traspasar', async function(req, res) {
      let db = new Db()
      let fecha = new Date().toJSON().slice(0,10)
      let idUnidad = req.body.idunidad
      let idSucursal = req.body.idsucursal
      let datos = {
        id_unidad_fk: idUnidad,
        sucursal_destino: idSucursal,
        sucursal_origen: req.user.sucursal,
        id_usuario_fk: req.user.id_usuario,
        fecha: fecha
      }


      let un = {
        id_unidad: idUnidad,
        estado: 5
      }

      await db.saveUnidad(un)
      await db.saveTraspaso(datos)

      db.disconnect()

        res.render('unidades-ok-traspaso', {datos: datosVista})



    })



    router.get('/pendientes', ensureAuth, async function(req, res) {
      let db = new Db()
      let pend = await db.getPendientes(req.user.sucursal)
      db.disconnect()
      datosVista.pendientes = pend
      res.render('unidades-pendientes', {titulo: 'Unidades en tránsito', datos: datosVista})
    })

    router.post('/save', async function(req, res) {
      let db = new Db()
      let nuevo = ((req.body.nuevo == 'on') ? 1 : 0)
      let estado
      if(!req.body.flagtoma) {
        estado = ((req.body.vendido == 'on')? 3 : 1)
      } else {
        nuevo = 0
        estado = 5
      }


      let id = (req.body.id == '')? 0 : req.body.id

      let unidad = {
        id_unidad: id,
        marca: req.body.marca.toUpperCase(),
        modelo: req.body.modelo.toUpperCase(),
        nro_motor: req.body.nromotor.toUpperCase(),
        nro_chasis: req.body.nrochasis? req.body.nrochasis.toUpperCase() : null,
        anio: req.body.anio,
        matricula: req.body.matricula.toUpperCase(),
        color: req.body.color.toUpperCase(),
        sucursal: req.user.sucursal,
        nuevo: nuevo,
        kmts: req.body.kmts,
        padron: req.body.padron,
        precio: req.body.precio || 0,
        toma: req.body.toma || 0,
        combustible: req.body.combustible,
        estado: estado,
        tipo: req.body.tipo
      }
      try {
          //Guarda la unidad
         let result = await db.saveUnidad(unidad)
         //Verifica si es nuevo para guardar en el historial
         if(req.body.id == '') {
           let historia = {
             id_unidad_fk: result.insertId,
             id_sucursal_fk: unidad.sucursal,
             fecha: new Date().toJSON().slice(0,10),
             operacion: 'Ingreso'
           }
           await db.saveHistorial(historia)
         }

         //Verifica si se vendió para guardar la venta
         if(estado == 3) {
           //Ingresa en el historial que se vendió
           let historia = {
             id_unidad_fk: unidad.id_unidad,
             id_sucursal_fk: unidad.sucursal,
             fecha: new Date().toJSON().slice(0,10),
             operacion: 'Venta'
           }
           await db.saveHistorial(historia)

           let fecha = new Date().toJSON().slice(0,10)
           let vnt = {id_unidad_fk: id, id_sucursal_fk: req.user.sucursal, fecha: fecha }
           await db.saveVenta(vnt)

         }
         db.disconnect()
         result.message = 'Ok'
         res.send(result)
      } catch(err) {

        if(err.message == 'ER_DUP_ENTRY') {
          db.disconnect()
          res.send('Registro duplicado')
        } else {
          db.disconnect()
          res.send('Ocurrió un error, intente de nuevo')
        }


    }

    })

    router.get('/historial', ensureAuth, (req, res) => {
      res.render('unidades-historial', {titulo: 'Historial de automóviles', datos: datosVista})
    })

    router.post('/stockfull', async function(req, res) {

      let db = new Db()
      let unidad = (await db.getUnidades(` WHERE nro_motor = '${req.body.nromotor}'`))[0]
      let historia = await db.getHistorial(unidad.id_unidad)
      if(historia) {
        for(let h of historia) {
          h.sucursal = (await db.getSucursal(h.id_sucursal_fk))[0]
          let mes = h.fecha.getMonth()+1 > 9 ? h.fecha.getMonth()+1 : '0' + (h.fecha.getMonth()+1)
          let dia = h.fecha.getDate() > 9 ? h.fecha.getDate() : '0' + h.fecha.getDate()
          h.fecha = `${dia}/${mes}/${h.fecha.getFullYear()}`

        }

      }


      unidad.historia = historia
      db.disconnect()
      res.send({unidad})
    })

    router.get('/stock', ensureAuth, async function(req, res) {
      let db = new Db()
      let sucursales = await db.getSucursales()
      db.disconnect()
      datosVista.sucursales = sucursales
      res.render('unidades-stock', {titulo: 'Stock de Unidades', datos: datosVista})

    })

    router.get('/stock/:sucursal/:tipo', ensureAuth, async function (req, res) {
      let db = new Db()
      let suc = req.params.sucursal
      let tipo = req.params.tipo
      let operador = (tipo == 1) ? '<' : '>='

      let sucursal = await db.getSucursal(suc)
      sucursal = sucursal[0]

      var unidades = await db.getUnidades(` WHERE estado = 1 AND sucursal = ${suc} and tipo ${operador} 4 `, ` ORDER BY nuevo, marca, modelo`)
      db.disconnect()
      let fecha = new Date()


      let data = {
        template: {shortid: config.reportes.stock}, data: {
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

    })

    router.post('/trasconfirm', async function(req, res) {
      let db = new Db()
      let id = req.body.id
      let sucursal = (await db.getSucursal(req.body.destino))[0]
      let unidad = (await db.getUnidad(id))[0]
      db.disconnect()
      datosVista.unidad = unidad
      datosVista.sucursal = sucursal
      res.render('unidades-confirm-traspaso', {titulo: 'Confirmar', datos: datosVista})
    })



    router.get('/traspaso/:id', ensureAuth, async function(req, res) {
      let db = new Db()
      let unidad = (await db.getUnidad(req.params.id))[0]
      let sucursal = (await db.getSucursal(req.user.sucursal))[0]
      let sucursales = await db.getSucursales()
      db.disconnect()
      sucursales = sucursales.filter(function(s) {

        return s.id_sucursal != req.user.sucursal && s.id_sucursal != 5
      })
      let fecha = new Date()
      datosVista.suc = sucursal
      datosVista.sucursales = sucursales
      datosVista.unidad = unidad
      datosVista.fecha = `${fecha.getDate()}/${fecha.getMonth()+1}/${fecha.getFullYear()}`

      res.render('unidades-traspaso', {titulo: 'Formulario de traspaso de Unidades', datos: datosVista })

    })

    router.get('/ventas', ensureAuth,  co.wrap(function * (req, res) {
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

    router.post('/ventas', async (req, res) => {
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

    router.get('/filtrar', function(req, res) {
      res.render('unidades-filtros', {datos: datosVista})
    })

    router.post('/filtrar', async (req, res) => {
      let db = new Db()
      let hasta = 0, desde = 0
      hasta = req.body.hasta
      desde = req.body.desde
      let where = ` estado = 1 AND tipo = ${req.body.tipo} AND combustible = '${req.body.combustible}'`
      if(desde) {
        where+= ` AND precio >= ${desde}`
      }
      if(hasta) {
        where+= ` AND precio <= ${hasta}`
      }
      let uns = await db.getUnidades( `WHERE ${where}`)
      res.send({uns})
    })

    router.get('/accept/:id',ensureAuth, async function(req, res) {
      let db = new Db()
      let unidad = {
        id_unidad: req.params.id,
        sucursal: req.user.sucursal,
        estado: 1
      }

      await db.saveUnidad(unidad)
      await db.delPendiente(req.params.id)

      let historia = {
        id_unidad_fk: unidad.id_unidad,
        id_sucursal_fk: unidad.sucursal,
        fecha: new Date().toJSON().slice(0,10),
        operacion: 'Traspaso'
      }
      await db.saveHistorial(historia)

      db.disconnect()
      res.redirect('/unidades/pendientes')
    })

    router.get('/:id', ensureAuth, async function(req, res) {
        let id = req.params.id
        let db = new Db()
        let rows = await db.getUnidad(id)
        let fila = rows[0]

        let unidad = {
          id_unidad: id,
          marca: fila.marca,
          modelo: fila.modelo,
          nro_motor: fila.nro_motor,
          nro_chasis: fila.nro_chasis,
          matricula: fila.matricula,
          anio: fila.anio,
          kmts: fila.kmts,
          precio: fila.precio,
          padron: fila.padron,
          sucursal: fila.sucursal,
          color: fila.color,
          toma: req.user.perfil == 1 ? fila.toma : '',
          nuevo: (fila.nuevo == 1)? 'CHECKED': '',
          disabled: ''
        }

        //console.log(unidad)

        if(req.user.sucursal != fila.sucursal) {
          unidad.disabled = 'DISABLED'
        }

        let tipos = [
          {id: 1, tipo: 'Auto', selected: (fila.tipo == 1)? 'SELECTED': ''},
          {id: 2, tipo: 'Camioneta', selected: (fila.tipo == 2)? 'SELECTED': ''},
          {id: 3, tipo: 'Camión', selected: (fila.tipo == 3)? 'SELECTED': ''},
          {id: 4, tipo: 'Moto', selected: (fila.tipo == 4)? 'SELECTED': ''},
          {id: 5, tipo: 'Triciclo', selected: (fila.tipo == 5)? 'SELECTED': ''},
          {id: 6, tipo: 'Cuatriciclo', selected: (fila.tipo == 6)? 'SELECTED': ''},
        ]

        let combustibles = [
          {id: 'N' , comb: 'Nafta', selected: (fila.combustible == 'N')? 'SELECTED': ''},
          {id: 'D' , comb: 'Diesel', selected: (fila.combustible == 'D')? 'SELECTED': ''},
        ]


        let suc = await db.getSucursales()
        db.disconnect()
        suc = suc.map(function(s) {
          s.selected = ''
          if(s.id_sucursal == unidad.sucursal)
            s.selected =  'SELECTED'


            return s
        })

        datosVista.sucursales = suc
        datosVista.unidad = unidad
        datosVista.tipos = tipos
        datosVista.combustibles = combustibles

        res.render('unidades-edit', {titulo: "Formulario de Unidades", datos: datosVista})

    })


    router.post('/', async function(req, res) {
      let criterio = req.body.criterio
      let texto = req.body.texto
      let nuevo = req.body.cero === 'true' ? 1 :  0
      let whereNuevo = nuevo ? `nuevo = ${nuevo} AND ` : ''
      let db = new Db()
      let unidades = await db.getUnidadesSuc(`WHERE ${whereNuevo}  estado = 1 AND sucursal != 5 AND ${criterio} LIKE '${texto}%'`, null)
      db.disconnect()
        let resultado = {
          user: req.user,
          unidades: unidades
        }
        res.send({res: resultado})

    })

    router.get('/historial/:id', async function(req, res) {
      let db = new Db()
      let id = req.params.id
      let historia = await db.getHistorial(id)

      for(let h of historia) {
        h.sucursal = (await db.getSucursal(h.id_sucursal_fk))[0]
        let mes = h.fecha.getMonth()+1 > 9 ? h.fecha.getMonth()+1 : '0' + (h.fecha.getMonth()+1)
        let dia = h.fecha.getDate() > 9 ? h.fecha.getDate() : '0' + h.fecha.getDate()
        h.fecha = `${dia}/${mes}/${h.fecha.getFullYear()}`

      }

      db.disconnect()

      res.send({historia})
    })

    router.get('/', function(req, res) {
      res.end('Unidades')
    })

    return router
}




module.exports = returnRouter;
