const path = require('path');

module.exports = {
  entry: './EVAPOTRAN/js/script.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'EVAPOTRAN/dist'),
  },
  mode: 'production',
  optimization: {
    minimize: true
  }
};

