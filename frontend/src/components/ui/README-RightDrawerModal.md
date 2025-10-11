# RightDrawerModal - Sistema de Modais Padronizado

Este documento descreve como usar o novo sistema de modais padronizado que segue o design das imagens de referência fornecidas.

## 🎨 Design e Comportamento

### Características Visuais
- **Posição**: Modal fixo no lado direito da tela (right drawer)
- **Largura**: Entre 420px e 500px (responsivo)
- **Fundo**: Branco puro (#FFFFFF) com sombra sutil
- **Bordas**: Arredondadas (rounded-l-2xl) para um visual moderno
- **Espaçamento**: Padding generoso (px-8 py-6) para respirar melhor
- **Animação**: Slide-in/out suave da direita usando framer-motion
- **Overlay**: Fundo escurecido (rgba(0,0,0,0.25))
- **Design**: Limpo e profissional, sem ícones desnecessários

### Tipografia e Cores
- **Fonte**: Inter ou DM Sans, peso médio
- **Título**: text-lg ou text-xl com font-semibold
- **Texto secundário**: text-sm text-gray-500
- **Espaçamento**: px-6 py-4 consistente
- **Paleta**: 
  - Fundo: #FFFFFF
  - Textos primários: #111827
  - Textos secundários: #6B7280
  - Bordas: #E5E7EB
  - Azul principal: #2563EB

## 🧩 Componentes Disponíveis

### RightDrawerModal
Componente principal que encapsula toda a estrutura do modal.

```tsx
import { RightDrawerModal } from '@/components/ui/right-drawer-modal';

<RightDrawerModal
  open={isOpen}
  onClose={onClose}
  title="Título do Modal"
  id="ID #123456"
  pagination={{
    current: 3,
    total: 12,
    onPrevious: () => {},
    onNext: () => {}
  }}
  actions={[
    {
      label: "Cancelar",
      variant: "outline",
      onClick: () => {}
    },
    {
      label: "Confirmar",
      variant: "primary",
      onClick: () => {},
      icon: <CheckIcon className="h-4 w-4" />
    }
  ]}
>
  {/* Conteúdo do modal */}
</RightDrawerModal>
```

### ModalSection
Divide o conteúdo em seções com título e espaçamento consistente.

```tsx
import { ModalSection } from '@/components/ui/right-drawer-modal';

<ModalSection title="Personal Detail">
  {/* Conteúdo da seção */}
</ModalSection>
```

### PersonalDetailSection
Seção específica para informações pessoais com avatar, nome e contato.

```tsx
import { PersonalDetailSection } from '@/components/ui/right-drawer-modal';

<PersonalDetailSection
  avatar={<img src="avatar.jpg" alt="Nome" />}
  name="Nome do Usuário"
  contact={{
    phone: "+55 11 99999-9999",
    email: "email@exemplo.com"
  }}
/>
```

### InfoField
Campo de informação com ícone, label e valor.

```tsx
import { InfoField } from '@/components/ui/right-drawer-modal';

<InfoField
  label="Data de Criação"
  value="12/01/2024"
  icon={<Calendar className="h-4 w-4 text-gray-500" />}
/>
```

### TagList
Lista de tags com opção de remoção e adição.

```tsx
import { TagList } from '@/components/ui/right-drawer-modal';

<TagList 
  tags={["Tag 1", "Tag 2", "Tag 3"]} 
  onRemove={(tag) => console.log('Remove:', tag)}
  onAdd={() => console.log('Add new tag')}
/>
```

### ScheduleEntry
Entrada de cronograma com data, título e detalhes.

```tsx
import { ScheduleEntry } from '@/components/ui/right-drawer-modal';

<ScheduleEntry
  date="12 Oct 2023 10:30 AM"
  title="Check up tooth"
  details={[
    { label: "Doctor", value: "Dr. João" },
    { label: "Room", value: "Sala 1" }
  ]}
/>
```

## 📝 Exemplo Completo

```tsx
import React from 'react';
import { 
  RightDrawerModal,
  ModalSection,
  PersonalDetailSection,
  InfoField,
  TagList
} from '@/components/ui/right-drawer-modal';
import { Calendar, User, Mail, Phone } from 'lucide-react';

function MyModal({ isOpen, onClose, data }) {
  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Detalhes do Item"
      id={`ID #${data.id.slice(-6)}`}
      actions={[
        {
          label: "Cancelar",
          variant: "outline",
          onClick: onClose
        },
        {
          label: "Salvar",
          variant: "primary",
          onClick: () => {
            // Lógica de salvamento
            onClose();
          }
        }
      ]}
    >
      {/* Personal Detail Section */}
      <ModalSection title="Personal Detail">
        <PersonalDetailSection
          avatar={
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          }
          name={data.name}
          contact={{
            phone: data.phone,
            email: data.email
          }}
        />
      </ModalSection>

      {/* Information Section */}
      <ModalSection title="Information">
        <InfoField
          label="Data de Criação"
          value={data.createdAt}
          icon={<Calendar className="h-4 w-4 text-gray-500" />}
        />
      </ModalSection>

      {/* Tags Section */}
      <ModalSection title="Tags">
        <TagList 
          tags={data.tags} 
          onRemove={(tag) => handleRemoveTag(tag)}
        />
      </ModalSection>
    </RightDrawerModal>
  );
}
```

## 🔧 Migração de Modais Existentes

Para migrar um modal existente:

1. **Substitua Dialog por RightDrawerModal**
2. **Organize o conteúdo em ModalSection**
3. **Use os componentes auxiliares apropriados**
4. **Mantenha as ações no array actions**
5. **Ajuste as cores e espaçamentos conforme o padrão**

### Antes (Dialog padrão):
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* Conteúdo */}
    </div>
  </DialogContent>
</Dialog>
```

