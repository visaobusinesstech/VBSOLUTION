import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  MapPin,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  avatar_url?: string;
  role_id?: string;
  area_id?: string;
  status: string;
  created_at: string;
  role?: {
    name: string;
  };
  area?: {
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  level: number;
}

interface Area {
  id: string;
  name: string;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMountedRef = useRef(true);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    birth_date: '',
    role_id: '',
    area_id: '',
    avatar_url: ''
  });

  useEffect(() => {
    isMountedRef.current = true;
    
    if (user?.id) {
      loadUsers();
      loadRoles();
      loadAreas();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user?.id]);

  const loadUsers = async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true);
      }
      
      // Buscar usuários da empresa do usuário logado
      const { data: userCompany } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (userCompany?.company_id) {
        const { data: usersData, error } = await supabase
          .from('company_users')
          .select(`
            *,
            role:company_roles(name),
            area:company_areas(name)
          `)
          .eq('company_id', userCompany.company_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMountedRef.current) {
          setUsers(usersData || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      showError('Erro ao carregar usuários');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadRoles = async () => {
    try {
      // Buscar cargos da empresa
      const { data: userCompany } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (userCompany?.company_id) {
        const { data: rolesData, error } = await supabase
          .from('company_roles')
          .select('*')
          .eq('company_id', userCompany.company_id)
          .eq('status', 'active')
          .order('level', { ascending: false });

        if (error) throw error;
        if (isMountedRef.current) {
          setRoles(rolesData || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
      showError('Erro ao carregar cargos');
    }
  };

  const loadAreas = async () => {
    try {
      // Buscar áreas da empresa
      const { data: userCompany } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (userCompany?.company_id) {
        const { data: areasData, error } = await supabase
          .from('company_areas')
          .select('*')
          .eq('company_id', userCompany.company_id)
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        if (isMountedRef.current) {
          setAreas(areasData || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      showError('Erro ao carregar áreas');
    }
  };

  const handleAddUser = async () => {
    try {
      // Buscar company_id do usuário logado
      const { data: userCompany } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!userCompany?.company_id) {
        showError('Erro: empresa não encontrada');
        return;
      }

      // Note: User creation should be handled by backend API
      // Frontend cannot create users directly with admin functions
      console.warn('User creation should be handled by backend API');

      // Criar usuário na tabela company_users
      const { data: newUser, error: userError } = await supabase
        .from('company_users')
        .insert({
          company_id: userCompany.company_id,
          auth_user_id: authData.user?.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          role_id: formData.role_id || null,
          area_id: formData.area_id || null,
          avatar_url: formData.avatar_url || null,
          status: 'active'
        })
        .select()
        .single();

      if (userError) throw userError;

      success('Usuário criado com sucesso!');
      setShowAddModal(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      showError('Erro ao criar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('company_users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          role_id: formData.role_id || null,
          area_id: formData.area_id || null,
          avatar_url: formData.avatar_url || null
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      success('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      showError('Erro ao atualizar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      // Buscar auth_user_id do usuário
      const { data: userData } = await supabase
        .from('company_users')
        .select('auth_user_id')
        .eq('id', userId)
        .single();

      if (userData?.auth_user_id) {
        // Note: User deletion should be handled by backend API
        // Frontend cannot delete users directly with admin functions
        console.warn('User deletion should be handled by backend API');
      }

      // Excluir da tabela company_users
      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      success('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      showError('Erro ao excluir usuário: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '', // Não mostrar senha
      phone: user.phone || '',
      birth_date: user.birth_date || '',
      role_id: user.role_id || '',
      area_id: user.area_id || '',
      avatar_url: user.avatar_url || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      birth_date: '',
      role_id: '',
      area_id: '',
      avatar_url: ''
    });
  };

  const success = (message: string) => {
    toast({
      title: 'Sucesso',
      description: message,
      variant: 'default'
    });
  };

  const showError = (message: string) => {
    toast({
      title: 'Erro',
      description: message,
      variant: 'destructive'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Usuários da Empresa</h3>
          <p className="text-sm text-gray-600">Gerencie os usuários e suas permissões</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Digite o email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Digite a senha"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role_id">Cargo</Label>
                  <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_id">Área</Label>
                <Select value={formData.area_id} onValueChange={(value) => setFormData({ ...formData, area_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddUser}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de usuários */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">
                          Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.phone ? (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{user.phone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.role ? (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>{user.role.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Não definido</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.area ? (
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span>{user.area.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Não definido</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome Completo *</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Digite o email"
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Telefone</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_birth_date">Data de Nascimento</Label>
                <Input
                  id="edit_birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_role_id">Cargo</Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData({ ...formData, role_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_area_id">Área</Label>
                <Select value={formData.area_id} onValueChange={(value) => setFormData({ ...formData, area_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditUser}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
