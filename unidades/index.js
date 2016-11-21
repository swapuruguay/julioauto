var con = require('../bd')

function listar(where, order, callback) {
  console.log(where)
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

module.exports.listar = listar
