module.exports = {
  entry: ['babel-polyfill', './src/demo.js'],
  output: {
    path: __dirname,
    filename: 'build.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        presets: ['es2015']
      }
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
    }]
  },
  devServer: {
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    }
  }
}

