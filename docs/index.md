
<div align="center">
  <img src="../EVAPOTRAN/img/Flaha_logo.svg" alt="Flaha Logo" width="80" height="80">
  <h1>Flaha Agri Tech - EVAPOTRAN</h1>
  <p><em>Professional Evapotranspiration Calculator for Agricultural Applications</em></p>
</div>

# EVAPOTRAN Documentation

Welcome to the official documentation for EVAPOTRAN, a professional evapotranspiration calculator for agricultural applications developed by Flaha Agri Tech.

## About EVAPOTRAN

EVAPOTRAN is a comprehensive calculator designed for professionals in horticulture, agronomy, landscaping, and agricultural engineering. This web application provides essential tools for precise calculations of evapotranspiration using the FAO Penman-Monteith method, supporting irrigation management and water resource planning.

## Key Features

- **Manual Calculator**: Enter climate data directly to calculate reference evapotranspiration
- **EPW Import**: Upload EnergyPlus Weather files to extract climate data
- **Weather Visualization**: Generate heatmaps and visualize weather patterns
- **Live Weather**: Connect to real-time weather data for immediate calculations

## Getting Started

New to EVAPOTRAN? Start here:

- [Introduction](getting-started-introduction) - Learn what EVAPOTRAN is and why it's useful
- [Installation](getting-started-installation) - Set up EVAPOTRAN on your system
- [Quick Start Guide](getting-started-quick-start) - Make your first calculations

## Documentation Formats

This documentation is available in multiple formats:

- **Web**: Browse online at [https://evapotran-doc.flaha.org](https://evapotran-doc.flaha.org)
- **GitHub Wiki**: View on [GitHub Wiki](https://github.com/rafatahmed/FlahaCalc/wiki)
- **PDF**: Download complete documentation as [PDF](https://evapotran-doc.flaha.org/_/downloads/en/latest/pdf/)
- **GitHub**: View source files in our [GitHub repository](https://github.com/rafatahmed/FlahaCalc)

## Support

Need help? Check these resources:

- [Frequently Asked Questions](faq-general)
- [Troubleshooting Guide](user-guide-troubleshooting)
- [Contact Support](about-contact)

## License

EVAPOTRAN is licensed under the GNU General Public License v3.0. See the [License](about-license) page for details.

## The Science Behind EVAPOTRAN

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

This internationally recognized method provides a standardized approach to estimating evapotranspiration, enabling accurate water management decisions across different climates and regions.





