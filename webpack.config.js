const path = require('path');
const WebpackAutoInject = require('webpack-auto-inject-version');

module.exports = {
  entry: './src/chrome_mux.js',
  output: {
    filename: 'chromecast-mux.js',
    path: path.resolve(__dirname, 'build'),
    library: 'chromecastMux',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules|scripts|dist|build\//,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }
      }
    ]
  },
  plugins: [
    new WebpackAutoInject({
      components: {
        AutoIncreaseVersion: false,
        InjectAsComment: false,
        InjectByTag: true
      }
    })
  ]
};
