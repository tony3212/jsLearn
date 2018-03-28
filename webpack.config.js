module.exports = {
    entry: __dirname + '/src/report.js',
    output: {
        path: __dirname + '/dist',
        publicPath: '/dist/',
        filename: 'bundle.js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: 'babel-loader'
        }]
    },
    devServer: {
        host: "localhost",
        inline: true,
        port: "6060"
    }
};
