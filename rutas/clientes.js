const express = require("express");
const router = express.Router();
const Db = require("../bd");

const formData = require("express-form-data");

// parsing data with connect-multiparty. Result set on req.body and req.files
router.use(formData.parse());
// clear all empty files
router.use(formData.format());
// change file objects to node stream.Readable
router.use(formData.stream());
// union body and files
router.use(formData.union());

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.perfil == 1) {
      req.user.habilitado = true;
    }

    return next();
  }
  res.redirect("/login");
}

router.get("/listar", ensureAuth, async function (req, res) {
  let db = new Db();

  let clientes = await db.getClientes(null, " ORDER BY apellido, nombre");

  res.render("clientes-listar", {
    titulo: "Formulario de Clientes",
    datos: { clientes: clientes, user: req.user },
  });
});

router.get("/nuevo", ensureAuth, function (req, res) {
  var nro = 0;
  res.render("clientes", {
    titulo: "Formulario de Clientes",
    datos: { user: req.user },
  });
});

router.post("/save", async function (req, res) {
  let db = new Db();

  // console.log(req.body)
  let id = req.body.id == "" ? 0 : req.body.id;
  let fechaNacimiento = null;
  if (req.body.fechanacimiento) {
    fechaNacimiento = req.body.fechanacimiento.split("/");
    fechaNacimiento = `${fechaNacimiento[2]}-${fechaNacimiento[1]}-${fechaNacimiento[0]}`;
  }

  let cliente = {
    id_cliente: id,
    nombre: req.body.nombre.toUpperCase().trim(),
    apellido: req.body.apellido.toUpperCase().trim(),
    documento: req.body.documento.toUpperCase(),
    domicilio: req.body.domicilio.toUpperCase(),
    telefono: req.body.telefono,
    celular: req.body.celular,
    ciudad: req.body.ciudad.toUpperCase(),
    aclaraciones: req.body.aclaraciones.toUpperCase(),

    categoria: req.body.categoria.toUpperCase(),
  };
  if (fechaNacimiento) {
    cliente.fecha_nacimiento = fechaNacimiento;
  }

  res.send(await db.saveCliente(cliente));
});

router.get("/", function (req, res) {
  res.end("Con router");
});

router.post("/", async function (req, res) {
  let criterio = req.body.criterio;
  let texto = req.body.texto;
  let db = new Db();

  let clientes = await db.getClientes(
    ` WHERE ${criterio} LIKE '${texto}%'`,
    null
  );

  clientes = clientes.map((c) => {
    if (c.categoria == "M") {
      c.clase = "danger";
    } else if (c.categoria == "R") {
      c.clase = "warning";
    } else {
      c.clase = "";
    }
    return c;
  });
  let resultado = {
    clientes,
  };
  res.send({ res: resultado });
});

router.get("/:id", ensureAuth, async function (req, res) {
  let db = new Db();

  let id = req.params.id;
  //console.log(id)
  let row = (await db.getCliente(id))[0];
  //console.log(row)

  let fecha = null;
  if (row.fecha_nacimiento) {
    fecha =
      new Intl.NumberFormat("es-UY", { minimumIntegerDigits: 2 }).format(
        row.fecha_nacimiento.getDate()
      ) +
      "/" +
      new Intl.NumberFormat("es-UY", { minimumIntegerDigits: 2 }).format(
        row.fecha_nacimiento.getMonth() + 1
      ) +
      "/" +
      row.fecha_nacimiento.getFullYear();
  }

  let categorias = [
    {
      codigo: "B",
      nombre: "Bueno",
    },
    {
      codigo: "R",
      nombre: "Regular",
    },
    {
      codigo: "M",
      nombre: "Malo",
    },
  ];

  let cliente = {
    id_cliente: id,
    nombre: row.nombre,
    apellido: row.apellido,
    aclaraciones: row.aclaraciones,
    domicilio: row.domicilio,
    telefono: row.telefono,
    documento: row.documento,
    celular: row.celular,
    ciudad: row.ciudad,
    fechaNacimiento: fecha,
    categorias: categorias.map((c) => {
      if (c.codigo == row.categoria) {
        c.selected = "SELECTED";
      } else {
        c.selected = "";
      }
      return c;
    }),
  };

  res.render("clientes-edit", {
    titulo: "Formulario de clientes",
    datos: {
      cliente: cliente,
      fecha: new Intl.DateTimeFormat("es-UY", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }).format(new Date()),
      user: req.user,
    },
  });
  //  res.end()
});

router.get("/crm/:id", async (req, res) => {
  let db = new Db();

  let id = req.params.id;
  //console.log(id)
  let filas = await db.getCrm(id);
  //console.log(row)

  res.send(filas);
});

router.post("/crm", async (req, res) => {
  const db = new Db();
  let { id, texto, tema, fecha } = req.body;
  let f = fecha.split("/");
  let fechin = `${f[2]}-${f[1]}-${f[0]}`;
  let crm = {
    id_cliente_fk: id,
    texto,
    tema,
    fecha: fechin,
  };

  res.send(await db.saveCrm(crm));
});
router.delete("/crm", async (req, res) => {
  const db = new Db();
  let { id } = req.body;

  res.send(await db.deleteCrm(id));
});
module.exports = router;
