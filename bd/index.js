const database = require("./database");
const config = require("../config");

class Bd {
  async getUnidad(id) {
    let db = new database(config);
    let unidad = await db.query(
      `SELECT * FROM unidades WHERE id_unidad = ${id}`
    );

    if (!unidad) {
      await db.close();
      return Promise.reject(new Error(`Unidad ${id} not found`));
    }
    await db.close();
    return Promise.resolve(unidad);
  }

  async getUnidadTemp(id) {
    let db = new database(config);
    let unidad;
    try {
      unidad = await db.query(
        `SELECT * FROM unidades_temp WHERE id_unidad = ${id}`
      );
    } catch (error) {
      console.error(error);
    }

    if (!unidad) {
      await db.close();
      return Promise.reject(new Error(`Unidad ${id} not found`));
    }
    await db.close();
    return Promise.resolve(unidad);
  }

  async getUnidades(where, order) {
    let db = new database(config);
    let orden = order || "";
    let cond = where || "";

    let sql = `SELECT * FROM unidades ${cond} ${orden}`;
    let unidades;
    try {
      unidades = await db.query(sql);
    } catch (error) {}

    if (!unidades) {
      await db.close();
      return Promise.reject(new Error(`not found`));
    }
    await db.close();
    return Promise.resolve(unidades);
  }

  async getUnidadesSuc(where, order) {
    let db = new database(config);
    let orden = "",
      cond = "";
    if (where) {
      cond = where;
    }

    if (order) {
      orden = order;
    }
    let unidades;
    try {
      unidades = await db.query(
        `SELECT unidades.*, ifnull(nro_chasis, '') as chasis, sucursales.nombre FROM unidades JOIN sucursales ON sucursales.id_sucursal = unidades.sucursal ${cond} ${orden}`
      );
    } catch (error) {
      console.error(error);
    }

    if (!unidades) {
      await db.close();
      return Promise.reject(new Error(`not found`));
    }
    await db.close();
    return Promise.resolve(unidades);
  }

  async getCliente(id) {
    let db = new database(config);
    let cliente = await db.query(
      "SELECT * FROM clientes WHERE id_cliente = " + id
    );

    if (!cliente) {
      await db.close();
      return Promise.reject(new Error(`Cliente ${id} not found`));
    }
    await db.close();
    return Promise.resolve(cliente);
  }

  async getClientes(where, order) {
    let db = new database(config);
    let orden = "",
      cond = "";
    if (where) {
      cond = where;
    }

    if (order) {
      orden = order;
    }

    let clientes = await db.query("SELECT * FROM clientes " + cond + orden);

    if (!clientes) {
      await db.close();
      return Promise.reject(new Error(`not found`));
    }
    await db.close();
    return Promise.resolve(clientes);
  }

  async saveCliente(cliente) {
    let db = new database(config);
    let sql;
    if (cliente.id_cliente == 0) {
      sql = "INSERT INTO clientes SET ? ";
    } else {
      sql = `UPDATE clientes SET ? WHERE id_cliente = ${cliente.id_cliente}`;
    }

    let result = await db.query(sql, cliente);

    if (!result) {
      await db.close();
      return Promise.reject(new Error(`not found`));
    }
    await db.close();
    return Promise.resolve(result);
  }

  async getSucursales() {
    let db = new database(config);
    let sucursales = await db.query("SELECT * FROM sucursales");

    if (!sucursales) {
      await db.close();
      return Promise.reject(new Error(`not found`));
    }
    await db.close();
    return Promise.resolve(sucursales);
  }

  async getSucursal(id) {
    let db = new database(config);
    let sucursal;
    try {
      sucursal = await db.query(
        `SELECT * FROM sucursales WHERE id_sucursal = ${id}`
      );
    } catch (error) {
    } finally {
      await db.close();
    }

    if (!sucursal) {
      return Promise.reject(new Error(`not found`));
    }

    return Promise.resolve(sucursal);
  }

  async getUser(where, order) {
    let db = new database(config);
    let orden = "",
      cond = "";
    if (where) {
      cond = where;
    }
    if (order) {
      orden = order;
    }
    let user;
    try {
      user = await db.query(`SELECT * FROM usuarios_web  ${cond} ${orden}`);
    } catch (error) {
      console.log(error);
    } finally {
      await db.close();
    }

    if (!user) {
      //await db.close();
      return Promise.reject(new Error(`not found`));
    }
    //await db.close();
    return Promise.resolve(user);
  }

