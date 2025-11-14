// src/services/authService.ts
import bcrypt from "bcryptjs";
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
// type StringValue from ms é apenas string
import { query } from "../db";
import { v4 as uuidv4 } from "uuid";

type Role = "ADMIN" | "USER";

function normalizeRole(input?: string): Role {
  const r = (input ?? "USER").toUpperCase();
  return r === "ADMIN" ? "ADMIN" : "USER";
}
function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
function getJwtSecret(): Secret {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET não configurado no servidor");
  return s as Secret;
}
function getJwtExpires(): number | string {
  const v = process.env.JWT_EXPIRES_IN;

  if (!v || v.trim() === "") {
    return "1d"; // padrão
  }

  // Se for só números (ex.: "3600"), retorna como number (segundos)
  if (/^\d+$/.test(v.trim())) {
    return Number(v.trim());
  }

  // Strings compatíveis com ms: "1h", "12h", "1d", "7d"...
  return v.trim();
}

export const register = async (
  name: string,
  email: string,
  password: string,
  roleInput: string = "USER"
) => {
  if (!name || !email || !password) {
    throw new Error("name, email e password são obrigatórios");
  }

  const emailNorm = normalizeEmail(email);
  const existsResult = await query('SELECT id FROM "User" WHERE email = $1', [emailNorm]);
  const exists = existsResult.rows[0];
  if (exists) {
    // mensagem neutra para evitar enumeração de contas
    throw new Error("Não foi possível criar a conta");
  }

  const hashed = await bcrypt.hash(password, 12);
  const role = normalizeRole(roleInput);

  const userId = uuidv4();
  await query(
    'INSERT INTO "User" (id, name, email, password, role, "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())',
    [userId, name, emailNorm, hashed, role]
  );
  const userResult = await query(
    'SELECT id, name, email, role FROM "User" WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];

  // opcional: já retornar token para logar após cadastro
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role as Role };
  const expiresIn = getJwtExpires();
  const signOptions = { expiresIn } as SignOptions;
  const token = jwt.sign(payload, getJwtSecret(), signOptions);

  return { user, token };
};

export const login = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("email e password são obrigatórios");
  }

  const emailNorm = normalizeEmail(email);
  const userResult = await query(
    'SELECT id, name, email, role, password FROM "User" WHERE email = $1',
    [emailNorm]
  );
  const user = userResult.rows[0];

  // mensagem neutra
  if (!user || !user.password) {
    throw new Error("Credenciais inválidas");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Credenciais inválidas");
  }

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role as Role };
  const expiresIn = getJwtExpires();
  const signOptions = { expiresIn } as SignOptions;
  const token = jwt.sign(payload, getJwtSecret(), signOptions);

  const { password: _hidden, ...safe } = user;
  return { token, user: safe }; // safe = { id, name, email, role }
};
