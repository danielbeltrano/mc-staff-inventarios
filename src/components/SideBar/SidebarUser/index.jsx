// import React, { useEffect, useState, useContext } from "react";
// import { useSelector } from "react-redux";
// import { fetchUsuarioByEmail } from "../../../core/config/supabase/supabaseFetchFunctions";
// import LoadingSpinner from "../../LoadingSpinner";
// import { ThemeContext } from "../index.jsx"; // Importamos el ThemeContext

// const SidebarUser = ({ expanded }) => {
//   const { isDarkMode } = useContext(ThemeContext); // Obtenemos el estado del tema del contexto
//   const { user } = useSelector((state) => state.auth); // Obtener el usuario desde Redux
//   const [userRol, setUserRol] = useState(null); // Estado para almacenar los detalles del usuario desde personal_mc
//   const [userData, setUserData] = useState(null); // Estado para almacenar los detalles del usuario desde personal_mc
//   const [loading, setLoading] = useState(true); // Estado para indicar que está cargando
//   const [error, setError] = useState(null); // Estado para manejar errores

//   const RenameUserRol = () => {
//     if (!user || !user.role) {
//       return ""; // O puedes devolver 'Invitado' o cualquier otro valor por defecto
//     } else if (user.role === "director_grupo") {
//       setUserRol("Director de Grupo");
//     } else if (user.role === "jefe_nivel") {
//       setUserRol("Jefe de Nivel");
//     } else if (user.role === "profesional_bienestar") {
//       setUserRol("Profesional bienestar");
//     } else if (user.role === "coordinador_general") {
//       setUserRol("Coordinador General");
//     } else if (user.role === "directivo") {
//       setUserRol("Director de Grupo");
//     } else if (user.role === "superadministrador") {
//       setUserRol("Superadministrador");
//     }

//     if (!user) {
//       return null; // O algún componente alternativo
//     }

//     return userRol;
//   };

//   // Obtener los detalles del usuario al cargar el componente
//   useEffect(() => {
//     const fetchUserDetails = async () => {
//       try {
//         if (user && user.email) {
//           const data = await fetchUsuarioByEmail(user.email); // Obtener los detalles del usuario por correo
//           setUserData(data);
//         }
//       } catch (error) {
//         setError("Error al cargar los detalles del usuario");
//       } finally {
//         setLoading(false);
//       }
//     };

//     RenameUserRol();
//     fetchUserDetails();
//   }, [user]);

//   // Mostrar un loader mientras se cargan los datos del usuario
//   if (loading) {
//     return <LoadingSpinner />; // Puedes cambiar este mensaje por un spinner o similar
//   }

//   // Mostrar un mensaje de error si ocurre un problema al cargar los datos
//   if (error) {
//     return <div className={isDarkMode ? "text-red-400" : "text-red-500"}>{error}</div>;
//   }

//   return (
//     <div className="flex w-full my-8">
//       {!expanded ? (
//         <div className={`
//           flex items-center p-3 text-xl font-semibold 
//           ${isDarkMode 
//             ? "border-2 border-white text-white bg-amber-default" 
//             : "border-2 border-blue-default text-blue-default bg-amber-default"
//           } 
//           rounded-md
//         `}>
//           {/* Mostrar las iniciales del nombre y apellido */}
//           {userData?.primer_nombre && userData?.primer_apellido
//             ? userData.primer_nombre.charAt(0) +
//               userData.primer_apellido.charAt(0)
//             : "U"}
//         </div>
//       ) : (
//         <div
//           className={`
//           flex justify-between w-auto items-center
//           overflow-hidden transition-all ${expanded ? "w-52 " : "w-0"}
//         `}
//         >
//           <div
//             className={`flex flex-col leading-4 overflow-hidden transition-all`}
//           >
//             {userData && (
//               <>
//                 {/* Mostrar el nombre completo */}
//                 <h4 className={`font-semibold text-xl ${isDarkMode ? "text-white" : "text-gray-800"}`}>
//                   {`${userData.primer_nombre} ${userData.primer_apellido}`}
//                 </h4>
//                 {/* Mostrar el correo */}
//                 <span className={`text-xs ${isDarkMode ? "text-white" : "text-gray-600"}`}>
//                   {userData.correo_institucional}
//                 </span>
//                 {/* Mostrar el rol */}
//                 <span className={`italic text-xs ${isDarkMode ? "text-white" : "text-gray-500"}`}>
//                   Rol: {userRol}
//                 </span>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SidebarUser;


import React, { useEffect, useState, useContext } from "react";
import { useSelector } from "react-redux";
import LoadingSpinner from "../../LoadingSpinner";
import { ThemeContext } from "../index.jsx";
import usePermissions from "../../../hooks/usePermissions";
import { Shield, AlertTriangle } from "lucide-react";
import { use } from "react";

