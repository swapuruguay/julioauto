
const express = require('express');
const router = express.Router();
const Db = require('../bd')
const config = require('../config')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const request = require('request')
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

let returnRouter = function(io) {
    router.use(function (req, res, next) {
      datosVista = {}
      datosVista.user = req.user
      next();
    });

    io.on('connection', function(socket) {
      
      socket.on('unir', async(function(sala) {
        let db = new Db()
        console.log(sala)
        let autos = await (db.getPendientes(sala))
        db.disconnect()
        let regs = autos.length
        socket.emit('devolver', regs)
        socket.join(sala)
        //console.log(socket.room)
        
      }))
     
      /*console.log(socket.id) */
      socket.on('enviar', function(msg) {
        socket.broadcast.to(msg).emit('devolver', 1)
      })
    }) 

    router.get('/nuevo', ensureAuth, async(function(req, res) {

      let nro = ''
      let db = new Db()
      
      let suc = await(db.getSucursales())
      db.disconnect()
      datosVista.sucursales = suc
      res.render('unidades', {titulo: 'Formulario de Unidades',datos: datosVista})
    }))

    

    router.get('/listar', ensureAuth, async(function(req, res) {
      let db = new Db()
      let sucursales = await(db.getSucursales())
      db.disconnect()
      datosVista.sucursales = sucursales
          

     res.render('unidades-listar', {titulo: 'Formulario de Unidades', datos: datosVista})

          
    }))

    router.post('/traspasar', async(function(req, res) {
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

      await(db.saveUnidad(un))
      await(db.saveTraspaso(datos))

      db.disconnect()

        res.render('unidades-ok-traspaso', {datos: datosVista})
    
        

    }))

    

    router.get('/pendientes', ensureAuth, async(function(req, res) {
      let db = new Db()
      let pend = await(db.getPendientes(req.user.sucursal))
      db.disconnect()
      datosVista.pendientes = pend
      res.render('unidades-pendientes', {titulo: 'Unidades en tránsito', datos: datosVista})
    }))

    router.post('/save', async(function(req, res) {
      let db = new Db()
      //console.log(req.body)
      let nuevo = ((req.body.nuevo == 'on') ? 1 : 0)
      let id = (req.body.id == '')? 0 : req.body.id
      let unidad = {
        id_unidad: id,
        marca: req.body.marca.toUpperCase(),
        modelo: req.body.modelo.toUpperCase(),
        nro_motor: req.body.nromotor.toUpperCase(),
        anio: req.body.anio,
        matricula: req.body.matricula.toUpperCase(),
        color: req.body.color.toUpperCase(),
        sucursal: req.user.sucursal,
        nuevo: nuevo,
        padron: req.body.padron,
        precio: req.body.precio,
        combustible: req.body.combustible,
        estado: 1,
        tipo: req.body.tipo
      }
      try {
         await(db.saveUnidad(unidad)) 
         db.disconnect()
         res.send('Ok')
      } catch(err) {
        
        if(err.message == 'ER_DUP_ENTRY') {
          db.disconnect()
          res.send('Registro duplicado')
        } else {
          db.disconnect()
          res.send('Ocurrió un error, intente de nuevo')
        }
  
      
    }

    }))

    router.get('/stock', ensureAuth, async(function(req, res) {
      let db = new Db()
      let sucursales = await(db.getSucursales())
      db.disconnect()
      datosVista.sucursales = sucursales
      res.render('unidades-stock', {titulo: 'Stock de Unidades', datos: datosVista})

    }))

    router.get('/stock/:sucursal/:tipo', ensureAuth, async(function (req, res) {
      let db = new Db()
      let suc = req.params.sucursal
      let tipo = req.params.tipo
      let operador = (tipo == 1) ? '<' : '>='

      let sucursal = await(db.getSucursal(suc))
      sucursal = sucursal[0]

      var unidades = await (db.getUnidades(` WHERE estado = 1 AND sucursal = ${suc} and tipo ${operador} 4 `, ` ORDER BY nuevo, marca, modelo`))
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
    
    }))

    router.post('/trasconfirm', async(function(req, res) {
      let db = new Db()
      let id = req.body.id
      let sucursal = await(db.getSucursal(req.body.destino))[0]
      let unidad = await(db.getUnidad(id))[0]
      db.disconnect()
      datosVista.unidad = unidad
      datosVista.sucursal = sucursal
      res.render('unidades-confirm-traspaso', {titulo: 'Confirmar', datos: datosVista})
    }))



    router.get('/traspaso/:id', ensureAuth, async(function(req, res) {
      let db = new Db()
      let unidad = await(db.getUnidad(req.params.id))[0]
      //console.log(unidad)
      let sucursal = await(db.getSucursal(req.user.sucursal))[0]
      console.log(sucursal)
      let sucursales = await(db.getSucursales())
      db.disconnect()
      sucursales = sucursales.filter(function(s) {
        
        return s.id_sucursal != req.user.sucursal
      })
      let fecha = new Date()
      datosVista.suc = sucursal
      datosVista.sucursales = sucursales
      datosVista.unidad = unidad
      datosVista.fecha = `${fecha.getDate()}/${fecha.getMonth()+1}/${fecha.getFullYear()}`

      res.render('unidades-traspaso', {titulo: 'Formulario de traspaso de Unidades', datos: datosVista })
      
    }))

    router.get('/accept/:id',ensureAuth, async(function(req, res) {
      let db = new Db()
      let unidad = {
        id_unidad: req.params.id,
        sucursal: req.user.sucursal,
        estado: 1
      }
      
      await(db.saveUnidad(unidad))
      await(db.delPendiente(req.params.id))
      db.disconnect()
      res.redirect('/unidades/pendientes')
    }))

    router.get('/:id', ensureAuth, async(function(req, res) {
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
          sucursal: fila.sucursal,
          color: fila.color,
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
        
        
        let suc = await(db.getSucursales())
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
          
    }))


    router.post('/', async(function(req, res) {
      let criterio = req.body.criterio
      let texto = req.body.texto
      let db = new Db()
      let unidades = await(db.getUnidadesSuc(` WHERE estado = 1 AND sucursal != 5 AND ${criterio} LIKE '${texto}%'`, null))
      db.disconnect()
        let resultado = {
          user: req.user,
          unidades: unidades
        }
        res.send({res: resultado})
    
    }))

    router.get('/', function(req, res) {
      res.end('Unidades')
    })
      return router
}




module.exports = returnRouter;
