import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  createItem,
  getCategorias,
  createCategoria,
} from "../../../features/Inventario/Items/services/itemsService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RegistrarItem() {
  // ✅ Auth global
  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    idCategoria: "",
    tipo: "",
    unidad: "",
    stockMinimo: "",
    inventarioInicial: "",
    imagen: null,
    ubicacion: "",
  });

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [mostrarInputCategoria, setMostrarInputCategoria] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchCategorias() {
      try {
        const data = await getCategorias();
        setCategorias(data || []);
      } catch {
        toast.error("Error al cargar categorías.");
      }
    }

    fetchCategorias();
  }, [user]);

  function handleChange(e) {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  }

  async function handleAddCategoria() {
    if (!nuevaCategoria.trim()) {
      toast.warning("Por favor ingresa un nombre para la categoría.");
      return;
    }

    try {
      const nueva = await createCategoria(nuevaCategoria.trim());
      setCategorias([...categorias, nueva]);
      setForm({ ...form, idCategoria: nueva.idCategoria });
      setNuevaCategoria("");
      setMostrarInputCategoria(false);
      toast.success("Categoría añadida correctamente.");
    } catch {
      toast.error("Error al crear la categoría.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      toast.error("Sesión no válida.");
      return;
    }

    setLoading(true);
    try {
      await createItem(form);
      toast.success("Ítem registrado correctamente.");

      setForm({
        codigo: "",
        nombre: "",
        idCategoria: "",
        tipo: "",
        unidad: "",
        stockMinimo: "",
        inventarioInicial: "",
        imagen: null,
        ubicacion: "",
      });
    } catch {
      toast.error("Error al registrar el ítem.");
    } finally {
      setLoading(false);
    }
  }

  // ⛔ Protección visual
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Debes iniciar sesión para registrar ítems.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-2xl mx-auto"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-slate-800">
          Registrar Ítem
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[
            "codigo",
            "nombre",
            "tipo",
            "unidad",
            "stockMinimo",
            "inventarioInicial",
          ].map((field) => (
            <div key={field}>
              <label className="block text-sm text-slate-600 mb-1 capitalize">
                {field === "stockMinimo"
                  ? "Stock mínimo"
                  : field === "inventarioInicial"
                  ? "Inventario inicial"
                  : field}
              </label>
              <input
                type={
                  ["stockMinimo", "inventarioInicial"].includes(field)
                    ? "number"
                    : "text"
                }
                name={field}
                value={form[field]}
                onChange={handleChange}
                required
                className="w-full border border-slate-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm text-slate-600 mb-1">
              Categoría
            </label>
            <select
              name="idCategoria"
              value={form.idCategoria}
              onChange={handleChange}
              required
              className="w-full border border-slate-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMostrarInputCategoria(!mostrarInputCategoria)
              }
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Añadir categoría
            </button>
          </div>

          {mostrarInputCategoria && (
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Nueva categoría"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="flex-1 border border-slate-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={handleAddCategoria}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Guardar
              </button>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 mb-1">
              Imagen
            </label>
            <input
              type="file"
              name="imagen"
              accept="image/*"
              onChange={handleChange}
              className="w-full border border-slate-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
          >
            {loading ? "Registrando..." : "Registrar Ítem"}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-100 text-slate-700 py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
