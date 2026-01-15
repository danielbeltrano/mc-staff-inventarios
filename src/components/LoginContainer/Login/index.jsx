// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { loginUser } from "../../../redux/slices/authSlice";
// import { fetchUsuarioByEmail } from "../../../core/config/supabase/supabaseFetchFunctions";
// import InputForm from "../../ui/InputForm";
// import Button2 from "../../ui/Button2";
// import PasswordInput from "../../ui/PasswordInput";
// import { Mail, CheckCircle, KeyRound } from "lucide-react";
// import { Link, useNavigate } from "react-router-dom";

// const validateEmailWithDomain = (email) => {
//   const re = /^[^\s@]+@gimnasiomariecurie\.edu\.co$/;
//   return re.test(email);
// };

// const Login = () => {
//   const [identifier, setIdentifier] = useState("");
//   const [userPassword, setUserPassword] = useState("");
//   const [error, setError] = useState(null);
//   const [isValidating, setIsValidating] = useState(false);
//   const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { error: authError, status, user, role, subrole, permissionsStatus } = useSelector((state) => state.auth);

  
//   useEffect(() => {
//     const wasRegistrationSuccessful = localStorage.getItem('registrationSuccess');
//     if (wasRegistrationSuccessful) {
//       setShowRegistrationSuccess(true);
//       localStorage.removeItem('registrationSuccess');
      
//       setTimeout(() => {
//         setShowRegistrationSuccess(false);
//       }, 5000);
//     }
//   }, []);

//   useEffect(() => {
//     if (status === "succeeded" && user ) {
//       switch (role) {
//         case "director_grupo":
//           navigate("/directorgrupo");
//           break;
//         case "jefe_nivel":
//           navigate("/directorgrupo");
//           break;
//         case "coordinador_general":
//           navigate("/coordinadorgrupo");
//           break;
//         case "admin_bienestar":
//           navigate("/bienestar/dashboard");
//           break;
//         case "profesional_bienestar":
//           navigate("/bienestar/dashboard");
//           break;
//         case "superadministrador":
//           navigate("/superadmin");
//           break;
//         default:
//           navigate("/");
//           break;
//       }
//     }
//   }, [status, user, role, navigate]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);

//     if (!identifier || !userPassword) {
//       setError("Por favor, complete todos los campos.");
//       return;
//     }

//     const isValidEmail = validateEmailWithDomain(identifier);

//     if (!isValidEmail) {
//       setError("El correo debe ser del dominio @gimnasiomariecurie.edu.co");
//       return;
//     }

//     setIsValidating(true);

//     try {
//       const userCreated = await fetchUsuarioByEmail(identifier);
//       console.log("identifier:", identifier);
//       console.log("userCreated:", userCreated);

//       if (!userCreated) {
//         setError("La cuenta no está creada o no existe en la base de datos.");
//         setIsValidating(false);
//         return;
//       }

//       setIsValidating(false);
//       dispatch(loginUser({ email: identifier, password: userPassword }));
//     } catch (err) {
//       console.error("Error al verificar el usuario:", err);
//       setError("Hubo un error al verificar la cuenta. Por favor, intenta nuevamente o verifica que la cuenta esté creada");
//       setIsValidating(false);
//     }
//   };

//   return (
//     <>
//       {showRegistrationSuccess && (
//         <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex flex-col items-center text-green-700">
//           <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
//           <p className="font-semibold text-lg mb-1">¡Registro Exitoso!</p>
//           <p className="text-center text-sm">Tu cuenta ha sido creada. Por favor, inicia sesión con tus credenciales.</p>
//         </div>
//       )}

//       <form
//         onSubmit={handleSubmit}
//         className="w-full space-y-6"
//       >
//         {/* Email Input Group */}
//         <div className="space-y-1.5">
//           <label className="block text-sm font-medium text-blue-default">
//             Correo electrónico
//           </label>
//           <div className="relative">
//             <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
//             <InputForm
//               type="text"
//               onChange={(e) => setIdentifier(e.target.value)}
//               placeholder="Ingresa tu correo"
//               value={identifier}
//               className="pl-10 w-full py-2.5 border border-amber-default rounded-md focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
//             />
//           </div>
//         </div>

//         {/* Password Input Group */}
//         <div className="space-y-1.5">
//           <label className="block text-sm font-medium text-blue-default">
//             Contraseña
//           </label>
//           <div className="relative">
//             <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5 transition-all duration-200" />
//             <PasswordInput
//               onChange={(e) => setUserPassword(e.target.value)}
//               placeholder="Ingresa tu contraseña"
//               value={userPassword}
//               className=" w-full py-2.5 border border-amber-default rounded-md focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
//             />
//           </div>
//         </div>

//         <div>
//           {error && <p className="text-red-500 text-sm">{error}</p>}
//         </div>

//         {/* Action Buttons */}
//       <div className="space-y-3 pt-2">
//         <Button2
//           type="submit"
//           disabled={status === "loading"}
//           className="w-full py-2.5 bg-blue-default hover:bg-blue-hover text-white rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
//         >
//           {status === "loading" ? (
//             <>
//               <Loader2 className="animate-spin h-5 w-5" />
//               <span>Iniciando sesión...</span>
//             </>
//           ) : (
//             "Iniciar sesión"
//           )}
//         </Button2>

//         <Link
//           to="/password-reset"
//           className="block text-center w-full py-2.5 rounded-md border border-amber-default text-blue-default hover:bg-amber-50 transition-colors duration-200"
//         >
//           ¿Olvidaste tu contraseña?
//         </Link>
//       </div>
//       </form>
//     </>
//   );
// };

// export default Login;


