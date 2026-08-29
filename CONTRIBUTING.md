# Guía de contribución

1. Crear una rama corta desde `main`: `feat/<tema>`, `fix/<tema>` o `chore/<tema>`.
2. Mantener los pull requests pequeños y con un solo propósito.
3. Ejecutar `pnpm check` antes de publicar cambios.
4. Solicitar revisión del dueño del área afectada.
5. Usar squash merge después de que CI y el preview estén correctos.

No se permiten pushes directos a `main`. Los cambios generados con IA deben ser
entendidos y revisados por la persona que los presenta.

- Cambiar primero los tipos o el contrato OpenAPI.
- Mantener compatibilidad hacia atrás durante migraciones.
- No exponer claves o credenciales al frontend.
- Añadir timeouts y validación a toda integración externa.
- No registrar prompts o documentos sensibles de manera predeterminada.
