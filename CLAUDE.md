@AGENTS.md

## NORMA IMPERATIVA: el código muerto se elimina, no se comenta ni se deja «por si acaso»

**Si al pasar por un fichero se ve código que no se está usando, se borra en ese momento.** No es
opcional ni se aparca para una tarea de limpieza que no llega nunca.

Cuenta como código muerto:

- Imports, variables y constantes que nadie usa.
- Parámetros y propiedades que se declaran, se pasan desde quien llama y no se leen en el cuerpo. Se
  quitan de los TRES sitios: la firma, el tipo y la llamada. Dejarlos solo en la firma hace creer al
  siguiente que el dato importa.
- Funciones, componentes y ramas de código a los que no llega nadie.
- Ficheros enteros que ya no se importan.

**Por qué es imperativo y no una preferencia:** el código que no se ejecuta sigue costando. Se lee,
se mantiene, aparece en las búsquedas, se refactoriza por error y hace ruido en el análisis estático
—donde además tapa los avisos que sí importan—. Y un parámetro que se pasa y no se usa es peor que
inútil: es una mentira sobre lo que hace la función.

**Cómo se hace bien:** antes de borrar, comprobar que de verdad nadie lo usa (búsqueda en todo el
repositorio, no solo en el fichero). Si algo se retira temporalmente y va a volver, se comenta con la
fecha y el motivo —eso NO es código muerto, es una decisión anotada—; todo lo demás se borra.
