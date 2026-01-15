
// ===================================================================
// ARCHIVO: src/hooks/useFormularioSequence.js  
// ===================================================================

import { useState, useEffect, useCallback } from 'react';
import { FormularioSequenceManager } from '../../utils/formularioUtils';

export const useFormularioSequence = () => {
  const [sequenceStatus, setSequenceStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📊 Cargar estado inicial de secuencia
  const loadSequenceStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await FormularioSequenceManager.getSequenceStatus();
    
    if (result.success) {
      setSequenceStatus(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, []);

  // 📋 Cargar lista de backups
  const loadBackups = useCallback(async () => {
    const result = await FormularioSequenceManager.listBackups();
    
    if (result.success) {
      setBackups(result.backups);
    }
  }, []);

  // 🔧 Configurar inicio de secuencia
  const setStart = useCallback(async (startNumber) => {
    setLoading(true);
    setError(null);
    
    const result = await FormularioSequenceManager.setSequenceStart(startNumber);
    
    if (result.success) {
      await loadSequenceStatus(); // Recargar estado
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [loadSequenceStatus]);

  // 🔄 Auto-configurar secuencia
  const autoSet = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await FormularioSequenceManager.autoSetSequence();
    
    if (result.success) {
      await loadSequenceStatus();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [loadSequenceStatus]);

  // 💾 Crear backup
  const createBackup = useCallback(async (backupName, reason) => {
    setLoading(true);
    setError(null);
    
    const result = await FormularioSequenceManager.createBackup(backupName, reason);
    
    if (result.success) {
      await loadBackups(); // Recargar lista
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [loadBackups]);

  // 🔄 Reset con backup
  const resetWithBackup = useCallback(async (suffix) => {
    setLoading(true);
    setError(null);
    
    const result = await FormularioSequenceManager.backupAndReset(suffix);
    
    if (result.success) {
      await loadSequenceStatus();
      await loadBackups();
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [loadSequenceStatus, loadBackups]);

  // 🔍 Obtener próximo ID para vista previa
  const getNextId = useCallback(async () => {
    const result = await FormularioSequenceManager.getNextId();
    return result;
  }, []);

  // Cargar datos iniciales al montar
  useEffect(() => {
    loadSequenceStatus();
    loadBackups();
  }, [loadSequenceStatus, loadBackups]);

  return {
    sequenceStatus,
    backups,
    loading,
    error,
    setStart,
    autoSet,
    createBackup,
    resetWithBackup,
    getNextId,
    reload: loadSequenceStatus,
    reloadBackups: loadBackups
  };
};

// ===================================================================
// UTILIDADES AUXILIARES
// ===================================================================

export const FormularioUtils = {
  
  // ✅ Extraer número de secuencia desde ID
  extractSequenceFromId: (formularioId) => {
    if (!formularioId || !formularioId.startsWith('ADM')) return null;
    return parseInt(formularioId.substring(3));
  },
  
  // ✅ Formatear número a ID ADM
  formatSequenceToId: (sequenceNumber) => {
    if (!sequenceNumber || sequenceNumber < 1) return null;
    return `ADM${sequenceNumber.toString().padStart(3, '0')}`;
  },
  
  // ✅ Validar formato de ID ADM
  validateFormularioId: (formularioId) => {
    if (!formularioId) return false;
    return /^ADM\d{3,}$/.test(formularioId);
  },
  
  // ✅ Obtener rango de IDs desde-hasta
  getIdRange: (start, end) => {
    if (!start || !end || start > end) return [];
    
    const ids = [];
    for (let i = start; i <= end; i++) {
      ids.push(FormularioUtils.formatSequenceToId(i));
    }
    return ids;
  }
};