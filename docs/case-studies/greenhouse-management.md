# Case Study: Greenhouse Management

## Overview

This case study examines how EVAPOTRAN was used to optimize irrigation and climate control in a commercial greenhouse operation growing tomatoes and cucumbers in a Mediterranean climate.

## Client Profile

**Organization**: GreenHarvest Farms
**Location**: Valencia, Spain
**Operation Size**: 2.5 hectares of greenhouse space
**Crops**: Tomatoes, cucumbers, and bell peppers
**Previous System**: Timer-based irrigation with manual adjustments

## Challenges

GreenHarvest Farms faced several challenges in their greenhouse operation:

1. **Inconsistent Irrigation**: Timer-based irrigation didn't account for changing weather conditions
2. **High Water Usage**: Excessive water application during cooler periods
3. **Climate Control Inefficiency**: HVAC systems running unnecessarily during certain periods
4. **Crop Stress**: Plants showing signs of water stress despite regular irrigation
5. **Energy Costs**: High energy consumption for climate control

## Implementation

GreenHarvest Farms implemented EVAPOTRAN as part of their greenhouse management system:

1. **Weather Station Integration**: Connected local weather station data to EVAPOTRAN
2. **Daily ET₀ Calculations**: Automated daily calculation of reference evapotranspiration
3. **Crop Coefficient Application**: Applied specific crop coefficients for tomatoes, cucumbers, and peppers
4. **Irrigation System Connection**: Linked EVAPOTRAN outputs to automated irrigation controllers
5. **Climate Control Integration**: Used ET₀ data to inform HVAC system operation

## Technical Setup

The technical implementation included:

1. **Data Collection**:
   - Weather station measuring temperature, humidity, solar radiation, and wind speed
   - Soil moisture sensors at multiple depths
   - Indoor climate sensors throughout the greenhouse

2. **EVAPOTRAN Configuration**:
   - Hourly weather data import
   - Crop-specific coefficient settings
   - Custom visualization dashboards for greenhouse managers

3. **Integration Points**:
   - API connection to irrigation controllers
   - Data export to climate control systems
   - Mobile alerts for irrigation events

## Results

After six months of implementation, GreenHarvest Farms achieved significant improvements:

1. **Water Savings**: 27% reduction in total water usage
2. **Energy Efficiency**: 18% reduction in climate control energy consumption
3. **Crop Yield**: 12% increase in tomato yield, 9% increase in cucumber yield
4. **Quality Improvement**: Reduced incidence of blossom end rot by 65%
5. **Labor Efficiency**: 15 hours per week saved in manual system adjustments

## Key Insights

The implementation revealed several important insights:

1. **Microclimate Variations**: Significant ET₀ variations within different greenhouse zones
2. **Temporal Patterns**: Clear patterns in daily ET₀ that could be anticipated
3. **Crop-Specific Responses**: Different crops showed varying sensitivity to ET₀-based irrigation
4. **Seasonal Adjustments**: Crop coefficients needed seasonal adjustment for optimal results

## Visualization Impact

The visualization tools in EVAPOTRAN proved particularly valuable:

1. **Heatmaps**: Helped identify patterns in water demand throughout the growing season
2. **Time Series Charts**: Allowed comparison of ET₀ with actual crop water use
3. **Comparison Views**: Enabled side-by-side analysis of different greenhouse zones

![Example Greenhouse ET₀ Heatmap](../img/greenhouse-heatmap-example.png)

## Challenges Encountered

The implementation wasn't without challenges:

1. **Sensor Calibration**: Weather sensors required frequent calibration
2. **Staff Training**: Initial resistance to changing established irrigation practices
3. **System Integration**: Some compatibility issues with legacy irrigation controllers
4. **Data Volume**: Managing the large volume of hourly climate data

## Future Developments

Based on this implementation, GreenHarvest Farms is planning several enhancements:

1. **Machine Learning Integration**: Developing predictive models for ET₀ forecasting
2. **Expanded Sensor Network**: Adding more granular climate monitoring
3. **Crop-Specific Dashboards**: Creating specialized interfaces for different crops
4. **Mobile Application**: Developing a mobile app for remote monitoring and control

## Conclusion

The implementation of EVAPOTRAN at GreenHarvest Farms demonstrates how precision evapotranspiration calculation can significantly improve greenhouse operations, leading to water and energy savings while improving crop yield and quality.

The case study highlights the importance of:

1. **Data-Driven Irrigation**: Moving beyond timer-based systems to weather-responsive irrigation
2. **Integration Capabilities**: Connecting evapotranspiration data with control systems
3. **Visualization Tools**: Using visual data representation to identify patterns and anomalies
4. **Crop-Specific Approach**: Tailoring water management to specific crop needs

For greenhouse operations looking to optimize resource use and improve crop outcomes, EVAPOTRAN provides a scientific foundation for precision irrigation management.