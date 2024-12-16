const jsonServer = require("json-server");
const nodemailer = require("nodemailer");

const server = jsonServer.create();
const router = jsonServer.router("almacen.json");
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 10000;

server.use(jsonServer.bodyParser);
server.use(middlewares);

// Configuración del transporte de correos
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pruebaskk1221@gmail.com",
    pass: "ktxs zqpz kfia xcph",
  },
});

// Ruta para enviar token de recuperación
server.post("/recover-password", (req, res) => {
  const { email } = req.body;

  const db = router.db;
  const user = db.get("usuarios").find({ email }).value();

  if (!user) {
    return res.status(404).json({ message: "Correo no encontrado" });
  }

  const token = Math.random().toString(36).substring(2);

  // Guardar el token en el usuario correspondiente
  db.get("usuarios").find({ email }).assign({ resetToken: token }).write();

  const mailOptions = {
    from: "pruebaskk1221@gmail.com",
    to: email,
    subject: "Recuperación de contraseña",
    text: `Hola, este es tu token de recuperación de contraseña: ${token}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
      return res.status(500).json({ message: "Error al enviar el correo" });
    }

    res.json({ message: "Correo enviado exitosamente", token });
  });
});

// Ruta para restablecer la contraseña
server.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;

  const db = router.db;
  const user = db.get("usuarios").find({ resetToken: token }).value();

  if (!user) {
    return res.status(400).json({ message: "Token inválido o expirado." });
  }

  // Actualizar la contraseña del usuario y eliminar el token
  db.get("usuarios")
    .find({ resetToken: token })
    .assign({ password: newPassword, resetToken: null })
    .write();

  res.json({ message: "Contraseña actualizada correctamente." });
});

// Usar el router de JSON Server para manejar otras rutas
server.use(router);

server.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
