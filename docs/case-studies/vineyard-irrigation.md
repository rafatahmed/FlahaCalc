# Case Study: Vineyard Irrigation Optimization

## Background

**Location**: Napa Valley, California, USA  
**Crop**: Wine grapes (Vitis vinifera 'Cabernet Sauvignon')  
**Area**: 15 hectares  
**Irrigation System**: Drip irrigation  
**Challenge**: Optimize irrigation scheduling to improve water use efficiency while maintaining grape quality

## Problem Statement

A vineyard manager needed to develop a precise irrigation schedule for a premium Cabernet Sauvignon vineyard. The goals were to:

1. Reduce water usage by at least 15%
2. Maintain or improve grape quality parameters
3. Implement regulated deficit irrigation (RDI) at specific phenological stages
4. Create a data-driven approach to replace the existing fixed schedule

## Methodology

### Data Collection

1. **Weather Data**: 
   - Installed an on-site weather station collecting hourly data
   - Parameters measured: temperature, relative humidity, wind speed, solar radiation
   - Data collected from April through October (growing season)

2. **Soil Moisture Monitoring**:
   - Installed soil moisture sensors at three depths (30cm, 60cm, 90cm)
   - Sensors placed in three vineyard zones representing different soil types

3. **Plant Monitoring**:
   - Weekly measurements of stem water potential using pressure chamber
   - Canopy temperature measurements using infrared thermometer
   - Visual assessment of vine stress indicators

### Analysis with EVAPOTRAN

1. **Daily ET₀ Calculation**:
   - Weather data imported into EVAPOTRAN
   - Daily reference evapotranspiration (ET₀) calculated using FAO Penman-Monteith method

2. **Crop ET Calculation**:
   - Crop coefficients (Kc) applied based on growth stage:
     - Budbreak to flowering: Kc = 0.3
     - Flowering to veraison: Kc = 0.5
     - Veraison to harvest: Kc = 0.4
   - Crop evapotranspiration (ETc) calculated as: ETc = Kc × ET₀

3. **Irrigation Scheduling**:
   - Regulated deficit irrigation applied during specific phenological stages
   - Irrigation amounts calculated as percentage of ETc:
     - Pre-veraison: 80% of ETc
     - Veraison to harvest: 60% of ETc
   - Soil moisture data used to validate and adjust calculations

## Results

### Water Usage

| Month | Previous Usage (m³) | EVAPOTRAN-Based Usage (m³) | Reduction (%) |
|-------|---------------------|----------------------------|---------------|
| May   | 450                 | 320                        | 29%           |
| June  | 720                 | 580                        | 19%           |
| July  | 950                 | 760                        | 20%           |
| August| 850                 | 680                        | 20%           |
| Sept  | 520                 | 470                        | 10%           |
| **Total** | **3,490**       | **2,810**                  | **19.5%**     |

### Grape Quality Parameters

| Parameter           | Previous Season | EVAPOTRAN Season | Change |
|---------------------|-----------------|------------------|--------|
| Brix                | 24.2            | 25.1             | +0.9   |
| Titratable Acidity  | 6.8 g/L        