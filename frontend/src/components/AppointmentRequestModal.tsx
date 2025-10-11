import React from 'react';
import { 
  RightDrawerModal,
  ModalSection,
  PersonalDetailSection,
  InfoField,
  TagList,
  ScheduleEntry
} from '@/components/ui/right-drawer-modal';
import { 
  Calendar, 
  MessageSquare, 
  User,
  Clock,
  MapPin
} from 'lucide-react';

interface AppointmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    patient: {
      name: string;
      avatar?: string;
      phone: string;
      email: string;
    };
    reason: string;
    diagnosis: string;
    preferredPharmacy: string[];
    bookingInfo: {
      date: string;
      type: string;
    };
    schedule: Array<{
      date: string;
      title: string;
      details: Array<{ label: string; value: string; }>;
    }>;
  };
  onApprove?: () => void;
  onDecline?: () => void;
}

export function AppointmentRequestModal({
  isOpen,
  onClose,
  appointment,
  onApprove,
  onDecline
}: AppointmentRequestModalProps) {
  const avatarElement = appointment.patient.avatar ? (
    <img
      className="h-12 w-12 rounded-full object-cover border border-gray-200"
      src={appointment.patient.avatar}
      alt={appointment.patient.name}
    />
  ) : (
    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center border border-gray-200">
      <User className="h-6 w-6 text-gray-600" />
    </div>
  );

  return (
    <RightDrawerModal
      open={isOpen}
      onClose={onClose}
      title="Request Appointment"
      id={`ID #${appointment.id}`}
      pagination={{
        current: 3,
        total: 12,
        onPrevious: () => console.log('Previous'),
        onNext: () => console.log('Next')
      }}
      actions={[
        {
          label: "Decline",
          variant: "outline",
          onClick: onDecline || (() => console.log('Decline'))
        },
        {
          label: "Approve",
          variant: "primary",
          onClick: onApprove || (() => console.log('Approve')),
          icon: <Calendar className="h-4 w-4" />
        }
      ]}
    >
      {/* Personal Detail Section */}
      <ModalSection title="Personal Detail">
        <PersonalDetailSection
          avatar={avatarElement}
          name={appointment.patient.name}
          contact={{
            phone: appointment.patient.phone,
            email: appointment.patient.email
          }}
        />
      </ModalSection>

      {/* Reason Section */}
      <ModalSection title="Reason">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            {appointment.reason}
          </p>
        </div>
      </ModalSection>

      {/* Diagnose Section */}
      <ModalSection title="Diagnose">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            {appointment.diagnosis}
          </p>
        </div>
        
        {/* Preferred Pharmacy */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Preferred Pharmacy</p>
          <TagList tags={appointment.preferredPharmacy} />
        </div>
      </ModalSection>

      {/* Booking Information Section */}
      <ModalSection title="Booking Information">
        <InfoField
          label="Date"
          value={appointment.bookingInfo.date}
          icon={<Calendar className="h-4 w-4 text-gray-500" />}
        />
        <InfoField
          label="Appointment Type"
          value={appointment.bookingInfo.type}
          icon={<MessageSquare className="h-4 w-4 text-gray-500" />}
        />
      </ModalSection>

      {/* Planning Schedule Section */}
      <ModalSection title="Planning Schedule">
        <div className="space-y-4">
          {appointment.schedule.map((scheduleItem, index) => (
            <ScheduleEntry
              key={index}
              date={scheduleItem.date}
              title={scheduleItem.title}
              details={scheduleItem.details}
            />
          ))}
        </div>
      </ModalSection>
    </RightDrawerModal>
  );
}

// Exemplo de uso com dados mockados
export function ExampleAppointmentRequestModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  const mockAppointment = {
    id: "202324",
    patient: {
      name: "Jerome Bellingham",
      avatar: undefined,
      phone: "+62 837 356 343 23",
      email: "jeromebellingham93@mail.com"
    },
    reason: "Eating sweet foods, not brushing your teeth regularly. often drink cold water when eating food that is still hot.",
    diagnosis: "Cavities, Exposed nerves causing pain, Tartar teeth",
    preferredPharmacy: [
      "Cataflam 50 mg",
      "Ponstan 500 mg", 
      "Mefinal 500 mg",
      "Ibuprofen 400 mg"
    ],
    bookingInfo: {
      date: "Thursday, 12 November, 09.00 AM - 10.00AM",
      type: "Chat WhatsApp"
    },
    schedule: [
      {
        date: "12 Oct 2023 10:30 AM",
        title: "Check up tooth",
        details: [
          { label: "Doctor", value: "Drg. Dianne Rachel" },
          { label: "Assistant Doctor", value: "Maria Kitty" },
          { label: "Room", value: "Dental A12" }
        ]
      },
      {
        date: "12 Oct 2013 10:30 AM", 
        title: "Prosthetic Tooth Fabrication",
        details: [
          { label: "Doctor", value: "Drg. Dianne Rachel" },
          { label: "Assistant Doctor", value: "Markonah Nicky" },
          { label: "Room", value: "Labolatorium Tooth 1" }
        ]
      }
    ]
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Abrir Modal de Exemplo
      </button>
      
      <AppointmentRequestModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appointment={mockAppointment}
        onApprove={() => {
          console.log('Appointment approved');
          setIsOpen(false);
        }}
        onDecline={() => {
          console.log('Appointment declined');
          setIsOpen(false);
        }}
      />
    </>
  );
}
