// components/ui/ModalSeleccionarContrato.jsx - VERSIÓN ACTUALIZADA

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  ExternalLink,
  RefreshCw,
  ArrowUpCircle,
} from "lucide-react";
import { Card, CardContent } from "../Cards";
import { Button } from "../Button";
import Modal from "../Modal";
import { toast } from "react-toastify";
import {
  listarContratosDisponibles,
  descargarContratoEspecifico,
  obtenerUrlDocumento,
  sincronizarEnvelopesEstudiante,
} from "../../../services/docusign/docusignApiStaff";

const ModalSeleccionarContrato = ({
  isOpen,
  onClose,
  codigoEstudiante,
  nombreEstudiante,
  onContratoDescargado,
}) => {
  const [contratos, setContratos] = useState([]);
  const [contratosOrganizados, setContratosOrganizados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(null);
  const [vistaActual, setVistaActual] = useState("todos");
  const [sincronizando, setSincronizando] = useState(false);

  // Cargar contratos al abrir el modal
  useEffect(() => {
    if (isOpen && codigoEstudiante) {
      cargarContratos();
    }
  }, [isOpen, codigoEstudiante]);

  const cargarContratos = async (forzarSincronizacionOEvento = false) => {
    setCargando(true);

    const forzarSincronizacion = typeof forzarSincronizacionOEvento === 'boolean' 
    ? forzarSincronizacionOEvento 
    : false;

    try {
    console.log('🔄 Cargando contratos para:', codigoEstudiante, {
      forzarSincronizacion
    });
    
    const resultado = await listarContratosDisponibles(
      codigoEstudiante,
      forzarSincronizacion
    );

      if (resultado.success) {
        setContratos(resultado.contratos);
        setContratosOrganizados(resultado.organizados);

        console.log("✅ Contratos cargados:", {
          total: resultado.total,
          activos: resultado.organizados.activos.length,
          historicos: resultado.organizados.historicos.length,
          pendientes: resultado.organizados.pendientes.length,
          sincronizado: resultado.sincronizadoConDocuSign,
        });

        if (resultado.total === 0) {
          toast.info("No hay contratos disponibles para este estudiante");
        } else {
          // Seleccionar vista con más contratos
          const vistas = {
            activos: resultado.organizados.activos.length,
            historicos: resultado.organizados.historicos.length,
            pendientes: resultado.organizados.pendientes.length,
          };

          const vistaConMasContratos = Object.entries(vistas).sort(
            (a, b) => b[1] - a[1]
          )[0][0];

          setVistaActual(vistaConMasContratos);

          // ⬅️ NUEVO: Mostrar mensaje si se sincronizó
          if (forzarSincronizacion && resultado.sincronizadoConDocuSign) {
            toast.success("Lista sincronizada con DocuSign", {
              icon: "✅",
              autoClose: 3000,
            });
          }
        }
      } else {
        toast.error(`Error: ${resultado.error}`);
      }
    } catch (error) {
      console.error("❌ Error cargando contratos:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  // ⬅️ NUEVA FUNCIÓN: Sincronizar con DocuSign
  const handleSincronizarConDocuSign = async () => {
    setSincronizando(true);

    try {
      console.log("🔄 Sincronizando con DocuSign...");

      // ⬅️ USAR LA NUEVA FUNCIÓN
      const resultado = await sincronizarEnvelopesEstudiante(codigoEstudiante);

      if (resultado.success) {
        toast.success(`✅ ${resultado.total} contratos sincronizados`, {
          autoClose: 3000,
        });

        // Recargar lista
        await cargarContratos(false); // false = no forzar, leer del JSON actualizado
      } else {
        toast.error(`Error: ${resultado.error}`);
      }
    } catch (error) {
      console.error("❌ Error sincronizando:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSincronizando(false);
    }
  };

  const handleDescargarContrato = async (contrato) => {
    setDescargando(contrato.envelopeId);

    try {
      console.log("📥 Descargando contrato:", {
        envelopeId: contrato.envelopeId,
        codigo: contrato.codigoEstudiante,
        año: contrato.anoEscolar,
      });

      const resultado = await descargarContratoEspecifico(
        contrato.envelopeId,
        contrato.codigoEstudiante,
        contrato.anoEscolar
      );

      if (resultado.success) {
        toast.success(resultado.mensaje, {
          icon: "✅",
          autoClose: 5000,
        });

        // Actualizar lista de contratos
        await cargarContratos();

        // Notificar al componente padre
        if (onContratoDescargado) {
          onContratoDescargado(resultado);
        }
      } else if (resultado.error === "ENVELOPE_NOT_COMPLETED") {
        toast.warning(resultado.mensaje, {
          autoClose: 6000,
        });

        // NUEVO: Mostrar modal con firmantes pendientes
        if (resultado.firmantesInfo?.pendientes?.length > 0) {
          toast.info(
            `Pendientes: ${resultado.firmantesInfo.pendientes.join(", ")}`,
            { autoClose: 8000 }
          );
        }
      } else {
        toast.error(`Error: ${resultado.error || resultado.mensaje}`);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setDescargando(null);
    }
  };

  const handleVerDocumento = async (documentPath) => {
    try {
      console.log("👁️ Abriendo documento:", documentPath);

      const url = await obtenerUrlDocumento(documentPath);
      window.open(url, "_blank");

      toast.success("Documento abierto en nueva pestaña", {
        autoClose: 2000,
        icon: "📄",
      });
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getContratosVista = () => {
    if (!contratosOrganizados) return [];

    switch (vistaActual) {
      case "activos":
        return contratosOrganizados.activos;
      case "historicos":
        return contratosOrganizados.historicos;
      case "pendientes":
        return contratosOrganizados.pendientes;
      case "todos":
        return contratosOrganizados.todos;
      default:
        return [];
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar Contrato"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Header con info del estudiante */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <FileText className="w-5 h-5 text-blue-default" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-default">
                {nombreEstudiante}
              </h3>
              <p className="text-sm text-sky-700">Código: {codigoEstudiante}</p>
            </div>

            <Button
              onClick={() => cargarContratos(false)} // ⬅️ Pasar false explícitamente
              disabled={cargando || sincronizando}
              variant="default"
              size="sm"
              className="px-4 py-2 flex items-center gap-2 rounded-md"
              title="Actualizar lista (usa caché de 5 min)"
            >
              <RefreshCw
                className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>

            <Button
              onClick={handleSincronizarConDocuSign}
              disabled={sincronizando || cargando}
              variant="amber"
              size="sm"
              className="px-4 py-2 flex items-center gap-2 rounded-md"
              title="Consultar DocuSign y actualizar lista"
            >
              <ArrowUpCircle
                className={`w-4 h-4 ${sincronizando ? "animate-spin" : ""}`}
              />
              {sincronizando ? "Sincronizando..." : "Sincronizar"}
            </Button>
          </div>
        </div>

        {/* Tabs de filtrado */}
        {contratosOrganizados && (
          <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
            <button
              onClick={() => setVistaActual("todos")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                vistaActual === "todos"
                  ? "bg-blue-100 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Todos ({contratosOrganizados.todos.length})
            </button>

            <button
              onClick={() => setVistaActual("activos")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                vistaActual === "activos"
                  ? "bg-blue-100 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Activos ({contratosOrganizados.activos.length})
            </button>

            <button
              onClick={() => setVistaActual("historicos")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                vistaActual === "historicos"
                  ? "bg-blue-100 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Históricos ({contratosOrganizados.historicos.length})
            </button>

            <button
              onClick={() => setVistaActual("pendientes")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                vistaActual === "pendientes"
                  ? "bg-blue-100 text-blue-700 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Pendientes ({contratosOrganizados.pendientes.length})
            </button>
          </div>
        )}

        {/* Lista de contratos */}
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {cargando ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Cargando contratos...</span>
            </div>
          ) : getContratosVista().length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay contratos en esta categoría</p>
            </div>
          ) : (
            getContratosVista().map((contrato) => (
              <ContratoCard
                key={contrato.id}
                contrato={contrato}
                onDescargar={handleDescargarContrato}
                onVerDocumento={handleVerDocumento}
                descargando={descargando === contrato.envelopeId}
                formatearFecha={formatearFecha}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="amber"
            className="px-4 py-2 text-sm font-medium rounded-md"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Card individual para cada contrato
 */
const ContratoCard = ({
  contrato,
  onDescargar,
  onVerDocumento,
  descargando,
  formatearFecha,
}) => {
  return (
    <Card
      className={`${
        contrato.esVersionMasReciente
          ? "border-2 border-blue-300 bg-blue-50"
          : "border border-gray-200"
      }`}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          {/* Información del contrato */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-semibold text-gray-900">
                Contrato {contrato.anoEscolar}
              </h4>

              {/* Badge de año actual */}
              {contrato.esVersionMasReciente && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
                  Año Actual
                </span>
              )}

              {/* Badge de estado */}
              {contrato.estaCompleto ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Completado
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pendiente
                </span>
              )}

              {/* Badge de descargado */}
              {contrato.yaDescargado && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  Descargado
                </span>
              )}
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Creado: {formatearFecha(contrato.fechaCreacion)}</span>
              </div>

              {contrato.fechaCompletado && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Completado: {formatearFecha(contrato.fechaCompletado)}
                  </span>
                </div>
              )}

              {/* ← NUEVO: Mostrar info de firmantes si existe */}
              {contrato.firmantesTotales > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    Firmas: {contrato.firmantesCompletos}/
                    {contrato.firmantesTotales}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4" />
                <span className="truncate">
                  {contrato.emailSubject || "Contrato de Matrícula"}
                </span>
              </div>
            </div>

            {/* ← NUEVO: Mostrar firmantes pendientes si existen */}
            {!contrato.estaCompleto &&
              contrato.recipients &&
              contrato.recipients.length > 0 && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs font-medium text-amber-900 mb-1">
                    Pendientes de firma:
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1">
                    {contrato.recipients
                      .filter((r) => r.status !== "completed")
                      .map((recipient, idx) => (
                        <li key={idx}>
                          • {recipient.name} ({recipient.roleName})
                        </li>
                      ))}
                  </ul>
                </div>
              )}

            {/* Error si existe */}
            {contrato.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{contrato.errorMensaje}</span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2">
            {/* Botón Ver (si ya está descargado) */}
            {contrato.yaDescargado && contrato.documentPath && (
              <Button
                onClick={() => onVerDocumento(contrato.documentPath)}
                variant="default"
                size="sm"
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" />
                Ver
              </Button>
            )}

            {/* Botón Descargar (si está completo y no descargado) */}
            {contrato.puedoDescargar && (
              <Button
                onClick={() => onDescargar(contrato)}
                disabled={descargando}
                variant="amber"
                size="sm"
                className="flex items-center gap-1 whitespace-nowrap"
              >
                {descargando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Descargar
                  </>
                )}
              </Button>
            )}

            {/* ← NUEVO: Botón de info si está pendiente */}
            {!contrato.estaCompleto && !contrato.puedoDescargar && (
              <Button
                onClick={() => {
                  toast.info(
                    `Este contrato está en estado: ${contrato.statusDescripcion}`,
                    { autoClose: 4000 }
                  );
                }}
                variant="clean"
                size="sm"
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <AlertCircle className="w-4 h-4" />
                Info
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModalSeleccionarContrato;
