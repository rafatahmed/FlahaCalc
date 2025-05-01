# Manual Calculator

The Manual Calculator is the core component of EVAPOTRAN, allowing you to calculate reference evapotranspiration (ET₀) by entering climate data directly.

## Accessing the Calculator

1. From the home page, click on "Manual Calculator" in the navigation menu
2. Alternatively, navigate directly to `calculator.html`

## Required Input Parameters

To calculate ET₀, you need to provide the following parameters:

| Parameter | Description | Unit | Example Value |
|-----------|-------------|------|--------------|
| Mean Temperature | Average daily temperature | °C | 25 |
| Wind Speed | Wind speed at 2m height | m/s | 2 |
| Relative Humidity | Average daily relative humidity | % | 60 |
| Elevation | Site elevation above sea level | m | 100 |
| Latitude | Site latitude | degrees | 35.2 |
| Day of Year | Day number (1-365) | day | 182 |
| Sunshine Duration | Hours of bright sunshine | hours | 8 |

## Optional Parameters

The following parameter is optional and will be calculated from elevation if not provided:

| Parameter | Description | Unit | Example Value |
|-----------|-------------|------|--------------|
| Atmospheric Pressure | Average atmospheric pressure | kPa | 101.3 |

## Calculation Process

1. Enter all required parameters in the input fields
2. Click the "Calculate ET₀" button
3. View the results in the "Results" section

## Understanding the Results

After calculation, the following results are displayed:

1. **Intermediate Values**:
   - Saturation Vapor Pressure (es): The vapor pressure at saturation
   - Actual Vapor Pressure (ea): The actual vapor pressure based on relative humidity
   - Slope of Vapor Pressure Curve (Δ): Rate of change of saturation vapor pressure with temperature
   - Psychrometric Constant (γ): Relates partial pressure of water in air to air temperature
   - Net Radiation (Rn): The difference between incoming and outgoing radiation

2. **Final Result**:
   - Reference ET₀: The calculated reference evapotranspiration in mm/day

## Calculation Sheet

For detailed information about the calculation process:

1. Click "Show Calculation Sheet" to view a detailed breakdown of all calculations
2. Click "Print Calculation Sheet" to print or save the calculation details as a PDF

## FAO Penman-Monteith Equation

The calculator uses the FAO Penman-Monteith equation:

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