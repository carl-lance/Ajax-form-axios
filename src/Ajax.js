import $ from './jquery-esm-3.6.0.js';
import {json2xml} from "./json2xml.js";

const ajax = $.ajax;

class Interceptor {
    constructor() {
        this.interceptors = [];
    }

    use(func) {
        this.interceptors.push(func);
    }

    remove() {
        this.interceptors.forEach(function (item, index) {

        })
    }
}

class Ajax {
    constructor(options = {}) {
        //默认地址
        this.baseURL = options.baseURL || '';
        //超时时间
        this.timeOut = options.timeOut || 500;
        //请求头
        this.headers = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8;'
        };
        //拦截器
        this.interceptors = {
            request: new Interceptor(),
            response: new Interceptor()
        }

        //缓存
        this.cache = options.cache !== undefined ? options.cache : false;
        //异步
        this.async = options.async !== undefined ? options.async : true;
        this.crossDomain = options.crossDomain ;
        this.xhrFields = options.xhrFields ||{};

        const headers = options.headers || {};
        const scope = this;

        for (const headersKey in headers) {
            scope.headers[headersKey] = headers[headersKey];
        }

        //立即发送
        if (options.url && options.data) this.send(options);
    }

    send(options) {
        const scope = this;

        //合并/处理请求参数
        options = {
            headers: scope.headers,
            timeout: scope.timeOut,
            cache: scope.cache,
            async: scope.async,
            crossDomain: scope.crossDomain,
            xhrFields: scope.xhrFields,
            cleanSend: false,
            ...options
        };
        if (options.url.indexOf('/') === 0) options.url = scope.baseURL + options.url;

        let requestOptions = null;
        scope.interceptors.request.interceptors.forEach(function (itemAction) {
            if (typeof itemAction === 'function') requestOptions = itemAction(options);
        })
        options = formatData(requestOptions || options);

        function responseInterceptor(response) {
            let result = response;
            scope.interceptors.response.interceptors.forEach(function (itemAction) {
                let resultData = null;
                if (typeof itemAction === 'function') resultData = itemAction(response);
                if (resultData && response.status === 200) result = resultData;
            })

            if (response.status !== 200) {
                options.context && options.error.bind(options.context);
                options.error(response);
                return;
            }
            options.context && options.success.bind(options.context);
            options.success(result);
        }

        const params = {};
        params.url = options.url;
        params.type = options.type;
        params.headers = options.headers;
        params.timeout = options.timeout;
        params.processData = options.processData;
        params.contentType = options.headers["Content-Type"];
        params.async = options.async !== undefined ? options.async : true;
        params.cache = options.cache !== undefined ? options.cache : true;
        params.global = options.global !== undefined ? options.global : false;
        if (options.crossDomain !== undefined)params.crossDomain = options.crossDomain;
        if (options.xhrFields !== undefined)params.xhrFields= options.xhrFields;
        if (options.options !== undefined) params.options = options.options;
        if (options.dataType !== undefined) params.dataType = options.dataType;
        if (options.data !== undefined) params.data = options.data;
        if (options.username !== undefined) params.username = options.username;
        if (options.password !== undefined) params.password = options.password;
        if (options.jsonp !== undefined) params.jsonp = options.jsonp;
        if (options.jsonCallback !== undefined) params.jsonCallback = options.jsonCallback;

        let resultXHR = null,resultData=null;
        params.beforeSend = function (xhr) {
            options.before && options.before();
            resultXHR = xhr;
            return !options.cleanSend;
        };
        params.success = function (data) {
            resultData={data, status: resultXHR.status, statusText: resultXHR.statusText};
            responseInterceptor(resultData);
        }
        params.error = function (errorMsg) {
            resultData={status: errorMsg.status, statusText: errorMsg.statusText};
            responseInterceptor(resultData);
        }

        //发送请求
        ajax(params);

        if (params.async===false)return resultData;
    }

}

Ajax.createInstance = function (options) {

    const base = new Ajax(options);
    const instance = bind(Ajax.prototype.send, base);

    extend(instance, Ajax.prototype, base);
    extend(instance, base);

    instance.createInstance = Ajax.createInstance;

    return instance;
}

const toString = Object.prototype.toString

function isArray(val) {
    return toString.call(val) === '[object Array]';
}

function forEach(obj, fn) {
    if (obj === null || typeof obj === 'undefined') {
        return;
    }
    if (typeof obj !== 'object') {
        obj = [obj];
    }

    if (isArray(obj)) {
        for (var i = 0, l = obj.length; i < l; i++) {
            fn.call(null, obj[i], i, obj);
        }
    } else {
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                fn.call(null, obj[key], key, obj);
            }
        }
    }
}

function extend(a, b, thisArg) {
    forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
            a[key] = bind(val, thisArg);
        } else {
            a[key] = val;
        }
    });
    return a;
}

function bind(fn, thisArg) {
    return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
    };
}

function formatData(options = {}) {
    const contentTypeStr = (options.headers['Content-Type'] || '');
    const type = contentTypeStr.substring(0, contentTypeStr.indexOf(';'));

    if (options.data === undefined) return undefined;
    if (!options.data) return null;

    switch (type) {
        case 'application/x-www-form-urlencoded':
            //默认
            break;
        case 'multipart/form-data':
            //表单
            const formData = new FormData();
            for (const dataKey in options.data) {
                formData.append(dataKey, options.data[dataKey]);
            }
            options.data = formData;
            break;
        case 'application/json':
            //JSON
            options.data = JSON.stringify(options.data);
            break;
        case 'text/xml':
            //XML
            options.data = json2xml(data, {})
            break;
    }

    return options;
}


export default Ajax;
