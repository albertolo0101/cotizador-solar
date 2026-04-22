# Cotizador Solar SIS

Software web para generar cotizaciones referenciales de sistemas solares fotovoltaicos en Guatemala para SIS.

El proyecto incluye dos cotizadores:

- `cotizador-rapido.html`: pensado para una cotización inmediata con pocos datos.
- `cotizador.html`: pensado para una cotización más técnica, con selección de panel, inversor, estructura y acabado.

También incluye herramientas administrativas:

- `admin-sis.html`: configuración general del sistema.
- `admin-catalogo.html`: administración del catálogo de paneles e inversores.

## Cómo usar los cotizadores

### 1. Cotizador rápido

Archivo principal: [cotizador-rapido.html](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/cotizador-rapido.html)

Uso:

1. Ingresa el consumo mensual en `kWh`.
2. Ingresa el valor de la factura mensual actual en `Q`.
3. Elige la línea de equipos:
   `Genérico`: usa inversores no Huawei.
   `Premium`: usa inversores Huawei.
4. Activa la opción de servicio fuera del área metropolitana si aplica.
5. Revisa la propuesta automática:
   inversión estimada,
   inversor recomendado,
   cantidad de paneles,
   potencia instalada,
   ahorro mensual,
   retorno estimado.

### 2. Cotizador detallado

Archivo principal: [cotizador.html](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/cotizador.html)

Uso:

1. Ingresa el consumo mensual en `kWh`.
2. Selecciona el tipo de techo o estructura:
   `Losa` o `Lámina`.
3. Selecciona el panel solar desde el catálogo activo.
4. Selecciona la categoría de inversor:
   `Genérico` o `Huawei Premium`.
5. Selecciona el inversor deseado.
6. Ajusta los metros de cable DC si es necesario.
7. Activa o desactiva extras Huawei cuando aplique.
8. Selecciona el tipo de acabado:
   `Tipo 1` o `Tipo 2`.
9. Activa servicio fuera del área metropolitana si aplica.
10. Revisa el resultado:
    potencia requerida,
    paneles,
    generación mensual,
    desglose de materiales,
    precio con IVA,
    cobertura,
    retorno de inversión.

## Instrucciones para agregar al catálogo desde VS Code

El catálogo permanente del sistema vive en [catalog.json](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/catalog.json).

Si quieres agregar paneles o inversores manualmente desde VS Code, edita ese archivo directamente.

### Estructura general

El archivo tiene dos arreglos principales:

- `panels`
- `inverters`

### Agregar un panel

Dentro de `panels`, agrega un nuevo objeto con esta estructura:

```json
{
  "id": "P-JINKO-610W",
  "brand": "Jinko",
  "model": "610W bifacial",
  "watts": 610,
  "price": 790,
  "active": true
}
```

Campos:

- `id`: identificador único del panel.
- `brand`: marca.
- `model`: nombre comercial o modelo.
- `watts`: potencia del panel en watts.
- `price`: precio unitario en quetzales.
- `active`: si está disponible en los cotizadores.

### Agregar un inversor

Dentro de `inverters`, agrega un nuevo objeto con esta estructura:

```json
{
  "id": "I-GROWATT-8K",
  "brand": "Growatt",
  "model": "8 kW",
  "note": "Monofásico",
  "capacityKw": 8,
  "maxPanels": 16,
  "price": 8500,
  "isHuawei": false,
  "active": true
}
```

Campos:

- `id`: identificador único del inversor.
- `brand`: marca.
- `model`: modelo o capacidad mostrada en pantalla.
- `note`: descripción corta.
- `capacityKw`: capacidad nominal del inversor en kW.
- `maxPanels`: cantidad máxima de paneles recomendada para ese inversor.
- `price`: precio unitario en quetzales.
- `isHuawei`: `true` si debe aparecer en la línea Huawei Premium, `false` si debe aparecer en Genérico.
- `active`: si está disponible en los cotizadores.

### Recomendaciones importantes

- No repitas `id`.
- Mantén el JSON válido: comas, llaves y corchetes bien cerrados.
- Usa `true` o `false` sin comillas.
- Si no quieres eliminar un equipo, puedes dejarlo con `"active": false`.
- El cotizador usa `watts` del panel para calcular cantidad de paneles.
- El cotizador usa `maxPanels` del inversor para sugerir y escalar la selección.

## Archivos principales del proyecto

- [index.html](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/index.html): página principal.
- [cotizador-rapido.html](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/cotizador-rapido.html): cotizador rápido.
- [cotizador.html](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/cotizador.html): cotizador detallado.
- [admin-sis.html](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/admin-sis.html): configuración general.
- [admin-catalogo.html](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/admin-catalogo.html): administración visual del catálogo.
- [catalog.json](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/catalog.json): catálogo permanente.
- [config.js](/c:/Users/alber/Documents/2026/SIS%20gt/Cotizadorhtml/cotizador-solar/config.js): configuración global.
