// src/components/ui/ModalValidarPagoWompi/index.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  X,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertCircle,
  User
} from "lucide-react";
import { Button } from "../Button";
import { Card, CardHeader, CardContent, CardTitle } from "../Cards";
import { getTransactionById, obtenerEntornoActual, esModoPruebas } from "../../../services/wompi/wompiValidationService";
import { deleteCodMatricula, getAWSInfo, getPagosPorNota, verMatriculas } from "../../../services/aws/awsApi";
import { validarPagos } from "../../../services/wompi/validarPagos";
import { toast } from "react-toastify";
import { fetchMatriculas } from "../../../redux/slices/matriculasSlice";
import { useDispatch } from "react-redux";
import Loader from "../../../styles/Loader";

/* ---------- Helpers ---------- */
function parseNumber(value) {
  if (value == null || value === "") return NaN;
  const s = String(value).trim();
  // eliminar puntos como miles y convertir coma decimal a punto
  const normalized = s.replace(/\./g, "").replace(/,/g, ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function formatThousands(value, { decimals = 0, locale = "es-CO" } = {}) {
  const n = typeof value === "number" ? value : parseNumber(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function csvEscape(value = "") {
  // convertir a string y escapar comillas dobles
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/* ---------- Component ---------- */
const ModalValidarPagoAWS = ({
  isOpen,
  onClose,
  onValidationSuccess,
  paymentLinkId,
  customValidation = null
}) => {
  const [reference, setReference] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const dispatch = useDispatch();

  // AWS list
  const [awsItems, setAwsItems] = useState([]); // cada item normalizado incluye .codigo_estudiante (string)
  const [isFetchingAws, setIsFetchingAws] = useState(false);

  // Selección
  const [selectedMap, setSelectedMap] = useState({}); // { codigo_estudiante_norm: true }
  const [selectAll, setSelectAll] = useState(false); // si todos están seleccionados
  const [filterListText, setFilterListText] = useState("");

  // Preview inline (codigo_estudiante currently open) -> toggle with Ver
  const [openPreviewCode, setOpenPreviewCode] = useState(null);

  const entornoActual = obtenerEntornoActual();
  const isPruebas = esModoPruebas();

  // Normaliza items: garantiza campo codigo_estudiante string y único (si no existe, crea __aws_idx)
  const normalizeItems = (items = []) => {
    return items.map((it, idx) => {
      const rawCode =
        (it.codigo_estudiante ?? it.Personalizado1 ?? (it.ADM && it.ADM.Tercero_Interno) ?? null);
      const code = rawCode != null && String(rawCode).trim() !== "" ? String(rawCode).trim() : `__aws_${idx}`;
      return { ...it, codigo_estudiante: code };
    });
  };

  // Obtiene AWS (usa key=null para "todos-pagos")
  // const getAWS = async () => {
  //   setIsFetchingAws(true);
  //   try {
  //     const anoSiguiente = new Date().getFullYear() + 1;
  //     const resp = await getPagosPorNota({
  //       nota: `MATRICULA ${anoSiguiente}`,
  //       filterWord: `MATRICULA ${anoSiguiente}`, // opcional
  //       limit: 10000,
  //       timeoutMs: 5000
  //     });

  //     console.log(" === AWS PAGOS RESPONSE: ", resp);
  //     const rawItems = (resp && resp.items) ? resp.items : [];
  //     const items = normalizeItems(rawItems);
  //     setAwsItems(items);

  //     // reset selección si cambian items
  //     setSelectedMap({});
  //     setSelectAll(false);
  //     setOpenPreviewCode(null);
  //   } catch (err) {
  //     console.error("Error cargando AWS items:", err);
  //     toast.error("No se pudieron obtener los pagos desde AWS. Revisa la consola.");
  //     setAwsItems([]);
  //     setSelectedMap({});
  //     setSelectAll(false);
  //     setOpenPreviewCode(null);
  //   } finally {
  //     setIsFetchingAws(false);
  //   }
  // };


  const getAWS = async () => {
  setIsFetchingAws(true);
  
  try {
    // ✅ LÓGICA CORREGIDA PARA DETERMINAR AÑO DE MATRÍCULA
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1; // getMonth() retorna 0-11, sumamos 1 para tener 1-12
    const anoActual = fechaActual.getFullYear();
    
    // Enero (1) a Junio (6) = año actual
    // Julio (7) a Diciembre (12) = año siguiente
    const anoMatricula = mesActual >= 7 ? anoActual + 1 : anoActual;
    
    console.log(`📅 getAWS - Mes actual: ${mesActual}, Año de matrícula: ${anoMatricula}`);
    
    const resp = await getPagosPorNota({
      nota: `MATRICULA ${anoMatricula}`,
      filterWord: `MATRICULA ${anoMatricula}`, // opcional
      limit: 10000,
      timeoutMs: 5000
    });
    
    console.log(" === AWS PAGOS RESPONSE: ", resp);
    
    const rawItems = (resp && resp.items) ? resp.items : [];
    const items = normalizeItems(rawItems);
    
    setAwsItems(items);
    
    // reset selección si cambian items
    setSelectedMap({});
    setSelectAll(false);
    setOpenPreviewCode(null);
    
  } catch (err) {
    console.error("Error cargando AWS items:", err);
    toast.error("No se pudieron obtener los pagos desde AWS. Revisa la consola.");
    setAwsItems([]);
    setSelectedMap({});
    setSelectAll(false);
    setOpenPreviewCode(null);
  } finally {
    setIsFetchingAws(false);
  }
};


  // Cargar items al abrir modal
  useEffect(() => {
    if (!isOpen) return;
    getAWS();
  }, [isOpen]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setReference("");
      setValidationResult(null);
      setAwsItems([]);
      setSelectedMap({});
      setSelectAll(false);
      setFilterListText("");
      setOpenPreviewCode(null);
    }
  }, [isOpen]);

  // Preview Wompi (busca transacción por reference)
  const handlePreview = async () => {
    if (!reference.trim()) {
      setValidationResult({ success: false, message: "Por favor ingresa un Transaction ID válido" });
      return;
    }
    if (!paymentLinkId) {
      setValidationResult({ success: false, message: "No se encontró el Payment Link ID. Verifica la configuración." });
      return;
    }

    setIsSearching(true);
    setValidationResult(null);

    try {
      const result = await getTransactionById(reference.trim());
      if (!result.success) {
        setValidationResult({ success: false, message: `No se encontró la transacción: ${result.error}` });
        return;
      }

      const transaction = result.transaction;
      if (transaction.payment_link_id !== paymentLinkId) {
        setValidationResult({
          success: false,
          message: `Esta transacción pertenece a otro payment link. Esperado ${paymentLinkId} pero la transacción pertenece a ${transaction.payment_link_id}`
        });
        return;
      }

      const isApproved = transaction.status === "APPROVED";

      if (customValidation?.validate) {
        const customResult = customValidation.validate(transaction, paymentLinkId);
        if (!customResult.valid) {
          setValidationResult({ success: false, message: customResult.message || "Validación personalizada falló", hint: customResult.hint });
          return;
        }
      }

      // show small summary in validationResult for preview action
      setValidationResult({
        success: isApproved,
        message: isApproved ? "Transacción aprobada (lista para validar)" : `Transacción no aprobada (${transaction.status})`,
        transaction: {
          id: transaction.id,
          amount: transaction.amount_in_cents / 100,
          currency: transaction.currency,
          status: transaction.status
        }
      });
    } catch (err) {
      console.error("Error preview:", err);
      setValidationResult({ success: false, message: "Error inesperado al obtener transacción", hint: err.message });
    } finally {
      setIsSearching(false);
    }
  };

  // Toggle selección individual
  const toggleSelect = (codigo) => {
    setSelectedMap(prev => {
      const next = { ...prev, [codigo]: !prev[codigo] };
      // si desmarcamos alguno, desactivar selectAll
      if (!next[codigo]) setSelectAll(false);
      return next;
    });
  };

  // Seleccionar / Deseleccionar todos los items (todos los cargados)
  const handleToggleSelectAllItems = () => {
    if (!awsItems || awsItems.length === 0) return;
    const total = awsItems.length;
    const currentlySelectedCount = Object.values(selectedMap).filter(Boolean).length;
    if (currentlySelectedCount === total) {
      setSelectedMap({});
      setSelectAll(false);
      return;
    }
    const allMap = {};
    awsItems.forEach((it) => {
      allMap[it.codigo_estudiante] = true;
    });
    setSelectedMap(allMap);
    setSelectAll(true);
  };

  // Filtrado local por texto (codigo o nota)
  const filteredItems = useMemo(() => {
    const q = filterListText.trim().toUpperCase();
    if (!q) return awsItems;
    return awsItems.filter(it => {
      const code = String(it.codigo_estudiante ?? "").toUpperCase();
      const nota = String((it.info_pago && it.info_pago[0] && (it.info_pago[0]["Nota.1"] || it.info_pago[0].Nota)) ?? "").toUpperCase();
      return code.includes(q) || nota.includes(q) || JSON.stringify(it).toUpperCase().includes(q);
    });
  }, [awsItems, filterListText]);

  // Cantidad seleccionada
  const selectedCount = useMemo(() => Object.values(selectedMap).filter(Boolean).length, [selectedMap]);

  // Enviar seleccionados a validarPagos
  const handleValidateSelected = async () => {
    const selectedCodes = Object.entries(selectedMap).filter(([k, v]) => v).map(([k]) => k);
    if (selectedCodes.length === 0) {
      toast.warning("Selecciona al menos un estudiante para validar");
      return;
    }

    const datosAValidar = awsItems
      .filter(i => selectedMap[i.codigo_estudiante])
      .map(i => ({ codigo_estudiante: i.codigo_estudiante, info_pago: i.info_pago }));

    setIsValidating(true);
    setValidationResult(null);

    try {
      const results = await validarPagos({ datos: datosAValidar });
      console.log("Resultados validarPagos:", results);
      const successCount = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok);

      setValidationResult({
        success: failed.length === 0,
        message: `Validación completada: ${successCount} correctos, ${failed.length} con error.`,
        details: results
      });

      if (successCount > 0) {
        toast.success(`Validación: ${successCount} correctos, ${failed.length} errores`);
      } else {
        toast.error(`Validación: ${successCount} correctos, ${failed.length} errores`);
      }

      if (onValidationSuccess) {
        try { await onValidationSuccess(results, datosAValidar); } catch (e) { console.warn("onValidationSuccess callback falló:", e); }
      }

      const updatedMap = { ...selectedMap };
      results.forEach(r => { if (r.ok) delete updatedMap[r.codigo_estudiante]; });
      setSelectedMap(updatedMap);
      setSelectAll(Object.values(updatedMap).filter(Boolean).length === awsItems.length && awsItems.length > 0);
    } catch (err) {
      console.error("Error en validarPagos:", err);
      toast.error("Error validando pagos. Revisa la consola.");
      setValidationResult({ success: false, message: err.message || "Error inesperado" });
    } finally {
      setIsValidating(false);
      getAWS();
      dispatch(fetchMatriculas());
    }
  };

  const handleClose = () => {
    if (!isSearching && !isValidating) {
      onClose();
    }
  };

  // Toggle preview inline for the given code (open below the item)
  const toggleInlinePreview = (codigo) => {
    setOpenPreviewCode(prev => (prev === codigo ? null : codigo));
    // clear overall validationResult preview if any when toggling
    setValidationResult(null);
  };

  // ---------- CSV export logic ----------
  const buildExportRows = (items) => {
    // items: array of normalized items (each has .codigo_estudiante and info_pago array)
    return items.map((it) => {
      const codigo = it.codigo_estudiante ?? "";
      // Nombre: prefer `nombre_completo`, si no, intentar Nota o Nombre en primer pago
      const nombre = it.nombre_completo
        || it.info_pago?.[0]?.Nota
        || it.info_pago?.[0]?.Nombre
        || "";

      // Monto: prefer it.monto_total if viene, sino sumar Valor_Unitario de los pagos
      let montoRaw = NaN;
      if (it.monto_total != null) {
        montoRaw = parseNumber(it.monto_total);
      } else if (Array.isArray(it.info_pago) && it.info_pago.length > 0) {
        const sum = it.info_pago.reduce((acc, p) => {
          const v = parseNumber(p.Valor_Unitario ?? p.Valor ?? 0);
          return acc + (Number.isFinite(v) ? v : 0);
        }, 0);
        montoRaw = sum;
      }

      const montoFormatted = Number.isFinite(montoRaw) ? formatThousands(montoRaw, { decimals: 0 }) : "-";

      // Concepto Pago: agregar los conceptos/nota.1 únicos concatenados
      const conceptos = Array.isArray(it.info_pago)
        ? Array.from(new Set(it.info_pago.map(p => (p["Nota.1"] || p.Nota || p.Concepto || "").trim()).filter(Boolean)))
        : [];
      const conceptoPago = conceptos.join(" | ") || "";

      // Estado: si la mayoría tienen Estado_Pago usarlo, si no "PAGADO" por defecto
      const estados = Array.isArray(it.info_pago) ? Array.from(new Set(it.info_pago.map(p => (p.Estado_Pago || "").toString().toUpperCase()).filter(Boolean))) : [];
      const estado = estados.length === 1 ? estados[0] : (estados.length > 1 ? estados.join(" / ") : "PAGADO");

      return { codigo, nombre, monto: montoFormatted, conceptoPago, estado };
    });
  };

  const exportCSV = () => {
    // si hay seleccionados exportar seleccionados, sino exportar visibles (filteredItems)
    const itemsToExport = selectedCount > 0
      ? awsItems.filter(i => selectedMap[i.codigo_estudiante])
      : filteredItems;

    if (!itemsToExport || itemsToExport.length === 0) {
      toast.info("No hay datos para exportar");
      return;
    }

    const rows = buildExportRows(itemsToExport);

    // CSV header
    const header = ["Código", "Nombre", "Monto", "Concepto Pago", "Estado"];
    const csvLines = [header.map(csvEscape).join(",")];

    // body
    rows.forEach(r => {
      const line = [
        csvEscape(r.codigo),
        csvEscape(r.nombre),
        csvEscape(r.monto),
        csvEscape(r.conceptoPago),
        csvEscape(r.estado)
      ].join(",");
      csvLines.push(line);
    });

    const csvContent = csvLines.join("\r\n");

    // create blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}`;
    const filename = `pagos_matriculas_${ts}.csv`;

    // create temporary link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`CSV generado (${rows.length} filas)`);
  };

  // UI helpers
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    if (dateString.includes("/")) return dateString;
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-default text-white">
          <div>
            <h3 className="text-lg font-semibold">Validar Pagos AWS</h3>
            <p className="text-sm opacity-90">Cargar pagos PAGADO → Seleccionar → Validar</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClose} className="p-2 rounded hover:text-gray-400" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-auto">

          {/* Controls: refresh, search list, select all, export */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={getAWS}
              disabled={isFetchingAws}
              className="px-3 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {isFetchingAws ? (<><RefreshCw size={16} className=" inline-block mr-2" />Cargando...</>) : (<><RefreshCw size={16} className="inline-block mr-2" />Refrescar</>)}
            </button>

            <div className="flex items-center ml-2 border rounded overflow-hidden">
              <input
                value={filterListText}
                onChange={(e) => setFilterListText(e.target.value)}
                placeholder="Filtrar por código / nota..."
                className="px-3 py-2 outline-none text-sm"
              />
              <button className="px-3 py-2 border-l" onClick={() => setFilterListText("")} aria-label="Limpiar filtro"><Search size={16} /></button>
            </div>

            {/* EXPORT CSV */}
            <button
              onClick={exportCSV}
              disabled={isFetchingAws || (filteredItems.length === 0 && Object.values(selectedMap).filter(Boolean).length === 0)}
              className="px-3 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm"
              title="Exportar CSV (seleccionados o visibles)"
            >
              Exportar CSV
            </button>

            <div className="ml-auto flex items-center gap-2">
              {/* Seleccionar todos / deseleccionar */}
              <button
                onClick={handleToggleSelectAllItems}
                className="px-3 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm"
                disabled={awsItems.length === 0 || isFetchingAws}
                title="Seleccionar todos / Deseleccionar todos"
              >
                {Object.values(selectedMap).filter(Boolean).length === awsItems.length && awsItems.length > 0 ? "Deseleccionar todos" : "Seleccionar todos"}
              </button>

              <div className="text-sm text-gray-600">{filteredItems.length} estudiantes</div>
              <div className="text-sm text-gray-600">Seleccionados: <strong>{selectedCount}</strong></div>
            </div>
          </div>

          {/* Lista de items */}
          <div className="space-y-2">
            {isFetchingAws && (
              <div className="w-full min-h-[220px] flex flex-col items-center justify-center gap-6 text-sm text-gray-700">
                <div className="flex flex-col items-center -space-y-1">
                  <p className="-mt-4 text-2xl font-bold text-gray-580" role="status" aria-live="polite">
                    Cargando pagos de AWS...
                  </p>
                  <div className="scale-120">
                    <Loader />
                  </div>
                </div>
              </div>
            )}

            {!isFetchingAws && filteredItems.length === 0 && (
              <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">No hay pagos que coincidan.</div>
            )}

            {!isFetchingAws && filteredItems.length > 0 && (
              <div className="grid gap-2">
                {filteredItems.map((it, index) => {
                  const code = it.codigo_estudiante ?? `__aws_${index}`;
                  const firstNota = (it.info_pago && it.info_pago[0]) ? (it.info_pago[0]["Nota.1"] || it.info_pago[0].Nota || "") : "";
                  const pagosCount = Array.isArray(it.info_pago) ? it.info_pago.length : 0;
                  const checked = !!selectedMap[code];
                  const isOpen = openPreviewCode === code;

                  return (
                    <div key={code + "-" + pagosCount + "-" + index} className="rounded">
                      {/* Row */}
                      <div className="flex items-center p-3 border rounded-t hover:shadow-sm bg-white">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(code)}
                          className="mr-3 w-4 h-4 cursor-pointer"
                          aria-label={`Seleccionar ${code}`}
                        />
                        <div className="flex-1">
                          <div className="flex flex-col justify-between">
                            <div className="text-sm font-bold">{code}</div>
                            <div className="text-sm font-normal capitalize">{(it.nombre_completo || "").toLowerCase()}</div>
                            <div className="text-sm font-normal">{`$ ${formatThousands(it.monto_total ?? (it.info_pago && it.info_pago.reduce ? it.info_pago.reduce((s,p) => s + (parseNumber(p.Valor_Unitario||p.Valor||0)||0), 0) : 0), { decimals: 0 })}`}</div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{String(firstNota).slice(0, 200)}</div>
                          <div className="text-xs text-gray-400 mt-1">{formatDate(it.info_pago?.[0]?.Fecha)}</div>
                        </div>

                        <div className="ml-3 flex items-center gap-2">
                          <div className="text-xs text-gray-500">{pagosCount} pagos</div>
                          <button
                            onClick={() => toggleInlinePreview(code)}
                            className="px-3 py-1 flex items-center gap-1 bg-white border rounded text-xs hover:bg-gray-50"
                            aria-expanded={isOpen}
                            aria-controls={`preview-${code}`}
                          >
                            <Eye size={12} /> <span>{isOpen ? "Ocultar" : "Ver"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Inline preview: aparece justo debajo de la fila */}
                      {isOpen && (
                        <div id={`preview-${code}`} className="border border-t-0 rounded-b bg-gray-50 p-3">
                          <div className="text-sm text-gray-700">
                            <p><strong>Pagos encontrados:</strong> {it.info_pago.length}</p>
                            <div className="mt-2 text-xs space-y-2 max-h-48 overflow-auto">
                              {it.info_pago.map((p, idx) => (
                                <div key={idx} className="p-2 border rounded bg-white">
                                  <div className="text-xs"><strong>Nota.1:</strong> {p["Nota.1"] ?? p.Nota ?? "-"}</div>
                                  <div className="text-xs"><strong>Estado:</strong> {p.Estado_Pago}</div>
                                  <div className="text-xs">
                                    <strong>Valor:</strong>{" "}
                                    {p.Valor_Unitario != null
                                      ? `$ ${formatThousands(p.Valor_Unitario, { decimals: 0 })}`
                                      : "-"}
                                  </div>
                                  {p.Descuento ? <div className="text-xs"><strong>Descuento:</strong> {p.Descuento ?? "-"}%</div> : null}
                                  <div className="text-xs"><strong>Fecha:</strong> {formatDate(p.Fecha) ?? "-"}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resultado de validarPagos */}
          {validationResult && (
            <div className={`mt-4 p-3 rounded ${validationResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              <div className="flex items-start gap-3">
                {validationResult.success ? <CheckCircle size={18} className="text-green-700" /> : <AlertCircle size={18} className="text-red-700" />}
                <div>
                  <div className="text-sm font-semibold">{validationResult.message}</div>
                  {validationResult.details && (
                    <div className="mt-2 text-xs text-gray-700 max-h-44 overflow-auto">
                      {validationResult.details.map((r, i) => (
                        <div key={i} className="mb-1">
                          <strong>{r.codigo_estudiante}</strong>: {r.ok ? "OK" : `ERR (${String(r.error || r.message || "error")})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <Button
            variant="white"
            onClick={handleClose}
            className="px-4 py-2 text-sm cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            onClick={() => {
              if (awsItems.length > 0 && selectedCount === 0) {
                toast.error("Debes seleccionar por lo menos una matrícula");
                return;
              }
              handleValidateSelected();
            }}
            className="px-4 py-2 bg-green-600 text-white flex items-center rounded-md text-sm"
          >
            {isValidating ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Validando...
              </>
            ) : (
              <>
                <CheckCircle size={18} className="mr-2" />
                <span>Validar seleccionados ({selectedCount})</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalValidarPagoAWS;