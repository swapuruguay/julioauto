const express = require("express");
const router = express.Router();
const Db = require("../bd");
const config = require("../config");
const request = require("request");
const formData = require("express-form-data");
const {notificar} = require('../bot')
let datosVista = {};
// parsing data with connect-multiparty. Result set on req.body and req.files
router.use(formData.parse());
// clear all empty files
router.use(formData.format());
// change file objects to node stream.Readable
router.use(formData.stream());
// union body and files
router.use(formData.union());

async function ensureAuth(req, res, next) {
  const db = new Db();
  let dolar = (await db.getCotizacion())[0];
  dolar.fecha = new Intl.DateTimeFormat("es-ES").format(dolar.fecha);
  if (req.isAuthenticated()) {
    datosVista.dolar = dolar;
    if (req.user.perfil == 1) {
      req.user.habilitado = true;
    }

    return next();
  }
  res.redirect("/login");
}

function admin(req, res, next) {
  if (req.user.perfil == 1) {
    return next();
  }
  res.redirect("/");
}

function yo(req, res, next) {
  if (req.user.id_usuario === 1) {
    return next();
  }
  res.redirect("/");
}

let returnRouter = function (io) {
  router.use(function (req, res, next) {
    datosVista = {};
    datosVista.user = req.user;
    next();
  });

  io.on("connection", function (socket) {
    socket.on("unir", async function (sala) {
      let db = new Db();
      let autos = await db.getPendientes(sala);
      let regs = autos.length;
      socket.emit("devolver", regs);
      socket.join(sala);
    });

    socket.on("enviar", function (msg) {
      socket.broadcast.to(msg).emit("devolver", 1);
    });
  });

  router.get("/nuevo", ensureAuth, async function (req, res) {
    let nro = "";
    let db = new Db();
    let suc = await db.getSucursales();
    datosVista.sucursales = suc;
    res.render("unidades", {
      titulo: "Formulario de Unidades",
      datos: datosVista,
    });
  });

  router.get("/retorno", ensureAuth, admin, async function (req, res) {
    let db = new Db();

    let sucursales = await db.getSucursales();

    sucursales = sucursales.filter(function (s) {
      return s.id_sucursal != 5;
    });
    datosVista.sucursales = sucursales;
    res.render("unidades-retorno", {
      titulo: "Formulario de Unidades",
      datos: datosVista,
    });
  });

  router.post("/retornables", async function (req, res) {
    let db = new Db();

    let nro = req.body.nro;
    let uni = (
      await db.getUnidades(
        ` WHERE (sucursal = 5 OR estado = 3) AND nro_motor = '${nro}'`
      )
    )[0];
    let sucursal = (await db.getSucursal(uni.sucursal))[0];
    uni.suc = sucursal;

    res.send({ uni: uni });
  });

  router.post("/retornar", ensureAuth, admin, async function (req, res) {
    let db = new Db();

    let unidad = {
      id_unidad: req.body.id,
      sucursal: req.body.suc,
      estado: 1,
    };
     let suc = (await db.getSucursal(req.user.sucursal))[0]
    let uniAux = (await db.getUnidad(unidad.id_unidad))[0]
    let unidadBot = { marca: uniAux.marca, modelo: uniAux.modelo, anio: uniAux.anio, sucursal: suc, kmts: uniAux.kmts, combustible: uniAux.combustible}
    await db.saveUnidad(unidad);
    let historia = {
      id_unidad_fk: unidad.id_unidad,
      id_sucursal_fk: unidad.sucursal,
      fecha: new Date().toJSON().slice(0, 10),
      operacion: "Reingreso",
    };
    await db.saveHistorial(historia);
    notificar(unidadBot)

    res.send("Retornado con éxito");
  });

  router.get("/listar", ensureAuth, async function (req, res) {
    let db = new Db();

    let sucursales = await db.getSucursales();

    datosVista.sucursales = sucursales;

    res.render("unidades-listar", {
      titulo: "Formulario de Unidades",
      datos: datosVista,
    });
  });

  router.post("/traspasar", async function (req, res) {
    let db = new Db();

    let fecha = new Date().toJSON().slice(0, 10);
    let idUnidad = req.body.idunidad;
    let idSucursal = req.body.idsucursal;
    let datos = {
      id_unidad_fk: idUnidad,
      sucursal_destino: idSucursal,
      sucursal_origen: req.user.sucursal,
      id_usuario_fk: req.user.id_usuario,
      fecha: fecha,
    };

    let un = {
      id_unidad: idUnidad,
      estado: 5,
    };
    try {
      await db.saveUnidad(un);
      await db.saveTraspaso(datos);
      res.render("unidades-ok-traspaso", {
        datos: datosVista,
        mensaje: "Operación exitosa",
      });
    } catch (err) {
      if (err.message == "ER_DUP_ENTRY") {
        res.render("unidades-ok-traspaso", {
          datos: datosVista,
          mensaje:
            "Registro duplicado, ya se hizo este traspaso no se puede volver a enviar",
        });
      } else {
        res.send("Ocurrió un error, intente de nuevo");
      }
    }
  });

  router.get("/pendientes", ensureAuth, async function (req, res) {
    let db = new Db();

    let pend = await db.getPendientes(req.user.sucursal);

    datosVista.pendientes = pend;
    res.render("unidades-pendientes", {
      titulo: "Unidades en tránsito",
      datos: datosVista,
    });
  });

  router.post("/save", async function (req, res) {
    let db = new Db();
    let suc = (await db.getSucursal(req.user.sucursal))[0]
    let nuevo = req.body.nuevo == "on" ? 1 : 0;
    let estado;
    if (!req.body.flagtoma) {
      estado = req.body.vendido == "on" ? 3 : 1;
    } else {
      nuevo = 0;
      estado = 5;
    }

    let id = req.body.id == "" ? 0 : req.body.id;

    let unidad = {
      id_unidad: id,
      marca: req.body.marca.toUpperCase(),
      modelo: req.body.modelo.toUpperCase(),
      nro_motor: req.body.nromotor.toUpperCase(),
      nro_chasis: req.body.nrochasis ? req.body.nrochasis.toUpperCase() : null,
      anio: req.body.anio,
      llaves: req.body.llaves,
      matricula: req.body.matricula.toUpperCase(),
      color: req.body.color.toUpperCase(),
      sucursal: req.user.sucursal,
      nuevo: nuevo,
      kmts: req.body.kmts,
      padron: req.body.padron,
      precio: req.body.precio || 0,
      toma: req.body.toma || 0,
      combustible: req.body.combustible,
      estado: estado,
      tipo: req.body.tipo,
    };
    
    let unidadBot = { marca: unidad.marca, modelo: unidad.modelo, anio: unidad.anio, sucursal: suc, kmts: unidad.kmts, combustible: unidad.combustible}
    try {
      //Guarda la unidad
      let result = await db.saveUnidad(unidad);
      //Verifica si es nuevo para guardar en el historial
      if (req.body.id == "") {
        let historia = {
          id_unidad_fk: result.insertId,
          id_sucursal_fk: unidad.sucursal,
          fecha: new Date().toJSON().slice(0, 10),
          operacion: "Ingreso",
        };
        await db.saveHistorial(historia);
       notificar(unidadBot)
      }

      //Verifica si se vendió para guardar la venta
      if (estado == 3) {
        //Ingresa en el historial que se vendió
        let historia = {
          id_unidad_fk: unidad.id_unidad,
          id_sucursal_fk: unidad.sucursal,
          fecha: new Date().toJSON().slice(0, 10),
          operacion: "Venta",
        };
        await db.saveHistorial(historia);

        let fecha = new Date().toJSON().slice(0, 10);
        let vnt = {
          id_unidad_fk: id,
          id_sucursal_fk: req.user.sucursal,
          fecha: fecha,
        };
        await db.saveVenta(vnt);
      }

      result.message = "Ok";
      res.send(result);
    } catch (err) {
      if (err.message == "ER_DUP_ENTRY") {
        res.send("Registro duplicado");
      } else {
        /*res.send("Ocurrió un error, intente de nuevo");*/
        res.send(err.message)
      }
    }
  });

  router.get("/historial", ensureAuth, (req, res) => {
    res.render("unidades-historial", {
      titulo: "Historial de automóviles",
      datos: datosVista,
    });
  });

  router.post("/stockfull", async function (req, res) {
    let db = new Db();
    let unidad = null;
    unidad = (
      await db.getUnidades(
        ` WHERE nro_motor = '${req.body.nromotor}' OR nro_chasis = '${req.body.nromotor}' OR padron = '${req.body.nromotor}'`
      )
    )[0];
    if (unidad) {
      let historia = await db.getHistorial(unidad.id_unidad);
      if (historia) {
        for (let h of historia) {
          h.sucursal = (await db.getSucursal(h.id_sucursal_fk))[0];
          let mes =
            h.fecha.getMonth() + 1 > 9
              ? h.fecha.getMonth() + 1
              : "0" + (h.fecha.getMonth() + 1);
          let dia =
            h.fecha.getDate() > 9 ? h.fecha.getDate() : "0" + h.fecha.getDate();
          h.fecha = `${dia}/${mes}/${h.fecha.getFullYear()}`;
        }
      }
      unidad.historia = historia;
    }

    res.send({ unidad });
  });

  router.get("/stock", ensureAuth, async function (req, res) {
    let db = new Db();

    let sucursales = await db.getSucursales();

    datosVista.sucursales = sucursales;
    res.render("unidades-stock", {
      titulo: "Stock de Unidades",
      datos: datosVista,
    });
  });

  router.get("/pedidos", ensureAuth, yo, async function (req, res) {
    let db = new Db();

    let sucursales = await db.getSucursales();

    datosVista.sucursales = sucursales;
    res.render("unidades-pedidos", {
      titulo: "Pedido de unidades Unidades",
      datos: datosVista,
    });
  });

  router.get("/stock/:sucursal/:tipo", ensureAuth, async function (req, res) {
    let db = new Db();

    let suc = req.params.sucursal;
    let tipo = req.params.tipo;
    let operador = tipo == 1 ? "<" : ">=";

    let sucursal = await db.getSucursal(suc);
    sucursal = sucursal[0];

    var unidades = await db.getUnidades(
      ` WHERE estado = 1 AND sucursal = ${suc} and tipo ${operador} 4 `,
      ` ORDER BY nuevo, marca, modelo`
    );

    let fecha = new Date();

    let data = {
      template: { shortid: config.reportes.stock },
      data: {
        fecha:
          fecha.getDate() +
          "/" +
          (fecha.getMonth() + 1) +
          "/" +
          fecha.getFullYear(),
        sucursal: sucursal.nombre,
        unidades,
      },
    };

    let options = {
      url: "http://localhost:5488/api/report",
      json: data,
      method: "POST",
    };

    request(options).pipe(res);
  });

  router.post("/trasconfirm", async function (req, res) {
    let db = new Db();

    let id = req.body.id;
    let sucursal = (await db.getSucursal(req.body.destino))[0];
    let unidad = (await db.getUnidad(id))[0];

    datosVista.unidad = unidad;
    datosVista.sucursal = sucursal;
    res.render("unidades-confirm-traspaso", {
      titulo: "Confirmar",
      datos: datosVista,
    });
  });

  router.get("/traspaso/:id", ensureAuth, async function (req, res) {
    let db = new Db();

    let unidad = (await db.getUnidad(req.params.id))[0];
    let sucursal = (await db.getSucursal(req.user.sucursal))[0];
    let sucursales = await db.getSucursales();

    sucursales = sucursales.filter(function (s) {
      return s.id_sucursal != req.user.sucursal && s.id_sucursal != 5;
    });
    let fecha = new Date();
    datosVista.suc = sucursal;
    datosVista.sucursales = sucursales;
    datosVista.unidad = unidad;
    datosVista.fecha = `${fecha.getDate()}/${
      fecha.getMonth() + 1
    }/${fecha.getFullYear()}`;

    res.render("unidades-traspaso", {
      titulo: "Formulario de traspaso de Unidades",
      datos: datosVista,
    });
  });

  router.get("/filtrar", ensureAuth, yo, function (req, res) {
    res.render("unidades-filtros", { datos: datosVista });
  });

  router.post("/filtrar", async (req, res) => {
    let db = new Db();

    let hasta = req.body.hasta;
    let desde = req.body.desde;

    let cero = req.body.cero;
    let ceroKm = cero === "on" ? " AND nuevo = 1" : "";
    let where = ` estado = 1 AND sucursal != 5 AND tipo = '${req.body.tipo}' AND combustible = '${req.body.combustible}' ${ceroKm}`;
    if (desde) {
      where += ` AND precio >= ${desde}`;
    }
    if (hasta) {
      where += ` AND precio <= ${hasta}`;
    }
    let uns = await db.getUnidades(
      ` WHERE  ${where}`,
      " ORDER BY marca, precio"
    );
    await Promise.all(
      uns.map(async (u) => {
        u.suc = (await db.getSucursal(u.sucursal))[0].nombre;
        return u;
      })
    );

    res.send({ uns });
  });

  router.get("/accept/:id", ensureAuth, async function (req, res) {
    let db = new Db();

    let unidad = {
      id_unidad: req.params.id,
      sucursal: req.user.sucursal,
      estado: 1,
    };

    await db.saveUnidad(unidad);
    await db.delPendiente(req.params.id);

    let historia = {
      id_unidad_fk: unidad.id_unidad,
      id_sucursal_fk: unidad.sucursal,
      fecha: new Date().toJSON().slice(0, 10),
      operacion: "Traspaso",
    };
    await db.saveHistorial(historia);

    res.redirect("/unidades/pendientes");
  });

  router.get("/:id", ensureAuth, async function (req, res) {
    let id = req.params.id;
    let db = new Db();

    let rows = await db.getUnidad(id);
    let fila = rows[0];

    let unidad = {
      id_unidad: id,
      marca: fila.marca,
      modelo: fila.modelo,
      nro_motor: fila.nro_motor,
      nro_chasis: fila.nro_chasis,
      matricula: fila.matricula,
      anio: fila.anio,
      kmts: fila.kmts,
      precio: fila.precio,
      llaves: fila.llaves,
      padron: fila.padron,
      sucursal: fila.sucursal,
      color: fila.color,
      toma: req.user.perfil == 1 ? fila.toma : "",
      nuevo: fila.nuevo == 1 ? "CHECKED" : "",
      disabled: "",
    };

    //console.log(unidad)

    if (req.user.sucursal != fila.sucursal) {
      unidad.disabled = "DISABLED";
    }

    let tipos = [
      { id: 1, tipo: "Auto", selected: fila.tipo == 1 ? "SELECTED" : "" },
      { id: 2, tipo: "Camioneta", selected: fila.tipo == 2 ? "SELECTED" : "" },
      { id: 3, tipo: "Camión", selected: fila.tipo == 3 ? "SELECTED" : "" },
      { id: 4, tipo: "Moto", selected: fila.tipo == 4 ? "SELECTED" : "" },
      { id: 5, tipo: "Triciclo", selected: fila.tipo == 5 ? "SELECTED" : "" },
      {
        id: 6,
        tipo: "Cuatriciclo",
        selected: fila.tipo == 6 ? "SELECTED" : "",
      },
    ];

    let combustibles = [
      {
        id: "N",
        comb: "Nafta",
        selected: fila.combustible == "N" ? "SELECTED" : "",
      },
      {
        id: "D",
        comb: "Diesel",
        selected: fila.combustible == "D" ? "SELECTED" : "",
      },
    ];

    let suc = await db.getSucursales();

    suc = suc.map(function (s) {
      s.selected = "";
      if (s.id_sucursal == unidad.sucursal) s.selected = "SELECTED";

      return s;
    });

    datosVista.sucursales = suc;
    datosVista.unidad = unidad;
    datosVista.tipos = tipos;
    datosVista.combustibles = combustibles;
    datosVista.isEnabled = "";
    if (req.user.id_usuario != 1) {
      datosVista.isEnabled = "readonly";
    }

    res.render("unidades-edit", {
      titulo: "Formulario de Unidades",
      datos: datosVista,
    });
  });

  router.post("/", async function (req, res) {
    let criterio = req.body.criterio;
    let texto = req.body.texto;
    let nuevo = req.body.cero;
    let whereNuevo = "";
    if (nuevo == 2) {
      whereNuevo = "nuevo = 1 AND ";
    } else if (nuevo == 3) {
      whereNuevo = "nuevo = 0 AND ";
    }
    let db = new Db();

    let unidades = await db.getUnidadesSuc(
      `WHERE ${whereNuevo}  estado = 1 AND sucursal != 5 AND ${criterio} LIKE '${texto}%'`,
      null
    );

    let resultado = {
      user: req.user,
      unidades,
    };
    res.send({ res: resultado });
  });

  router.get("/historial/:id", async function (req, res) {
    let db = new Db();

    let id = req.params.id;
    let historia = await db.getHistorial(id);

    for (let h of historia) {
      h.sucursal = (await db.getSucursal(h.id_sucursal_fk))[0];
      let mes =
        h.fecha.getMonth() + 1 > 9
          ? h.fecha.getMonth() + 1
          : "0" + (h.fecha.getMonth() + 1);
      let dia =
        h.fecha.getDate() > 9 ? h.fecha.getDate() : "0" + h.fecha.getDate();
      h.fecha = `${dia}/${mes}/${h.fecha.getFullYear()}`;
    }

    res.send({ historia });
  });

  router.get("/", function (req, res) {
    res.end("Unidades");
  });

  return router;
};

module.exports = returnRouter;
