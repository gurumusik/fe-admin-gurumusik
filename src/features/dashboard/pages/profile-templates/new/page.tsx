/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiCheckboxCircleFill, RiCloseLine } from 'react-icons/ri';

import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import ProfileTemplateForm, {
  type ProfileTemplateFormValues,
} from '@/features/dashboard/components/ProfileTemplateForm';
import { createProfileTemplate } from '@/services/api/profileTemplate.api';

const emptyValues: ProfileTemplateFormValues = {
  name: '',
  category: '',
  tags: [],
  headline: '',
  about: '',
  designed_for: [],
  sort_order: 0,
  is_active: true,
};

export default function AdminProfileTemplateCreatePage() {
  const navigate = useNavigate();

  const [values, setValues] = React.useState<ProfileTemplateFormValues>(emptyValues);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);

  const [result, setResult] = React.useState<null | { ok: boolean; message?: string; id?: number }>(null);

  const submit = async () => {
    setSubmitting(true);
    setErrorText(null);
    try {
      const resp = await createProfileTemplate({
        name: values.name.trim(),
        category: values.category.trim(),
        tags: values.tags,
        headline: values.headline,
        about: values.about,
        designed_for: values.designed_for,
        sort_order: values.sort_order,
        is_active: values.is_active,
      });
      setResult({ ok: true, id: resp.data.id });
    } catch (e: any) {
      setErrorText(e?.message ?? 'Gagal membuat template');
      setResult({ ok: false, message: e?.message ?? 'Gagal membuat template' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ProfileTemplateForm
        title="Tambah Template Profile Guru"
        values={values}
        onChange={setValues}
        onSubmit={submit}
        submitLabel="Buat Template"
        submitting={submitting}
        errorText={errorText}
      />

      {result && (
        <ConfirmationModal
          isOpen
          onClose={() => {
            const id = result.id;
            setResult(null);
            if (result.ok && id) navigate(`/dashboard-admin/profile-templates/${id}`, { replace: true });
          }}
          icon={result.ok ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={result.ok ? 'success' : 'danger'}
          title={result.ok ? 'Template Berhasil Dibuat' : 'Gagal Membuat Template'}
          texts={result.ok ? ['Template berhasil dibuat.'] : [result.message || 'Terjadi kendala.']}
          align="center"
          button1={{
            label: result.ok ? 'Lanjut Edit' : 'Tutup',
            variant: 'primary',
            onClick: () => {
              const id = result.id;
              setResult(null);
              if (result.ok && id) navigate(`/dashboard-admin/profile-templates/${id}`, { replace: true });
            },
          }}
          button2={
            result.ok
              ? {
                  label: 'Kembali ke List',
                  variant: 'outline',
                  onClick: () => {
                    setResult(null);
                    navigate('/dashboard-admin/profile-templates');
                  },
                }
              : undefined
          }
          showCloseIcon
        />
      )}
    </>
  );
}