const SidebarUser = ({ expanded }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { user } = useSelector((state) => state.auth);
  const [userRol, setUserRol] = useState(null);
  
  // console.log("user from SidebarUser", user);
  // console.log("userRol from SidebarUser", userRol);
  // Usar el hook de permisos para obtener información del usuario
  const { 
    permissions, 
    isReady: permissionsReady, 
    status: permissionsStatus,
    accessibleServices,
    stats
  } = usePermissions();

  const RenameUserRol = () => {
    if (!user || !user.role) {
      return "";
    }
    
    const roleNames = {
      "director_grupo": "Director de Grupo",
      "jefe_nivel": "Jefe de Nivel",
      "profesional_bienestar": "Profesional bienestar",
      "coordinador_general": "Coordinador General",
      "directivo": "Director de Grupo",
      "superadministrador": "Superadministrador",
      "admin_bienestar": "Admin Bienestar",
      "asistente_bienestar": "Asistente Bienestar",
      "coordinador_rrhh": "Coordinador RRHH",
      "coordinador_financiero": "Coordinador Financiero",
      "coordinador_academico": "Coordinador Académico",
      "profesor": "Profesor"
    };

    setUserRol(roleNames[user.role] || user.role);
    return roleNames[user.role] || user.role;
  };

  useEffect(() => {
    RenameUserRol();
  }, [user]);

  // Mostrar un loader mientras se cargan los datos del usuario
  if (permissionsStatus === 'loading' || !permissionsReady) {
    return (
      <div className="flex justify-center items-center p-3">
        <LoadingSpinner size="small" />
      </div>
    );
  }

  // Información del usuario desde los permisos o fallback al usuario de auth
  const userData = permissions.userInfo || {
    nombre: user?.email?.split('@')[0] || 'Usuario',
    correo: user?.email || '',
    primer_nombre: user?.email?.split('@')[0] || 'Usuario',
    primer_apellido: ''
  };

  // Obtener iniciales
  const getInitials = () => {
    if (userData.primer_nombre && userData.primer_apellido) {
      return userData.primer_nombre.charAt(0) + userData.primer_apellido.charAt(0);
    } else if (userData.nombre) {
      const nameParts = userData.nombre.split(' ');
      return nameParts.length > 1 
        ? nameParts[0].charAt(0) + nameParts[1].charAt(0)
        : nameParts[0].charAt(0) + nameParts[0].charAt(1);
    }
    return "U";
  };

  // Mostrar estado de permisos
  const getPermissionsStatus = () => {
    if (permissionsStatus === 'failed') {
      return {
        icon: <AlertTriangle size={12} />,
        text: "Sin permisos",
        color: isDarkMode ? "text-red-400" : "text-red-500"
      };
    }
    
    if (permissions.hasPermissions && stats.accessibleServices > 0) {
      return {
        icon: <Shield size={12} />,
        text: `${stats.accessibleServices} servicios`,
        color: isDarkMode ? "text-green-400" : "text-green-600"
      };
    }
    
    return {
      icon: <AlertTriangle size={12} />,
      text: "Sin accesos",
      color: isDarkMode ? "text-yellow-400" : "text-yellow-600"
    };
  };

  const permissionsStatus_display = getPermissionsStatus();

  return (
    <div className="flex w-full my-4">
      {!expanded ? (
        <div className={`
          flex items-center justify-center p-3 text-xl font-semibold 
          ${isDarkMode 
            ? "border-2 border-white text-white bg-amber-default" 
            : "border-2 border-blue-default text-blue-default bg-amber-default"
          } 
          rounded-md relative
        `}>
          {/* Mostrar las iniciales */}
          {getInitials()}
          
          {/* Indicador de estado de permisos */}
          <div className={`
            absolute -top-1 -right-1 p-1 rounded-full
            ${permissionsStatus_display.color}
            ${isDarkMode ? "bg-blue-default" : "bg-white"}
            border border-current
          `}>
            {permissionsStatus_display.icon}
          </div>
        </div>
      ) : (
        <div
          className={`
          flex justify-between w-auto items-center
          overflow-hidden transition-all ${expanded ? "w-52" : "w-0"}
        `}
        >
          <div
            className={`flex flex-col leading-4 overflow-hidden transition-all`}
          >
            {userData && (
              <>
                {/* Mostrar el nombre completo */}
                <h4 className={`font-semibold text-xl ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {userData.nombre || `${userData.primer_nombre} ${userData.primer_apellido}`.trim()}
                </h4>
                
                {/* Mostrar el correo */}
                <span className={`text-xs ${isDarkMode ? "text-white" : "text-gray-600"}`}>
                  {userData.correo}
                </span>
                
                {/* Mostrar el rol */}
                <span className={`italic text-xs ${isDarkMode ? "text-white" : "text-gray-500"}`}>
                  Rol: {userRol}
                </span>
                
                {/* Mostrar nivel jerárquico si está disponible */}
                {(permissions.hierarchyLevel && user.role === 'superadministrador') && (
                  <span className={`text-xs ${isDarkMode ? "text-amber-300" : "text-amber-600"}`}>
                    Nivel: {permissions.hierarchyLevel}
                  </span>
                )}
                
                {/* Mostrar estado de permisos */}
                <div className={`flex items-center gap-1 mt-1 ${permissionsStatus_display.color}`}>
                  {permissionsStatus_display.icon}
                  <span className="text-xs">
                    {permissionsStatus_display.text}
                  </span>
                </div>
                
                {/* Mostrar servicios accesibles en modo debug */}
                {/* {process.env.NODE_ENV === 'development' && accessibleServices.length > 0 && (
                  <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Acceso: {accessibleServices.slice(0, 2).join(", ")}
                    {accessibleServices.length > 2 && "..."}
                  </div>
                )} */}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarUser;