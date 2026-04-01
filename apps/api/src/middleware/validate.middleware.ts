import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  schema.parse(req.body);
  next();
};
