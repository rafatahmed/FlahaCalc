# EVAPOTRAN Documentation

<div align="center">
  <img src="../EVAPOTRAN/img/Flaha_logo.svg" alt="Flaha Logo" width="80" height="80">
  <h1>Flaha Agri Tech - EVAPOTRAN</h1>
</div>

## Overview

EVAPOTRAN is a comprehensive calculator designed for professionals in horticulture, agronomy, landscaping, and agricultural engineering. This web application provides essential tools for precise calculations of evapotranspiration using the FAO Penman-Monteith method, supporting irrigation management and water resource planning.

## Key Features

- **Evapotranspiration Calculator:** Calculate water loss through evaporation and transpiration using the industry-standard FAO Penman-Monteith method
- **Multiple Data Input Options:** Enter climate data manually or import from EPW weather files
- **Weather Data Visualization:** Generate heatmaps and visual representations of climate data
- **Live Weather Integration:** Connect to real-time weather data for immediate calculations

## Quick Start

1. **Manual Calculator**: Enter climate data directly to calculate reference evapotranspiration
2. **EPW Import**: Upload EnergyPlus Weather files to extract climate data
3. **Weather Visualization**: Generate heatmaps and visualize weather patterns
4. **Live Weather**: Connect to real-time weather data for immediate calculations

## Documentation Structure

This documentation is organized into the following sections:

- **User Guide**: Step-by-step instructions for using EVAPOTRAN
- **Technical Documentation**: Detailed information about the implementation
- **Development**: Guidelines for contributing to the project
- **About**: License information and contact details

## FAO Penman-Monteith Equation

EVAPOTRAN implements the FAO Penman-Monteith equation for calculating reference evapotranspiration (ET₀):

$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma (1 + 0.34 u_2)}$$

Where:
- $ET_0$ = reference evapotranspiration [mm day⁻¹]
- $R_n$ = net radiation at the crop surface [MJ m⁻² day⁻¹]
- $G$ = soil heat flux density [MJ m⁻² day⁻¹]
- $T$ = mean daily air temperature at 2 m height [°C]
- $u_2$ = wind speed at 2 m height [m s⁻¹]
- $e_s$ = saturation vapor pressure [kPa]
- $e_a$ = actual vapor pressure [kPa]
- $\Delta$ = slope of vapor pressure curve [kPa °C⁻¹]
- $\gamma$ = psychrometric constant [kPa °C⁻¹]