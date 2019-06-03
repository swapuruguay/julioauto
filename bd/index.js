const mysql = require("promise-mysql");
const config = require("../config");

class Bd {
  async connect() {
    let datos = {
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database
      //insecureAuth : true
    };
    try {
      this.con = await mysql.createPool(datos).getConnection();
    } catch (error) {
      console.error(error);
    }
  }

  async disconnect() {
    await this.con.connection.release();
  }

  async getUnidad(id) {
    let unidad = await this.con.query(
      `SELECT * FROM unidades WHERE id_unidad = ${id}`
    );

    if (!unidad) {
      return Promise.reject(new Error(`Unidad ${id} not found`));
    }

    return Promise.resolve(unidad);
  }

  async getUnidadTemp(id) {
    let unidad = await this.con.query(
      `SELECT * FROM unidades_temp WHERE id_unidad = ${id}`
    );

    if (!unidad) {
      return Promise.reject(new Error(`Unidad ${id} not found`));
    }

    return Promise.resolve(unidad);
  }

  async getUnidades(where, order) {
    let orden = order || "";
    let cond = where || "";

    let sql = `SELECT * FROM unidades ${cond} ${orden}`;

    let unidades = await this.con.query(sql);

    if (!unidades) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(unidades);
  }

  async getUnidadesSuc(where, order) {
    let orden = "",
      cond = "";
    if (where) {
      cond = where;
    }

    if (order) {
      orden = order;
    }

    let unidades = await this.con.query(
      `SELECT unidades.*, ifnull(nro_chasis, '') as chasis, sucursales.nombre FROM unidades JOIN sucursales ON sucursales.id_sucursal = unidades.sucursal ${cond} ${orden}`
    );

    if (!unidades) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(unidades);
  }

  async getCliente(id) {
    let cliente = await this.con.query(
      "SELECT * FROM clientes WHERE id_cliente = " + id
    );

    if (!cliente) {
      return Promise.reject(new Error(`Cliente ${id} not found`));
    }

    return Promise.resolve(cliente);
  }

  async getClientes(where, order) {
    let orden = "",
      cond = "";
    if (where) {
      cond = where;
    }

    if (order) {
      orden = order;
    }

    let clientes = await this.con.query(
      "SELECT * FROM clientes " + cond + orden
    );

    if (!clientes) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(clientes);
  }

  async saveCliente(cliente) {
    let sql;
    if (cliente.id_cliente == 0) {
      sql = "INSERT INTO clientes SET ? ";
    } else {
      sql = `UPDATE clientes SET ? WHERE id_cliente = ${cliente.id_cliente}`;
    }

    let result = await this.con.query(sql, cliente);

    if (!result) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(result);
  }

  async getSucursales() {
    let sucursales = await this.con.query("SELECT * FROM sucursales");

    if (!sucursales) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(sucursales);
  }

  async getSucursal(id) {
    let sucursal = await this.con.query(
      `SELECT * FROM sucursales WHERE id_sucursal = ${id}`
    );

    if (!sucursal) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(sucursal);
  }

  async getUser(where, order) {
    let orden = "",
      cond = "";
    if (where) {
      cond = where;
    }
    if (order) {
      orden = order;
    }

    let user = await this.con.query(
      `SELECT * FROM usuarios_web  ${cond} ${orden}`
    );

    if (!user) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(user);
  }

  async saveUnidad(unidad) {
    let sql;
    if (unidad.id_unidad == 0) {
      sql = "INSERT INTO unidades SET ? ";
    } else {
      sql = `UPDATE unidades SET ? WHERE id_unidad = ${unidad.id_unidad}`;
    }

    let result;
    try {
      result = await this.con.query(sql, unidad);
      return Promise.resolve(result);
    } catch (err) {
      console.log(err);
      return Promise.reject(new Error(err.code));
    }
  }

  async saveUnidadTemp(unidad) {
    let sql;
    if (unidad.id_unidad == 0) {
      sql = "INSERT INTO unidades_temp SET ? ";
    } else {
      sql = `UPDATE unidades_temp SET ? WHERE id_unidad = ${unidad.id_unidad}`;
    }
    let result;
    try {
      result = await this.con.query(sql, unidad);
      return Promise.resolve(result);
    } catch (err) {
      console.log(err);
      return Promise.reject(new Error(err.code));
    }
  }

