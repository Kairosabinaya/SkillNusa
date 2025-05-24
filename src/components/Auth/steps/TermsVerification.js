import React from 'react';
import { Formik, Form } from 'formik';
import { useRegistration } from '../../../context/RegistrationContext';
import { termsSchema } from '../../../validation/registrationSchema';
import { Checkbox } from '../../common/Checkbox';
import { Button } from '../../common/Button';
import { Alert } from '../../common/Alert';

const TermsVerification = () => {
  const { formData, updateFormData, prevStep, submitRegistration, error } = useRegistration();

  const handleSubmit = async (values) => {
    updateFormData(values);
    await submitRegistration();
  };

  return (
    <Formik
      initialValues={{
        termsAccepted: formData.termsAccepted || false,
        privacyAccepted: formData.privacyAccepted || false,
        marketingEmails: formData.marketingEmails || false
      }}
      validationSchema={termsSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, isValid, dirty }) => (
        <Form className="space-y-6">
          {error && (
            <Alert
              type="error"
              title="Error"
              message={error}
            />
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Syarat dan Ketentuan
            </h3>
            <p className="text-sm text-gray-600">
              Sebelum menyelesaikan pendaftaran, mohon baca dan setujui syarat dan ketentuan berikut:
            </p>
          </div>

          <div className="space-y-4">
            <Checkbox
              name="termsAccepted"
              label={
                <span>
                  Saya menyetujui{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-500"
                  >
                    Syarat dan Ketentuan
                  </a>
                  {' '}SkillNusa
                </span>
              }
              required
            />

            <Checkbox
              name="privacyAccepted"
              label={
                <span>
                  Saya menyetujui{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-500"
                  >
                    Kebijakan Privasi
                  </a>
                  {' '}SkillNusa
                </span>
              }
              required
            />

            <Checkbox
              name="marketingEmails"
              label="Saya ingin menerima email marketing dan penawaran dari SkillNusa"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Informasi Penting:
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
              <li>Anda akan menerima email verifikasi setelah mendaftar</li>
              <li>Akun Anda harus diverifikasi sebelum dapat menggunakan layanan</li>
              <li>Pastikan email yang Anda daftarkan aktif dan dapat diakses</li>
              <li>Data yang Anda berikan dapat diubah setelah pendaftaran</li>
            </ul>
          </div>

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
              Daftar Sekarang
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default TermsVerification; 