# Infraestructura en Oracle Cloud Infrastructure

La etapa inicial usa recursos OCI Always Free y está pensada para una sola
cuenta nueva, separada de cualquier cuenta personal o del cliente. Terraform
crea una VM ARM `VM.Standard.A1.Flex` con 1 OCPU, 6 GiB de RAM y un boot volume
de 50 GiB. La VM sólo carga imágenes ARM64 construidas en GitHub; no compila el
proyecto.

La red publica únicamente HTTP/HTTPS (80 y 443). SSH/22 no se abre: GitHub
solicita el despliegue con Compute Instance Run Command. Los archivos OCI de API
y portal se guardan por SHA en un bucket privado de Object Storage y la VM los
descarga mediante Instance Principal. No hay tokens de registry ni secretos de
aplicación dentro de Terraform, cloud-init o Git.

## Recursos creados

- VCN `10.42.0.0/16`, subnet pública `10.42.1.0/24`, Internet Gateway y NSG.
- Una VM Ampere A1 con Oracle Linux 9 y Podman.
- Bucket privado y versionado para archivos OCI, con limpieza a los 14 días.
- Grupo dinámico y política de instancia para Run Command y lectura del bucket.
- Bucket privado y versionado independiente para el estado remoto.

La IP inicial es dinámica y la URL usa HTTP. Dominio, certificado y terminación
HTTPS son un incremento posterior. No se incluye un Load Balancer porque no es
necesario para el primer prototipo.

## Límites de diseño

La asignación Always Free vigente para A1 equivale a 2 OCPU y 12 GiB de memoria
en total por tenancy, en la región home. Esta configuración consume la mitad para
dejar margen. El boot volume de 50 GiB cuenta contra los 200 GB gratuitos de
Block Volume. Los buckets de estado y artefactos comparten los 20 GB gratuitos
de Object Storage y sus 50,000 solicitudes mensuales.

El uso de Object Storage sustituye a OCIR porque Oracle cobra el almacenamiento
de imágenes de Container Registry. La limpieza automática reduce el riesgo de
superar la cuota, pero debe vigilarse el tamaño de cada build. Oracle puede no
tener capacidad A1 disponible y puede reclamar instancias Always Free inactivas.
Confirme siempre los límites y el estimador de costos antes de aplicar.

## Prerrequisitos manuales en la cuenta nueva

1. Identificar la región home y crear un compartimento dedicado.
2. Crear un usuario técnico de despliegue y un API signing key.
3. Agregar ese usuario a un grupo y adaptar
   `environments/dev/iam-policy.example.txt` con el OCID del compartimento y el
   nombre del bucket de artefactos.
4. Configurar OCI CLI localmente con el perfil `AI_PROTOTYPES`.
5. Instalar Terraform 1.12 o posterior; el backend nativo de OCI requiere esa
   versión.

OCI Run Command exige que el agente pertenezca al grupo dinámico. Como este grupo
se enlaza a la instancia recién creada, la primera autorización puede tardar
hasta 30 minutos en propagarse.

## Bootstrap del estado

Copie `bootstrap/terraform.tfvars.example` como `bootstrap/terraform.tfvars` y
complete únicamente OCIDs y región. El archivo real está ignorado por Git.

```powershell
terraform -chdir=infra/bootstrap init
terraform -chdir=infra/bootstrap plan -out=bootstrap.tfplan
terraform -chdir=infra/bootstrap apply bootstrap.tfplan
```

Use los outputs para copiar `environments/dev/backend.hcl.example` como
`environments/dev/backend.hcl`. El backend guarda el estado y su lock en Object
Storage, con versionado para recuperación.

## Creación del ambiente

Copie `environments/dev/terraform.tfvars.example` como `terraform.tfvars` y
complete los valores de la cuenta nueva.

```powershell
terraform -chdir=infra/environments/dev init -backend-config=backend.hcl
terraform -chdir=infra/environments/dev fmt -check
terraform -chdir=infra/environments/dev validate
terraform -chdir=infra/environments/dev plan -out=dev.tfplan
terraform -chdir=infra/environments/dev apply dev.tfplan
```

Antes de aprobar el plan verifique que sólo aparezcan recursos del compartimento
nuevo, la región home, `VM.Standard.A1.Flex`, 1 OCPU, 6 GiB y 50 GiB de disco.

## Configuración del ambiente `development` en GitHub

Variables:

- `OCI_REGION`: región home.
- `OCI_COMPARTMENT_OCID`: OCID del compartimento.
- `OCI_INSTANCE_OCID`: output `instance_id`.
- `OCI_ARTIFACT_BUCKET`: output `artifact_bucket`.

Secrets:

- `OCI_TENANCY_OCID`
- `OCI_USER_OCID`
- `OCI_API_KEY_FINGERPRINT`
- `OCI_API_PRIVATE_KEY`

Proteja el ambiente `development` con aprobación requerida. La API private key
es una credencial de automatización de larga duración: limite su usuario al
compartimento, rótela y elimínela al cerrar la plataforma.

## Flujo de despliegue

1. Un merge a `main` inicia `.github/workflows/deploy-oci.yml`.
2. GitHub construye API y portal para `linux/arm64` y genera archivos OCI con el
   SHA del commit como etiqueta inmutable.
3. OCI CLI sube ambos archivos a
   `deployments/<SHA>/{api,portal}.oci` en Object Storage.
4. OCI CLI crea un Run Command que llama `/opt/ai-prototype/deploy.sh <SHA>`.
5. La VM descarga los archivos mediante Instance Principal, los carga en Podman,
   recrea los contenedores y elimina imágenes locales antiguas.
6. El workflow espera el estado final del comando y falla si OCI reporta error o
   timeout.

No ejecute `terraform apply` ni el workflow hasta comprobar que OCI CLI muestra
la tenancy nueva. Esta preparación no crea recursos por sí sola.
