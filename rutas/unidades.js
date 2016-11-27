
const express = require('express');
const router = express.Router();
const Db = require('../bd')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const request = require('request')

function ensureAuth(req, res, next) {
    if(req.isAuthenticated()) {

        return next()
    }
    res.redirect('/login')
}

router.get('/nuevo', ensureAuth, function(req, res) {

  var nro = 0
  res.render('unidades', {titulo: 'Formulario de Unidades', nro: nro})
})

router.get('/listar', ensureAuth, async(function(req, res) {
   let db = new Db()
   let sucursales = await(db.getSucursales())

  res.render('unidades-listar', {titulo: 'Formulario de Unidades', sucursales: sucursales})

      
}))





router.get('/stock/:sucursal', ensureAuth, async(function (req, res) {
  let db = new Db()
  let suc = req.params.sucursal

  let sucursal = await(db.getSucursal(suc))
  sucursal = sucursal[0]

  var unidades = await (db.getUnidades(` WHERE estado = 1 AND sucursal = ${suc}`, ` ORDER BY nuevo, marca, modelo`))
  let fecha = new Date()
    

  let data = {
    template: {shortid:'Skyx99Nzl'}, data: {
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
      sucursal: fila.sucursal
    }
    
    let suc = await(db.getSucursales())

    suc = suc.map(function(s) {
      s.selected = ''
      if(s.id_sucursal == unidad.sucursal)
        s.selected =  'SELECTED'


        return s
    })
   
    res.render('unidades-edit', {titulo: "Formulario de Unidades", unidad: unidad, sucursales: suc})
    
    
    
}))


router.post('/', async(function(req, res) {
  let criterio = req.body.criterio
  let texto = req.body.texto
  let db = new Db()
  let rows = await(db.getUnidades(` WHERE estado = 1 AND ${criterio} LIKE '${texto}%'`, null))
  console.log(rows)
    res.send({unidades: rows})
 
}))

router.get('/', function(req, res) {
  res.end('Unidades')
})

module.exports = router;
