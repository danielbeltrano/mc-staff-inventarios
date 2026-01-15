import React, { useState } from 'react';
import { Edit2, Save, X, AlertCircle, Clock, Pencil, Check, RefreshCw  } from 'lucide-react';
import { Button } from '../Button';
import Tooltip, { POSITIONS } from '../Tooltip';
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/Select";
import Modal from '../Modal';
import { Card, CardContent, CardHeader, CardTitle } from '../Cards';

const EditableInfoSection = ({ 
  title, 
  children, 
  onSave,
  isEditable = true,
  className = "",
  classNameTitle = "",
  icon = null
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    await onSave();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className={`bg-white p-6 rounded-lg border border-amber-default hover:border-blue-default shadow-sm ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div className={`flex items-center gap-2 text-xl font-bold text-blue-default ${classNameTitle}`}>
          {icon}
          {title}
        </div>
        {isEditable && (
          <div className="flex gap-2">
            {!isEditing ? (
              <Tooltip text="Editar información" position={POSITIONS.LEFT}>
                <Button
                variant="rounded"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-blue-default hover:text-blue-hover hover:bg-blue-50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              </Tooltip>
            ) : (
              <>
                <Button
                  variant="default"
                  onClick={handleSave}
                  className=" py-2 px-4 rounded-md"
                >
                  Guardar
                </Button>
                <Button
                  variant="amber"
                  onClick={handleCancel}
                  className="hover:bg-red-50 py-2 px-4 rounded-md"
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {typeof children === 'function' 
          ? children({ isEditing }) 
          : React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  disabled: !isEditing,
                  ...child.props
                });
              }
              return child;
            })
        }
      </div>
    </div>
  );
};

export default EditableInfoSection;



export const CaseStatusEditor = ({ currentStatus, caseId, onStatusUpdate, detalleEstado }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [statusToUpdate, setStatusToUpdate] = useState(null);
  
  // Verificar si el caso fue reabierto previamente
  const wasReopened = detalleEstado?.reopened;

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      estado: currentStatus
    }
  });

  // Monitorear el valor seleccionado
  const selectedStatus = watch("estado");

  const onSubmit = async (data) => {
    if (data.estado === currentStatus) {
      setIsEditing(false);
      return;
    }

    // Si se selecciona "cerrado", mostrar el modal de cierre
    if (data.estado === "cerrado") {
      setStatusToUpdate(data.estado);
      setShowCloseModal(true);
      return; // Detener aquí, el proceso continuará después de la justificación
    }

    // Si se selecciona "en proceso" y el estado actual es "cerrado", mostrar modal de reapertura
    if (data.estado === "en proceso" && currentStatus === "cerrado") {
      setStatusToUpdate(data.estado);
      setShowReopenModal(true);
      return;
    }

    // Para otros estados, proceder normalmente
    setIsSubmitting(true);
    try {
      await onStatusUpdate(data.estado);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating status:', error);
      reset({ estado: currentStatus });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCase = async () => {
    if (!closeReason.trim()) {
      toast.error("La justificación de cierre es obligatoria");
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear objeto detalle_estado
      const nuevoDetalleEstado = {
        closed: true,
        closing_date: new Date().toISOString(),
        closing_reason: closeReason.trim(),
        // Mantener historia de reapertura pero marcar que ya no está reabierto
        reopened: false, // Importante: marcar como false cuando se cierra de nuevo
        has_been_reopened: wasReopened || detalleEstado?.has_been_reopened || false, // Guardar historial
        reopening_date: detalleEstado?.reopening_date || null,
        reopening_reason: detalleEstado?.reopening_reason || null,
        previous_closings: detalleEstado?.previous_closings || []
      };
      
      // Si había un cierre anterior, guardarlo en el historial
      if (detalleEstado?.closed && detalleEstado?.closing_reason) {
        const cierrePrevio = {
          date: detalleEstado.closing_date,
          reason: detalleEstado.closing_reason
        };
        
        nuevoDetalleEstado.previous_closings = [
          ...(detalleEstado.previous_closings || []),
          cierrePrevio
        ];
      }
      
      await onStatusUpdate(statusToUpdate, nuevoDetalleEstado);
      setShowCloseModal(false);
      setIsEditing(false);
      setCloseReason("");
    } catch (error) {
      console.error('Error closing case:', error);
      reset({ estado: currentStatus });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenCase = async () => {
    if (!reopenReason.trim()) {
      toast.error("La justificación de reapertura es obligatoria");
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear objeto detalle_estado manteniendo datos de cierre previo si existen
      const nuevoDetalleEstado = {
        ...(detalleEstado || {}),
        reopened: true,
        has_been_reopened: true, // Añadir bandera histórica
        reopening_date: new Date().toISOString(),
        reopening_reason: reopenReason.trim(),
        // Mantener info de cierre como histórico
        closed: false, // Ya no está cerrado
        previous_closings: detalleEstado?.previous_closings || []
      };
      
      // Si había un cierre actual, guardarlo en el historial
      if (detalleEstado?.closed && detalleEstado?.closing_reason) {
        const cierrePrevio = {
          date: detalleEstado.closing_date,
          reason: detalleEstado.closing_reason
        };
        
        nuevoDetalleEstado.previous_closings = [
          ...(detalleEstado.previous_closings || []),
          cierrePrevio
        ];
      }
      
      await onStatusUpdate(statusToUpdate, nuevoDetalleEstado);
      setShowReopenModal(false);
      setIsEditing(false);
      setReopenReason("");
    } catch (error) {
      console.error('Error reopening case:', error);
      reset({ estado: currentStatus });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelModal = (modal) => {
    if (modal === 'close') {
      setShowCloseModal(false);
    } else if (modal === 'reopen') {
      setShowReopenModal(false);
    }
    reset({ estado: currentStatus });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {!isEditing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm ">
            <span className='text-blue-default'>Estado: </span> {currentStatus?.toUpperCase() || "N/A"}
            </p>
            <Tooltip text="Editar estado" position={POSITIONS.RIGHT}>
              <Button
                variant="rounded"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="!p-1"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </Tooltip>
          </div>
          
          {/* Mostrar etiqueta de reabierto si está actualmente reabierto */}
          {currentStatus !== "cerrado" && wasReopened && (
            <div className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full border border-amber-300 w-fit">
              <RefreshCw className="w-3 h-3" />
              <span>Caso reabierto</span>
              {detalleEstado?.reopening_date && (
                <span className="ml-1">
                  el {formatDate(detalleEstado.reopening_date)}
                </span>
              )}
            </div>
          )}
          
          {/* Mostrar detalle de cierre solo si el caso está actualmente cerrado */}
          {currentStatus === "cerrado" && detalleEstado?.closing_reason && (
            <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
              <p className="text-sm font-medium text-blue-default">Motivo de cierre:</p>
              <p className="text-sm text-amber-text">{detalleEstado.closing_reason}</p>
              {detalleEstado.closing_date && (
                <p className="text-xs text-amber-text mt-1">
                  Cerrado el: {formatDate(detalleEstado.closing_date)}
                </p>
              )}
            </div>
          )}
          
          {/* Mostrar detalle de reapertura si aplica y no está cerrado */}
          {currentStatus !== "cerrado" && wasReopened && detalleEstado?.reopening_reason && (
            <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-sm font-medium text-blue-default">Motivo de reapertura:</p>
              <p className="text-sm text-amber-text">{detalleEstado.reopening_reason}</p>
            </div>
          )}
          
          {/* Si ha sido reabierto y luego cerrado, mostrar historial */}
          {currentStatus === "cerrado" && detalleEstado?.has_been_reopened && !wasReopened && (
            <div className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-300 w-fit">
              <Clock className="w-3 h-3" />
              <span>Este caso fue reabierto y cerrado nuevamente</span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
          <Controller
            name="estado"
            control={control}
            rules={{ required: "Este campo es requerido" }}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-[150px] focus:border-blue-default focus:ring-1 focus:ring-blue-default">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="por iniciar">Por iniciar</SelectItem> */}
                  <SelectItem value="en proceso">En proceso</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                  {/* <SelectItem value="cancelado">Cancelado</SelectItem> */}
                </SelectContent>
              </Select>
            )}
          />
          
          <div className="flex gap-1">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              className="p-1 hover:bg-green-50"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                reset({ estado: currentStatus });
                setIsEditing(false);
              }}
              disabled={isSubmitting}
              className="p-1 hover:bg-red-50"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </form>
      )}

      {/* Modal de Justificación de Cierre */}
      <Modal 
        isOpen={showCloseModal} 
        onClose={() => handleCancelModal('close')}
        className="z-50"
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-blue-default text-xl">Justificación de Cierre del Caso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-amber-text mb-2">
                Por favor, ingresa la razón detallada por la cual se cierra este caso:
              </p>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-md min-h-[8rem]
                         focus:border-blue-default focus:ring-1 focus:ring-blue-default transition-colors
                         placeholder:text-amber-text-op2 resize-y"
                placeholder="Describa los motivos del cierre..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="amber"
                onClick={() => handleCancelModal('close')}
                className="py-2 px-4 rounded-md hover:bg-red-50"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleCloseCase}
                className="py-2 px-4 rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Cerrar Caso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Modal>

      {/* Modal de Justificación de Reapertura */}
      <Modal 
        isOpen={showReopenModal} 
        onClose={() => handleCancelModal('reopen')}
        className="z-50"
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-blue-default text-xl">Reapertura del Caso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-amber-text mb-2">
                Por favor, ingresa la razón por la cual se está reabriendo este caso:
              </p>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-md min-h-[8rem]
                         focus:border-blue-default focus:ring-1 focus:ring-blue-default transition-colors
                         placeholder:text-amber-text-op2 resize-y"
                placeholder="Describa los motivos de reapertura..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="amber"
                onClick={() => handleCancelModal('reopen')}
                className="py-2 px-4 rounded-md hover:bg-red-50"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleReopenCase}
                className="py-2 px-4 rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Reabrir Caso"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Modal>
    </>
  );
};