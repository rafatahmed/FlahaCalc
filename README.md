# EVAPOTRAN

[![Documentation Status](https://readthedocs.org/projects/evapotran/badge/?version=latest)](https://evapotran-doc.flaha.org/?badge=latest)
[![GitHub release](https://img.shields.io/github/v/release/rafatahmed/FlahaCalc)](https://github.com/rafatahmed/FlahaCalc/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![GitHub issues](https://img.shields.io/github/issues/rafatahmed/FlahaCalc)](https://github.com/rafatahmed/FlahaCalc/issues)
[![GitHub stars](https://img.shields.io/github/stars/rafatahmed/FlahaCalc)](https://github.com/rafatahmed/FlahaCalc/stargazers)

EVAPOTRAN is a professional evapotranspiration calculator for agricultural applications, developed by Flaha Agri Tech. It provides accurate calculations of reference evapotranspiration (ET₀) using the FAO Penman-Monteith method.

## Features

- **Accurate Calculations**: Implements the FAO-56 Penman-Monteith equation for reference evapotranspiration
- **Multiple Input Options**: Manual data entry or import from EPW (EnergyPlus Weather) files
- **Weather Visualization**: Interactive charts and graphs of weather parameters
- **Live Weather Integration**: Connect to weather APIs for real-time data
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Offline Capability**: Can be used without an internet connection

## Documentation

Comprehensive documentation is available at [https://evapotran-doc.flaha.org](https://evapotran-doc.flaha.org)

- **User Guide**: Detailed instructions for using the application
- **Technical Reference**: In-depth information about calculation methods
- **API Documentation**: Details about the JavaScript API
- **Development Guide**: Information for developers

## Installation

### Web Version

The web version is available at [https://flaha.org/evapotran](https://flaha.org/evapotran)

### Local Installation

```bash
# Clone the repository
git clone https://github.com/rafatahmed/FlahaCalc.git

# Navigate to the project directory
cd FlahaCalc

# Install dependencies
npm install

# Start the local server
npm start
```

## Usage

```javascript
// Example of using the EVAPOTRAN API
import { calculateET0 } from 'evapotran';

const result = calculateET0({
  temperature: 25,
  humidity: 50,
  windSpeed: 2.5,
  solarRadiation: 20,
  latitude: 35.6,
  longitude: -78.8,
  elevation: 120,
  date: new Date()
});

console.log(`Reference ET₀: ${result.et0} mm/day`);
```

## Contributing

We welcome contributions to EVAPOTRAN! Please see our [Contributing Guide](https://evapotran-doc.flaha.org/development-contributing) for details.

## License

EVAPOTRAN is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## Citation

If you use EVAPOTRAN in your research, please cite:

```
Al Khashan, R. (2025). EVAPOTRAN: A Professional Evapotranspiration Calculator.
Flaha Agri Tech. https://github.com/rafatahmed/FlahaCalc
```

## Contact

- Email: [info@flaha.org](mailto:info@flaha.org)
- Twitter: [@FlahaAgriTech](https://x.com/Flaha_Ag)
- Website: [https://flaha.org](https://flaha.org)

## Acknowledgments

- Food and Agriculture Organization (FAO) for the Penman-Monteith methodology
- Contributors and testers who have helped improve this software

