import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { supabaseStudentClient } from "../../../../core/config/supabase/supabaseCampusStudentClient";
import {
  Shield,
  User,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Users,
  Filter,
  UserCheck,
  UserX,
  Power,
  PowerOff,
} from "lucide-react";
import UniversalSearchFilter from "../../../../components/ui/UniversalSearchFilter";
import Pagination from "../../../../components/ui/Pagination";
import { Card } from "../../../../components/ui/Cards";

const PermissionsManagement = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  // Estados para datos
  const [allUsers, setAllUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [hierarchyLevels, setHierarchyLevels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Estados para búsqueda y filtros
  const [searchValue, setSearchValue] = useState("");
  const [filterValues, setFilterValues] = useState({
    rol: "",
    nivel_jerarquico: "",
    estado_usuario: "",
    estado_permisos: "",
    servicio_acceso: "",
    fecha_desde: "",
    fecha_hasta: "",
  });

  // Debug para ver el estado de los filtros
  useEffect(() => {
    console.log('🎛️ Current filter values:', filterValues);
    console.log('🔍 Current search value:', searchValue);
  }, [filterValues, searchValue]);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar TODOS los usuarios (activos e inactivos)
      const { data: usersData, error: usersError } = await supabaseStudentClient
        .from("personal_mc")
        .select(`*`)
        .order("primer_apellido", { ascending: true });

      if (usersError) throw usersError;

      console.log('📊 Loaded users from DB:', usersData?.length || 0);

      // Cargar permisos
      const { data: permissionsData, error: permissionsError } =
        await supabaseStudentClient.from("accesos_usuario").select("*");

      if (permissionsError) {
        console.warn("Error loading permissions:", permissionsError);
      }

      console.log('🔐 Loaded permissions from DB:', permissionsData?.length || 0);

      // Combinar usuarios con permisos
      const usersWithPermissions = usersData.map((user) => {
        const userPermissions = permissionsData?.find(
          (p) => p.usuario_uuid === user.uuid
        );
        return {
          ...user,
          accesos_usuario: userPermissions ? [userPermissions] : [],
        };
      });

      console.log('🔗 Combined users with permissions:', usersWithPermissions.length);

      // Verificar que no hay usuarios duplicados
      const uniqueUsers = usersWithPermissions.filter((user, index, self) => 
        index === self.findIndex(u => u.uuid === user.uuid)
      );

      if (uniqueUsers.length !== usersWithPermissions.length) {
        console.warn('⚠️ Found duplicate users, removed:', usersWithPermissions.length - uniqueUsers.length);
      }

      // Cargar servicios
      const { data: servicesData, error: servicesError } =
        await supabaseStudentClient
          .from("servicios")
          .select("*")
          .eq("activo", true)
          .order("orden_visualizacion", { ascending: true });

      if (servicesError) throw servicesError;

      // Cargar niveles jerárquicos
      const { data: hierarchyData, error: hierarchyError } =
        await supabaseStudentClient
          .from("niveles_jerarquicos")
          .select("*")
          .order("nivel_prioridad", { ascending: true });

      if (hierarchyError) throw hierarchyError;

      // Cargar roles
      const { data: rolesData, error: rolesError } = await supabaseStudentClient
        .from("roles")
        .select("*")
        .order("nombre", { ascending: true });

      if (rolesError) throw rolesError;

      console.log('✅ Final data loaded:', {
        users: uniqueUsers.length,
        services: servicesData?.length || 0,
        hierarchyLevels: hierarchyData?.length || 0,
        roles: rolesData?.length || 0
      });

      setAllUsers(uniqueUsers || []);
      setServices(servicesData || []);
      setHierarchyLevels(hierarchyData || []);
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      
      // Toast de error para carga de datos
      toast.error(`❌ Error cargando datos del sistema: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setMessage({
        type: "error",
        text: "Error cargando datos: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Configuración de filtros mejorada
  const filters = [
    {
      key: "rol",
      type: "select",
      label: "Rol",
      options: roles.map((role) => ({
        value: role.nombre,
        label: role.descripcion || role.nombre,
      })),
      placeholder: "Todos los roles",
    },
    {
      key: "estado_usuario",
      type: "select",
      label: "Estado de Usuario",
      options: [
        { value: "activo", label: "Activo" },
        { value: "inactivo", label: "Inactivo" },
      ],
      placeholder: "Cualquier estado",
    },
    {
      key: "nivel_jerarquico",
      type: "select",
      label: "Nivel Jerárquico",
      options: hierarchyLevels.map((level) => ({
        value: level.nombre,
        label: level.descripcion,
      })),
      placeholder: "Todos los niveles",
    },
    {
      key: "estado_permisos",
      type: "select",
      label: "Estado de Permisos",
      options: [
        { value: "con_permisos", label: "Con permisos asignados" },
        { value: "sin_permisos", label: "Sin permisos asignados" },
        { value: "permisos_inactivos", label: "Permisos inactivos" },
      ],
      placeholder: "Cualquier estado",
    },
    {
      key: "servicio_acceso",
      type: "select",
      label: "Acceso a Servicio",
      options: services.map((service) => ({
        value: service.clave_servicio,
        label: service.nombre_servicio,
      })),
      placeholder: "Cualquier servicio",
    },
    {
      key: "fecha_desde",
      type: "date",
      label: "Creado desde",
    },
    {
      key: "fecha_hasta",
      type: "date",
      label: "Creado hasta",
    },
  ];

  // Filtros rápidos mejorados
  const quickFilters = [
    {
      label: "Usuarios Inactivos",
      filters: { estado_usuario: "inactivo" },
    },
    {
      label: "Activos sin permisos",
      filters: { estado_usuario: "activo", estado_permisos: "sin_permisos" },
    },
    {
      label: "Superadministradores",
      filters: { rol: "superadministrador" },
    },
    {
      label: "Nivel Estratégico",
      filters: { nivel_jerarquico: "estrategico" },
    },
    {
      label: "Con acceso a Bienestar",
      filters: { servicio_acceso: "bienestar" },
    },
    {
      label: "Directores de Grupo",
      filters: { rol: "director_grupo" },
    },
  ];

  // Lógica de filtrado mejorada
  const filteredUsers = useMemo(() => {
    let filtered = [...allUsers];

    console.log('🔍 Starting filter with:', filtered.length, 'users');
    console.log('🎛️ Applied filters:', {
      searchValue: searchValue || 'none',
      rol: filterValues.rol || 'none',
      estado_usuario: filterValues.estado_usuario || 'none',
      nivel_jerarquico: filterValues.nivel_jerarquico || 'none',
      estado_permisos: filterValues.estado_permisos || 'none',
      servicio_acceso: filterValues.servicio_acceso || 'none',
      fecha_desde: filterValues.fecha_desde || 'none',
      fecha_hasta: filterValues.fecha_hasta || 'none'
    });

    // Filtro de búsqueda
    if (searchValue && searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (user) =>
          user.primer_nombre?.toLowerCase().includes(searchLower) ||
          user.primer_apellido?.toLowerCase().includes(searchLower) ||
          user.correo_institucional?.toLowerCase().includes(searchLower) ||
          `${user.primer_nombre} ${user.primer_apellido}`
            .toLowerCase()
            .includes(searchLower)
      );
      console.log(`🔍 After search filter (${searchValue}):`, filtered.length, 'users (removed', beforeSearch - filtered.length, ')');
    }

    // Filtros específicos
    if (filterValues.rol && filterValues.rol.trim()) {
      const beforeRol = filtered.length;
      filtered = filtered.filter((user) => user.rol === filterValues.rol);
      console.log(`🔍 After rol filter (${filterValues.rol}):`, filtered.length, 'users (removed', beforeRol - filtered.length, ')');
    }

    if (filterValues.estado_usuario && filterValues.estado_usuario.trim()) {
      const beforeEstado = filtered.length;
      filtered = filtered.filter((user) => user.estado === filterValues.estado_usuario);
      console.log(`🔍 After estado_usuario filter (${filterValues.estado_usuario}):`, filtered.length, 'users (removed', beforeEstado - filtered.length, ')');
    }

    if (filterValues.nivel_jerarquico && filterValues.nivel_jerarquico.trim()) {
      const beforeNivel = filtered.length;
      filtered = filtered.filter(
        (user) =>
          user.accesos_usuario?.[0]?.nivel_jerarquico ===
          filterValues.nivel_jerarquico
      );
      console.log(`🔍 After nivel_jerarquico filter (${filterValues.nivel_jerarquico}):`, filtered.length, 'users (removed', beforeNivel - filtered.length, ')');
    }

    if (filterValues.estado_permisos && filterValues.estado_permisos.trim()) {
      const beforePermisos = filtered.length;
      switch (filterValues.estado_permisos) {
        case "con_permisos":
          filtered = filtered.filter(
            (user) =>
              user.accesos_usuario?.length > 0 && user.accesos_usuario[0].activo
          );
          break;
        case "sin_permisos":
          filtered = filtered.filter(
            (user) => !user.accesos_usuario?.length || !user.accesos_usuario[0]
          );
          break;
        case "permisos_inactivos":
          filtered = filtered.filter(
            (user) =>
              user.accesos_usuario?.length > 0 &&
              !user.accesos_usuario[0].activo
          );
          break;
      }
      console.log(`🔍 After estado_permisos filter (${filterValues.estado_permisos}):`, filtered.length, 'users (removed', beforePermisos - filtered.length, ')');
    }

    if (filterValues.servicio_acceso && filterValues.servicio_acceso.trim()) {
      const beforeServicio = filtered.length;
      filtered = filtered.filter(
        (user) =>
          user.accesos_usuario?.[0]?.[filterValues.servicio_acceso] === true
      );
      console.log(`🔍 After servicio_acceso filter (${filterValues.servicio_acceso}):`, filtered.length, 'users (removed', beforeServicio - filtered.length, ')');
    }

    if (filterValues.fecha_desde && filterValues.fecha_desde.trim()) {
      const beforeFechaDesde = filtered.length;
      filtered = filtered.filter(
        (user) =>
          new Date(user.created_at) >= new Date(filterValues.fecha_desde)
      );
      console.log(`🔍 After fecha_desde filter (${filterValues.fecha_desde}):`, filtered.length, 'users (removed', beforeFechaDesde - filtered.length, ')');
    }

    if (filterValues.fecha_hasta && filterValues.fecha_hasta.trim()) {
      const beforeFechaHasta = filtered.length;
      filtered = filtered.filter(
        (user) =>
          new Date(user.created_at) <= new Date(filterValues.fecha_hasta)
      );
      console.log(`🔍 After fecha_hasta filter (${filterValues.fecha_hasta}):`, filtered.length, 'users (removed', beforeFechaHasta - filtered.length, ')');
    }

    // Eliminar duplicados por UUID (por si acaso)
    const uniqueFiltered = filtered.filter((user, index, self) => 
      index === self.findIndex(u => u.uuid === user.uuid)
    );

    if (uniqueFiltered.length !== filtered.length) {
      console.log('⚠️ Removed duplicate users:', filtered.length - uniqueFiltered.length);
    }

    console.log('✅ Final filtered users:', uniqueFiltered.length, 'users');
    return uniqueFiltered;
  }, [allUsers, searchValue, filterValues]);

  // Lógica de paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Debug para revisar paginación
  console.log('📄 Pagination Debug:', {
    totalUsers: filteredUsers.length,
    itemsPerPage,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedUsersLength: paginatedUsers.length,
    paginatedUsers: paginatedUsers.map(u => ({ uuid: u.uuid, name: `${u.primer_nombre} ${u.primer_apellido}` }))
  });

  // Handlers existentes
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
      rol: "",
      nivel_jerarquico: "",
      estado_usuario: "",
      estado_permisos: "",
      servicio_acceso: "",
      fecha_desde: "",
      fecha_hasta: "",
    });
    setSearchValue("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Nuevo handler para activar/desactivar usuario con toast
  const toggleUserStatus = async (userUuid, currentStatus) => {
    try {
      const newStatus = currentStatus === "activo" ? "inactivo" : "activo";
      const user = allUsers.find(u => u.uuid === userUuid);
      const userName = user ? `${user.primer_nombre} ${user.primer_apellido}` : 'Usuario';
      
      // Toast de progreso
      const toastId = toast.loading(
        `${newStatus === "activo" ? "Activando" : "Desactivando"} usuario...`
      );
      
      const { error } = await supabaseStudentClient
        .from("personal_mc")
        .update({ 
          estado: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("uuid", userUuid);

      if (error) throw error;

      // Toast de éxito
      toast.update(toastId, {
        render: `${userName} ${newStatus === "activo" ? "activado" : "desactivado"} correctamente`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Limpiar mensaje anterior si existe
      setMessage({ type: "", text: "" });
      
      loadData(); // Recargar datos
    } catch (error) {
      console.error("Error toggling user status:", error);
      
      // Toast de error
      toast.error(`❌ Error cambiando estado del usuario: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setMessage({
        type: "error",
        text: "Error cambiando estado del usuario: " + error.message,
      });
    }
  };

  const savePermissions = async (userUuid, permissions) => {
    try {
      // Verificar que el usuario esté activo antes de asignar permisos
      const userToUpdate = allUsers.find(u => u.uuid === userUuid);
      if (!userToUpdate) {
        throw new Error('Usuario no encontrado');
      }

      const userName = `${userToUpdate.primer_nombre} ${userToUpdate.primer_apellido}`;

      if (userToUpdate.estado !== 'activo') {
        toast.error('❌ No se pueden asignar permisos a usuarios inactivos', {
          position: "top-right",
          autoClose: 4000,
        });
        throw new Error('No se pueden asignar permisos a usuarios inactivos');
      }

      // Verificar si ya existe un registro en accesos_usuario
      const existingPermissions = userToUpdate.accesos_usuario?.[0];
      const isNewAssignment = !existingPermissions;
      
      // Toast de progreso
      const toastId = toast.loading(
        isNewAssignment 
          ? `Asignando permisos a ${userName}...`
          : `Actualizando permisos de ${userName}...`
      );
      
      //   const permissionData = {
    //     usuario_uuid: userUuid,
    //     ...permissions,
    //     otorgado_por: currentUser.uuid,
    //     otorgado_en: existingPermissions?.otorgado_en || new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //   }

      const { error } = await supabaseStudentClient
        .from("accesos_usuario")
        .upsert({
        usuario_uuid: userUuid,
        ...permissions,
        otorgado_por: currentUser.uuid,
        otorgado_en: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'usuario_uuid' // Especifica la columna de conflicto
      });

      if (error) throw error;

      // Contar servicios activos
      const activeServices = Object.entries(permissions)
        .filter(([key, value]) => 
          key !== 'nivel_jerarquico' && 
          key !== 'activo' && 
          key !== 'notas' && 
          value === true
        ).length;

      // Toast de éxito personalizado
      const successMessage = isNewAssignment
        ? `Permisos asignados a ${userName}\n🔐 ${activeServices} servicio${activeServices !== 1 ? 's' : ''} habilitado${activeServices !== 1 ? 's' : ''}\n📊 Nivel: ${permissions.nivel_jerarquico}`
        : `Permisos de ${userName} actualizados\n🔐 ${activeServices} servicio${activeServices !== 1 ? 's' : ''} activo${activeServices !== 1 ? 's' : ''}\n📊 Nivel: ${permissions.nivel_jerarquico}`;

      toast.update(toastId, {
        render: successMessage,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Limpiar mensaje anterior
      setMessage({ type: "", text: "" });
      
      loadData();
      setEditingUser(null);
    } catch (error) {
      console.error("Error saving permissions:", error);
      
      // Toast de error
      toast.error(`❌ Error guardando permisos: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setMessage({
        type: "error",
        text: "Error guardando permisos: " + error.message,
      });
    }
  };

  const handleEditUser = (user) => {
    // Verificar que el usuario esté activo antes de permitir edición
    if (user.estado !== 'activo') {
      toast.warning(`⚠️ ${user.primer_nombre} ${user.primer_apellido} está inactivo\nDebe activar el usuario antes de asignar permisos`, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setMessage({
        type: "error",
        text: "Solo se pueden editar permisos de usuarios activos",
      });
      return;
    }

    const existingPermissions = user.accesos_usuario?.[0] || {};

    setEditingUser({
      uuid: user.uuid,
      name: `${user.primer_nombre} ${user.primer_apellido}`,
      email: user.correo_institucional,
      userStatus: user.estado,
      isNewPermission: !user.accesos_usuario?.[0], // Nuevo campo para saber si es primera asignación
      permissions: {
        bienestar: existingPermissions.bienestar || false,
        admisiones: existingPermissions.admisiones || false,
        matriculas: existingPermissions.matriculas || false,
        academico: existingPermissions.academico || false,
        recursos_humanos: existingPermissions.recursos_humanos || false,
        financiero: existingPermissions.financiero || false,
        administrador: existingPermissions.administrador || false,
        nivel_jerarquico: existingPermissions.nivel_jerarquico || "operativo",
        activo:
          existingPermissions.activo !== undefined
            ? existingPermissions.activo
            : true,
        notas: existingPermissions.notas || "",
      },
    });
  };

  const handlePermissionChange = (service, value) => {
    setEditingUser((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [service]: value,
      },
    }));
  };

  const getUserPermissionsSummary = (user) => {
    const permissions = user.accesos_usuario?.[0];
    if (!permissions) return { count: 0, services: [] };

    const activeServices = services.filter(
      (service) => permissions[service.clave_servicio] === true
    );

    return {
      count: activeServices.length,
      services: activeServices.map((s) => s.nombre_servicio),
    };
  };

  const getPermissionStatusBadge = (user) => {
    const permissions = user.accesos_usuario?.[0];

    if (!permissions) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Sin permisos
        </span>
      );
    }

    if (!permissions.activo) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Inactivo
        </span>
      );
    }

    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Activo
      </span>
    );
  };

  const getUserStatusBadge = (user) => {
    if (user.estado === "activo") {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <UserCheck className="h-3 w-3 mr-1" />
          Activo
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <UserX className="h-3 w-3 mr-1" />
          Inactivo
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-default"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-6 w-6 text-amber-default" />
          <h1 className="text-3xl font-bold text-blue-default">
            Gestión de Usuarios y Permisos
          </h1>
        </div>
        <p className="text-neutral-text">
          Administra el estado de los usuarios y sus permisos de acceso a servicios
        </p>
      </div>

      {/* Mensajes */}
      {message.text && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          {message.text}
        </div>
      )}

      {/* Buscador y Filtros */}
      <UniversalSearchFilter
        title="Buscar y Filtrar Usuarios"
        searchPlaceholder="Buscar por nombre, apellido o correo..."
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        quickFilters={quickFilters}
        onQuickFilterApply={handleQuickFilterApply}
        onClearFilters={handleClearFilters}
        showSearchButton={false}
        showApplyButton={false}
        collapsible={true}
        isCollapsed={false}
      />

      {/* Indicadores de filtros activos */}
      {(searchValue || Object.values(filterValues).some(value => value)) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Filtros activos:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchValue && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Búsqueda: "{searchValue}"
                <button 
                  onClick={() => setSearchValue("")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {Object.entries(filterValues).map(([key, value]) => 
              value && (
                <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {filters.find(f => f.key === key)?.label}: {value}
                  <button 
                    onClick={() => handleFilterChange(key, "")}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )
            )}
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
            >
              Limpiar todos
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas de resultados */}
      <Card className="flex justify-between items-center bg-white p-4 rounded-lg border border-amber-default my-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-text">
            Mostrando {paginatedUsers.length} de {filteredUsers.length} usuarios
            {startIndex > 0 && (
              <span className="text-xs text-gray-500">
                {' '}(desde {startIndex + 1} hasta {Math.min(endIndex, filteredUsers.length)})
              </span>
            )}
          </span>
          {filteredUsers.length !== allUsers.length && (
            <span className="text-xs text-blue-default bg-blue-50 px-2 py-1 rounded">
              {allUsers.length - filteredUsers.length} filtrados de {allUsers.length} total
            </span>
          )}
          
          {/* Botón para mostrar todos */}
          {filteredUsers.length !== allUsers.length && (
            <button
              onClick={handleClearFilters}
              className="text-xs bg-amber-default text-white px-3 py-1 rounded hover:bg-amber-600 transition-colors"
            >
              Mostrar todos ({allUsers.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-text">Mostrar:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="border border-amber-default rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-default focus:border-transparent"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-neutral-text">por página</span>
        </div>
      </Card>

      {/* Lista de usuarios */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-amber-default">
        <div className="px-6 py-4 flex gap-2 items-center border-b border-amber-default">
          <Filter className="h-5 w-5 text-amber-default" />
          <h2 className="text-lg font-semibold text-blue-default flex items-center gap-2">
            Usuarios del Sistema
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                  Estado Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                  Estado Permisos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                  Servicios Activos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                  Nivel Jerárquico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-default uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  if (!user.uuid) {
                    console.warn("Usuario sin UUID:", user);
                    return null;
                  }

                  const permissionsSummary = getUserPermissionsSummary(user);
                  const userPermissions = user.accesos_usuario?.[0];

                  return (
                    <tr
                      key={`user-${user.uuid}`}
                      className={`hover:bg-blue-50 transition-colors ${
                        user.estado === 'inactivo' ? 'bg-gray-50 opacity-75' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              user.estado === 'activo' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <User className={`h-5 w-5 ${
                                user.estado === 'activo' ? 'text-blue-default' : 'text-gray-400'
                              }`} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-text">
                              {user.primer_nombre} {user.primer_apellido}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.correo_institucional}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUserStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-default">
                          {user.rol || "Sin rol"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPermissionStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield
                            className={`h-4 w-4 mr-2 ${
                              permissionsSummary.count > 0
                                ? "text-green-500"
                                : "text-gray-400"
                            }`}
                          />
                          <span className="text-sm text-neutral-text">
                            {permissionsSummary.count} servicios
                          </span>
                        </div>
                        {permissionsSummary.services.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {permissionsSummary.services.slice(0, 2).join(", ")}
                            {permissionsSummary.services.length > 2 && "..."}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userPermissions?.nivel_jerarquico === "estrategico"
                              ? "bg-purple-100 text-purple-800"
                              : userPermissions?.nivel_jerarquico === "tactico"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {userPermissions?.nivel_jerarquico || "Sin nivel"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {/* Botón Activar/Desactivar Usuario */}
                          <button
                            onClick={() => toggleUserStatus(user.uuid, user.estado)}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                              user.estado === 'activo'
                                ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}
                            title={user.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {user.estado === 'activo' ? (
                              <PowerOff size={16} />
                            ) : (
                              <Power size={16} />
                            )}
                            {user.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </button>
                          
                          {/* Separador */}
                          <span className="text-gray-300">|</span>
                          
                          {/* Botón Editar Permisos */}
                          <button
                            onClick={() => handleEditUser(user)}
                            className={`flex items-center gap-1 transition-colors ${
                              user.estado === 'inactivo' 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-blue-default hover:text-blue-hover'
                            }`}
                            disabled={user.estado === 'inactivo'}
                            title={
                              user.estado === 'inactivo' 
                                ? 'Active el usuario para editar permisos' 
                                : user.accesos_usuario?.[0]
                                  ? 'Editar permisos existentes'
                                  : 'Asignar permisos por primera vez'
                            }
                          >
                            <Edit size={16} />
                            {user.accesos_usuario?.[0] ? 'Editar' : 'Asignar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr key="no-users">
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-gray-300" />
                      <p>
                        No se encontraron usuarios con los filtros aplicados
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="text-blue-default hover:text-blue-hover text-sm"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-amber-default">
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              className="justify-center"
            />
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-amber-default">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-blue-default">
                  {editingUser.isNewPermission ? 'Asignar Permisos' : 'Editar Permisos'} - {editingUser.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Estado del usuario: {editingUser.userStatus === 'activo' ? (
                    <span className="text-green-600 font-medium">Activo</span>
                  ) : (
                    <span className="text-red-600 font-medium">Inactivo</span>
                  )}
                  {editingUser.isNewPermission && (
                    <span className="ml-2 text-blue-600 font-medium">• Primera asignación de permisos</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {editingUser.isNewPermission && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    Nueva Asignación de Permisos
                  </span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Este usuario no tiene permisos asignados. Al guardar, se creará un nuevo registro de permisos para este usuario.
                </p>
              </div>
            )}

            {editingUser.userStatus === 'inactivo' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    Usuario Inactivo
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Este usuario está inactivo. Los cambios de permisos se guardarán pero no tendrán efecto hasta que el usuario sea activado.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* Nivel Jerárquico */}
              <div>
                <label className="block text-sm font-medium text-blue-default mb-2">
                  Nivel Jerárquico
                </label>
                <select
                  value={editingUser.permissions.nivel_jerarquico}
                  onChange={(e) =>
                    handlePermissionChange("nivel_jerarquico", e.target.value)
                  }
                  className="w-full border border-amber-default rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-default focus:border-transparent"
                >
                  {hierarchyLevels.map((level) => (
                    <option key={`level-${level.nombre}`} value={level.nombre}>
                      {level.nombre} - {level.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permisos por servicio */}
              <div>
                <label className="block text-sm font-medium text-blue-default mb-4">
                  Permisos de Servicios
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div
                      key={`service-${service.clave_servicio}`}
                      className="flex items-center justify-between p-3 border border-amber-default rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-neutral-text">
                          {service.nombre_servicio}
                        </div>
                        <div className="text-sm text-gray-500">
                          Requiere: {service.nivel_minimo_requerido}
                        </div>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            editingUser.permissions[service.clave_servicio] ||
                            false
                          }
                          onChange={(e) =>
                            handlePermissionChange(
                              service.clave_servicio,
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-default focus:ring-blue-default border-amber-default rounded"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-blue-default mb-2">
                  Notas
                </label>
                <textarea
                  value={editingUser.permissions.notas || ""}
                  onChange={(e) =>
                    handlePermissionChange("notas", e.target.value)
                  }
                  rows={3}
                  className="w-full border border-amber-default rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-default focus:border-transparent"
                  placeholder="Notas sobre los permisos otorgados..."
                />
              </div>

              {/* Estado activo de permisos */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={editingUser.permissions.activo}
                  onChange={(e) =>
                    handlePermissionChange("activo", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-default focus:ring-blue-default border-amber-default rounded"
                />
                <label htmlFor="activo" className="text-sm text-neutral-text">
                  Permisos activos
                </label>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-amber-default">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-neutral-text bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  savePermissions(editingUser.uuid, editingUser.permissions)
                }
                className="px-4 py-2 bg-blue-default text-white rounded-md hover:bg-blue-hover flex items-center gap-2 transition-colors"
              >
                <Save size={16} />
                {editingUser.isNewPermission ? 'Asignar Permisos' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManagement;