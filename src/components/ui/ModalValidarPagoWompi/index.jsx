// src/components/ui/ModalValidarPagoWompi/index.jsx

import React, { useState, useEffect } from "react";
import { X, Search, CheckCircle, AlertCircle, RefreshCw, DollarSign, Hash, Info, Eye, CheckCheck, User } from "lucide-react";
import { Button } from "../Button";
import { Card, CardHeader, CardContent, CardTitle } from "../Cards";
import { 
  getTransactionById,
  obtenerEntornoActual,
  esModoPruebas 
} from "../../../services/wompi/wompiValidationService";

/**
 * Modal Global para Validación Manual de Pagos Wompi
 * 
 * @param {boolean} isOpen - Controla visibilidad del modal
 * @param {function} onClose - Callback al cerrar
 * @param {function} onValidationSuccess - Callback exitoso con datos: (transactionData, previewData) => void
 * @param {string} paymentLinkId - ID del payment link de Wompi
 * @param {object} entityInfo - Información contextual de la entidad
 * @param {string} entityInfo.nombre - Nombre de la entidad (ej: "Juan Pérez")
 * @param {string} entityInfo.tipo - Tipo de entidad (ej: "Aspirante", "Estudiante", "Cliente")
 * @param {string} entityInfo.identificador - ID o código (ej: "ADM-2024-001")
 * @param {string} entityInfo.subtitulo - Subtítulo opcional (ej: "Grado: Primero")
 * @param {string} tipoPago - Descripción del pago (ej: "Formulario de admisión", "Matrícula 2025")
 * @param {boolean} showEntityCard - Mostrar/ocultar tarjeta de información de entidad (default: true)
 * @param {string} successMessage - Mensaje personalizado de éxito (opcional)
 * @param {object} customValidation - Validación adicional personalizada (opcional)
 * @param {function} customValidation.validate - (transaction, paymentLinkId) => { valid: boolean, message?: string }
 */