  async saveVenta(venta) {
    let sql = "INSERT INTO ventas SET ? ";
    let result;
    try {
      result = await this.con.query(sql, venta);
      return Promise.resolve(result);
    } catch (err) {
      //console.log(err)
      return Promise.reject(new Error(err.code));
    }
  }

  async saveTraspaso(datos) {
    let sql;
    sql = "INSERT INTO traspasos SET ? ";

    let result;

    try {
      result = await this.con.query(sql, datos);
      return Promise.resolve(result);
    } catch (err) {
      //console.log(err)
      return Promise.reject(new Error(err.code));
    }
  }

  async getPendientes(idSucursal) {
    let user = await this.con
      .query(`SELECT traspasos.id_unidad_fk, unidades.marca, unidades.modelo, sucursales.nombre FROM traspasos
            JOIN unidades ON unidades.id_unidad = traspasos.id_unidad_fk
            JOIN sucursales ON traspasos.sucursal_origen=sucursales.id_sucursal WHERE sucursal_destino = ${idSucursal}`);

    if (!user) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(user);
  }

  async delPendiente(idUnidad) {
    let sql;
    sql = `DELETE FROM traspasos WHERE id_unidad_fk = ${idUnidad}`;

    let result = await this.con.query(sql);

    if (!result) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(result);
  }

  async eliminarSenia(idUnidad) {
    let sql;
    sql = `DELETE FROM unidades_temp WHERE id_unidad = ${idUnidad}`;

    let result = await this.con.query(sql);

    if (!result) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(result);
  }

  async getSenias(where) {
    let cond = where || "";
    let list = await this.con.query(
      `SELECT senias.* FROM senias JOIN unidades_temp ON senias.id_unidad_fk = unidades_temp.id_unidad ${cond}`
    );
    if (!list) {
      return Promise.reject(new Error("No existen señas"));
    }
    return Promise.resolve(list);
  }

  async getSenia(id) {
    let list = await this.con.query(
      `SELECT senias.* FROM senias JOIN unidades_temp ON senias.id_unidad_fk = unidades_temp.id_unidad WHERE id_senia = ${id}`
    );
    if (!list) {
      return Promise.reject(new Error("No existen señas"));
    }
    return Promise.resolve(list);
  }

  async getUnidadSeniada(id) {
    let list = await this.con.query(
      `SELECT * FROM unidades_senias WHERE id_senia_fk = ${id}`
    );
    if (!list) {
      return Promise.reject(new Error("No existen señas"));
    }
    return Promise.resolve(list);
  }

  async saveSenia(senia) {
    let sql = "INSERT INTO senias SET ? ";
    let result = await this.con.query(sql, senia);
    if (!result) {
      return Promise.reject(new Error("No existen señas"));
    }

    return Promise.resolve(result);
  }

  async saveUnidadSenia(senia) {
    let sql = "INSERT INTO unidades_senias SET ? ";
    let result = await this.con.query(sql, senia);
    if (!result) {
      return Promise.reject(new Error("No existen señas"));
    }

    return Promise.resolve(result);
  }

  async getVentas(where, order) {
    let orden = order || "";
    let cond = where || "";

    let list = await this.con.query(`SELECT * from ventas ${cond} ${orden}`);
    if (!list) {
      return Promise.reject(new Error("No existen ventas"));
    }
    return Promise.resolve(list);
  }

  async getVentasAgrupadas(where, order) {
    let orden = order || "";
    let cond = where || "";
    let sql = `SELECT s.nombre, COUNT(*) AS cantidad, u.nuevo from ventas v JOIN
                         unidades u ON u.id_unidad = v.id_unidad_fk JOIN sucursales s ON s.id_sucursal = v.id_sucursal_fk ${cond}
                         GROUP BY v.id_sucursal_fk`;
    let list = await this.con.query(sql);
    if (!list) {
      return Promise.reject(new Error("No existen ventas"));
    }
    return Promise.resolve(list);
  }

  async getHistorial(id) {
    let list = await this.con.query(
      `SELECT * from historial WHERE id_unidad_fk = ${id}`
    );
    if (!list) {
      return Promise.reject(new Error("No existen registros"));
    }
    return Promise.resolve(list);
  }

  async saveHistorial(historial) {
    let sql = "INSERT INTO historial SET ? ";
    let result = await this.con.query(sql, historial);
    if (!result) {
      return Promise.reject(new Error("Hubo un error"));
    }

    return Promise.resolve(result);
  }
}

module.exports = Bd;
