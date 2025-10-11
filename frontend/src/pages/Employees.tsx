import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useVB } from '@/contexts/VBContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, LayoutDashboard } from 'lucide-react';
import { Employee } from '@/types/employee';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import { ButtonGroup } from '@/components/ui/button-group';

// Components
import EmployeesHeader from '@/components/employees/EmployeesHeader';
import EmployeesStats from '@/components/employees/EmployeesStats';
import EmployeesFilters from '@/components/employees/EmployeesFilters';
import EmployeesList from '@/components/employees/EmployeesList';
import DepartmentStats from '@/components/employees/DepartmentStats';
import EmployeeFormDialog from '@/components/employees/EmployeeFormDialog';
import EmployeesCanvas from '@/components/employees/EmployeesCanvas';
import EmployeesManualMode from '@/components/employees/EmployeesManualMode';

interface OrgNode {
  id: string;
  name: string;
  type: 'sector' | 'position' | 'person';
  parent_id?: string;
  responsible_id?: string;
  description?: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

const Employees = () => {
  const { state, dispatch } = useVB();
  const { employees, settings } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  const [viewMode, setViewMode] = useState<'canvas' | 'manual'>('canvas');
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load organizational structure data
  useEffect(() => {
    loadOrgStructure();
  }, []);

  const loadOrgStructure = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizational_structure')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map the data to ensure proper typing
      const typedData: OrgNode[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as 'sector' | 'position' | 'person',
        parent_id: item.parent_id || undefined,
        responsible_id: item.responsible_id || undefined,
        description: item.description || undefined,
        position_x: item.position_x || 0,
        position_y: item.position_y || 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setOrgNodes(typedData);
    } catch (error) {
      console.error('Error loading org structure:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estrutura organizacional",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrgStructure = async () => {
    setIsLoading(true);
    try {
      const updates = orgNodes.map(node => ({
        id: node.id,
        position_x: node.position_x,
        position_y: node.position_y,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('organizational_structure')
          .update({
            position_x: update.position_x,
            position_y: update.position_y,
            updated_at: update.updated_at
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Estrutura organizacional salva com sucesso!",
      });
    } catch (error) {
      console.error('Error saving org structure:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar estrutura organizacional",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportOrgStructure = () => {
    const dataStr = JSON.stringify(orgNodes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `estrutura-organizacional-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || employee.department === selectedDepartment;
    const matchesRole = !selectedRole || employee.role === selectedRole;
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const handleSubmit = (employeeData: any) => {
    const newEmployee = {
      id: Date.now().toString(),
      ...employeeData,
      createdAt: new Date()
    };

    dispatch({ type: 'ADD_EMPLOYEE', payload: newEmployee });
    
    toast({
      title: "Sucesso",
      description: "Funcionário cadastrado com sucesso!",
    });
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      dispatch({ type: 'DELETE_EMPLOYEE', payload: employeeId });
      toast({
        title: "Sucesso",
        description: "Funcionário excluído com sucesso!",
      });
    }
  };

  const handleAddNew = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <EmployeesHeader
        activeTab={activeTab}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSave={saveOrgStructure}
        onRefresh={loadOrgStructure}
        onExport={exportOrgStructure}
        onAddNew={handleAddNew}
        isLoading={isLoading}
        orgNodesCount={orgNodes.length}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Estrutura Organizacional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-6">
          <EmployeesStats employees={employees} />
          
          <EmployeesFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            departments={settings.departments || []}
          />

          <EmployeesList 
            employees={filteredEmployees}
            onDeleteEmployee={handleDeleteEmployee}
            onAddNew={handleAddNew}
          />

          <DepartmentStats 
            employees={employees}
            departments={settings.departments || []}
          />
        </TabsContent>

        <TabsContent value="structure" className="space-y-6">
          <Card className="vb-card">
            <CardContent className="p-0">
              {viewMode === 'canvas' ? (
                <EmployeesCanvas 
                  nodes={orgNodes} 
                  onNodesChange={setOrgNodes}
                />
              ) : (
                <div className="p-6">
                  <EmployeesManualMode 
                    nodes={orgNodes} 
                    onNodesChange={setOrgNodes}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmployeeFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        departments={settings.departments || []}
        positions={settings.positions || []}
        employees={employees}
      />
    </div>
  );
};

export default Employees;
