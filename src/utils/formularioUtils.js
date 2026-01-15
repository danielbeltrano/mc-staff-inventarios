// ===================================================================
// ARCHIVO: src/utils/formularioUtils.js
// Utilidades para gestión de secuencia de formularios ADM
// ===================================================================

import { supabaseStudentClient } from '../core/config/supabase/supabaseCampusStudentClient';

// 🎯 CLASE PRINCIPAL PARA GESTIÓN DE SECUENCIA
export class FormularioSequenceManager {
  
  // ✅ Obtener estado actual de la secuencia
  static async getSequenceStatus() {
    try {
      const { data, error } = await supabaseStudentClient
        .rpc('check_formulario_sequence_status');
      
      if (error) throw error;
      
      return {
        success: true,
        data: data[0] || null
      };
    } catch (error) {
      console.error('❌ Error obteniendo estado de secuencia:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Configurar inicio de secuencia desde número específico
  static async setSequenceStart(startNumber) {
    try {
      const { data, error } = await supabaseStudentClient
        .rpc('set_formulario_sequence_start', { start_number: startNumber });
      
      if (error) throw error;
      
      console.log('✅ Secuencia configurada:', data);
      return { success: true, message: data };
    } catch (error) {
      console.error('❌ Error configurando secuencia:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Auto-detectar y configurar desde el último número
  static async autoSetSequence() {
    try {
      const { data, error } = await supabaseStudentClient
        .rpc('auto_set_formulario_sequence');
      
      if (error) throw error;
      
      console.log('✅ Secuencia auto-configurada:', data);
      return { success: true, message: data };
    } catch (error) {
      console.error('❌ Error en auto-configuración:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Crear backup y resetear secuencia
  static async backupAndReset(backupSuffix = null) {
    try {
      const { data, error } = await supabaseStudentClient
        .rpc('backup_and_reset_formularios', { backup_suffix: backupSuffix });
      
      if (error) throw error;
      
      console.log('✅ Backup y reset completado:', data);
      return { success: true, data, message: data.message };
    } catch (error) {
      console.error('❌ Error en backup y reset:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Crear backup con metadatos
  static async createBackup(backupName, reason = null) {
    try {
      const { data, error } = await supabaseStudentClient
        .rpc('create_formulario_backup_enhanced', { 
          backup_name: backupName,
          backup_reason: reason
        });
      
      if (error) throw error;
      
      console.log('✅ Backup creado:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Listar backups disponibles
  static async listBackups() {
    try {
      const { data, error } = await supabaseStudentClient
        .from('v_backups_summary')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, backups: data };
    } catch (error) {
      console.error('❌ Error listando backups:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Generar próximo ID (para validación)
  static async getNextId() {
    try {
      const { data, error } = await supabaseStudentClient
        .rpc('get_next_formulario_id');
      
      if (error) throw error;
      
      return { success: true, nextId: data };
    } catch (error) {
      console.error('❌ Error obteniendo próximo ID:', error);
      return { success: false, error: error.message };
    }
  }
}
