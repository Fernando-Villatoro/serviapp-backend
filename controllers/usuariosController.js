import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// 1. OBTENER TODOS LOS USUARIOS
export const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre, correo, tipo FROM usuarios");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
  }
};

// 2. OBTENER TRABAJADORES PARA EL HOME
export const obtenerTrabajadores = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.tipo,
              t.descripcion, t.ubicacion, t.precio, t.servicio_id
       FROM usuarios u
       JOIN trabajadores t ON t.usuario_id = u.id
       WHERE u.tipo = 'emprendedor' OR u.tipo = 'trabajador'`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener trabajadores", error: error.message });
  }
};

// 3. REGISTRO COMPLETO (Usuario + Perfil de Trabajador)
export const register = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { nombre, correo, password, tipo } = req.body;

    if (!nombre || !correo || !password || !tipo) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
    }

    const contraseñaEncriptada = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    const [userResult] = await connection.query(
      `INSERT INTO usuarios (nombre, correo, contraseña, tipo) VALUES (?, ?, ?, ?)`,
      [nombre, correo, contraseñaEncriptada, tipo]
    );

    const nuevoUsuarioId = userResult.insertId;

    if (tipo === "emprendedor" || tipo === "trabajador") {
      await connection.query(
        `INSERT INTO trabajadores (usuario_id, descripcion, ubicacion, precio)
         VALUES (?, ?, ?, ?)`,
        [nuevoUsuarioId, "¡Bienvenido! Edita tu perfil.", "Pendiente", 0]
      );
    }

    await connection.commit();

    res.status(201).json({ mensaje: `Registro exitoso como ${tipo}.` });

  } catch (error) {
    await connection.rollback();
    console.error("Error en registro:", error);
    res.status(500).json({ mensaje: "Error al registrar usuario", error: error.message });
  } finally {
    connection.release();
  }
};

// 4. LOGIN
export const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
    }

    const [rows] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const usuario = rows[0];
    const passwordCorrecta = await bcrypt.compare(password, usuario.contraseña);

    if (!passwordCorrecta) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo },
      process.env.JWT_SECRET || "secret_key_serviapp_2026",
      { expiresIn: "4h" }
    );

    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        tipo: usuario.tipo
      }
    });

  } catch (error) {
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
};

// 5. ACTUALIZAR PERFIL DE TRABAJADOR
export const actualizarPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, ubicacion, precio, telefono, servicio } = req.body;

    await pool.query(
      `UPDATE trabajadores SET descripcion=?, ubicacion=?, precio=?, servicio_id=NULL
       WHERE usuario_id=?`,
      [descripcion, ubicacion, precio || 0, id]
    );

    // También guarda teléfono y servicio en la tabla usuarios si tienes esas columnas
    // Si no las tienes, puedes agregar estas columnas:
    // ALTER TABLE trabajadores ADD COLUMN telefono VARCHAR(20);
    // ALTER TABLE trabajadores ADD COLUMN servicio VARCHAR(100);

    res.json({ mensaje: "Perfil actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar perfil", error: error.message });
  }
};