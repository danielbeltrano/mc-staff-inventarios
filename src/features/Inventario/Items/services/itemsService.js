import { supabase } from "../../../../core/config/supabase/supabaseClientInventario.js";
import { uploadImageToBucket } from "./uploadService.js";

// 🖼️ Subir imagen al bucket específico de ítems
export async function uploadItemImage(file) {
  return await uploadImageToBucket(file, "items-images");
}

// Crear nuevo ítem (NO necesita usuario)
export async function createItem(itemData) {
  let imageUrl = null;

  if (itemData.imagen instanceof File) {
    imageUrl = await uploadItemImage(itemData.imagen);
  }

  const { error } = await supabase.from("item").insert([
    {
      codigo: itemData.codigo,
      nombre: itemData.nombre,
      idCategoria: itemData.idCategoria,
      tipo: itemData.tipo,
      unidad: itemData.unidad,
      stockMinimo: itemData.stockMinimo,
      inventarioInicial: itemData.inventarioInicial,
      stockReal: itemData.inventarioInicial,
      imagen: imageUrl,
      qr: null,
      ubicacion: itemData.ubicacion,
    },
  ]);

  if (error) throw error;
}

// Obtener lista de ítems
export async function getItems() {
  const { data, error } = await supabase
    .from("item")
    .select("*, categoria(nombre)")
    .order("idItem", { ascending: false });

  if (error) throw error;
  return data;
}

// Obtener categorías
export async function getCategorias() {
  const { data, error } = await supabase
    .from("categoria")
    .select("idCategoria, nombre")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
}

// Crear nueva categoría
export async function createCategoria(nombre) {
  const { data, error } = await supabase
    .from("categoria")
    .insert([{ nombre }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtener ítem por ID
export async function getItemById(id) {
  const { data, error } = await supabase
    .from("item")
    .select("*")
    .eq("idItem", id)
    .single();

  if (error) throw error;
  return data;
}

// ✅ Actualizar ítem CON usuario inyectado
export async function updateItem({
  id,
  itemData,
  motivoAjuste,
  user, // 👈 viene desde Redux
}) {
  if (!user) {
    throw new Error("No hay usuario autenticado.");
  }

  let imageUrl = itemData.imagen;

  // Obtener stock actual
  const { data: currentItem, error: fetchError } = await supabase
    .from("item")
    .select("stockReal")
    .eq("idItem", id)
    .single();

  if (fetchError) throw fetchError;

  if (itemData.imagen instanceof File) {
    imageUrl = await uploadItemImage(itemData.imagen);
  }

  const { error: updateError } = await supabase
    .from("item")
    .update({
      ...itemData,
      imagen: imageUrl,
    })
    .eq("idItem", id);

  if (updateError) throw updateError;

  // Registrar ajuste si cambia stock
  if (
    typeof itemData.stockReal === "number" &&
    itemData.stockReal !== currentItem.stockReal
  ) {
    const cantidadAjustada =
      itemData.stockReal - currentItem.stockReal;

    const { data: ajuste, error: ajusteError } = await supabase
      .from("ajuste")
      .insert([
        {
          idItem: id,
          idUsuarioGestor: user.uuid, // 👈 del auth state
          tipo: "ajuste manual",
          cantidad: cantidadAjustada,
          motivo: motivoAjuste,
          fecha: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (ajusteError) throw ajusteError;

    const { error: errorMov } = await supabase
      .from("movimiento")
      .insert([
        {
          tipo: "ajuste manual",
          referenciaTipo: "ajuste",
          idReferencia: ajuste.idAjuste,
          idItem: id,
          descripcion: `Gestor ${user.email} ajustó el ítem ${itemData.nombre}`,
          fecha: new Date().toISOString(),
          cantidad: cantidadAjustada,
        },
      ]);

    if (errorMov) throw errorMov;
  }
}

// Eliminar ítem
export async function deleteItem(id) {
  const { error } = await supabase
    .from("item")
    .delete()
    .eq("idItem", id);

  if (error) throw error;
}