var con = require('../bd')
const co = require('co')
const Promise = require('bluebird')

function listar(where, order, callback) {
  
  var orden = '', cond = ''
        if(where) {
            cond = where
        }

        if(order) {
            orden = order
        }

  con.query('SELECT * FROM unidades ' + cond + orden, function(err, rows) {
      if(err) {
        callback(err)
      } else {
        callback(null, rows)
      }

    })
}
/*
function getById(id, callback) {
  
    con.query('SELECT * FROM unidades WHERE id_unidad = ' + id, function(err, rows) {
      if(err) {
        callback(err)
      } else {
        callback(null, rows)
      }

    })
}
*/
function getById (id, callback) {
    
   
    let tasks = co.wrap(function * () {
    var sql = 'SELECT * FROM unidades WHERE id_unidad = ' +id
    let unidad = yield con.query(sql)
      console.log(sql)
      if (!unidad) {
        return Promise.reject(new Error(`Unidad ${id} not found`))
      }

      return Promise.resolve(unidad)
    })

    return Promise.resolve(tasks()).asCallback(callback)
  }

module.exports.listar = listar
module.exports.getById = getById
