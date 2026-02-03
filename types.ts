
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  joinDate: string;
  salary: number;
  status: 'Active' | 'Inactive';
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export type Department = 'HR' | 'Engineering' | 'Sales' | 'Marketing' | 'Finance' | 'Legal';
