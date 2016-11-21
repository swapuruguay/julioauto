var mysql = require ('mysql')

var config = require('../config')

var datos = {
    host: config.host,
    user:   config.user,
    password: config.password,
    database: config.database
}

var con = mysql.createConnection(datos)

module.exports = con
