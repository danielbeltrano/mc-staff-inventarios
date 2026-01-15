// containers/ProfesionalesContainer.js
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ProfesionalesService } from "../services/profesionalesService";
import ProfesionalesManagement from "../components/ProfesionalesManagement";

/**
 * Container que maneja la lógica de negocio y estado para la gestión de profesionales
 */
const ProfesionalesContainer = () => {
  const { user: currentUser, role } = useSelector((state) => state.auth);

  // Estados para datos
  const [profesionales, setProfesionales] = useState([]);
  const [personalMC, setPersonalMC] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfesional, setEditingProfesional] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stats, setStats] = useState({
    totalProfesionales: 0,
    activeProfesionales: 0,
    inactiveProfesionales: 0,
    profesionalesSinVinculo: 0,
    cargaCasosTotal: 0,
    disponiblesAsignacion: 0,
    categoriasDistribution: {}
  });

  // Estados para búsqueda y filtros
  const [searchValue, setSearchValue] = useState("");
  const [filterValues, setFilterValues] = useState({
    especialidad: "",
    categoria: "",
    estado: "",
    vinculo_personal: "",
    disponibilidad: "",
    nivel_atencion: "",
    carga_casos: "",
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Control de acceso
  if (role !== 'superadministrador') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carga todos los datos necesarios usando el servicio
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const result = await ProfesionalesService.loadAllData();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const { profesionales: profesionalesData, personalMC: personalData, categorias: categoriasData, stats: statsData } = result.data;
      
      setProfesionales(profesionalesData);
      setPersonalMC(personalData);
      setCategorias(categoriasData);
      setStats(statsData);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(`Error cargando datos: ${error.message}`, {
        autoClose: 5000,
      });
      setMessage({
        type: "error",
        text: "Error cargando datos: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtra los profesionales según los criterios de búsqueda y filtros
   */
  const filteredProfesionales = useMemo(() => {
    let filtered = [...profesionales];

    // Filtro de búsqueda
    if (searchValue && searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(
        (prof) =>
          prof.nombre?.toLowerCase().includes(searchLower) ||
          prof.especialidad?.toLowerCase().includes(searchLower) ||
          prof.correo?.toLowerCase().includes(searchLower)
      );
    }

    // Filtros específicos
    if (filterValues.categoria && filterValues.categoria.trim()) {
      filtered = filtered.filter((prof) => prof.categoria_id?.toString() === filterValues.categoria);
    }

    if (filterValues.estado && filterValues.estado.trim()) {
      const isActive = filterValues.estado === "true";
      filtered = filtered.filter((prof) => prof.activo === isActive);
    }

    if (filterValues.vinculo_personal && filterValues.vinculo_personal.trim()) {
      if (filterValues.vinculo_personal === "con_vinculo") {
        filtered = filtered.filter((prof) => prof.personal_mc_uuid);
      } else if (filterValues.vinculo_personal === "sin_vinculo") {
        filtered = filtered.filter((prof) => !prof.personal_mc_uuid);
      }
    }

    if (filterValues.disponibilidad && filterValues.disponibilidad.trim()) {
      const isAvailable = filterValues.disponibilidad === "true";
      filtered = filtered.filter((prof) => prof.disponible_asignacion === isAvailable);
    }

    if (filterValues.nivel_atencion && filterValues.nivel_atencion.trim()) {
      filtered = filtered.filter((prof) => 
        prof.grados_atencion?.includes(filterValues.nivel_atencion)
      );
    }

    if (filterValues.carga_casos && filterValues.carga_casos.trim()) {
      switch (filterValues.carga_casos) {
        case "sin_casos":
          filtered = filtered.filter((prof) => (prof.carga_casos_actual || 0) === 0);
          break;
        case "baja":
          filtered = filtered.filter((prof) => (prof.carga_casos_actual || 0) >= 1 && (prof.carga_casos_actual || 0) <= 10);
          break;
        case "media":
          filtered = filtered.filter((prof) => (prof.carga_casos_actual || 0) >= 11 && (prof.carga_casos_actual || 0) <= 25);
          break;
        case "alta":
          filtered = filtered.filter((prof) => (prof.carga_casos_actual || 0) >= 26 && (prof.carga_casos_actual || 0) <= 40);
          break;
        case "muy_alta":
          filtered = filtered.filter((prof) => (prof.carga_casos_actual || 0) > 40);
          break;
      }
    }

    return filtered;
  }, [profesionales, searchValue, filterValues]);

  /**
   * Datos paginados basados en los filtros aplicados
   */
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(filteredProfesionales.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProfesionales = filteredProfesionales.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedProfesionales
    };
  }, [filteredProfesionales, currentPage, itemsPerPage]);

  /**
   * Handlers para búsqueda y filtros
   */
  const handleSearchChange = (value) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleQuickFilterApply = (quickFilterData) => {
    setFilterValues((prev) => ({
      ...prev,
      ...quickFilterData,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterValues({
      especialidad: "",
      categoria: "",
      estado: "",
      vinculo_personal: "",
      disponibilidad: "",
      nivel_atencion: "",
      carga_casos: "",
    });
    setSearchValue("");
    setCurrentPage(1);
  };

  /**
   * Handlers para paginación
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  /**
   * Cambia el estado activo/inactivo de un profesional
   */
  const toggleProfesionalStatus = async (profesionalId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const profesional = profesionales.find(p => p.id === profesionalId);
      const profesionalName = profesional ? profesional.nombre : 'Profesional';
      
      // Toast de progreso
      const loadingMessage = `${newStatus ? "Activando" : "Desactivando"} profesional...`;
      const toastId = toast(loadingMessage, { 
        type: 'default',
        autoClose: false,
        closeButton: false
      });
      
      const result = await ProfesionalesService.toggleProfesionalStatus(profesionalId, newStatus);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Toast de éxito
      toast.dismiss(toastId);
      toast.success(`${profesionalName} ${newStatus ? "activado" : "desactivado"} correctamente`, {
        autoClose: 3000,
      });

      setMessage({ type: "", text: "" });
      loadData(); // Recargar datos

    } catch (error) {
      console.error("Error toggling profesional status:", error);
      
      toast.error(`Error cambiando estado del profesional: ${error.message}`, {
        autoClose: 5000,
      });

      setMessage({
        type: "error",
        text: "Error cambiando estado del profesional: " + error.message,
      });
    }
  };

  /**
   * Inicia la creación de un nuevo profesional
   */
  const handleCreateNew = () => {
    setCreatingNew(true);
    setEditingProfesional({
      id: null,
      nombre: "",
      especialidad: "",
      categoria_id: "",
      correo: "",
      personal_mc_uuid: "",
      grados_atencion: ["GENERAL"],
      carga_casos_maxima: 50,
      disponible_asignacion: true,
      activo: true,
      permiso_crear_cualquier_caso: false
    });
  };

  /**
   * Inicia la edición de un profesional existente
   */
  const handleEditProfesional = (profesional) => {
    setCreatingNew(false);
    setEditingProfesional({
      id: profesional.id,
      nombre: profesional.nombre || "",
      especialidad: profesional.especialidad || "",
      categoria_id: profesional.categoria_id || "",
      correo: profesional.correo || "",
      personal_mc_uuid: profesional.personal_mc_uuid || "",
      grados_atencion: profesional.grados_atencion || ["GENERAL"],
      carga_casos_maxima: profesional.carga_casos_maxima || 50,
      disponible_asignacion: profesional.disponible_asignacion !== undefined ? profesional.disponible_asignacion : true,
      activo: profesional.activo !== undefined ? profesional.activo : true,
      permiso_crear_cualquier_caso: profesional.permiso_crear_cualquier_caso || false
    });
  };

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleInputChange = (field, value) => {
    setEditingProfesional(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Maneja cambios en los niveles de atención
   */
  const handleNivelesAtencionChange = (nivel, isChecked) => {
    setEditingProfesional(prev => {
      let newNiveles = [...(prev.grados_atencion || [])];
      
      if (isChecked) {
        if (!newNiveles.includes(nivel)) {
          newNiveles.push(nivel);
        }
      } else {
        newNiveles = newNiveles.filter(n => n !== nivel);
      }
      
      return {
        ...prev,
        grados_atencion: newNiveles
      };
    });
  };

  /**
   * Guarda un profesional (crear o actualizar)
   */
  const saveProfesional = async () => {
    try {
      // Preparar y validar datos
      const profesionalData = ProfesionalesService.prepareProfesionalData(editingProfesional);
      const validation = ProfesionalesService.validateProfesionalData(profesionalData);
      
      if (!validation.isValid) {
        validation.errors.forEach(error => {
          toast.error(error, { autoClose: 3000 });
        });
        return;
      }

      // Toast de progreso
      const loadingMessage = creatingNew ? "Creando profesional..." : "Actualizando profesional...";
      const toastId = toast(loadingMessage, { 
        type: 'default',
        autoClose: false,
        closeButton: false
      });

      let result;
      if (creatingNew) {
        result = await ProfesionalesService.createProfesional(profesionalData);
      } else {
        result = await ProfesionalesService.updateProfesional(editingProfesional.id, profesionalData);
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      // Toast de éxito
      toast.dismiss(toastId);
      toast.success(`Profesional ${creatingNew ? "creado" : "actualizado"} correctamente`, {
        autoClose: 3000,
      });

      setMessage({ type: "", text: "" });
      loadData(); // Recargar datos
      setEditingProfesional(null);
      setCreatingNew(false);

    } catch (error) {
      console.error("Error saving profesional:", error);
      toast.error(`Error guardando profesional: ${error.message}`, { autoClose: 5000 });
      setMessage({
        type: "error",
        text: "Error guardando profesional: " + error.message,
      });
    }
  };

  /**
   * Cancela la edición/creación
   */
  const handleCancelEdit = () => {
    setEditingProfesional(null);
    setCreatingNew(false);
  };

  // Props para el componente de presentación
  const componentProps = {
    // Datos
    profesionales,
    personalMC,
    categorias,
    stats,
    loading,
    message,
    
    // Estados de UI
    editingProfesional,
    creatingNew,
    
    // Estados de búsqueda y filtros
    searchValue,
    filterValues,
    
    // Estados de paginación
    currentPage,
    itemsPerPage,
    
    // Datos procesados
    filteredProfesionales,
    paginatedData,
    
    // Handlers
    loadData,
    handleSearchChange,
    handleFilterChange,
    handleQuickFilterApply,
    handleClearFilters,
    handlePageChange,
    handleItemsPerPageChange,
    toggleProfesionalStatus,
    handleCreateNew,
    handleEditProfesional,
    handleInputChange,
    handleNivelesAtencionChange,
    saveProfesional,
    handleCancelEdit
  };

  return <ProfesionalesManagement {...componentProps} />;
};

export default ProfesionalesContainer;