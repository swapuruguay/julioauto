const mysql = require('promise-mysql')
const config = require('../config')
const co = require('co')

class Bd {

    constructor() {
        this.connect()
    }
    
    connect() {
       let datos = {
           host: config.host,
           user: config.user,
           password: config.password,
           database: config.database
       }
       this.con = mysql.createConnection(datos)
       let connection = this.con
       let setup = co.wrap(function *() {
           let conn = yield connection
           return conn
       }) 
      return Promise.resolve(setup())
    }

    getUnidad(id) {
        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let unidad = yield conn.query("SELECT * FROM unidades WHERE id_unidad = " + id)

            if (!unidad) {
                return Promise.reject(new Error(`Unidad ${id} not found`))
            }

            return Promise.resolve(unidad)
        })

        return Promise.resolve(task())
     
    }

    getUnidades(where, order) {
        let orden = '', cond = ''
        if(where) {
            cond = where
        }

        if(order) {
            orden = order
        }

        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let unidades = yield conn.query("SELECT * FROM unidades " + cond + orden)

            if (!unidades) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(unidades)
        })

        return Promise.resolve(task()) 
      }
    

    getCliente(id) {
      let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let cliente = yield conn.query("SELECT * FROM clientes WHERE id_cliente = " + id)

            if (!cliente) {
                return Promise.reject(new Error(`Cliente ${id} not found`))
            }

            return Promise.resolve(cliente)
        })

        return Promise.resolve(task())
    }

    getClientes(where, order) {
        let orden = '', cond = ''
        if(where) {
            cond = where
        }

        if(order) {
            orden = order
        }

        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let clientes = yield conn.query("SELECT * FROM clientes " + cond + orden)

            if (!clientes) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(clientes)
        })

        return Promise.resolve(task()) 
      }
    

    getSucursales() {
       let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let sucursales = yield conn.query("SELECT * FROM sucursales")

            if (!sucursales) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(sucursales)
        })

        return Promise.resolve(task()) 
    }

    getSucursal(id) {
      let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let sucursal = yield conn.query(`SELECT * FROM sucursales WHERE id_sucursal = ${id}`)

            if (!sucursal) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(sucursal)
        })

        return Promise.resolve(task()) 
    }

    getUser(where, order) {
        let orden = '', cond = ''
        if(where) {
            cond = where
        }

        if(order) {
            orden = order
        }

        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let user = yield conn.query(`SELECT * FROM usuarios_web  ${cond} ${orden}`)

            if (!user) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(user)
        })

        return Promise.resolve(task())    
    }

    saveUnidad(unidad) {
      let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let sql;
            if(unida.id_unidad == 0) {
                sql = 'INSERT INTO unidades SET ? '
            } else {
                sql = `UPDATE unidades SET ? WHERE id_unidad = ${unidad.id_unidad}`
            }
            
            let user = yield conn.query(sql, unidad)

            if (!user) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(user)
        })

        return Promise.resolve(task())     
    }
 }

module.exports = Bd