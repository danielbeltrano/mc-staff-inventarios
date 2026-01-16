import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getItemById,
  updateItem,
  deleteItem,
  getCategorias,
  uploadItemImage,
} from "../../../features/Inventario/Items/services/itemsService";
import { generateQrForItem } from "../../../features/Inventario/Items/services/qrService";
import {
  Package,
  Trash2,
  Save,
  ArrowLeft,
  Edit,
  Upload,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DetalleItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ Auth global
  const { user } = useSelector((state) => state.auth);

  const [item, setItem] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [stockOriginal, setStockOriginal] = useState(null);
  const [motivoAjuste, setMotivoAjuste] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  useEffect(() => {
    if (user) {
      cargarItem();
      cargarCategorias();
    }
  }, [id, user]);

  async function cargarItem() {
    setLoading(true);
    try {
      const data = await getItemById(id);
      setItem(data);
      setForm(data);
      setPreview(data.imagen);
      setQrUrl(data.qr || null);
      setStockOriginal(data.stockReal);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar el ítem.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarCategorias() {
    try {
      const data = await getCategorias();
      setCategorias(data || []);
    } catch (err) {
      toast.error("Error al cargar categorías.");
    }
  }

  async function handleGuardar() {
    if (!user) {
      toast.error("Sesión no válida.");
      return;
    }

    setLoading(true);
    try {
      let nuevaUrl = form.imagen;

      if (form.nuevaImagen instanceof File) {
        nuevaUrl = await uploadItemImage(form.nuevaImagen);
      }

      await updateItem({
        id,
        itemData: {
          codigo: form.codigo,
          nombre: form.nombre,
          idCategoria: form.idCategoria,
          stockMinimo: form.stockMinimo,
          stockReal: Number(form.stockReal),
          imagen: nuevaUrl,
          ubicacion: form.ubicacion,
          qr: form.qr,
        },
        motivoAjuste,
        user, // 👈 auth state
      });

      toast.success("Ítem actualizado correctamente.");

      setEditando(false);
      setForm({ ...form, imagen: nuevaUrl, nuevaImagen: null });
      setPreview(nuevaUrl);
      setMotivoAjuste("");
      setStockOriginal(Number(form.stockReal));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al actualizar el ítem.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar() {
    if (!window.confirm("¿Seguro que deseas eliminar este ítem?")) return;

    try {
      await deleteItem(id);
      toast.success("Ítem eliminado correctamente.");
      setTimeout(() => navigate("/gestor"), 1500);
    } catch (err) {
      toast.error("Error al eliminar el ítem.");
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, nuevaImagen: file });
    setPreview(URL.createObjectURL(file));
  };

  // ⛔ Protección de vista
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Debes iniciar sesión para acceder al inventario.
      </div>
    );
  }

  if (loading && !item) {
    return (
      <div className="text-center text-slate-500 py-20">Cargando...</div>
    );
  }

  if (!item) {
    return (
      <div className="text-center text-slate-500 py-20">
        Ítem no encontrado.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <button
          onClick={() => navigate("/items")}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition w-full sm:w-auto justify-center"
        >
          <ArrowLeft size={20} /> Volver al inventario
        </button>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {editando ? (
            <button
              onClick={handleGuardar}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 w-full sm:w-auto"
            >
              <Save size={18} /> Guardar cambios
            </button>
          ) : (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto"
            >
              <Edit size={18} /> Editar
            </button>
          )}
          <button
            onClick={handleEliminar}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition w-full sm:w-auto"
          >
            <Trash2 size={18} /> Eliminar
          </button>
          <button
            onClick={async () => {
              // Open modal; if no qr -> generate
              if (!qrUrl) {
                setGeneratingQr(true);
                try {
                  const url = await generateQrForItem(item);
                  // store url in item.qr via updateItem
                  // suppress possible stock_minimo alerts triggered by DB triggers
                  try {
                    window.__suppressStockAlert = true;
                    setTimeout(() => { delete window.__suppressStockAlert; }, 2000);
                  } catch (e) {}
                  await updateItem(id, { qr: url });
                  setQrUrl(url);
                  setForm({ ...form, qr: url });
                  toast.success('QR generado y subido al bucket.');
                } catch (err) {
                  console.error(err);
                  toast.error('Error generando QR: ' + (err.message || err));
                } finally {
                  setGeneratingQr(false);
                  setShowQrModal(true);
                }
              } else {
                setShowQrModal(true);
              }
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto"
          >
            QR
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-8 max-w-4xl mx-auto border border-slate-100">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="relative">
            <div className="h-56 w-56 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
              {preview ? (
                <img
                  src={preview}
                  alt="Vista previa"
                  className="object-cover h-full w-full"
                />
              ) : (
                <Package size={64} className="text-slate-300" />
              )}
            </div>

            {editando && (
              <label className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-md transition">
                <Upload size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1 space-y-4 w-full">
            <InputField
              label="Código"
              value={form.codigo}
              disabled={!editando}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />

            <InputField
              label="Nombre"
              value={form.nombre}
              disabled={!editando}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <div>
              <label className="text-sm font-medium text-slate-500">
                Categoría
              </label>
              <select
                value={form.idCategoria || ""}
                disabled={!editando}
                onChange={(e) =>
                  setForm({ ...form, idCategoria: parseInt(e.target.value) })
                }
                className={`w-full mt-1 border px-3 py-2 rounded-lg ${editando
                  ? "border-blue-300 focus:ring-2 focus:ring-blue-300 outline-none"
                  : "border-slate-200 bg-slate-50"
                  }`}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Stock actual"
                type="number"
                value={form.stockReal}
                disabled={!editando}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stockReal: parseInt(e.target.value),
                  })
                }
              />
              <InputField
                label="Stock mínimo"
                type="number"
                value={form.stockMinimo}
                disabled={!editando}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stockMinimo: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <InputField
              label="Ubicación"
              value={form.ubicacion}
              disabled={!editando}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            />

            {/* Campo condicional para motivo de ajuste */}
            {editando && form.stockReal !== stockOriginal && (
              <InputField
                label="Motivo del ajuste"
                value={motivoAjuste}
                onChange={(e) => setMotivoAjuste(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      <ToastContainer />

      {showQrModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Código QR - {item.nombre}</h3>
              <button onClick={() => setShowQrModal(false)} className="text-slate-500">Cerrar</button>
            </div>
            <div className="flex flex-col items-center gap-4">
              {generatingQr ? (
                <div className="text-slate-600">Generando QR...</div>
              ) : qrUrl ? (
                <img src={qrUrl} alt={`QR ${item.nombre}`} className="h-64 w-64 object-contain" />
              ) : (
                <div className="text-slate-500">No hay QR disponible.</div>
              )}

              <div className="flex gap-2 mt-2">
                {qrUrl && (
                  <a href={qrUrl} download={`qr_item_${item.idItem}.png`} className="bg-green-600 text-white px-3 py-1 rounded">Descargar</a>
                )}
                <button
                  className="bg-gray-200 px-3 py-1 rounded"
                  onClick={async () => {
                    // Regenerar
                    setGeneratingQr(true);
                    try {
                      const url = await generateQrForItem(item);
                      try {
                        window.__suppressStockAlert = true;
                        setTimeout(() => { delete window.__suppressStockAlert; }, 2000);
                      } catch (e) {}
                      await updateItem(id, { qr: url });
                      setQrUrl(url);
                      toast.success('QR regenerado.');
                    } catch (err) {
                      console.error(err);
                      toast.error('Error regenerando QR.');
                    } finally {
                      setGeneratingQr(false);
                    }
                  }}
                >Regenerar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Subcomponente Input */
function InputField({ label, value, disabled, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-500">{label}</label>
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={onChange}
        className={`w-full mt-1 border px-3 py-2 rounded-lg ${
          !disabled
            ? "border-blue-300 focus:ring-2 focus:ring-blue-300"
            : "border-slate-200 bg-slate-50"
        }`}
      />
    </div>
  );
}
