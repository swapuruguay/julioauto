const TelegramBot = require("node-telegram-bot-api");
const token = "1535889789:AAHQuyeLH9qKvTYXjSw6f1qdG7a13E1qdqM";
const bot = new TelegramBot(token, { polling: true });
//const chatId = 886623278;
const chatId = 473834914;
// let fecha = new Date();
// let month = fecha.getMonth() + 1;
// let day = fecha.getDate();

module.exports = {
  notificar: function (unidad) {
            let message = `Se dio de alta ${unidad.marca} ${ unidad.modelo } año ${unidad.anio} en ${unidad.sucursal.nombre}`
  
            bot.sendMessage(chatId, message);
  
  }
}

//verificar();
/*bot.onText(/\/consulta (.+)/, async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  let db = await new database(config);
  let res = await db.query(
    `SELECT a.* FROM alumnos a WHERE estado = 1 AND (a.nombre LIKE '%${resp}%' OR a.apellido LIKE '%${resp}%' )  `
  );
  // let parents = await db.query(
  //   `SELECT p.* FROM alumnos_parientes pa JOIN parientes p ON p.idpariente = pa.idpariente_fk WHERE pa.idalumno_fk = ${
  //     res[0].idalumno
  //   } `
  // );
  let texto = "";
  // send back the matched "whatever" to the chat
  await Promise.all(
    res.map(async a => {
      let parents = await db.query(
        `SELECT p.* FROM alumnos_parientes pa JOIN parientes p ON p.idpariente = pa.idpariente_fk WHERE pa.idalumno_fk = ${a.idalumno} `
      );
      a.parents = parents;
      return a;
    })
  );

  res.forEach(c => {
    let fecha = new Date(c.fecha_nacimiento);
    let fecha2 = `${fecha.getDate()}/${fecha.getMonth() +
      1}/${fecha.getFullYear()}`;
    texto += `Nombre alumno: ${c.nombre} ${c.apellido}
    F.Nacim: ${fecha2}
    Documento: ${c.cedula}
    Matricula: ${c.matricula}
    Domicilio: ${c.domicilio}\n`;
    c.parents.forEach(p => {
      texto += `Nombre: ${p.nombre} ${p.apellido}
      Celular: ${p.celular}
      Documento: ${p.documento}\n`;
    });
    texto += "\n";
  });
  bot.sendMessage(chatId, texto);
});

bot.on("message", msg => {
  const chatId = msg.chat.id;
  console.log(chatId)
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, "Gracias por darte de alta ");
});*/

// bot.on("message", function(msg) {
//   // let chatId = msg.chat.id;
//   //  bot.downloadFile(msg.photo[3].file_id, '.')
//   //console.log(msg.photo[2].file_id)
//   console.log(msg);
//   // photo can be: a file path, a stream or a Telegram file_id

//   // bot.sendPhoto(chatId, photo, {caption: 'Lovely kittens'});
// });
