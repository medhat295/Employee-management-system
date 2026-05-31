import { Mail, Phone, MapPin, Building2, LayoutGrid, Calendar, Clock } from 'lucide-react';
import type { Employee } from '../../types';
import { formatDate, formatTenure, getInitials, avatarColor } from '../../utils/format';
import { Modal, ModalHeader } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';

interface Props {
  employee: Employee;
  deptMap: Map<number, string>;
  companyMap: Map<number, string>;
  onClose: () => void;
}

export function ViewEmployeeModal({ employee, deptMap, companyMap, onClose }: Props) {
  const color = avatarColor(employee.name);
  return (
    <Modal maxWidth="lg">
      <ModalHeader title="Employee Profile" onClose={onClose} />
      <div className="px-6 py-5 space-y-5">

        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-xl">{getInitials(employee.name)}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#2D3B55]">{employee.name}</p>
            <p className="text-sm text-gray-500">{employee.title}</p>
            <StatusBadge status={employee.status} />
          </div>
        </div>

        <div className="bg-[#2D3B55]/5 rounded-xl px-4 py-3 flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#2D3B55] flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Time Employed</p>
            <p className="font-bold text-[#2D3B55]">
              {formatTenure(employee.days_employed)}
              <span className="text-xs font-normal text-gray-500 ml-1.5">
                (since {formatDate(employee.hire_date)})
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Mail,       label: 'Email',      value: employee.email },
            { icon: Phone,      label: 'Mobile',     value: employee.mobile },
            { icon: LayoutGrid, label: 'Department',  value: deptMap.get(employee.department_id) ?? '—' },
            { icon: Building2,  label: 'Company',     value: companyMap.get(employee.company_id) ?? '—' },
            { icon: Calendar,   label: 'Hire Date',   value: formatDate(employee.hire_date) },
            { icon: MapPin,     label: 'Address',     value: employee.address || '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
      <div className="px-6 pb-5">
        <button onClick={onClose}
          className="w-full h-10 rounded-xl bg-[#2D3B55] text-white text-sm font-semibold
            hover:bg-[#22C55E] transition-all duration-200">
          Close
        </button>
      </div>
    </Modal>
  );
}
