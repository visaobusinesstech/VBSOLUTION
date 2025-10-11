import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { useUser } from './UserContext';

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
  responsibleId: string;
  companyId?: string;
  projectId?: string;
  workGroup?: string;
  department?: string;
  type: 'call' | 'meeting' | 'task' | 'other';
  status: 'backlog' | 'pending' | 'in-progress' | 'completed' | 'overdue';
  createdAt: Date;
  completedAt?: string;
  archived?: boolean;
  leadId?: string; // ID do lead associado à atividade
}

// Export the Employee type for backwards compatibility
export type { Employee };

export interface Proposal {
  id: string;
  status: 'negotiating' | 'won' | 'lost';
  totalValue: number;
  createdAt: Date;
}

export interface Company {
  id: string;
  corporateName: string;
  fantasyName: string;
  cnpj: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  companyName?: string;
  city?: string;
  state?: string;
  cep?: string;
  description?: string;
  funnelStage?: string;
  proposals?: Proposal[];
  createdAt: Date;
  updatedAt: Date;
  logo?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  basePrice?: number;
  type?: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface VBSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  companyLogo?: string;
  departments: string[];
  positions: string[];
  funnelStages: FunnelStage[];
  viewMode: 'kanban' | 'list';
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  avatar?: string;
  role?: string;
}

interface VBState {
  activities: Activity[];
  employees: Employee[];
  companies: Company[];
  products: Product[];
  settings: VBSettings;
  currentUser?: CurrentUser;
}

type VBAction =
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'UPDATE_ACTIVITY'; payload: Partial<Activity> & { id: string } }
  | { type: 'DELETE_ACTIVITY'; payload: string }
  | { type: 'ARCHIVE_ACTIVITY'; payload: string }
  | { type: 'UNARCHIVE_ACTIVITY'; payload: string }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'UPDATE_COMPANY'; payload: Company }
  | { type: 'DELETE_COMPANY'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<VBSettings> }
  | { type: 'SET_CURRENT_USER'; payload: CurrentUser }
  | { type: 'LOAD_ACTIVITIES'; payload: Activity[] }
  | { type: 'LOAD_EMPLOYEES'; payload: Employee[] }
  | { type: 'LOAD_COMPANIES'; payload: Company[] }
  | { type: 'LOAD_PRODUCTS'; payload: Product[] }
  | { type: 'LOAD_SETTINGS'; payload: VBSettings };

const initialState: VBState = {
  activities: [],
  employees: [],
  companies: [],
  products: [],
  settings: {
    theme: 'light',
    notifications: true,
    language: 'pt-BR',
    companyName: 'VBSolution',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    departments: [],
    positions: [],
    funnelStages: [],
    viewMode: 'kanban'
  }
};

function vbReducer(state: VBState, action: VBAction): VBState {
  switch (action.type) {
    case 'ADD_ACTIVITY':
      return { ...state, activities: [action.payload, ...state.activities] };
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(activity =>
          activity.id === action.payload.id 
            ? { ...activity, ...action.payload }
            : activity
        )
      };
    case 'DELETE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.filter(activity => activity.id !== action.payload)
      };
    case 'ARCHIVE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(activity =>
          activity.id === action.payload ? { ...activity, archived: true } : activity
        )
      };
    case 'UNARCHIVE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(activity =>
          activity.id === action.payload ? { ...activity, archived: false } : activity
        )
      };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [action.payload, ...state.employees] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(emp => emp.id === action.payload.id ? action.payload : emp)
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== action.payload)
      };
    case 'ADD_COMPANY':
      return { ...state, companies: [action.payload, ...state.companies] };
    case 'UPDATE_COMPANY':
      return {
        ...state,
        companies: state.companies.map(comp => comp.id === action.payload.id ? action.payload : comp)
      };
    case 'DELETE_COMPANY':
      return {
        ...state,
        companies: state.companies.filter(comp => comp.id !== action.payload)
      };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(prod => prod.id === action.payload.id ? action.payload : prod)
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(prod => prod.id !== action.payload)
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'LOAD_ACTIVITIES':
      return { ...state, activities: action.payload };
    case 'LOAD_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'LOAD_COMPANIES':
      return { ...state, companies: action.payload };
    case 'LOAD_PRODUCTS':
      return { ...state, products: action.payload };
    case 'LOAD_SETTINGS':
      return { ...state, settings: action.payload };
    default:
      return state;
  }
}

