# Arquitectura

## Capas

1. **Plataforma:** identidad, portal, contratos, telemetría y despliegue.
2. **Solución:** experiencia, reglas y flujos propios del cliente.
3. **Capacidades:** agentes, documentos, alertas, búsqueda y conectores.

```text
Browser -> Portal -> Solution API -> AI Runtime -> Model provider
                         |              |
                         |              +-> approved tools
                         +-> workers / queues / connectors
```

El portal sólo conoce el contrato público. La API decide qué capacidades habilitar
según el manifiesto. El runtime de IA normaliza proveedores, límites y errores.

## Manifiestos

`SOLUTION_ID` acepta únicamente identificadores en `kebab-case`. Al iniciar, la
API carga `solutions/<SOLUTION_ID>/solution.yaml`, valida todos los campos y
comprueba que el identificador interno coincide. El manifiesto contiene opciones
operativas, nunca secretos. En esta etapa la política de datos permitida es
exclusivamente `synthetic-only`.

## Ambientes

- `preview`: uno por pull request y con datos sintéticos.
- `integration`: despliegue automático de `main`.
- `demo`: versión promovida y congelada para mostrar al cliente.

## Seguridad

- El navegador nunca recibe credenciales de modelos o integraciones.
- Cada herramienta de agente debe registrarse explícitamente.
- Acciones con efectos externos requieren aprobación humana.
- Los secretos se inyectan en ejecución; nunca forman parte de imágenes o Git.
- Los ambientes y datos de clientes permanecen aislados.

Una capacidad se mueve a `packages/` sólo después de reutilizarse en dos soluciones.
