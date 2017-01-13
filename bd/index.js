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

    disconnect() {
        let connection = this.con
       let setup = co.wrap(function * () {
         //  console.log(mysql)
           let conn = yield connection
           conn.destroy()
           return conn
       }) 
      return Promise.resolve(setup())
    }

    getUnidad(id) {
        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let unidad = yield conn.query("SELECT* FROM unidades WHERE id_unidad = " + id)

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

      getUnidadesSuc(where, order) {
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
            let unidades = yield conn.query('SELECT unidades.*, sucursales.nombre FROM unidades JOIN sucursales ON sucursales.id_sucursal = unidades.sucursal' + cond + orden)

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

      saveCliente(cliente) {
      let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let sql;
            if(cliente.id_cliente == 0) {
                sql = 'INSERT INTO clientes SET ? '
            } else {
                sql = `UPDATE clientes SET ? WHERE id_cliente = ${cliente.id_cliente}`
            }
            
            let result = yield conn.query(sql, cliente)

            if (!result) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(result)
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
            if(unidad.id_unidad == 0) {
                sql = 'INSERT INTO unidades SET ? '
            } else {
                sql = `UPDATE unidades SET ? WHERE id_unidad = ${unidad.id_unidad}`
            }
            
            let result
            try {
                result = yield conn.query(sql, unidad)
                return Promise.resolve(result)
            } catch(err) {
                console.log(err)
                return Promise.reject(new Error(err.code))
            }
        })

        return Promise.resolve(task())     
    }

    saveVenta(venta) {
        let connection = this.con
            let task = co.wrap(function * () {
                let conn = yield connection
                let sql = 'INSERT INTO ventas SET ? '
                let result
                try {
                    result = yield conn.query(sql, venta)
                    return Promise.resolve(result)
                } catch (err) {
                    console.log(err)
                    return Promise.reject(new Error(err.code))
                }
                
            })
            return Promise.resolve(task())
    }   

    saveTraspaso(datos) {
      let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let sql;
            sql = 'INSERT INTO traspasos SET ? '
                       
            let result = yield conn.query(sql, datos)

            if (!result) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(result)
        })

        return Promise.resolve(task())     
    }

    getPendientes(idSucursal) {
       

        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let user = yield conn.query(`SELECT traspasos.id_unidad_fk, unidades.marca, unidades.modelo, sucursales.nombre FROM traspasos 
            JOIN unidades ON unidades.id_unidad = traspasos.id_unidad_fk
            JOIN sucursales ON traspasos.sucursal_origen=sucursales.id_sucursal WHERE sucursal_destino = ${idSucursal}`)

            if (!user) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(user)
        })

        return Promise.resolve(task())    
    }

    delPendiente(idUnidad) {
        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let sql;
            sql = `DELETE FROM traspasos WHERE id_unidad_fk = ${idUnidad}`
                       
            let result = yield conn.query(sql)

            if (!result) {
                return Promise.reject(new Error(`not found`))
            }

            return Promise.resolve(result)
        })

        return Promise.resolve(task())    
    }

    getSenias() {
        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let list = conn.query('SELECT * FROM senias')
            if(!list) {
                return Promise.reject(new Error('No existen señas'))
            }
            return Promise.resolve(list)
        })
        return Promise.resolve(task())
    }

    saveSenia(senia) {
        let connection = this.con
        let task = co.wrap(function * () {
            let conn = yield connection
            let sql = 'INSERT INTO senias SET ? '
            let result = conn.query(sql, senia)
            if(!result) {
                return Promise.reject(new Error('No existen señas'))
            }

            return Promise.resolve(result)
        })
        return Promise.resolve(task())    
    }
 }

module.exports = Bd