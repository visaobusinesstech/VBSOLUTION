import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModalAction {
  label: string;
  variant: 'primary' | 'outline' | 'destructive';
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface RightDrawerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  id?: string;
  pagination?: {
    current: number;
    total: number;
    onPrevious?: () => void;
    onNext?: () => void;
  };
  actions?: ModalAction[];
  children: React.ReactNode;
  className?: string;
}

export function RightDrawerModal({
  open,
  onClose,
  title,
  id,
  pagination,
  actions = [],
  children,
  className
}: RightDrawerModalProps) {
  // Focus trap e tecla ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/25"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200,
              duration: 0.3 
            }}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-[500px] min-w-[420px] z-50",
              "bg-white shadow-xl flex flex-col rounded-l-2xl",
              className
            )}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 px-8 py-6 rounded-tl-2xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 truncate">
                    {title}
                  </h2>
                  {id && (
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                      {id}
                    </p>
                  )}
                </div>
                
                {/* Pagination */}
                {pagination && (
                  <div className="flex items-center gap-3 mr-6">
                    <span className="text-sm text-gray-600 font-medium">
                      {pagination.current} of {pagination.total}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={pagination.onPrevious}
                        disabled={pagination.current <= 1}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={pagination.onNext}
                        disabled={pagination.current >= pagination.total}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto px-8 py-4">
               {children}
             </div>

            {/* Footer */}
            {actions.length > 0 && (
              <div className="flex-shrink-0 border-t border-gray-200 bg-white px-8 py-4 rounded-bl-2xl">
                <div className="flex justify-end gap-3">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant === 'primary' ? 'default' : action.variant === 'destructive' ? 'destructive' : 'outline'}
                      onClick={action.onClick}
                      disabled={action.disabled}
                       className={cn(
                         "px-6 py-2.5 rounded-lg font-medium transition-all duration-200",
                         action.variant === 'primary' && "shadow-lg hover:shadow-xl",
                         action.variant === 'outline' && "border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
                         action.variant === 'destructive' && "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                       )}
                       style={action.variant === 'primary' ? {
                         background: '#021529',
                         color: 'white',
                         border: 'none'
                       } : undefined}
                       onMouseEnter={action.variant === 'primary' ? (e) => {
                         e.currentTarget.style.background = '#031a35';
                       } : undefined}
                       onMouseLeave={action.variant === 'primary' ? (e) => {
                         e.currentTarget.style.background = '#021529';
                       } : undefined}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Componentes auxiliares para estrutura do modal
 export function ModalSection({ 
   title, 
   children, 
   className 
 }: { 
   title?: string; 
   children: React.ReactNode; 
   className?: string; 
 }) {
   return (
     <div className={cn("border-b border-gray-200 py-4 last:border-b-0", className)}>
       {title && (
         <h3 className="text-sm font-semibold text-gray-900 mb-3 tracking-wide">
           {title}
         </h3>
       )}
       {children}
     </div>
   );
 }

export function PersonalDetailSection({ 
  avatar, 
  name, 
  contact 
}: { 
  avatar?: string | React.ReactNode; 
  name: string; 
  contact?: { phone?: string; email?: string; }; 
}) {
  return (
    <div className="flex items-start gap-5">
      {avatar && (
        <div className="flex-shrink-0">
          {typeof avatar === 'string' ? (
            <img
              src={avatar}
              alt={name}
              className="h-12 w-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            avatar
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {name}
        </h4>
        {contact && (
          <div className="space-y-1">
            {contact.phone && (
              <p className="text-sm text-gray-600">
                {contact.phone}
              </p>
            )}
            {contact.email && (
              <p className="text-sm text-gray-600">
                {contact.email}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function InfoField({ 
  label, 
  value, 
  icon, 
  className 
}: { 
  label: string; 
  value: string | React.ReactNode; 
  icon?: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-sm font-medium text-gray-600">
        {label}
      </p>
      <div className="text-sm text-gray-900">
        {value}
      </div>
    </div>
  );
}

export function TagList({ 
  tags, 
  onRemove, 
  onAdd 
}: { 
  tags: string[]; 
  onRemove?: (tag: string) => void; 
  onAdd?: () => void; 
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {tag}
          {onRemove && (
            <button
              onClick={() => onRemove(tag)}
              className="ml-1 hover:text-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <span>+</span>
          Adicionar
        </button>
      )}
    </div>
  );
}

export function ScheduleEntry({ 
  date, 
  title, 
  details 
}: { 
  date: string; 
  title: string; 
  details: Array<{ label: string; value: string; }>; 
}) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 mb-2 font-medium">{date}</p>
        <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
        <div className="grid grid-cols-1 gap-3 text-sm">
          {details.map((detail, index) => (
            <div key={index} className="flex">
              <span className="text-gray-600 font-medium min-w-[120px]">{detail.label}:</span>
              <span className="text-gray-900 ml-2">{detail.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
