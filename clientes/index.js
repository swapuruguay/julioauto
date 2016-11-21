var con = require('../bd')

function listar(where, order, callback) {

  var orden = '', cond = ''
        if(where) {
            cond = where
        }

        if(order) {
            orden = order
        }

  con.query('SELECT * FROM clientes ', function(err, rows) {
      if(err) {
        callback(err)
      } else {
        callback(null, rows)
      }
}

module.exports.listar = listar
