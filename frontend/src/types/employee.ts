
export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  role: 'admin' | 'manager' | 'employee' | 'intern';
  phone?: string;
  photo?: string;
  avatar?: string;
  createdAt: Date;
}
