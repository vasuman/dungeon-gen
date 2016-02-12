module.exports = {
    entry: ['babel-polyfill', './src/demo.js'],
    output: {
        path: __dirname + '/build',
        filename: 'out.js'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel',
            query: {
                presets: ['es2015']
            }
        }]
    },
    devServer: {
      watchOptions: {
        aggregateTimeout: 300,
        poll: 1000
      }
    }
}

