# EVAPOTRAN 0.1.0-alpha Release Notes

## Overview

This is the initial alpha release of EVAPOTRAN, a professional evapotranspiration calculator for agricultural applications. This release provides the core functionality for calculating reference evapotranspiration (ET₀) using the FAO Penman-Monteith method, along with several data input methods and visualization tools.

## Key Features

- **Manual Calculator**: Direct input of weather parameters for ET₀ calculation
- **EPW File Import**: Parse and use EnergyPlus Weather (EPW) files for location-specific calculations
- **Weather Visualization**: Generate heatmaps and charts from weather data
- **Live Weather Integration**: Connect to weather APIs for current conditions
- **Responsive Design**: Works on desktop and mobile devices
- **Comprehensive Documentation**: User guides and technical documentation

## Installation

EVAPOTRAN is a client-side web application that can be run locally or deployed to a web server.

### Local Installation

1. Download the release package
2. Extract the files to a local directory
3. Open `index.html` in a modern web browser

### Server Deployment

1. Upload all files to your web server
2. Ensure the directory structure is maintained
3. Access via a web browser

## Known Limitations

As an alpha release, EVAPOTRAN has some known limitations:

1. EPW file parsing may be slow for very large files
2. Visualization rendering issues may occur on some mobile devices
3. Limited browser compatibility testing (works best with Chrome, Firefox, Edge)
4. Documentation is still being expanded

## Feedback and Contributions

We welcome feedback and contributions to improve EVAPOTRAN:

- Report issues on our GitHub repository
- Submit feature requests through the issue tracker
- Contact us at info@flaha.org with questions or suggestions

## License

EVAPOTRAN is licensed under the GNU General Public License v3.0.