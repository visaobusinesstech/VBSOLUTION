import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SmtpStatusIndicatorProps {
  useSmtp: boolean;
  hasSmtpSettings: boolean;
}

export function SmtpStatusIndicator({ useSmtp, hasSmtpSettings }: SmtpStatusIndicatorProps) {
  if (!useSmtp) return null;

  return (
    <Alert className={hasSmtpSettings ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
      {hasSmtpSettings ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-yellow-600" />
      )}
      <AlertDescription className={hasSmtpSettings ? 'text-green-700' : 'text-yellow-700'}>
        {hasSmtpSettings
          ? 'SMTP configurado e pronto para uso'
          : 'Configure seu servidor SMTP para enviar emails'}
      </AlertDescription>
    </Alert>
  );
}
