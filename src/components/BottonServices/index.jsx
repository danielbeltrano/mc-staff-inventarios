import React from 'react';
import { User, File, RefreshCw, CheckCheck } from "lucide-react";
import Tooltip from "../../../../components/ui/Tooltip";
import TablaEstudiantes from './TablaEstudiantes';

const BottonServices = () => {
  // Definición de columnas base
  const columnasBase = [
    { id: 'codigo', label: 'Código' },
    { id: 'foto', label: 'Foto' },
    { id: 'nombre', label: 'Nombre Completo' },
    { id: 'grado', label: 'Grado' },
    { id: 'curso', label: 'Curso' },
    { id: 'padre', label: 'Padre' },
    { id: 'madre', label: 'Madre' },
    { id: 'tipoEstudiante', label: 'Tipo de Estudiante' },
    { id: 'estadoFormulario', label: 'Estado Formulario' },
    { id: 'formularioEnviado', label: 'Formulario Enviado' },
    { id: 'acciones', label: 'Acciones' },
    { id: 'aprobado', label: 'Aprobado' }
  ];

  // Ejemplo para un administrador
  const renderBotonesAdmin = (estudiante) => (
    <>
      <Tooltip text="Ver Detalles del Estudiante">
        <button
          onClick={() => handleVerDetalles(estudiante)}
          className="bg-orange-500 text-white p-2 rounded-full"
        >
          <User size={20} />
        </button>
      </Tooltip>
      <Tooltip text="Ver Documentos Matrícula">
        <button
          onClick={() => handleVerDocumentos(estudiante)}
          className="bg-amber-400 text-white p-2 rounded-full"
        >
          <File size={20} />
        </button>
      </Tooltip>
      {/* ... otros botones específicos del admin ... */}
    </>
  );

  // Ejemplo para un profesor
  const renderBotonesProfesor = (estudiante) => (
    <>
      <Tooltip text="Ver Detalles del Estudiante">
        <button
          onClick={() => handleVerDetalles(estudiante)}
          className="bg-orange-500 text-white p-2 rounded-full"
        >
          <User size={20} />
        </button>
      </Tooltip>
      {/* ... botones específicos del profesor ... */}
    </>
  );

  return (
    <div>
      {userRole === 'admin' && (
        <TablaEstudiantes
          estudiantes={estudiantes}
          renderButtons={renderBotonesAdmin}
          columnas={columnasBase}
          loadingAprobacion={loadingAprobacion}
        />
      )}
      
      {userRole === 'profesor' && (
        <TablaEstudiantes
          estudiantes={estudiantes}
          renderButtons={renderBotonesProfesor}
          columnas={columnasBase.filter(col => col.id !== 'acciones_admin')}
          loadingAprobacion={loadingAprobacion}
        />
      )}
    </div>
  );
};

export default BottonServices;