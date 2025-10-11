
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Project } from '@/hooks/useProjects';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

interface ProjectState {
  projects: Project[];
  projectStages: ProjectStage[];
  workGroups: string[];
  departments: string[];
}

type ProjectAction =
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ARCHIVE_PROJECT'; payload: string } // Nova ação
  | { type: 'UNARCHIVE_PROJECT'; payload: string } // Nova ação
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_STAGE'; payload: ProjectStage }
  | { type: 'UPDATE_STAGE'; payload: ProjectStage }
  | { type: 'DELETE_STAGE'; payload: string }
  | { type: 'SET_WORK_GROUPS'; payload: string[] }
  | { type: 'SET_DEPARTMENTS'; payload: string[] };

const initialState: ProjectState = {
  projects: [],
  projectStages: [],
  workGroups: [],
  departments: []
};

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload)
      };
    case 'ARCHIVE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload ? { ...p, archived: true } : p
        )
      };
    case 'UNARCHIVE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload ? { ...p, archived: false } : p
        )
      };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_STAGE':
      return { ...state, projectStages: [...state.projectStages, action.payload] };
    case 'UPDATE_STAGE':
      return {
        ...state,
        projectStages: state.projectStages.map(s => s.id === action.payload.id ? action.payload : s)
      };
    case 'DELETE_STAGE':
      return {
        ...state,
        projectStages: state.projectStages.filter(s => s.id !== action.payload)
      };
    case 'SET_WORK_GROUPS':
      return { ...state, workGroups: action.payload };
    case 'SET_DEPARTMENTS':
      return { ...state, departments: action.payload };
    default:
      return state;
  }
}

interface ProjectContextType {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { user } = useAuth();
  const { projects, loading, error } = useProjects();

  // Carregar projetos automaticamente quando o usuário estiver autenticado
  useEffect(() => {
    if (user && projects.length > 0) {
      dispatch({ type: 'SET_PROJECTS', payload: projects });
    }
  }, [user, projects]);

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