  async saveUnidad(unidad) {
    let db = new database(config);
    let sql;
    if (unidad.id_unidad == 0) {
      sql = "INSERT INTO unidades SET ? ";
    } else {
      sql = `UPDATE unidades SET ? WHERE id_unidad = ${unidad.id_unidad}`;
    }

    let result;
    try {
      result = await db.query(sql, unidad);
      await db.close();
      return Promise.resolve(result);
    } catch (err) {
      console.log(err);
      await db.close();
      return Promise.reject(new Error(err.code));
    }
  }

  async saveUnidadTemp(unidad) {
    let db = new database(config);
    let sql;
    if (unidad.id_unidad == 0) {
      sql = "INSERT INTO unidades_temp SET ? ";
    } else {
      sql = `UPDATE unidades_temp SET ? WHERE id_unidad = ${unidad.id_unidad}`;
    }
    let result;
    try {
      result = await db.query(sql, unidad);
      await db.close();
      return Promise.resolve(result);
    } catch (err) {
      console.log(err);
      await db.close();
      return Promise.reject(new Error(err.code));
    }
  }

  async saveVenta(venta) {
    let db = new database(config);
    let sql = "INSERT INTO ventas SET ? ";
    let result;
    try {
      result = await db.query(sql, venta);
      await db.close();
      return Promise.resolve(result);
    } catch (err) {
      //console.log(err)
      await db.close();
      return Promise.reject(new Error(err.code));
    }
  }

  async saveTraspaso(datos) {
    let db = new database(config);
    let sql;
    sql = "INSERT INTO traspasos SET ? ";

    let result;

    try {
      result = await db.query(sql, datos);
      await db.close();
      return Promise.resolve(result);
    } catch (err) {
      //console.log(err)
      await db.close();
      return Promise.reject(new Error(err.code));
    }
  }

  async getPendientes(idSucursal) {
    let db = new database(config);
    let user;
    try {
      user = await db.query(`SELECT traspasos.id_unidad_fk, unidades.marca, unidades.modelo, sucursales.nombre FROM traspasos
              JOIN unidades ON unidades.id_unidad = traspasos.id_unidad_fk
              JOIN sucursales ON traspasos.sucursal_origen=sucursales.id_sucursal WHERE sucursal_destino = ${idSucursal}`);
    } catch (error) {
      console.error(error);
    }

    if (!user) {
      await db.close();
      return Promise.reject(new Error(`not found`));
    }
    await db.close();
    return Promise.resolve(user);
  }

  async delPendiente(idUnidad) {
    let db = new database(config);
    let sql;
    sql = `DELETE FROM traspasos WHERE id_unidad_fk = ${idUnidad}`;

    let result = await db.query(sql);

    if (!result) {
      await db.close();
      return Promise.reject(new Error(`not found`));
    }
    await db.close();
    return Promise.resolve(result);
  }

  async eliminarSenia(idUnidad) {
    let db = new database(config);
    let sql;
    sql = `DELETE FROM unidades_temp WHERE id_unidad = ${idUnidad}`;

    let result = await db.query(sql);

    if (!result) {
      await db.close();
      return Promise.reject(new Error(`not found`));
    }
    await db.close();
    return Promise.resolve(result);
  }

  async getSenias(where) {
    let db = new database(config);
    let cond = where || "";
    let list = await db.query(
      `SELECT senias.* FROM senias JOIN unidades_temp ON senias.id_unidad_fk = unidades_temp.id_unidad ${cond}`
    );
    if (!list) {
      await db.close();
      return Promise.reject(new Error("No existen señas"));
    }
    await db.close();
    return Promise.resolve(list);
  }

  async getSenia(id) {
    let db = new database(config);
    let list = await db.query(
      `SELECT senias.* FROM senias JOIN unidades_temp ON senias.id_unidad_fk = unidades_temp.id_unidad WHERE id_senia = ${id}`
    );
    if (!list) {
      await db.close();
      return Promise.reject(new Error("No existen señas"));
    }
    await db.close();
    return Promise.resolve(list);
  }