interface VBContextType {
  state: VBState;
  dispatch: React.Dispatch<VBAction>;
}

const VBContext = createContext<VBContextType | undefined>(undefined);

export const VBProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(vbReducer, initialState);
  const { userName, userEmail, refreshUserData } = useUser();

  // Carregar dados salvos do localStorage na inicialização
  useEffect(() => {
    try {
      const savedActivities = localStorage.getItem('vb-activities');
      const savedEmployees = localStorage.getItem('vb-employees');
      const savedCompanies = localStorage.getItem('vb-companies');
      const savedProducts = localStorage.getItem('vb-products');
      const savedSettings = localStorage.getItem('vb-settings');
      const savedCurrentUser = localStorage.getItem('vb-currentUser');

      if (savedActivities) {
        const activities = JSON.parse(savedActivities).map((activity: any) => ({
          ...activity,
          date: new Date(activity.date),
          createdAt: new Date(activity.createdAt)
        }));
        dispatch({ type: 'LOAD_ACTIVITIES', payload: activities });
      }

      if (savedEmployees) {
        const employees = JSON.parse(savedEmployees);
        dispatch({ type: 'LOAD_EMPLOYEES', payload: employees });
      }

      if (savedCompanies) {
        const companies = JSON.parse(savedCompanies).map((company: any) => ({
          ...company,
          createdAt: new Date(company.createdAt),
          updatedAt: new Date(company.updatedAt)
        }));
        dispatch({ type: 'LOAD_COMPANIES', payload: companies });
      }

      if (savedProducts) {
        const products = JSON.parse(savedProducts);
        dispatch({ type: 'LOAD_PRODUCTS', payload: products });
      }

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'LOAD_SETTINGS', payload: settings });
      }

      if (savedCurrentUser) {
        const currentUser = JSON.parse(savedCurrentUser);
        dispatch({ type: 'SET_CURRENT_USER', payload: currentUser });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
    }
  }, []);

  // Sincronizar currentUser com UserContext
  useEffect(() => {
    if (userName && userEmail) {
      const currentUser: CurrentUser = {
        id: 'current-user', // ID temporário
        name: userName,
        email: userEmail,
        position: 'Usuário',
        department: 'Geral',
        avatar: undefined,
        role: 'user'
      };
      
      dispatch({ type: 'SET_CURRENT_USER', payload: currentUser });
    }
  }, [userName, userEmail]);

  // Salvar dados no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      localStorage.setItem('vb-activities', JSON.stringify(state.activities));
    } catch (error) {
      console.error('Erro ao salvar atividades no localStorage:', error);
    }
  }, [state.activities]);

  useEffect(() => {
    try {
      localStorage.setItem('vb-employees', JSON.stringify(state.employees));
    } catch (error) {
      console.error('Erro ao salvar funcionários no localStorage:', error);
    }
  }, [state.employees]);

  useEffect(() => {
    try {
      localStorage.setItem('vb-companies', JSON.stringify(state.companies));
    } catch (error) {
      console.error('Erro ao salvar empresas no localStorage:', error);
    }
  }, [state.companies]);

  useEffect(() => {
    try {
      localStorage.setItem('vb-products', JSON.stringify(state.products));
    } catch (error) {
      console.error('Erro ao salvar produtos no localStorage:', error);
    }
  }, [state.products]);

  useEffect(() => {
    try {
      localStorage.setItem('vb-settings', JSON.stringify(state.settings));
    } catch (error) {
      console.error('Erro ao salvar configurações no localStorage:', error);
    }
  }, [state.settings]);

  useEffect(() => {
    if (state.currentUser) {
      try {
        localStorage.setItem('vb-currentUser', JSON.stringify(state.currentUser));
      } catch (error) {
        console.error('Erro ao salvar usuário atual no localStorage:', error);
      }
    }
  }, [state.currentUser]);

  return (
    <VBContext.Provider value={{ state, dispatch }}>
      {children}
    </VBContext.Provider>
  );
};

export const useVB = () => {
  const context = useContext(VBContext);
  if (context === undefined) {
    throw new Error('useVB must be used within a VBProvider');
  }
  return context;
};
