import { useToast } from '../context/ToastContext'
import { useLanguage } from '../context/LanguageContext'

/**
 * Standardised admin feedback hook.
 *
 *   const a = useAdminToasts()
 *   a.success('create')   // "تمت الإضافة بنجاح"
 *   a.success('update')
 *   a.success('delete')
 *   a.success('archive')
 *   a.success('status')
 *   a.error()             // "حدث خطأ، حاول مرة أخرى"
 *   a.error(err)          // server message if available, else generic
 *
 * Keeps the wording identical across pages and prevents "double-toast" bugs
 * by making the call site a single line.
 */
export default function useAdminToasts() {
  const { toast } = useToast()
  const { t } = useLanguage()

  const success = (kind = 'update') => {
    const key = {
      create:  'admin.toastCreated',
      update:  'admin.toastUpdated',
      delete:  'admin.toastDeleted',
      archive: 'admin.toastArchived',
      status:  'admin.toastStatusChanged',
    }[kind] || 'admin.toastUpdated'
    toast(t(key))
  }

  const error = (err) => {
    const msg = err?.response?.data?.message || t('admin.toastError')
    toast(msg, 'error')
  }

  return { success, error, toast }
}