  async getUnidadSeniada(id) {
    let db = new database(config);
    let list = await db.query(
      `SELECT * FROM unidades_senias WHERE id_senia_fk = ${id}`
    );
    if (!list) {
      await db.close();
      return Promise.reject(new Error("No existen señas"));
    }
    await db.close();
    return Promise.resolve(list);
  }

  async saveSenia(senia) {
    let db = new database(config);
    let sql = "INSERT INTO senias SET ? ";
    let result = await db.query(sql, senia);
    if (!result) {
      await db.close();
      return Promise.reject(new Error("No existen señas"));
    }
    await db.close();
    return Promise.resolve(result);
  }

  async saveUnidadSenia(senia) {
    let db = new database(config);
    let sql = "INSERT INTO unidades_senias SET ? ";
    let result = await db.query(sql, senia);
    if (!result) {
      await db.close();
      return Promise.reject(new Error("No existen señas"));
    }
    await db.close();
    return Promise.resolve(result);
  }

  async getVentas(where, order) {
    let db = new database(config);
    let orden = order || "";
    let cond = where || "";

    let list = await db.query(`SELECT * from ventas ${cond} ${orden}`);
    if (!list) {
      await db.close();
      return Promise.reject(new Error("No existen ventas"));
    }
    await db.close();
    return Promise.resolve(list);
  }

  async getVentasAgrupadas(where, order) {
    let db = new database(config);
    let cond = where || "";
    let sql = `SELECT s.nombre, COUNT(*) AS cantidad, u.nuevo from ventas v JOIN
                         unidades u ON u.id_unidad = v.id_unidad_fk JOIN sucursales s ON s.id_sucursal = v.id_sucursal_fk ${cond}
                         GROUP BY v.id_sucursal_fk`;
    let list = await db.query(sql);
    if (!list) {
      await db.close();
      return Promise.reject(new Error("No existen ventas"));
    }
    await db.close();
    return Promise.resolve(list);
  }

  async saveCotiza(cotizacion) {
    let id = cotizacion.id || 0;
    const db = new database(config);
    let sql = "";
    if (id == 0) {
      sql = "INSERT INTO dolar SET ? ";
    } else {
      sql = `UPDATE dolar SET cotizacion = ${cotizacion.dolar} WHERE id_dolar = ${id}`;
    }
    let result = await db.query(sql, cotizacion);
    if (!result) {
      await db.close();
      return Promise.reject(new Error("Ocurrió un error"));
    }
    await db.close();
    return Promise.resolve(result);
  }

  async getCotizacion() {
    const db = new database(config);
    let sql = "SELECT * FROM dolar ORDER BY id_dolar DESC LIMIT 1";
    let result = await db.query(sql);
    if (!result) {
      await db.close();
      return Promise.reject(new Error("Ocurrió un error"));
    }
    await db.close();
    return Promise.resolve(result);
  }

  async getHistorial(id) {
    let db = new database(config);
    let list = await db.query(
      `SELECT * from historial WHERE id_unidad_fk = ${id}`
    );
    if (!list) {
      await db.close();
      return Promise.reject(new Error("No existen registros"));
    }
    await db.close();
    return Promise.resolve(list);
  }

  async saveHistorial(historial) {
    let db = new database(config);
    let sql = "INSERT INTO historial SET ? ";
    let result = await db.query(sql, historial);
    if (!result) {
      await db.close();
      return Promise.reject(new Error("Hubo un error"));
    }
    await db.close();
    return Promise.resolve(result);
  }

  async getCrm(id) {
    let db = new database(config);
    let list = await db.query(
      `SELECT crm.fecha, crm.id_crm, crm.texto, tc.tema from crm 
      JOIN temas_crm tc ON tc.id_tema = crm.tema WHERE id_cliente_fk = ${id}`
    );
    if (!list) {
      await db.close();
      return Promise.reject(new Error("No existen registros"));
    }
    await db.close();
    return Promise.resolve(list);
  }
  async saveCrm(crm) {
    let db = new database(config);
    let sql = "INSERT INTO crm SET ? ";

    let result = await db.query(sql, crm);
    if (!result) {
      await db.close();
      return Promise.reject(new Error("Ocurrió un error"));
    }
    await db.close();
    return Promise.resolve(result);
  }
}

module.exports = Bd;
