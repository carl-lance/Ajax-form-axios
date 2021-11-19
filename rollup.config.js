import {nodeResolve} from "@rollup/plugin-node-resolve";
import {terser} from "rollup-plugin-terser";
//import babel from '@rollup/plugin-babel';

function header() {

    return {

        renderChunk(code) {

            return "// Ajax/zjw/license\n" + code;

        }

    };

}

export default [

    {
        input: './src/Ajax.js',
        plugins: [
            header(),
            nodeResolve(),
            //terser(),
        ],
        output: [
            {
                format: 'esm',
                file: './build/ajax.js'
            }
        ]
    },
    {
        input: './src/Ajax.js',
        plugins: [
            header(),
            nodeResolve(),
            terser(),
        ],
        output: [
            {
                format: 'esm',
                file: './build/ajax.min.js'
            }
        ]
    },

];
