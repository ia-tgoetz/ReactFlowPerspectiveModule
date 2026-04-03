const webpack = require('webpack'),
    path = require('path'),
    fs = require('fs'),
    MiniCssExtractPlugin = require("mini-css-extract-plugin"),
    AfterBuildPlugin = require('@fiverr/afterbuild-webpack-plugin');

// 1. Updated the Library Name to match your component
const LibName = "DatabaseSchemaDesigner";

// function that copies the result of the webpack from the dist/ folder into the gateway resources folder
function copyToResources() {
    const generatedResourceDir = path.resolve(__dirname, '../..', 'build/generated-resources/mounted/');
    const toCopy = path.resolve(__dirname, "dist/", `${LibName}.js`);
    const resourcePath = path.resolve(generatedResourceDir, `${LibName}.js`);

    // if the desired folder doesn't exist, create it
    if (!fs.existsSync(generatedResourceDir)){
        fs.mkdirSync(generatedResourceDir, {recursive: true})
    }

    try {
        console.log(`copying ${toCopy}...`);
        fs.access(toCopy, fs.constants.R_OK, (err) => {
            if (!err) {
                fs.createReadStream(toCopy)
                    .pipe(fs.createWriteStream(resourcePath));
            } else {
                console.log(`Error when attempting to copy ${toCopy} into ${resourcePath}`)
            }
        });
    } catch (err) {
        console.log(err);
    }
}

var config = {

    // 2. Updated the entry point to point to your new TypeScript file
    entry: {
        DatabaseSchemaDesigner:  path.join(__dirname, "./typescript/databaseschema-designer.ts"),
    },

    output: {
        library: [LibName],  // name as it will be accessible by on the webpack when linked as a script
        path: path.join(__dirname, "dist"),
        filename: `${LibName}.js`,
        libraryTarget: "umd",
        umdNamedDefine: true
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "eval-source-map",

    resolve: {
        extensions: [".jsx", ".js", ".ts", ".tsx", ".d.ts"],
        modules: [
            // look at the local as well as shared node modules when resolving dependencies
            path.resolve(__dirname, "../../node_modules")
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: false
                    }
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$|.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            // tells css-loader not to treat `url('/some/path')` as things that need to resolve at build time
                            // in other words, the url value is simply passed-through as written in the css/sass
                            url: false
                        }
                    },
                    {
                        loader: "sass-loader",
                    }
                ]
            }
        ]
    },
plugins: [
        // This MUST be here if you use MiniCssExtractPlugin.loader in your rules
        new MiniCssExtractPlugin({
            filename: `${LibName}.css`,
        }),
        new AfterBuildPlugin(function(stats) {
            copyToResources();
        }),
    ],

    // IMPORTANT -- don't include these things as part of the webpack bundle.  They are 'provided' via perspective.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "mobx": "mobx",
        "mobx-react": "mobxReact",
        "@inductiveautomation/perspective-client": "PerspectiveClient",
        "@inductiveautomation/perspective-designer": "PerspectiveDesigner",
        // 3. We must tell Webpack NOT to bundle your client package into the designer package. 
        // It will be loaded automatically by Perspective in the browser.
        "@wargoetz/databaseschema-client": "DatabaseSchemaClient" 
    }
};

module.exports = () => config;