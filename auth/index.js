const LocalStrategy = require("passport-local").Strategy;
const Db = require("../bd");
const bcrypt = require("bcrypt-nodejs");

exports.strategy = new LocalStrategy(async function (username, password, done) {
  let db = new Db();

  let user = await db.getUser(` WHERE username = '${username}'`);

  if (user.length > 0) {
    let hash = bcrypt.hashSync(password);
   // console.log(hash);
    //console.log(bcrypt.compareSync(password, hash))
    if (bcrypt.compareSync(password, user[0].password)) {
      if (user[0].perfil > 2) {
        let rango = new Date();
        rango.setHours(8);
        rango.setMinutes(30);
        let rango2 = new Date();
        rango2.setHours(19);
        rango2.setMinutes(0);
        let hora = new Date();
        if (hora < rango || hora > rango2) {
          return done(null, false, { message: "Fuera de horario" });
        } else {
          return done(null, user[0]);
        }
      } else {
        return done(null, user[0]);
      }
    } else {
      return done(null, false, { message: "Usuario o Password Incorrecto" });
    }
  } else {
    return done(null, false, { message: "Usuario o Password Incorrecto" });
  }
});

exports.serialize = function (user, done) {
  done(null, user);
};

exports.deserialize = function (user, done) {
  done(null, user);
};
