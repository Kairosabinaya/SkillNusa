import React from 'react';
import { Formik, Form, FieldArray } from 'formik';
import { useRegistration } from '../../../context/RegistrationContext';
import { freelancerInfoSchema, clientInfoSchema } from '../../../validation/registrationSchema';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { Button } from '../../common/Button';
import { TagInput } from '../../common/TagInput';
import { RadioGroup } from '../../common/RadioGroup';
import { CheckboxGroup } from '../../common/CheckboxGroup';
import { skillsList } from '../../../data/skills';
import { industries } from '../../../data/industries';

const RoleSpecificInfo = () => {
  const { formData, updateFormData, nextStep, prevStep } = useRegistration();

  const experienceLevelOptions = [
    { id: 'beginner', label: 'Pemula', description: '0-2 tahun pengalaman' },
    { id: 'intermediate', label: 'Menengah', description: '2-5 tahun pengalaman' },
    { id: 'expert', label: 'Ahli', description: '5+ tahun pengalaman' }
  ];

  const availabilityOptions = [
    { id: 'full-time', label: 'Penuh Waktu', description: '40 jam/minggu' },
    { id: 'part-time', label: 'Paruh Waktu', description: '20-30 jam/minggu' },
    { id: 'project-based', label: 'Berbasis Proyek', description: 'Sesuai kebutuhan proyek' }
  ];

  const companySizeOptions = [
    { value: '1-10', label: '1-10 karyawan' },
    { value: '11-50', label: '11-50 karyawan' },
    { value: '51-200', label: '51-200 karyawan' },
    { value: '200+', label: 'Lebih dari 200 karyawan' },
    { value: 'individual', label: 'Perorangan' }
  ];

  const budgetRangeOptions = [
    { value: 'under_1m', label: 'Di bawah 1 juta' },
    { value: '1m_5m', label: '1 - 5 juta' },
    { value: '5m_10m', label: '5 - 10 juta' },
    { value: '10m_50m', label: '10 - 50 juta' },
    { value: 'above_50m', label: 'Di atas 50 juta' }
  ];

  const primaryNeedsOptions = [
    { value: 'web_design', label: 'Desain Website' },
    { value: 'mobile_app', label: 'Aplikasi Mobile' },
    { value: 'content_writing', label: 'Penulisan Konten' },
    { value: 'graphic_design', label: 'Desain Grafis' },
    { value: 'digital_marketing', label: 'Digital Marketing' },
    { value: 'video_editing', label: 'Pengeditan Video' },
    { value: 'translation', label: 'Penerjemahan' },
    { value: 'data_entry', label: 'Input Data' },
    { value: 'virtual_assistant', label: 'Asisten Virtual' }
  ];

  const handleSubmit = (values) => {
    updateFormData(values);
    nextStep();
  };

  const FreelancerForm = () => (
    <Formik
      initialValues={{
        skills: formData.skills || [],
        experienceLevel: formData.experienceLevel || '',
        portfolioLinks: formData.portfolioLinks || [''],
        hourlyRate: formData.hourlyRate || '',
        availability: formData.availability || ''
      }}
      validationSchema={freelancerInfoSchema}
      onSubmit={handleSubmit}
    >
      {({ values, isSubmitting, isValid, dirty }) => (
        <Form className="space-y-6">
          <TagInput
            label="Keahlian"
            name="skills"
            suggestions={skillsList}
            placeholder="Pilih atau ketik keahlian"
            helperText="Minimal 3 keahlian"
            required
          />

          <RadioGroup
            label="Level Pengalaman"
            name="experienceLevel"
            options={experienceLevelOptions}
            required
          />

          <FieldArray name="portfolioLinks">
            {({ push, remove }) => (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Link Portfolio (Opsional)
                </label>
                {values.portfolioLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      name={`portfolioLinks.${index}`}
                      type="url"
                      placeholder="https://"
                      className="flex-1"
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => remove(index)}
                      >
                        Hapus
                      </Button>
                    )}
                  </div>
                ))}
                {values.portfolioLinks.length < 3 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => push('')}
                  >
                    Tambah Link
                  </Button>
                )}
              </div>
            )}
          </FieldArray>

          <Input
            label="Rate per Jam (Rp)"
            name="hourlyRate"
            type="number"
            placeholder="Masukkan rate per jam"
            helperText="Opsional"
          />

          <RadioGroup
            label="Ketersediaan"
            name="availability"
            options={availabilityOptions}
            required
          />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              loading={isSubmitting}
            >
              Lanjutkan
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );

  const ClientForm = () => (
    <Formik
      initialValues={{
        companyName: formData.companyName || '',
        industry: formData.industry || '',
        companySize: formData.companySize || '',
        budgetRange: formData.budgetRange || '',
        primaryNeeds: formData.primaryNeeds || []
      }}
      validationSchema={clientInfoSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, isValid, dirty }) => (
        <Form className="space-y-6">
          <Input
            label="Nama Perusahaan/Organisasi"
            name="companyName"
            type="text"
            placeholder="Nama perusahaan Anda"
            helperText="Opsional"
          />

          <Select
            label="Industri"
            name="industry"
            options={industries.map(industry => ({
              value: industry.id,
              label: industry.name
            }))}
            required
          />

          <Select
            label="Ukuran Perusahaan"
            name="companySize"
            options={companySizeOptions}
            required
          />

          <Select
            label="Kisaran Budget"
            name="budgetRange"
            options={budgetRangeOptions}
            required
          />

          <CheckboxGroup
            label="Kebutuhan Utama"
            name="primaryNeeds"
            options={primaryNeedsOptions}
            required
            helperText="Pilih minimal 1 kebutuhan"
          />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              loading={isSubmitting}
            >
              Lanjutkan
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );

  return formData.roles.includes('freelancer') ? <FreelancerForm /> : <ClientForm />;
};

export default RoleSpecificInfo; 