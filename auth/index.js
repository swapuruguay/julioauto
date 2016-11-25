var LocalStrategy = require('passport-local').Strategy
var Db = require('../bd')
var bcrypt = require('bcrypt-nodejs')
const async = require('asyncawait/async')
const await = require('asyncawait/await')

exports.strategy = new LocalStrategy( async(function(username, password, done) {
  let db = new Db()
  let user = await(db.getUser(` WHERE username = '${username}'`))
        //console.log(user)
  if(user.length > 0) {
      let hash = bcrypt.hashSync(password)
      //console.log(hash)
      //console.log(bcrypt.compareSync(password, hash))
    if(bcrypt.compareSync(password, user[0].password)) {
      return done(null, user[0])
    } else {
                //req.flash({error_msg: 'Usuario no encuentra'})
      return done(false, false, {mesage: 'No se encuetra usuario'})
    }
  } else {
    return done(false, false, {message: 'Usuario desconocido'})
  }
  
}))


exports.serialize = function(user, done) {
    done(null, user)
}

exports.deserialize = function(user, done) {
    done(null, user)
}