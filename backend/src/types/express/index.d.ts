import { ITenant } from '../../models/tenant.model';
import { IUser } from '../../models/user.model';

declare global {
  namespace Express {
    export interface Request {
      tenant?: ITenant;
      user?: IUser;
    }
  }
}