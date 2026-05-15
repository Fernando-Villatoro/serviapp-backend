import { Router } from "express";
import {
  obtenerUsuarios,
  obtenerTrabajadores,
  register,
  login,
  actualizarPerfil,
} from "../controllers/usuariosController.js";

const router = Router();

router.get("/", obtenerUsuarios);
router.get("/trabajadores", obtenerTrabajadores);
router.post("/register", register);
router.post("/login", login);
router.put("/perfil/:id", actualizarPerfil);  // ← nueva ruta

export default router;