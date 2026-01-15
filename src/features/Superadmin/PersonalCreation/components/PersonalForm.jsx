import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "../../../../components/ui/Cards";
import InputText from "../../../../components/ui/InputText";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/Select";
import { Checkbox } from "../../../../components/ui/Checkbox";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Briefcase,
  Shield,
} from "lucide-react";
import { Button } from "../../../../components/ui/Button";

/**
 * Componente de formulario para crear personal
 */
const PersonalForm = ({
  formData,
  errors,
  loading,
  roles,
  rolesLoading,
  submitSuccess,
  onFieldChange,
  onPermissionChange,
  onSubmit,
  onReset,
  isMobile
}) => {
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  console.log("roles frrom CreatePersonalForm", roles);
  return (
    <div className={`max-w-4xl mx-auto  space-y-6 ${isMobile ? "p-4" : "p-6"}`}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center text-left justify-start gap-3">
          <User className="h-6 w-6 text-amber-default" />
          <h1 className="text-2xl font-bold text-blue-default">
            Registrar Nuevo Personal
          </h1>
        </div>
        <CardDescription className="pl-4">
          Complete la información del personal para registrarlo en el sistema
        </CardDescription>
      </div>

      {/* Mensaje de éxito */}
      {submitSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">
                  ¡Personal registrado exitosamente!
                </h3>
                <p className="text-green-600">
                  El personal ha sido agregado al sistema correctamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error general */}
      {errors.submit && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">
                  Error al registrar
                </h3>
                <p className="text-red-600">{errors.submit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Datos personales del miembro del personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primer Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primer Nombre *
                </label>
                <InputText
                  value={formData.primerNombre}
                  onChange={(e) =>
                    onFieldChange("primerNombre", e.target.value)
                  }
                  placeholder="Ingrese el primer nombre"
                  className={`w-full ${errors.primerNombre ? "border-red-500" : ""}`}
                />
                {errors.primerNombre && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.primerNombre}
                  </p>
                )}
              </div>

              {/* Segundo Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segundo Nombre
                </label>
                <InputText
                  value={formData.segundoNombre}
                  onChange={(e) =>
                    onFieldChange("segundoNombre", e.target.value)
                  }
                  placeholder="Ingrese el segundo nombre (opcional)"
                  className="w-full"
                />
                {errors.segundoNombre && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.segundoNombre}
                  </p>
                )}
              </div>

              {/* Primer Apellido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primer Apellido *
                </label>
                <InputText
                  value={formData.primerApellido}
                  onChange={(e) =>
                    onFieldChange("primerApellido", e.target.value)
                  }
                  placeholder="Ingrese el primer apellido"
                  className={`w-full ${errors.primerApellido ? "border-red-500" : ""}`}
                />
                {errors.primerApellido && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.primerApellido}
                  </p>
                )}
              </div>

              {/* Segundo Apellido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Segundo Apellido
                </label>
                <InputText
                  value={formData.segundoApellido}
                  onChange={(e) =>
                    onFieldChange("segundoApellido", e.target.value)
                  }
                  placeholder="Ingrese el segundo apellido (opcional)"
                  className="w-full"
                />
                {errors.segundoApellido && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.segundoApellido}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Institucional */}
        <Card>
          <CardHeader className="gap-2">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Información Institucional
            </CardTitle>
            <CardDescription>
              Datos relacionados con la posición en la institución
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Correo Institucional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Institucional *
                </label>
                <InputText
                  type="email"
                  value={formData.correoInstitucional}
                  onChange={(e) =>
                    onFieldChange("correoInstitucional", e.target.value)
                  }
                  placeholder="correo@gimnasiomariecurie.edu.co"
                  className={`w-full ${errors.correoInstitucional ? "border-red-500" : ""}`}
                />
                {errors.correoInstitucional && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.correoInstitucional}
                  </p>
                )}
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo
                </label>
                <InputText
                  value={formData.cargo}
                  onChange={(e) => onFieldChange("cargo", e.target.value)}
                  placeholder="Ingrese el cargo (opcional)"
                  className="w-full"
                />
                {errors.cargo && (
                  <p className="text-red-500 text-sm mt-1">{errors.cargo}</p>
                )}
              </div>
            </div>

            {/* Rol */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol en el Sistema *
              </label>
              <Select
                value={formData.rol}
                onValueChange={(value) => onFieldChange("rol", value)}
                disabled={rolesLoading}
              >
                <SelectTrigger
                  className={`w-full ${errors.rol ? "border-red-500" : ""}`}
                >
                  <SelectValue
                    placeholder={
                      rolesLoading ? "Cargando roles..." : "Seleccione un rol"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.nombre} value={rol.nombre}>
                      {rol.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rol && (
                <p className="text-red-500 text-sm mt-1">{errors.rol}</p>
              )}
              {errors.roles && (
                <p className="text-yellow-600 text-sm mt-1">{errors.roles}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permisos de Servicios */}
        {/* <Card>
          <CardHeader className="gap-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos de Servicios
            </CardTitle>
            <CardDescription>
              Seleccione los servicios a los que tendrá acceso este personal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="flex items-center space-x-3 p-3 border border-amber-default hover:shadow-md rounded-lg transition-colors">
                <Checkbox
                  id="admisiones"
                  checked={formData.permisos.admisiones}
                  onCheckedChange={(checked) =>
                    onPermissionChange("admisiones", checked)
                  }
                />
                <label
                  htmlFor="admisiones"
                  className="text-sm font-medium cursor-pointer"
                >
                  Admisiones
                </label>
              </div>

              
              <div className="flex items-center space-x-3 p-3 border border-amber-default hover:shadow-md rounded-lg transition-colors">
                <Checkbox
                  id="matriculas"
                  checked={formData.permisos.matriculas}
                  onCheckedChange={(checked) =>
                    onPermissionChange("matriculas", checked)
                  }
                />
                <label
                  htmlFor="matriculas"
                  className="text-sm font-medium cursor-pointer"
                >
                  Matrículas
                </label>
              </div>

              
              <div className="flex items-center space-x-3 p-3 border border-amber-default hover:shadow-md rounded-lg transition-colors">
                <Checkbox
                  id="bienestar"
                  checked={formData.permisos.bienestar}
                  onCheckedChange={(checked) =>
                    onPermissionChange("bienestar", checked)
                  }
                />
                <label
                  htmlFor="bienestar"
                  className="text-sm font-medium cursor-pointer"
                >
                  Bienestar
                </label>
              </div>

              
              <div className="flex items-center space-x-3 p-3 border border-amber-default hover:shadow-md rounded-lg transition-colors">
                <Checkbox
                  id="recursosHumanos"
                  checked={formData.permisos.recursosHumanos}
                  onCheckedChange={(checked) =>
                    onPermissionChange("recursosHumanos", checked)
                  }
                />
                <label
                  htmlFor="recursosHumanos"
                  className="text-sm font-medium cursor-pointer"
                >
                  Recursos Humanos
                </label>
              </div>

              
              <div className="flex items-center space-x-3 p-3 border border-amber-default hover:shadow-md rounded-lg transition-colors">
                <Checkbox
                  id="academico"
                  checked={formData.permisos.academico}
                  onCheckedChange={(checked) =>
                    onPermissionChange("academico", checked)
                  }
                />
                <label
                  htmlFor="academico"
                  className="text-sm font-medium cursor-pointer"
                >
                  Académico
                </label>
              </div>

              
              <div className="flex items-center space-x-3 p-3 border border-amber-default hover:shadow-md rounded-lg transition-colors">
                <Checkbox
                  id="crearUsuarios"
                  checked={formData.permisos.crearUsuarios}
                  onCheckedChange={(checked) =>
                    onPermissionChange("crearUsuarios", checked)
                  }
                />
                <label
                  htmlFor="crearUsuarios"
                  className="text-sm font-medium cursor-pointer"
                >
                  Crear Usuarios
                </label>
              </div>
            </div>

            {errors.permisos && (
              <p className="text-red-500 text-sm mt-3">{errors.permisos}</p>
            )}
          </CardContent>
        </Card> */}

        {/* Botones */}
        <CardFooter className={`gap-4 ${isMobile ? "w-full flex-col items-center justify-center  px-0" : "justify-end"}`}>
          <Button
            variant="amber"
            onClick={onReset}
            className={`px-6 py-2 border rounded-md transition-colors ${isMobile ? "w-full" : ""}`}
            disabled={loading}
          >
            Limpiar Formulario
          </Button>

          <Button
            variant="default"
            className={`px-8 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? "w-full flex-col items-center justify-center !m-0" : ""}`}
            disabled={loading || rolesLoading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Personal"
            )}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
};

export default PersonalForm;
