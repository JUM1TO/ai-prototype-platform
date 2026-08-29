# Infraestructura

La primera etapa crea una VPC y una `t3.micro` con 20 GiB de EBS. Esta opción es
elegible para Free Tier, pero la elegibilidad real depende de la fecha de creación
de la cuenta y de sus créditos disponibles. La administración se realiza mediante
AWS Systems Manager Session Manager; el security group no abre SSH.

```bash
cd infra/environments/dev
terraform init
terraform plan -var="project_name=ai-prototypes"
terraform apply -var="project_name=ai-prototypes"
```

La instancia usa créditos de CPU en modo `standard` para evitar cobros de T3
Unlimited y añade 2 GiB de swap. Tiene sólo 1 GiB de RAM: CI debe construir las
imágenes y EC2 únicamente descargarlas y ejecutarlas. Durante esta fase se limita
la cantidad de previews simultáneos.

El estado remoto, dominio, certificado TLS, ECR, backups y alertas de costo se
añadirán antes de desplegar una demo externa. No ejecutar `apply` hasta revisar
región, tamaño, costos y cuenta AWS activa. Free Tier no garantiza costo cero si
se consumen los créditos o se agregan servicios no incluidos.
