import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getItems, getCategorias } from "../../../features/Inventario/Items/services/itemsService";
import { useNavigate } from "react-router-dom";
import { Search, Package, Filter, RefreshCcw, Plus } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Items() {
  const { user } = useSelector((state) => state.auth); // ✅ auth global

  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      cargarDatos();
    }
  }, [user]);

  async function cargarDatos() {
    setLoading(true);
    try {
      const [itemsData, categoriasData] = await Promise.all([
        getItems(),
        getCategorias(),
      ]);

      setItems(itemsData || []);
      setCategorias(categoriasData || []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar los ítems o categorías.");
    } finally {
      setLoading(false);
    }
  }

  // 🔎 Filtro de búsqueda y categoría
  const itemsFiltrados = items.filter((item) => {
    const coincideCategoria =
      !filtroCategoria || item.idCategoria === Number(filtroCategoria);

    const coincideBusqueda =
      item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.codigo.toLowerCase().includes(busqueda.toLowerCase());

    return coincideCategoria && coincideBusqueda;
  });

  // ⛔ Protección visual si no hay sesión
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Debes iniciar sesión para ver el inventario.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-semibold text-slate-800 flex items-center gap-2">
          <Package className="text-blue-600" /> Inventario
        </h1>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 w-full md:w-auto">

          {/* Búsqueda */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-slate-200 pl-9 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            />
          </div>

          {/* Filtro categoría */}
          <div className="relative w-full sm:w-52">
            <Filter className="absolute left-2.5 top-2.5 text-slate-400" size={18} />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border border-slate-200 pl-8 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.idCategoria} value={cat.idCategoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={cargarDatos}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition"
            >
              <RefreshCcw size={16} /> Refrescar
            </button>

            <button
              onClick={() => navigate("/registro-item")}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700 transition"
            >
              <Plus size={18} />
              Añadir material
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-slate-500 py-20">
          Cargando ítems...
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="text-center text-slate-500 py-20">
          No se encontraron ítems.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {itemsFiltrados.map((item) => (
            <div
              key={item.idItem}
              onClick={() => navigate(`/item/${item.idItem}`)}
              className="bg-white rounded-2xl shadow hover:shadow-md cursor-pointer transition transform hover:scale-[1.02] border border-slate-100"
            >
              <div className="h-40 w-full bg-slate-100 rounded-t-2xl overflow-hidden flex items-center justify-center">
                {item.imagen ? (
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <Package size={48} className="text-slate-300" />
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-slate-800 truncate">
                  {item.nombre}
                </h3>
                <p className="text-sm text-slate-500 mb-2">
                  {item.categoria?.nombre || "Sin categoría"}
                </p>

                <div className="flex justify-between items-center">
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      item.stockReal <= item.stockMinimo
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    Stock: {item.stockReal}
                  </span>

                  <span className="text-xs text-slate-400">
                    Código: {item.codigo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}