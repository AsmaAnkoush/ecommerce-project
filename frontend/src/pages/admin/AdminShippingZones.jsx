import { useEffect, useState } from 'react'
import {
  getAdminShippingZones,
  createShippingZone,
  updateZonePrice,
  toggleZoneActive,
  deleteShippingZone,
} from '../../api/shippingApi'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import PageHeader from '../../components/layout/PageHeader'
import { useLanguage } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'

const EMPTY_FORM = { nameEn: '', nameAr: '', price: '', deliveryDays: '1-2', icon: '📦', displayOrder: '' }

export default function AdminShippingZones() {
  const { t } = useLanguage()
  const { toast } = useToast()

  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [editingPriceId, setEditingPriceId] = useState(null)
  const [priceInput, setPriceInput] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  const [togglingId, setTogglingId] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchZones = () =>
    getAdminShippingZones()
      .then(r => setZones(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { fetchZones() }, [])

  /* ── Add new zone ── */
  const handleCreate = async e => {
    e.preventDefault()
    if (!form.nameEn.trim() || !form.nameAr.trim() || !form.price) return
    setSaving(true)
    try {
      await createShippingZone({
        nameEn: form.nameEn.trim(),
        nameAr: form.nameAr.trim(),
        price: parseFloat(form.price),
        deliveryDays: form.deliveryDays.trim() || '1-2',
        icon: form.icon.trim() || '📦',
        displayOrder: form.displayOrder ? parseInt(form.displayOrder) : 99,
      })
      setForm(EMPTY_FORM)
      setShowAddForm(false)
      await fetchZones()
      toast(t('admin.zoneCreated'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally { setSaving(false) }
  }

  /* ── Inline price edit ── */
  const startEditPrice = zone => {
    setEditingPriceId(zone.id)
    setPriceInput(zone.price?.toString() ?? '')
  }

  const cancelEditPrice = () => {
    setEditingPriceId(null)
    setPriceInput('')
  }

  const savePrice = async id => {
    const val = parseFloat(priceInput)
    if (isNaN(val) || val < 0) return
    setSavingPrice(true)
    try {
      const res = await updateZonePrice(id, val)
      const updated = res.data.data
      setZones(prev => prev.map(z => z.id === id ? { ...z, price: updated.price } : z))
      setEditingPriceId(null)
      toast(t('admin.zonePriceUpdated'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally { setSavingPrice(false) }
  }

  /* ── Toggle active ── */
  const handleToggle = async zone => {
    const id = zone.id
    const previous = zone.active
    setZones(prev => prev.map(z => z.id === id ? { ...z, active: !previous } : z))
    setTogglingId(id)
    try {
      const res = await toggleZoneActive(id)
      const next = res.data.data.active
      setZones(prev => prev.map(z => z.id === id ? { ...z, active: next } : z))
      toast(next ? t('admin.zoneActivated') : t('admin.zoneDeactivated'))
    } catch (err) {
      setZones(prev => prev.map(z => z.id === id ? { ...z, active: previous } : z))
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally { setTogglingId(null) }
  }

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      await deleteShippingZone(confirmTarget.id)
      setZones(prev => prev.filter(z => z.id !== confirmTarget.id))
      setConfirmTarget(null)
      toast(t('admin.zoneDeleted'))
    } catch (err) {
      toast(err?.response?.data?.message || t('admin.failedSave'), 'error')
    } finally { setDeleting(false) }
  }

  /* ── Render ── */
  return (
    <div className="min-h-full pb-10">
      <PageHeader />

      <div className="px-5 lg:px-7 space-y-5">

        {/* Add Zone button / form */}
        {!showAddForm ? (
          <div className="flex justify-end">
            <Button
              onClick={() => setShowAddForm(true)}
              className="text-sm px-4 py-2"
            >
              + {t('admin.addZone')}
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#F0DDE0] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#6B1F2A] mb-4"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px' }}>
              {t('admin.addZone')}
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Input
                label={t('admin.zoneNameEn')}
                value={form.nameEn}
                onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                required
              />
              <Input
                label={t('admin.zoneNameAr')}
                value={form.nameAr}
                onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                required
                dir="rtl"
              />
              <Input
                label={t('admin.zonePrice')}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                required
              />
              <Input
                label={t('admin.zoneDeliveryDays')}
                value={form.deliveryDays}
                onChange={e => setForm(f => ({ ...f, deliveryDays: e.target.value }))}
                placeholder="1-2"
              />
              <Input
                label={t('admin.zoneIcon')}
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="📦"
              />
              <Input
                label="Display Order"
                type="number"
                min="1"
                value={form.displayOrder}
                onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))}
                placeholder="99"
              />
              <div className="col-span-2 sm:col-span-3 flex gap-2 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM) }}
                  className="text-sm px-4 py-2 rounded-xl border border-[#EDD8DC] text-[#9B7B80] hover:bg-[#FDF0F2] transition-colors"
                >
                  {t('admin.cancel')}
                </button>
                <Button type="submit" disabled={saving} className="text-sm px-4 py-2">
                  {saving ? t('admin.saving') : t('admin.addZone')}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Zones table */}
        <div className="bg-white rounded-2xl border border-[#F0DDE0] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : zones.length === 0 ? (
            <p className="text-center text-sm text-[#9B7B80] py-12">{t('common.noResults')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F5EDEF]">
                    <th className="text-start px-5 py-3 text-xs font-semibold text-[#9B7B80] uppercase tracking-wide">{t('admin.zoneIcon')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-[#9B7B80] uppercase tracking-wide">{t('admin.zoneNameEn')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-[#9B7B80] uppercase tracking-wide">{t('admin.zoneNameAr')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-[#9B7B80] uppercase tracking-wide">{t('admin.zonePrice')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-[#9B7B80] uppercase tracking-wide">{t('admin.zoneDeliveryDays')}</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-[#9B7B80] uppercase tracking-wide">{t('admin.status')}</th>
                    <th className="text-end px-5 py-3 text-xs font-semibold text-[#9B7B80] uppercase tracking-wide">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone, i) => (
                    <tr
                      key={zone.id}
                      className={`transition-colors hover:bg-[#FDF6F7] ${i !== zones.length - 1 ? 'border-b border-[#F5EDEF]' : ''}`}
                    >
                      {/* Icon */}
                      <td className="px-5 py-3.5 text-xl">{zone.icon}</td>

                      {/* Name EN */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-[#3D1A1E]">{zone.nameEn}</span>
                      </td>

                      {/* Name AR */}
                      <td className="px-4 py-3.5">
                        <span className="text-[#3D1A1E]" dir="rtl">{zone.nameAr}</span>
                      </td>

                      {/* Price — inline edit */}
                      <td className="px-4 py-3.5">
                        {editingPriceId === zone.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={priceInput}
                              onChange={e => setPriceInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') savePrice(zone.id)
                                if (e.key === 'Escape') cancelEditPrice()
                              }}
                              autoFocus
                              className="w-20 border border-[#EDD8DC] rounded-lg px-2 py-1 text-sm text-[#3D1A1E] focus:outline-none focus:border-[#6B1F2A]"
                            />
                            <button
                              onClick={() => savePrice(zone.id)}
                              disabled={savingPrice}
                              className="text-[10px] px-2 py-1 bg-[#6B1F2A] text-white rounded-lg hover:bg-[#5a1a24] transition-colors disabled:opacity-50"
                            >
                              {savingPrice ? '…' : '✓'}
                            </button>
                            <button
                              onClick={cancelEditPrice}
                              className="text-[10px] px-2 py-1 border border-[#EDD8DC] text-[#9B7B80] rounded-lg hover:bg-[#FDF0F2] transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditPrice(zone)}
                            className="group flex items-center gap-1.5 text-[#3D1A1E] hover:text-[#6B1F2A] transition-colors"
                            title={t('admin.editPrice')}
                          >
                            <span className="font-semibold">₪{Number(zone.price).toFixed(0)}</span>
                            <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#9B7B80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </td>

                      {/* Delivery days */}
                      <td className="px-4 py-3.5 text-[#9B7B80]">{zone.deliveryDays} days</td>

                      {/* Active toggle */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggle(zone)}
                          disabled={togglingId === zone.id}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                            zone.active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-[#F5EDEF] text-[#9B7B80] hover:bg-[#EDD8DC]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${zone.active ? 'bg-emerald-500' : 'bg-[#C4A0A6]'}`} />
                          {zone.active ? t('admin.zoneActive') : t('admin.zoneInactive')}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-end">
                        <button
                          onClick={() => setConfirmTarget(zone)}
                          className="text-xs text-[#9B7B80] hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                          title={t('admin.delete')}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title={t('admin.deleteZone')}
        message={confirmTarget ? `"${confirmTarget.nameEn}" / "${confirmTarget.nameAr}"` : ''}
        confirmLabel={t('admin.delete')}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