### Depois (RightDrawerModal):
```tsx
<RightDrawerModal
  open={isOpen}
  onClose={onClose}
  title="Título"
  actions={[/* ações */]}
>
  <ModalSection title="Seção">
    {/* Conteúdo organizado */}
  </ModalSection>
</RightDrawerModal>
```

## ✅ Modais Migrados

Os seguintes modais já foram migrados para o novo padrão:

### Modais de Visualização
- ✅ LeadDetailModal
- ✅ ProjectViewModal  
- ✅ ActivityViewModal
- ✅ WorkGroupDetailModal
- ✅ AppointmentRequestModal (exemplo)

### Modais de Criação/Edição
- ✅ CreateActivityModal (criar/editar atividades)
- ✅ CreateSupplierModal (criar fornecedores)
- ✅ CreateCompanyModal (criar empresas)
- ✅ CreateInventoryItemModalNew (criar/ajustar itens de inventário)
- ✅ CreateWorkGroupModal (criar grupos de trabalho)

### Modais de Upload/Arquivo
- ✅ FileUploadModal (upload de arquivos)

## 🎯 Benefícios

1. **Consistência Visual**: Todos os modais seguem o mesmo design
2. **Reutilização**: Componentes auxiliares podem ser reutilizados
3. **Manutenibilidade**: Mudanças no design afetam todos os modais
4. **Acessibilidade**: Focus trap e navegação por teclado
5. **Performance**: Animações otimizadas com framer-motion
6. **Responsividade**: Adapta-se a diferentes tamanhos de tela

## 🔍 Verificação

Para verificar se um modal está seguindo o padrão:

- [ ] Usa RightDrawerModal como container
- [ ] Tem título e ID no header
- [ ] Organiza conteúdo em ModalSection
- [ ] Usa componentes auxiliares apropriados
- [ ] Tem ações no footer
- [ ] Segue a paleta de cores padrão
- [ ] Tem animações suaves
- [ ] É responsivo
