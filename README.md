# AI Prototype Platform

Base reutilizable para construir, probar y desplegar prototipos de IA adaptados a cada cliente.

## Estructura

```text
apps/              Aplicaciones ejecutables (portal y API)
packages/          Capacidades reutilizables y contratos compartidos
solutions/         Configuración específica de cada solución
infra/             Infraestructura como código
docs/              Decisiones y guías operativas
.github/workflows/ Integración continua
```

## Inicio rápido

Requisitos: Node.js 22+, pnpm 10+ y Docker.

```bash
cp .env.example .env
pnpm install
pnpm dev
```

También se puede ejecutar con `docker compose up --build`. El portal queda en
`http://localhost:3000` y la API en `http://localhost:8080`.

La variable `SOLUTION_ID` selecciona el manifiesto que se carga desde
`solutions/<id>/solution.yaml`. La API no inicia si el archivo falta, contiene
valores inválidos o intenta habilitar una clasificación de datos no permitida.

Consulta [docs/architecture.md](docs/architecture.md) y [CONTRIBUTING.md](CONTRIBUTING.md).