const ModalValidarPagoWompi = ({ 
  isOpen, 
  onClose, 
  onValidationSuccess,
  paymentLinkId,
  entityInfo = {
    nombre: "Entidad",
    tipo: "Registro",
    identificador: "N/A",
    subtitulo: null
  },
  tipoPago = "Pago",
  showEntityCard = true,
  successMessage = null,
  customValidation = null
}) => {
  const [reference, setReference] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  const entornoActual = obtenerEntornoActual();
  const isPruebas = esModoPruebas();

  useEffect(() => {
    if (isOpen) {
      console.log(`🔍 Modal de validación Wompi abierto en modo: ${entornoActual.toUpperCase()}`);
      console.log(`📋 Tipo de pago: ${tipoPago}`);
      console.log(`🔗 Payment Link ID: ${paymentLinkId}`);
    }
  }, [isOpen, entornoActual, tipoPago, paymentLinkId]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handlePreview = async () => {
    if (!reference.trim()) {
      setValidationResult({
        success: false,
        message: "Por favor ingresa un Transaction ID válido",
      });
      return;
    }

    if (!paymentLinkId) {
      setValidationResult({
        success: false,
        message: "No se encontró el Payment Link ID. Verifica la configuración.",
      });
      return;
    }

    setIsSearching(true);
    setValidationResult(null);
    setPreviewData(null);

    try {
      console.log(`🔍 Buscando transacción: ${reference.trim()}`);
      const result = await getTransactionById(reference.trim());
      
      if (!result.success) {
        setValidationResult({
          success: false,
          message: `No se encontró la transacción en Wompi (${result.entorno}): ${result.error}`,
        });
        return;
      }

      const transaction = result.transaction;

      console.log(`✅ Transacción encontrada:`);
      console.log(`   - ID: ${transaction.id}`);
      console.log(`   - Estado: ${transaction.status}`);
      console.log(`   - Payment Link: ${transaction.payment_link_id}`);
      console.log(`   - Esperado: ${paymentLinkId}`);

      // Validación de coincidencia de Payment Link
      if (transaction.payment_link_id !== paymentLinkId) {
        setValidationResult({
          success: false,
          message: `Esta transacción pertenece a otro payment link. Se esperaba: ${paymentLinkId}, pero la transacción pertenece a: ${transaction.payment_link_id}`,
          hint: `Verifica que hayas copiado el Transaction ID correcto para "${tipoPago}"${isPruebas ? ' en el dashboard de Wompi (modo Sandbox)' : ''}`,
        });
        return;
      }

      // Validación de estado APPROVED
      const isApproved = transaction.status === 'APPROVED';

      // Validación personalizada adicional (si se proporciona)
      if (customValidation?.validate) {
        const customResult = customValidation.validate(transaction, paymentLinkId);
        if (!customResult.valid) {
          setValidationResult({
            success: false,
            message: customResult.message || "La transacción no cumple con los criterios de validación personalizados",
            hint: customResult.hint || null,
          });
          return;
        }
      }

      setPreviewData({
        transaction_id: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount_in_cents / 100,
        currency: transaction.currency,
        status: transaction.status,
        payment_method: transaction.payment_method_type,
        finalized_at: transaction.finalized_at,
        payment_link_id: transaction.payment_link_id,
        customer_email: transaction.customer_email,
        isApproved: isApproved,
        entorno: result.entorno,
        // Datos originales completos para el callback
        rawTransaction: transaction,
      });

      if (!isApproved) {
        setValidationResult({
          success: false,
          message: `Esta transacción no está aprobada. Estado actual: ${transaction.status}`,
          hint: 'Solo puedes validar transacciones con estado APPROVED',
        });
      } else {
        console.log(`✅ Transacción válida y lista para confirmar`);
      }

    } catch (error) {
      console.error('❌ Error en preview:', error);
      setValidationResult({
        success: false,
        message: "Error inesperado al buscar la transacción",
        hint: error.message,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmValidation = async () => {
    if (!previewData) {
      setValidationResult({
        success: false,
        message: "No hay datos de transacción para validar",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      console.log(`🔄 Confirmando validación de pago...`);
      
      // Preparar datos de transacción para el callback
      const transactionData = {
        transaction_id: previewData.transaction_id,
        reference: previewData.reference,
        amount: previewData.amount,
        currency: previewData.currency,
        status: previewData.status,
        payment_method: previewData.payment_method,
        finalized_at: previewData.finalized_at,
        payment_link_id: previewData.payment_link_id,
        customer_email: previewData.customer_email,
        entorno: previewData.entorno,
        validated_at: new Date().toISOString(),
        validation_method: 'Manual',
        // Incluir datos completos por si se necesitan
        raw: previewData.rawTransaction,
      };

      // Llamar al callback del componente padre
      await onValidationSuccess(transactionData, previewData);

      console.log(`✅ Validación completada exitosamente`);

      setValidationResult({
        success: true,
        message: successMessage || `Pago de $${previewData.amount.toLocaleString('es-CO')} ${previewData.currency} validado correctamente`,
        transaction: transactionData,
      });

      // Limpiar preview después de 2 segundos del éxito
      setTimeout(() => {
        setPreviewData(null);
      }, 2000);

    } catch (error) {
      console.error('❌ Error en validación:', error);
      setValidationResult({
        success: false,
        message: error.message || "Error inesperado al validar el pago",
        hint: "Verifica que la función de validación esté configurada correctamente",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    if (!isSearching && !isValidating) {
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setReference("");
    setPreviewData(null);
    setValidationResult(null);
  };

  if (!isOpen) return null;

  // Función auxiliar para detectar tipo de referencia
  const detectReferenceType = (ref) => {
    if (!ref) return null;
    
    const hasOnlyDashes = ref.includes('-') && !ref.includes('_');
    const hasUnderscores = ref.includes('_');
    const isShort = ref.length <= 10;
    
    if (hasOnlyDashes && !hasUnderscores) {
      return { type: 'Transaction ID', valid: true };
    } else if (hasUnderscores) {
      return { type: 'Referencia de Pago', valid: false };
    } else if (isShort) {
      return { type: 'Payment Link ID', valid: false };
    }
    return { type: 'Desconocido', valid: false };
  };

  const referenceInfo = detectReferenceType(reference);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
      case 'DECLINED':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
      case 'PENDING':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
      case 'VOIDED':
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-default">
          <div>
            <h2 className="text-xl font-bold text-white">Validar Pago Manualmente</h2>
            <p className="text-sm text-blue-100 mt-1">
              {tipoPago}
              {isPruebas && ' - Modo Pruebas'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSearching || isValidating}
            className="text-white hover:bg-blue-hover rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* ALERTA DE MODO PRUEBAS */}
          {isPruebas && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <div className="flex items-start">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5 mr-3" size={20} />
                <div className="text-sm">
                  <p className="font-bold text-yellow-900">
                    Modo de Pruebas Activo - {entornoActual.toUpperCase()}
                  </p>
                  <p className="text-yellow-800 mt-1">
                    Las transacciones a validar deben estar en el dashboard de Wompi con el <strong>Modo Sandbox activado</strong>.
                    Asegúrate de buscar la transacción en el entorno correcto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INFORMACIÓN IMPORTANTE */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Información importante:</p>
                <ul className="space-y-1 ml-4 list-disc text-xs">
                  <li>
                    Ingresa el <strong>Transaction ID</strong> (formato: XXXX-XXXX-XXXX)
                  </li>
                  <li>
                    Lo encuentras en el dashboard de Wompi{isPruebas && ' (con modo Sandbox activado)'}, en la columna "ID" de cada transacción
                  </li>
                  <li>
                    El sistema verificará que la transacción esté aprobada y corresponda a este pago
                  </li>
                  <li>
                    <strong>Tipo de pago:</strong> {tipoPago}
                  </li>
                  <li>
                    <strong>Entorno actual:</strong> <span className="font-mono bg-white px-1 rounded">{entornoActual.toUpperCase()}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CARD DE INFORMACIÓN DE ENTIDAD */}
          {showEntityCard && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-blue-default flex items-center">
                  <User className="mr-2" size={18} />
                  Información de {entityInfo.tipo}
                </CardTitle>
              </CardHeader>
              <CardContent className="!p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-blue-default">Nombre:</span>
                    <p className="text-gray-800 mt-1">{entityInfo.nombre}</p>
                  </div>
                  {entityInfo.subtitulo && (
                    <div>
                      <span className="font-medium text-blue-default">Detalle:</span>
                      <p className="text-gray-800 mt-1">{entityInfo.subtitulo}</p>
                    </div>
                  )}
                  <div className={entityInfo.subtitulo ? "col-span-2" : "col-span-1"}>
                    <span className="font-medium text-blue-default">
                      {entityInfo.subtitulo ? "Payment Link ID" : "Identificador"}:
                    </span>
                    <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 text-gray-800 border border-gray-200">
                      {entityInfo.subtitulo ? paymentLinkId : entityInfo.identificador}
                    </p>
                  </div>
                  {entityInfo.subtitulo && (
                    <div className="col-span-2">
                      <span className="font-medium text-blue-default">Código:</span>
                      <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 text-gray-800 border border-gray-200">
                        {entityInfo.identificador}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* INPUT TRANSACTION ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ejemplo: 1279282-1755801974-40947"
                disabled={isSearching || isValidating || previewData}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* INDICADOR DE TIPO DE REFERENCIA */}
            {referenceInfo && (
              <div className={`mt-2 p-2 rounded text-xs flex items-center space-x-2 ${
                referenceInfo.valid 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {referenceInfo.valid ? (
                  <CheckCircle size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                <span>
                  Detectado: <strong>{referenceInfo.type}</strong>
                  {!referenceInfo.valid && ' - Solo se acepta Transaction ID'}
                </span>
              </div>
            )}

            {/* BOTÓN DE RESET */}
            {previewData && (
              <button
                onClick={handleReset}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-colors"
              >
                <RefreshCw size={14} />
                <span>Limpiar y buscar otra transacción</span>
              </button>
            )}
          </div>

          {/* PREVISUALIZACIÓN DE TRANSACCIÓN */}
          {previewData && (
            <Card className="border border-gray-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="mr-2 text-blue-600" size={18} />
                    Previsualización de la Transacción
                  </div>
                  {previewData.entorno && (
                    <span className={`text-xs px-2 py-1 rounded font-mono ${
                      previewData.entorno === 'produccion'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {previewData.entorno.toUpperCase()}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Monto:</span>
                    <p className="text-lg font-bold text-gray-800 flex items-center mt-1">
                      <DollarSign size={18} className="text-green-600" />
                      {previewData.amount.toLocaleString('es-CO')} {previewData.currency}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Estado:</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                        getStatusColor(previewData.status).bg
                      } ${getStatusColor(previewData.status).text} ${getStatusColor(previewData.status).border}`}>
                        {previewData.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Método de pago:</span>
                    <p className="text-sm text-gray-800 mt-1 capitalize">
                      {previewData.payment_method?.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Fecha de aprobación:</span>
                    <p className="text-sm text-gray-800 mt-1">
                      {formatDate(previewData.finalized_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Email:</span>
                    <p className="text-sm text-gray-800 mt-1 truncate">
                      {previewData.customer_email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Transaction ID:</span>
                    <p className="font-mono text-xs bg-white p-2 rounded mt-1 break-all text-gray-800 border border-gray-200">
                      {previewData.transaction_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Referencia:</span>
                    <p className="font-mono text-xs bg-white p-2 rounded mt-1 break-all text-gray-800 border border-gray-200">
                      {previewData.reference}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Payment Link ID:</span>
                    <p className="font-mono text-xs bg-white p-2 rounded mt-1 break-all text-gray-800 border border-gray-200">
                      {previewData.payment_link_id}
                    </p>
                  </div>
                </div>

                {/* ALERTA SI NO ESTÁ APROBADA */}
                {!previewData.isApproved && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-red-800">
                        <p className="font-semibold">Transacción no válida para validación</p>
                        <p className="text-xs mt-1">
                          Solo puedes validar transacciones con estado <strong>APPROVED</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ALERTA SI TODO ESTÁ CORRECTO */}
                {previewData.isApproved && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                      <div className="text-sm text-green-800">
                        <p className="font-semibold">Todo está correcto</p>
                        <p className="text-xs mt-1">
                          Esta transacción está aprobada y coincide con el pago de "{tipoPago}". 
                          Haz clic en "Confirmar Validación" para continuar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* RESULTADO DE VALIDACIÓN */}
          {validationResult && (
            <div
              className={`rounded-lg p-4 border-l-4 shadow-sm animate-fadeIn ${
                validationResult.success
                  ? "bg-green-50 border-green-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <div className="flex items-start space-x-3">
                {validationResult.success ? (
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      validationResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {validationResult.success ? "Pago validado exitosamente" : "Error"}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      validationResult.success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {validationResult.message}
                  </p>
                  
                  {!validationResult.success && validationResult.hint && (
                    <div className="mt-2 p-2 bg-white rounded border border-red-200">
                      <p className="text-xs text-gray-600">
                        <strong>Sugerencia:</strong> {validationResult.hint}
                      </p>
                    </div>
                  )}
                  
                  {validationResult.success && validationResult.transaction && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-700 font-medium mb-2">
                        Resumen del proceso:
                      </p>
                      <ul className="text-xs text-green-700 space-y-1 ml-4 list-disc">
                        <li>
                          <strong>Monto:</strong> ${validationResult.transaction.amount.toLocaleString('es-CO')} {validationResult.transaction.currency}
                        </li>
                        <li>
                          <strong>Método:</strong> {validationResult.transaction.payment_method?.replace('_', ' ')}
                        </li>
                        <li>
                          <strong>Transaction ID:</strong> {validationResult.transaction.transaction_id}
                        </li>
                        {validationResult.transaction.entorno && (
                          <li>
                            <strong>Entorno:</strong> <span className="font-mono">{validationResult.transaction.entorno.toUpperCase()}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER - BOTONES DE ACCIÓN */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          {validationResult?.success ? (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <CheckCircle size={16} />
              <span>Entendido, Cerrar</span>
            </button>
          ) : (
            <>
              <Button
                variant="amber"
                onClick={handleClose}
                className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSearching || isValidating}
              >
                Cancelar
              </Button>

              {!previewData && (
                <Button
                  onClick={handlePreview}
                  disabled={isSearching || !reference.trim() || !referenceInfo?.valid}
                  className="px-4 py-2.5 bg-blue-default hover:bg-blue-hover text-white font-medium rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      <span>Previsualizar</span>
                    </>
                  )}
                </Button>
              )}

              {previewData && previewData.isApproved && !validationResult && (
                <Button
                  onClick={handleConfirmValidation}
                  disabled={isValidating}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCheck size={16} />
                      <span>Confirmar Validación</span>
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalValidarPagoWompi;