import jwt, { SignOptions } from 'jsonwebtoken';

const generateToken = (id: string): string => {
  const secret: jwt.Secret = process.env.JWT_SECRET as string;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign({ id }, secret, options);
};

export default generateToken;
