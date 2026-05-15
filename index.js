import express from "express";
import cors from "cors";
import usuariosRoutes from "./routes/usuarios.js";

const app = express();

// MIDDLEWARES
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
}));
app.use(express.json());

// Header para que ngrok no bloquee las peticiones
app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// RUTAS
app.use("/usuarios", usuariosRoutes);

// PUERTO
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});