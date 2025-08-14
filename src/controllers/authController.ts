import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await authService.register(name, email, password, role);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/* export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message, teste: "teste" });
  }
}; */