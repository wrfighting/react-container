class Loader {
    constructor() {
        this.installedChunks = {
            // [name]: chunk
        }
        this.promiseCenter = {
            // [name]: {
            //    promise, resolve, reject
            // }
        }
    }

    have(name) {
        return this.installedChunks[name]
    }

    define(name, factory) {
        if (this.have(name)) return
        const chunk = factory()
        this.installedChunks[name] = chunk

        if (!this.promiseCenter[name]) {
            console.warn('chunk is not required, unless define', name)
            return
        }

        const { resolve } = this.promiseCenter[name]
        resolve(chunk)
        this.promiseCenter[name] = null
    }

    require(name, url) {
        if (this.have(name)) {
            return Promise.resolve(this.installedChunks[name])
        }

        if (this.promiseCenter[name]) {
            return this.promiseCenter[name].promise
        }

        const promise = new Promise((resolve, reject) => {
            this.promiseCenter[name] = {
                resolve, reject
            }
        })
        this.promiseCenter[name].promise = promise

        this.addScript(name, url)
        return promise
    }

    addScript(name, url) {
        const head = document.getElementsByTagName('head')[0]
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.async = true
        script.src = url
        script.timeout = 10000

        let timerId = null
        const onScriptComplete = (type) => {
            script.onerror = null
            script.onload = null
            clearTimeout(timerId)

            if (!this.have(name) && type !== 'loaded') {
                const { reject } = this.promiseCenter[name]
                reject(new Error('加载失败'))
                this.promiseCenter[name] = null
            }
        }

        script.onerror = onScriptComplete.bind(this, 'error')
        script.onload = onScriptComplete.bind(this, 'loaded')

        head.append(script)
        timerId = setTimeout(onScriptComplete.bind(this, 'timeout'), 10000)
    }
}

!window.MyAmd && (window.MyAmd = {})
!window.MyAmd.loader && (window.MyAmd.loader = new Loader())

//在组件打包的时候，利用webpack插件，注入模块化代码， window中有my-amd，则直接执行 window['my-amd'](组件名, factory)
// 没有的话用umd兜底

//暴露到全局，供组件调用
if (!window['my-amd']) {
    window['my-amd'] = (name, factory) => {
        window.MyAmd.loader.define(name, factory)
    }
}