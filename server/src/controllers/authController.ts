import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        next(error); 
    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
      const { username, password } = req.body;

      const user = await User.findOne({ username });
      if (!user || !(await bcrypt.compare(password, user.password))) {
          res.status(401).json({ error: 'Invalid credentials' }); 
          return;
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      res.json({ token }); 
  } catch (error) {
      next(error); 
  }
};