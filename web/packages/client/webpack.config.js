const webpack = require('webpack'),
    path = require('path'),
    fs = require('fs'),
    MiniCssExtractPlugin = require("mini-css-extract-plugin"),
    AfterBuildPlugin = require('@fiverr/afterbuild-webpack-plugin');

const LibName = "WARGoetzComponents";

function copyToResources() {
    const generatedResourcesDir = path.resolve(__dirname, '../..', 'build/generated-resources/mounted/');
    const jsToCopy = path.resolve(__dirname, "dist/", `${LibName}.js`);
    const cssToCopy = path.resolve(__dirname, "dist/", `${LibName}.css`);
    const jSResourcePath = path.resolve(generatedResourcesDir, `${LibName}.js`);
    const cssResourcePath = path.resolve(generatedResourcesDir, `${LibName}.css`);

    const toCopy = [{from:jsToCopy, to: jSResourcePath}, {from: cssToCopy, to: cssResourcePath}];

    if (!fs.existsSync(generatedResourcesDir)){
        fs.mkdirSync(generatedResourcesDir, {recursive: true})
    }

    toCopy.forEach( file => {
        try {
            fs.access(file.from, fs.constants.R_OK, (err) => {
                if (!err) {
                    fs.createReadStream(file.from).pipe(fs.createWriteStream(file.to));
                }
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    });
}

const config = {
    entry: {
        [LibName]:  path.join(__dirname, "./typescript/perspective-client.ts")
    },
    output: {
        library: [LibName],
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    devtool: "source-map",
    resolve: {
        extensions: [".jsx", ".js", ".ts", ".tsx", ".d.ts", ".css", ".scss"],
        modules: [
            "node_modules", 
            path.resolve(__dirname, "../../node_modules") 
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: { transpileOnly: true }
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$|.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    { loader: 'css-loader', options: { url: false } },
                    { loader: "sass-loader" }
                ]
            }
        ]
    },
    plugins: [
        new AfterBuildPlugin(function(stats) { copyToResources(); }),
        new MiniCssExtractPlugin({ filename: "[name].css" })
    ],
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "mobx": "mobx",
        "mobx-react": "mobxReact",
        "@inductiveautomation/perspective-client": "PerspectiveClient"
    }
};

module.exports = () => config;