# Calculation Methods

This page documents the mathematical methods and equations used in EVAPOTRAN to calculate reference evapotranspiration (ET₀).

## FAO Penman-Monteith Equation

EVAPOTRAN implements the FAO Penman-Monteith equation as defined in FAO Irrigation and Drainage Paper No. 56:

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

## Calculation Steps

### 1. Atmospheric Parameters

#### Atmospheric Pressure

If not provided, atmospheric pressure is calculated from elevation:

$$P = 101.3 \left(\frac{293 - 0.0065z}{293}\right)^{5.26}$$

Where:
- $P$ = atmospheric pressure [kPa]
- $z$ = elevation above sea level [m]

#### Psychrometric Constant

$$\gamma = \frac{c_p P}{\varepsilon \lambda} = 0.000665 P$$

Where:
- $\gamma$ = psychrometric constant [kPa °C⁻¹]
- $P$ = atmospheric pressure [kPa]
- $c_p$ = specific heat of air at constant pressure [MJ kg⁻¹ °C⁻¹]
- $\varepsilon$ = ratio of molecular weight of water vapor to dry air [0.622]
- $\lambda$ = latent heat of vaporization [MJ kg⁻¹]

### 2. Humidity Parameters

#### Saturation Vapor Pressure

$$e^o(T) = 0.6108 \exp\left(\frac{17.27 T}{T + 237.3}\right)$$

Where:
- $e^o(T)$ = saturation vapor pressure at temperature T [kPa]
- $T$ = air temperature [°C]

#### Actual Vapor Pressure

From relative humidity:

$$e_a = \frac{RH}{100} \times e_s$$

Where:
- $e_a$ = actual vapor pressure [kPa]
- $RH$ = relative humidity [%]
- $e_s$ = saturation vapor pressure [kPa]

#### Slope of Saturation Vapor Pressure Curve

$$\Delta = \frac{4098 \times 0.6108 \exp\left(\frac{17.27 T}{T + 237.3}\right)}{(T + 237.3)^2}$$

Where:
- $\Delta$ = slope of saturation vapor pressure curve [kPa °C⁻¹]
- $T$ = air temperature [°C]

### 3. Radiation Parameters

#### Inverse Relative Distance Earth-Sun

$$d_r = 1 + 0.033 \cos\left(\frac{2\pi J}{365}\right)$$

Where:
- $d_r$ = inverse relative distance Earth-Sun
- $J$ = day of the year [1-365]

#### Solar Declination

$$\delta = 0.409 \sin\left(\frac{2\pi J}{365} - 1.39\right)$$

Where:
- $\delta$ = solar declination [radians]
- $J$ = day of the year [1-365]

#### Sunset Hour Angle

$$\omega_s = \arccos(-\tan(\phi) \tan(\delta))$$

Where:
- $\omega_s$ = sunset hour angle [radians]
- $\phi$ = latitude [radians]
- $\delta$ = solar declination [radians]

#### Extraterrestrial Radiation

$$R_a = \frac{24(60)}{\pi} G_{sc} d_r [\omega_s \sin(\phi) \sin(\delta) + \cos(\phi) \cos(\delta) \sin(\omega_s)]$$

Where:
- $R_a$ = extraterrestrial radiation [MJ m⁻² day⁻¹]
- $G_{sc}$ = solar constant [0.0820 MJ m⁻² min⁻¹]
- $d_r$ = inverse relative distance Earth-Sun
- $\omega_s$ = sunset hour angle [radians]
- $\phi$ = latitude [radians]
- $\delta$ = solar declination [radians]

#### Daylight Hours

$$N = \frac{24}{\pi} \omega_s$$

Where:
- $N$ = daylight hours [hours]
- $\omega_s$ = sunset hour angle [radians]

#### Solar Radiation

If measured solar radiation is not available, it can be estimated from sunshine duration:

$$R_s = \left(a_s + b_s \frac{n}{N}\right) R_a$$

Where:
- $R_s$ = solar radiation [MJ m⁻² day⁻¹]
- $n$ = actual sunshine duration [hours]
- $N$ = maximum possible sunshine duration [hours]
- $R_a$ = extraterrestrial radiation [MJ m⁻² day⁻¹]
- $a_s$ and $b_s$ are regression constants (typically $a_s = 0.25$ and $b_s = 0.50$)

#### Clear-Sky Solar Radiation

$$R_{so} = (0.75 + 2 \times 10^{-5} z) R_a$$

Where:
- $R_{so}$ = clear-sky solar radiation [MJ m⁻² day⁻¹]
- $z$ = elevation above sea level [m]
- $R_a$ = extraterrestrial radiation [MJ m⁻² day⁻¹]

#### Net Shortwave Radiation

$$R_{ns} = (1 - \alpha) R_s$$

Where:
- $R_{ns}$ = net shortwave radiation [MJ m⁻² day⁻¹]
- $\alpha$ = albedo (0.23 for the reference crop)
- $R_s$ = solar radiation [MJ m⁻² day⁻¹]

#### Net Longwave Radiation

$$R_{nl} = \sigma \left[\frac{T_{max,K}^4 + T_{min,K}^4}{2}\right] \