import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../../redux/slices/authSlice";
import { fetchUsuarioByEmail } from "../../../core/config/supabase/supabaseFetchFunctions";
import InputForm from "../../ui/InputForm";
import Button2 from "../../ui/Button2";
import PasswordInput from "../../ui/PasswordInput";
import { Mail, CheckCircle, KeyRound, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import usePermissions from "../../../hooks/usePermissions";

const validateEmailWithDomain = (email) => {
  const re = /^[^\s@]+@gimnasiomariecurie\.edu\.co$/;
  return re.test(email);
};

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { error: authError, status, user, role } = useSelector((state) => state.auth);
  const { permissions, isReady: permissionsReady } = usePermissions();

  useEffect(() => {
    const wasRegistrationSuccessful = localStorage.getItem('registrationSuccess');
    if (wasRegistrationSuccessful) {
      setShowRegistrationSuccess(true);
      localStorage.removeItem('registrationSuccess');
      
      setTimeout(() => {
        setShowRegistrationSuccess(false);
      }, 5000);
    }
  }, []);

  // Función para determinar la ruta basada en rol y permisos
  const getRouteForUser = (userRole, userPermissions) => {
    // Si los permisos no están listos, usar ruta por defecto del rol
    if (!permissionsReady || !userPermissions.hasPermissions) {
      return getDefaultRouteForRole(userRole);
    }

    const accessibleServices = userPermissions.accessibleServices;

    console.log("accessibleServices:", accessibleServices);

    switch (userRole) {
      case "superadministrador":
        return "/superadmin";
      
      case "director_grupo":
        // Verificar si tiene acceso a servicios específicos
        if (accessibleServices.includes("matriculas")) {
          return "/matriculas";
        }
        return "/directorgrupo";
      
      case "coordinador_general":
        if (accessibleServices.includes("admisiones")) {
          return "/admisiones/dashboard";
        }
        if (accessibleServices.includes("academico")) {
          return "/academico/dashboard";
        }
        return "/coordinadorgrupo";
      
      case "profesional_bienestar":
      case "admin_bienestar":
        if (accessibleServices.includes("bienestar")) {
          return "/bienestar/dashboard";
        }
        break;
      
      case "coordinador_rrhh":
        if (accessibleServices.includes("recursos_humanos")) {
          return "/rrhh/dashboard";
        }
        break;
      
      case "contabilidad":
        return "/matriculas/listado";
      case "directivo":
        return "/matriculas/buscador";
      case "docente":
      case "jefe_nivel":
        return "/matriculas/buscador";
      default:
        break;
    }

    // Si no hay una ruta específica, usar la ruta por defecto
    return getDefaultRouteForRole(userRole);
  };

  const getDefaultRouteForRole = (userRole) => {
    switch (userRole) {
      case "director_grupo":
      case "jefe_nivel":
        return "/directorgrupo";
      case "docente":
        return "/matriculas";
      case "admin_bienestar":
      case "profesional_bienestar":
        return "/bienestar/dashboard";
      case "superadministrador":
        return "/superadmin";
      case "contabilidad":
        return "/matriculas/listado";
      default:
        return "/";
    }
  };

  useEffect(() => {
    if (status === "succeeded" && user) {
      const targetRoute = getRouteForUser(role, permissions);
      navigate(targetRoute);
    }
  }, [status, user, role, navigate, permissions, permissionsReady]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!identifier || !userPassword) {
      setError("Por favor, complete todos los campos.");
      return;
    }

    const isValidEmail = validateEmailWithDomain(identifier);

    if (!isValidEmail) {
      setError("El correo debe ser del dominio @gimnasiomariecurie.edu.co");
      return;
    }

    setIsValidating(true);

    try {
      const userCreated = await fetchUsuarioByEmail(identifier);
      console.log("identifier:", identifier);
      console.log("userCreated:", userCreated);

      if (!userCreated) {
        setError("La cuenta no está creada o no existe en la base de datos.");
        setIsValidating(false);
        return;
      }

      if (userCreated.estado !== 'activo') {
        setError("La cuenta está inactiva. Contacta al administrador.");
        setIsValidating(false);
        return;
      }

      setIsValidating(false);
      dispatch(loginUser({ email: identifier, password: userPassword }));
    } catch (err) {
      console.error("Error al verificar el usuario:", err);
      setError("Hubo un error al verificar la cuenta. Por favor, intenta nuevamente o verifica que la cuenta esté creada");
      setIsValidating(false);
    }
  };

  // Mostrar errores de autenticación
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  return (
    <>
      {showRegistrationSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex flex-col items-center text-green-700">
          <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
          <p className="font-semibold text-lg mb-1">¡Registro Exitoso!</p>
          <p className="text-center text-sm">Tu cuenta ha sido creada. Por favor, inicia sesión con tus credenciales.</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-6"
      >
        {/* Email Input Group */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-default">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5" />
            <InputForm
              type="text"
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ingresa tu correo"
              value={identifier}
              className="pl-10 w-full py-2.5 border border-amber-default rounded-md focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Input Group */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-blue-default">
            Contraseña
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-default h-5 w-5 transition-all duration-200" />
            <PasswordInput
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              value={userPassword}
              className="w-full py-2.5 border border-amber-default rounded-md focus:ring-2 focus:ring-blue-default focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button2
            type="submit"
            disabled={status === "loading" || isValidating}
            className="w-full py-2.5 bg-blue-default hover:bg-blue-hover text-white rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {(status === "loading" || isValidating) ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>{isValidating ? "Validando..." : "Iniciando sesión..."}</span>
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button2>

          <Link
            to="/password-reset"
            className="block text-center w-full py-2.5 rounded-md border border-amber-default text-blue-default hover:bg-amber-50 transition-colors duration-200"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
    </>
  );
};

export default Login;