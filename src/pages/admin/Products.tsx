import { Edit2, Loader2, Package, PackagePlus, Power, PowerOff, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { CATEGORIES } from '../../data/catalog';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/format';
import { PACK_TYPES, type PackType } from '../../lib/types';
import { type AdminProduct, type ProductInput, productService } from '../../services/productService';

/* ------------------------------------------------------------------ helpers */

const ALL_CATEGORIES = CATEGORIES.map((c) => c.name);

const EMPTY_INPUT: ProductInput = {
  name: '',
  category: '',
  weight: '',
  packType: null,
  packetsPerBox: null,
  cbmPerBox: null,
  kgPerPacket: null,
  active: true,
};

/* ------------------------------------------------------------------ sub-components */

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-ink/80">
        {label}
        {required && <span className="ml-1 text-chilli">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  'w-full rounded-xl border-2 border-ink/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-chilli transition placeholder:text-ink/35';

function ProductForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ProductInput;
  onSave: (v: ProductInput) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [v, setV] = useState<ProductInput>(initial);
  const set = (patch: Partial<ProductInput>) => setV((p) => ({ ...p, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(v);
  };

  const customCatRef = useRef<string>('');

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <Field label="Product name" required>
        <input
          data-autofocus
          required
          value={v.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Turmeric Powder"
          className={INPUT_CLS}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" required>
          <select
            required
            value={ALL_CATEGORIES.includes(v.category) ? v.category : '__custom__'}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                set({ category: customCatRef.current });
              } else {
                set({ category: e.target.value });
              }
            }}
            className={INPUT_CLS}
          >
            <option value="">Select category</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value="__custom__">Other (custom)</option>
          </select>
        </Field>

        <Field label="Weight / size" required>
          <input
            required
            value={v.weight}
            onChange={(e) => set({ weight: e.target.value })}
            placeholder="e.g. 100g"
            className={INPUT_CLS}
          />
        </Field>
      </div>

      {(!ALL_CATEGORIES.includes(v.category) || v.category === '') && (
        <Field label="Custom category name" required>
          <input
            required
            value={v.category}
            onChange={(e) => {
              customCatRef.current = e.target.value;
              set({ category: e.target.value });
            }}
            placeholder="e.g. Seasonings"
            className={INPUT_CLS}
          />
        </Field>
      )}

      <Field label="Pack type">
        <select
          value={v.packType ?? ''}
          onChange={(e) => set({ packType: (e.target.value as PackType) || null })}
          className={INPUT_CLS}
        >
          <option value="">None / not applicable</option>
          {PACK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Packets / box">
          <input
            type="number"
            min={0}
            step={1}
            value={v.packetsPerBox ?? ''}
            onChange={(e) => set({ packetsPerBox: e.target.value ? Number(e.target.value) : null })}
            placeholder="e.g. 12"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="CBM / box">
          <input
            type="number"
            min={0}
            step={0.0001}
            value={v.cbmPerBox ?? ''}
            onChange={(e) => set({ cbmPerBox: e.target.value ? Number(e.target.value) : null })}
            placeholder="e.g. 0.014"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Kg / packet">
          <input
            type="number"
            min={0}
            step={0.001}
            value={v.kgPerPacket ?? ''}
            onChange={(e) => set({ kgPerPacket: e.target.value ? Number(e.target.value) : null })}
            placeholder="e.g. 0.1"
            className={INPUT_CLS}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={v.active}
            onChange={(e) => set({ active: e.target.checked })}
            className="size-4 accent-chilli"
          />
          <span className="text-sm font-semibold">Active (visible to users)</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-ink/[0.06]">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-full px-5 py-2.5 font-bold ring-1 ring-ink/15 hover:bg-ink/5 disabled:opacity-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-chilli px-5 py-2.5 font-bold text-cream hover:bg-chilli/90 disabled:opacity-70"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save product
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ main page */

export default function Products() {
  const toast = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Products · Freelan admin';
    void productService.list().then(setProducts);
  }, []);

  const reload = () => productService.list().then(setProducts);

  const handleAdd = async (input: ProductInput) => {
    setSaving(true);
    try {
      await productService.create(input);
      await reload();
      setShowAdd(false);
      toast.success('Product created successfully.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the product.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (input: ProductInput) => {
    if (editId == null) return;
    setSaving(true);
    try {
      await productService.update(editId, input);
      await reload();
      setEditId(null);
      toast.success('Product updated successfully.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the product.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: AdminProduct) => {
    try {
      await productService.setActive(product.id, !product.active);
      await reload();
      toast.success(`"${product.name}" marked as ${!product.active ? 'active' : 'inactive'}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the product.');
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await productService.remove(deleteId);
      await reload();
      setDeleteId(null);
      toast.success('Product removed.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove the product.');
    } finally {
      setDeleting(false);
    }
  };

  const editProduct = products?.find((p) => p.id === editId);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink/50">Manage catalogue</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-maroon sm:text-4xl">Products</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-full bg-chilli px-5 py-2.5 font-bold text-cream hover:bg-chilli/90 active:scale-95 transition"
        >
          <PackagePlus className="size-4" aria-hidden="true" /> Add product
        </button>
      </header>

      <div className="mt-6 rounded-3xl bg-white shadow-sm ring-1 ring-ink/[0.06]">
        {products == null ? (
          <div className="grid h-52 place-items-center" role="status" aria-label="Loading products">
            <Loader2 className="size-8 animate-spin text-chilli" />
          </div>
        ) : products.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Package className="mx-auto mb-4 size-12 text-ink/20" />
            <p className="font-display text-xl font-bold text-maroon">No admin products yet</p>
            <p className="mt-1 text-sm text-ink/55">
              Static products from the catalogue are always available. Add extra products here.
            </p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-chilli px-5 py-2.5 font-bold text-cream hover:bg-chilli/90"
            >
              <PackagePlus className="size-4" /> Add first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[0.7rem] uppercase tracking-wider text-ink/50">
                <tr>
                  <th scope="col" className="px-5 py-3 font-bold">Name</th>
                  <th scope="col" className="px-3 py-3 font-bold">Category</th>
                  <th scope="col" className="px-3 py-3 font-bold">Weight</th>
                  <th scope="col" className="px-3 py-3 font-bold">Pack type</th>
                  <th scope="col" className="px-3 py-3 text-right font-bold">Pkts/box</th>
                  <th scope="col" className="px-3 py-3 font-bold">Status</th>
                  <th scope="col" className="px-5 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-ink/[0.06] hover:bg-turmeric/5 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-ink/40">ID: {p.id}</p>
                    </td>
                    <td className="px-3 py-3.5 text-ink/70">{p.category}</td>
                    <td className="px-3 py-3.5 text-ink/70">{p.weight}</td>
                    <td className="px-3 py-3.5 text-ink/70">{p.packType ?? '—'}</td>
                    <td className="px-3 py-3.5 text-right tabular text-ink/70">{p.packetsPerBox ?? '—'}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                          p.active ? 'bg-leaf/15 text-leaf' : 'bg-ink/10 text-ink/55',
                        )}
                      >
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title={p.active ? 'Deactivate product' : 'Activate product'}
                          onClick={() => handleToggleActive(p)}
                          className="rounded-full p-1.5 text-ink/50 transition hover:bg-ink/5 hover:text-ink"
                        >
                          {p.active ? <PowerOff className="size-4" /> : <Power className="size-4 text-leaf" />}
                        </button>
                        <button
                          type="button"
                          title="Edit product"
                          onClick={() => setEditId(p.id)}
                          className="rounded-full p-1.5 text-ink/50 transition hover:bg-ink/5 hover:text-maroon"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete product"
                          onClick={() => setDeleteId(p.id)}
                          className="rounded-full p-1.5 text-ink/50 transition hover:bg-chilli/10 hover:text-chilli"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-ink/45">
        ℹ️ Static products from the catalogue (products.json) are always available to users and are not listed here. This
        table only shows products added through the admin dashboard.
      </p>

      {/* Add product modal */}
      <Modal open={showAdd} onClose={() => !saving && setShowAdd(false)} locked={saving} size="lg" title="Add new product">
        <ProductForm initial={EMPTY_INPUT} onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
      </Modal>

      {/* Edit product modal */}
      <Modal
        open={editId != null}
        onClose={() => !saving && setEditId(null)}
        locked={saving}
        size="lg"
        title="Edit product"
        description={editProduct?.name}
      >
        {editProduct && (
          <ProductForm
            initial={{
              name: editProduct.name,
              category: editProduct.category,
              weight: editProduct.weight,
              packType: editProduct.packType,
              packetsPerBox: editProduct.packetsPerBox,
              cbmPerBox: editProduct.cbmPerBox,
              kgPerPacket: editProduct.kgPerPacket,
              image: editProduct.image,
              active: editProduct.active,
            }}
            onSave={handleEdit}
            onCancel={() => setEditId(null)}
            saving={saving}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteId != null}
        onClose={() => !deleting && setDeleteId(null)}
        locked={deleting}
        size="sm"
        title="Remove product?"
        description={products?.find((p) => p.id === deleteId)?.name}
      >
        <p className="mt-3 text-sm text-ink/70">
          This will remove the product from the admin catalogue. Existing orders that contain this product will not be
          affected.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteId(null)} disabled={deleting} className="rounded-full px-5 py-2.5 font-bold ring-1 ring-ink/15 hover:bg-ink/5 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-full bg-chilli px-5 py-2.5 font-bold text-cream hover:bg-chilli/90 disabled:opacity-70"
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Yes, remove
          </button>
        </div>
      </Modal>
    </div>
  );
}
