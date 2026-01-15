// ===================================================================
// ARCHIVO: src/components/admin/SequenceAdminPanel.jsx
// Componente para administrar la secuencia de formularios (solo admins)
// ===================================================================

import React, { useState } from 'react';
import { useFormularioSequence } from '../../../hooks/useFormularioSequence';
import { toast } from 'react-toastify';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Info,
  Trash2
} from 'lucide-react';

const SequenceAdminPanel = () => {
  const { 
    sequenceStatus, 
    backups, 
    loading, 
    error, 
    setStart, 
    autoSet, 
    createBackup, 
    resetWithBackup,
    getNextId,
    reload,
    reloadBackups
  } = useFormularioSequence();

  const [startNumber, setStartNumber] = useState('');
  const [backupName, setBackupName] = useState('');
  const [backupReason, setBackupReason] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [nextIdPreview, setNextIdPreview] = useState('');

  // 🔧 Manejar configuración de inicio
  const handleSetStart = async () => {
    const number = parseInt(startNumber);
    if (!number || number < 1) {
      toast.error('Ingrese un número válido mayor a 0');
      return;
    }

    try {
      const result = await setStart(number);
      if (result.success) {
        toast.success('Secuencia configurada correctamente');
        setStartNumber('');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error configurando secuencia');
    }
  };

  // 🔄 Manejar auto-configuración
  const handleAutoSet = async () => {
    try {
      const result = await autoSet();
      if (result.success) {
        toast.success('Secuencia auto-configurada');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error en auto-configuración');
    }
  };

  // 💾 Crear backup manual
  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast.error('Ingrese un nombre para el backup');
      return;
    }

    try {
      const result = await createBackup(backupName.trim(), backupReason.trim() || null);
      if (result.success) {
        toast.success('Backup creado exitosamente');
        setBackupName('');
        setBackupReason('');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error creando backup');
    }
  };

  // 🗑️ Reset con backup
  const handleReset = async () => {
    try {
      const resetSuffix = `reset_${new Date().toISOString().split('T')[0]}`;
      const result = await resetWithBackup(resetSuffix);
      
      if (result.success) {
        toast.success('Sistema reiniciado correctamente con backup');
        setShowResetConfirm(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Error en el reset');
    }
  };

  // 🔍 Preview del próximo ID
  const handlePreviewNextId = async () => {
    try {
      const result = await getNextId();
      if (result.success) {
        setNextIdPreview(result.nextId);
        toast.info(`Próximo ID será: ${result.nextId}`);
      }
    } catch (error) {
      toast.error('Error obteniendo preview');
    }
  };

  // 🔄 Recargar datos
  const handleRefresh = () => {
    reload();
    reloadBackups();
    toast.success('Datos actualizados');
  };

  if (loading && !sequenceStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-default"></div>
        <span className="ml-3 text-gray-600">Cargando estado de secuencia...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Settings className="h-6 w-6 text-blue-default mr-2" />
          <h2 className="text-xl font-bold text-gray-800">
            Administración de Secuencia de Formularios
          </h2>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* ESTADO ACTUAL */}
      {sequenceStatus && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Estado Actual del Sistema
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {sequenceStatus.ultimo_id_usado}
              </div>
              <div className="text-sm text-blue-600 font-medium">Último Usado</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {sequenceStatus.proximo_id}
              </div>
              <div className="text-sm text-green-600 font-medium">Próximo ID</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-amber-600">
                {sequenceStatus.total_formularios}
              </div>
              <div className="text-sm text-amber-600 font-medium">Total Formularios</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {sequenceStatus.secuencia_actual}
              </div>
              <div className="text-sm text-purple-600 font-medium">Valor Secuencia</div>
            </div>
          </div>
          
          {/* PREVIEW BUTTON */}
          <div className="mt-4 text-center">
            <button
              onClick={handlePreviewNextId}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Clock className="h-4 w-4" />
              Ver Próximo ID
            </button>
            {nextIdPreview && (
              <span className="ml-3 text-sm text-gray-600">
                Siguiente: <strong className="text-blue-600">{nextIdPreview}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* CONFIGURACIÓN DE SECUENCIA */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* PANEL IZQUIERDO: CONFIGURACIÓN */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Secuencia
          </h3>
          
          {/* Configurar Inicio Manual */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Save className="h-4 w-4" />
              Configurar Inicio Manual
            </h4>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Número de inicio (ej: 351)"
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
                <button 
                  onClick={handleSetStart}
                  disabled={loading || !startNumber}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Configurar
                </button>
              </div>
              {startNumber && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  💡 El próximo formulario será: <strong>ADM{startNumber.padStart(3, '0')}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Auto-configurar */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Auto-configurar
            </h4>
            <button 
              onClick={handleAutoSet}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Continuar desde último formulario
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Detecta automáticamente el último número usado y continúa desde ahí
            </p>
          </div>

          {/* Crear Backup */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Crear Backup Manual
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre del backup (ej: backup_mensual)"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Razón del backup (opcional)"
                value={backupReason}
                onChange={(e) => setBackupReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleCreateBackup}
                disabled={loading || !backupName.trim()}
                className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <Database className="h-4 w-4" />
                Crear Backup
              </button>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: BACKUPS Y RESET */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Gestión de Backups
          </h3>
          
          {/* Lista de Backups */}
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Backups Disponibles
              <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {backups.length} backups
              </span>
            </h4>
            
            <div className="max-h-64 overflow-y-auto">
              {backups.length > 0 ? (
                <div className="space-y-2">
                  {backups.slice(0, 8).map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{backup.backup_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-3">
                          <span>📊 {backup.records_count} registros</span>
                          <span>💾 {backup.size_mb} MB</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            backup.table_status === 'Disponible' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {backup.table_status}
                          </span>
                        </div>
                        {backup.backup_reason && (
                          <div className="text-xs text-blue-600 mt-1">
                            📝 {backup.backup_reason}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        <div>{new Date(backup.created_at).toLocaleDateString()}</div>
                        <div>{new Date(backup.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                  
                  {backups.length > 8 && (
                    <div className="text-center text-xs text-gray-500 p-2">
                      ... y {backups.length - 8} backups más
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay backups disponibles</p>
                  <p className="text-xs">Crea tu primer backup usando el panel de la izquierda</p>
                </div>
              )}
            </div>
          </div>

          {/* Reset Sistema */}
          <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50 hover:shadow-sm transition-shadow">
            <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zona de Peligro
            </h4>
            
            {!showResetConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-red-700">
                  ⚠️ Esta acción creará un backup automático y reiniciará la secuencia desde <strong>ADM001</strong>
                </p>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reiniciar Sistema con Backup
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-800 text-sm font-medium mb-2">
                    ⚠️ CONFIRMACIÓN REQUERIDA
                  </p>
                  <p className="text-red-700 text-sm">
                    Esto realizará las siguientes acciones:
                  </p>
                  <ul className="text-red-700 text-xs mt-2 space-y-1 ml-4">
                    <li>• Crear backup automático con fecha actual</li>
                    <li>• Reiniciar secuencia desde ADM001</li>
                    <li>• Mantener todos los datos existentes en el backup</li>
                  </ul>
                  <p className="text-red-800 text-sm font-medium mt-2">
                    ¿Está completamente seguro?
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {loading ? 'Procesando...' : 'Sí, Reiniciar'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>x
      </div>

      {/* FOOTER INFO */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>🔄 Actualización automática cada vez que se usa</span>
            <span>💾 Backups seguros en base de datos</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Estado:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {loading ? 'Cargando...' : 'Listo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceAdminPanel;