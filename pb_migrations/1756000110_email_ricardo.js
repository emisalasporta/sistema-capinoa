/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: (ya no hace nada).
 *
 * Originalmente cambiaba el usuario de Ricardo, que se había creado con un
 * correo inventado, por su correo real. Ese cambio ya está aplicado en la base
 * de la clínica, que es la única que lo necesitaba.
 *
 * Se vació al pasar el sistema a internet: el repositorio es público y no
 * tiene que llevar escrito el correo personal de nadie. En una instalación
 * nueva, el correo de cada usuario se carga desde Configuración → Usuarios.
 *
 * El archivo se conserva (vacío) porque PocketBase lleva la cuenta de las
 * migraciones por nombre de archivo: borrarlo confundiría a las bases que ya
 * lo tienen anotado como aplicado.
 */
migrate(
  (app) => {},
  (app) => {}
);
