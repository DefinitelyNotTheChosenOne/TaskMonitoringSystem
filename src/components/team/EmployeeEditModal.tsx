'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import ModalDialog from '@/components/ui/ModalDialog';
import { useToast } from '@/components/ui/ToastProvider';
import { updateEmployeeDetails } from '@/lib/api/team';
import { EmployeeDetailedProfile } from '@/lib/types/workspace';

interface EmployeeEditModalProps {
  employee: EmployeeDetailedProfile | null;
  departments: readonly string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const EMPLOYEE_STATUS_OPTIONS = ['Active', 'Probationary', 'On Leave', 'Inactive'] as const;

function EmployeeEditForm({
  employee,
  departments,
  onClose,
  onSaved,
}: {
  employee: EmployeeDetailedProfile;
  departments: readonly string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(employee.name);
  const [empId, setEmpId] = useState(employee.emp_id ?? '');
  const [department, setDepartment] = useState(employee.department ?? '');
  const [position, setPosition] = useState(employee.position ?? '');
  const [phone, setPhone] = useState(employee.phone ?? '');
  const [employeeStatus, setEmployeeStatus] = useState(employee.employee_status ?? 'Active');
  const [dateOfHire, setDateOfHire] = useState(employee.date_of_hire ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(employee.date_of_birth ?? '');
  const [homeAddress, setHomeAddress] = useState(employee.home_address ?? '');
  const [emergencyContactName, setEmergencyContactName] = useState(
    employee.emergency_contact_name ?? ''
  );
  const [emergencyContactNumber, setEmergencyContactNumber] = useState(
    employee.emergency_contact_number ?? ''
  );
  const [tin, setTin] = useState(employee.tin ?? '');
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const departmentChoices = Array.from(
    new Set([...departments, ...(department ? [department] : [])].filter(Boolean))
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const res = await updateEmployeeDetails(employee.id, {
      name: name.trim(),
      emp_id: empId.trim() || null,
      department: department.trim() || null,
      position: position.trim() || null,
      phone: phone.trim() || null,
      employee_status: employeeStatus || 'Active',
      date_of_hire: dateOfHire || null,
      date_of_birth: dateOfBirth || null,
      home_address: homeAddress.trim() || null,
      emergency_contact_name: emergencyContactName.trim() || null,
      emergency_contact_number: emergencyContactNumber.trim() || null,
      tin: tin.trim() || null,
    });
    setSaving(false);

    if (!res.ok) {
      showToast({
        title: 'Could not update employee profile',
        description: res.error ?? undefined,
        tone: 'danger',
      });
      return;
    }

    if (res.migrationRequired) {
      showToast({
        title: 'Core fields saved',
        description: 'Run supabase_migration.sql to persist extended HR fields.',
        tone: 'info',
      });
    } else {
      showToast({
        title: `Updated "${name.trim()}"`,
        tone: 'success',
      });
    }

    await onSaved();
    onClose();
  };

  return (
    <form
      id="employee-edit-form"
      className="form-stack"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <p className="form-hint">Fields marked * are required.</p>

      <div className="form-grid--2">
        <div className="field">
          <label htmlFor="edit-emp-name" className="field-label">
            Full Name<span className="field-required" aria-hidden="true">*</span>
          </label>
          <input
            id="edit-emp-name"
            type="text"
            required
            data-error="edit-emp-name-error"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div id="edit-emp-name-error" className="error-msg">
            <AlertCircle size={14} aria-hidden="true" />
            <span>Full name is required.</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="edit-emp-id" className="field-label">
            Employee ID
          </label>
          <input
            id="edit-emp-id"
            type="text"
            className="field-input"
            placeholder="EMP-001"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-emp-dept" className="field-label">
            Department
          </label>
          <select
            id="edit-emp-dept"
            className="field-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">Unassigned</option>
            {departmentChoices.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="edit-emp-position" className="field-label">
            Position / Title
          </label>
          <input
            id="edit-emp-position"
            type="text"
            className="field-input"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-emp-phone" className="field-label">
            Phone Number
          </label>
          <input
            id="edit-emp-phone"
            type="tel"
            className="field-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-emp-status" className="field-label">
            Employment Status
          </label>
          <select
            id="edit-emp-status"
            className="field-select"
            value={employeeStatus}
            onChange={(e) => setEmployeeStatus(e.target.value)}
          >
            {EMPLOYEE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="edit-emp-hire" className="field-label">
            Date of Hire
          </label>
          <input
            id="edit-emp-hire"
            type="date"
            className="field-input"
            value={dateOfHire}
            onChange={(e) => setDateOfHire(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-emp-dob" className="field-label">
            Date of Birth
          </label>
          <input
            id="edit-emp-dob"
            type="date"
            className="field-input"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-emp-emergency-name" className="field-label">
            Emergency Contact Name
          </label>
          <input
            id="edit-emp-emergency-name"
            type="text"
            className="field-input"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-emp-emergency-phone" className="field-label">
            Emergency Contact Phone
          </label>
          <input
            id="edit-emp-emergency-phone"
            type="tel"
            className="field-input"
            value={emergencyContactNumber}
            onChange={(e) => setEmergencyContactNumber(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="edit-emp-tin" className="field-label">
            TIN / Tax ID
          </label>
          <input
            id="edit-emp-tin"
            type="text"
            className="field-input"
            value={tin}
            onChange={(e) => setTin(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="edit-emp-address" className="field-label">
          Home Address
        </label>
        <input
          id="edit-emp-address"
          type="text"
          className="field-input"
          value={homeAddress}
          onChange={(e) => setHomeAddress(e.target.value)}
        />
      </div>

      <div className="form-actions-end">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

export default function EmployeeEditModal({
  employee,
  departments,
  onClose,
  onSaved,
}: EmployeeEditModalProps) {
  return (
    <ModalDialog
      open={Boolean(employee)}
      onClose={onClose}
      title={employee ? `Edit ${employee.name}` : 'Edit Employee'}
      subtitle="Update directory metadata and confidential HR records"
      size="lg"
    >
      {employee ? (
        <EmployeeEditForm
          key={employee.id}
          employee={employee}
          departments={departments}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : (
        <div />
      )}
    </ModalDialog>
  );
}
