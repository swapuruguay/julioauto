const express = require("express");
const router = express.Router();
const Db = require("../bd");
const config = require("../config");
const request = require("request");
const formData = require("express-form-data");
const Bd = require("../bd");

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
  const db = new Bd();
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

router.use(function (req, res, next) {
  datosVista = {};
  datosVista.user = req.user;
  next();
});

router.get("/listar", ensureAuth, async (req, res) => {
  let db = new Db();

  let fecha = new Date();
  let ventas = await db.getVentas(
    ` WHERE id_sucursal_fk = ${
      req.user.sucursal
    } AND YEAR(fecha) = ${fecha.getFullYear()} AND MONTH(fecha) = ${
      fecha.getMonth() + 1
    }`
  );
  let options = { year: "numeric", month: "numeric", day: "numeric" };
  if (ventas) {
    await Promise.all(
      ventas.map(async (item) => {
        item.unidad = (await db.getUnidad(item.id_unidad_fk))[0];
        item.unidad.nuevo = item.unidad.nuevo == 1 ? "Sí" : "No";
        let fechin = new Date(item.fecha);
        let mes =
          fechin.getMonth() + 1 > 9
            ? fechin.getMonth() + 1
            : "0" + (fechin.getMonth() + 1);
        let dia =
          fechin.getDate() > 9 ? fechin.getDate() : "0" + fechin.getDate();
        item.fecha = dia + "/" + mes + "/" + fechin.getFullYear();
        return item;
      })
    );
  } else {
    ventas = [];
  }

  datosVista.ventas = ventas;
  res.render("ventas", { datos: datosVista });
});

router.post("/listar", async (req, res) => {
  let db = new Db();

  let ventas = await db.getVentas(
    ` WHERE id_sucursal_fk = ${req.body.sucursal} AND YEAR(fecha) = ${req.body.anio} AND MONTH(fecha) = ${req.body.mes}`
  );
  let options = { year: "numeric", month: "numeric", day: "numeric" };
  if (ventas) {
    await Promise.all(
      ventas.map(async (item) => {
        item.unidad = (await db.getUnidad(item.id_unidad_fk))[0];
        item.unidad.nuevo = item.unidad.nuevo == 1 ? "Sí" : "No";
        let fechin = new Date(item.fecha);
        let mes =
          fechin.getMonth() + 1 > 9
            ? fechin.getMonth() + 1
            : "0" + (fechin.getMonth() + 1);
        let dia =
          fechin.getDate() > 9 ? fechin.getDate() : "0" + fechin.getDate();
        item.fecha = dia + "/" + mes + "/" + fechin.getFullYear();
        return item;
      })
    );
  } else {
    ventas = [];
  }

  res.send(ventas);
});

router.get("/cotizacion", ensureAuth, admin, async (req, res) => {
  let db = new Db();

  let sucursales = await db.getSucursales();

  datosVista.sucursales = sucursales;

  res.render("cotizaciones", {
    titulo: "Ingresar cotización del día",
    datos: datosVista,
  });
});

router.get("/editar-cotizacion", ensureAuth, admin, async (req, res) => {
  let db = new Db();

  let sucursales = await db.getSucursales();
  let cotizacion = (await db.getCotizacion())[0];
  datosVista.sucursales = sucursales;

  res.render("editar-cotizacion", {
    titulo: "Ingresar cotización del día",
    valor: cotizacion,
    datos: datosVista,
  });
});

router.post("/edit-cotiza", async (req, res) => {
  const db = new Db();
  const { dolar, id } = req.body;
  const result = await db.saveCotiza({ dolar, id });
  res.send(result);
});

router.post("/cotiza", async (req, res) => {
  const db = new Db();
  const cotizacion = req.body.dolar;
  const fecha = new Date().toJSON().slice(0, 10);
  const result = await db.saveCotiza({ cotizacion, fecha });
  res.send(result);
});

router.get("/dia", ensureAuth, admin, (req, res) => {
  res.render("ventas-dia", { titulo: "Ventas de un dia", datos: datosVista });
});

router.post("/dia", async (req, res) => {
  let db = new Db();
  let tipo = req.body.tipo == 1 ? " tipo < 4" : " tipo > 3";
  let listadoNuevos = await db.getVentasAgrupadas(
    ` WHERE fecha = '${req.body.fecha}' AND ${tipo} AND u.nuevo = 1`
  );
  let listadoUsados = await db.getVentasAgrupadas(
    ` WHERE fecha = '${req.body.fecha}' AND ${tipo} AND u.nuevo = 0`
  );
  let contador = 0;
  let listado = [];
  let sucursales = await db.getSucursales();
  sucursales = sucursales.filter((s) => s.id_surusal != 5);
  sucursales.forEach((s) => {
    let usados = 0;
    let nuevos = 0;
    listadoNuevos.forEach((ln) => {
      if (ln.nombre === s.nombre) {
        nuevos = ln.cantidad;
      }
    });
    listadoUsados.forEach((lu) => {
      if (lu.nombre === s.nombre) {
        usados = lu.cantidad;
      }
    });
    listado.push({ nombre: s.nombre, nuevos, usados });
  });
  datos = listado;
  res.send({ datos });
});

router.get("/acumula", ensureAuth, admin, (req, res) => {
  res.render("ventas-acumuladas", {
    titulo: "Ventas del mes",
    datos: datosVista,
  });
});

router.post("/acumula", async (req, res) => {
  const db = new Db();

  const { mes, anio } = req.body;
  let tipo = req.body.tipo == 1 ? " tipo < 4" : " tipo > 3";
  let listadoNuevos = await db.getVentasAgrupadas(
    ` WHERE MONTH(fecha) = ${mes} AND YEAR(fecha) = ${anio} AND ${tipo} AND u.nuevo = 1`
  );
  let listadoUsados = await db.getVentasAgrupadas(
    ` WHERE MONTH(fecha) = ${mes} AND YEAR(fecha) = ${anio} AND ${tipo} AND u.nuevo = 0`
  );
  let contador = 0;
  let listado = [];
  let sucursales = await db.getSucursales();
  sucursales = sucursales.filter((s) => s.id_surusal != 5);
  sucursales.forEach((s) => {
    let usados = 0;
    let nuevos = 0;
    listadoNuevos.forEach((ln) => {
      if (ln.nombre === s.nombre) {
        nuevos = ln.cantidad;
      }
    });
    listadoUsados.forEach((lu) => {
      if (lu.nombre === s.nombre) {
        usados = lu.cantidad;
      }
    });
    listado.push({
      nombre: s.nombre,
      cantidad: nuevos + usados,
      nuevos,
      usados,
    });
  });

  res.send({ listado });
});

module.exports = router;
