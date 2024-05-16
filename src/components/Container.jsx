import React from 'react'
import loaderInst from './loader'

const Waiting = Function.prototype
const update = () => {
}
const ParenComponent = React.PureComponent || React.Component

export default class Container extends ParenComponent {
    static idIndex = 0

    // 为组件渲染的容器生成唯一id
    static getIdIndex() {
        return Container.idIndex++
    }

    // 组件信息默认值
    static initChildComState = {
        childMount: Waiting,
        childUnMount: Waiting,
        childShouldUpdate: update,
        needCompareChildPropKeys: []
    }

    // 根据组件暴露的compareKey做对比
    static childComPropsEqual = (preProps, currentProps, propKeys) => {
        if (!propKeys || !preProps.length) {
            return false
        }
        for (const key of propKeys) {
            if (preProps[key] !== currentProps[key]) {
                return false
            }
        }
        return true
    }

    constructor(props) {
        super(props);
        this.state = {
            ...Container.initChildComState
        }
        // 组件容器id
        this.containerId = `__container_${Container.getIdIndex()}`
        // 组件是否被渲染
        this.hasRenderChildCom = false
    }

    async componentDidMount() {
        await this._runEntry()
    }

    // container组件根据props对比情况决定是否重新渲染组件
    async componentDidUpdate(preProps, preState) {
        const { componentKey = '', env = 'prod' } = this.props
        const { componentKey: preComponentKey, env: preEnv } = preProps
        if (componentKey !== preComponentKey || env !== preEnv) {
            this._destroy()
            await this._runEntry()
            this.hasRenderChildCom = false
            return
        }
        this.renderChildComp(preProps, preState)
    }

    componentWillUnmount() {
        this.unmountChildComp()
    }

    getContainer = () => {
        const { containerId } = this
        return document.getElementById(containerId)
    }

    // 渲染子组件
    renderChildComp = (preProps) => {
        const { childMount, childShouldUpdate, needCompareChldComPropKeys } = this.state
        if (this.hasRenderChildCom) {
            // 判断props是否变化
            if (Container.childComPropsEqual(preProps, this.props, needCompareChldComPropKeys)) {
                return
            }
            // 子组件update判断钩子
            if (!childShouldUpdate({...preProps}, {...this.props})) {
                return
            }
        }
        const container = this.getContainer()
        if (container && childMount) {
            // 调用子组件mount
            childMount(container, { ...this.props }, () => {
                this.hasRenderChildCom = true
            })
        }
    }

    // 卸载子组件 - 调用子组件unmount钩子
    unmountChildComp = () => {
        const container = this.getContainer()
        const { childUnMount } = this.state
        if (container && childUnMount) {
            childUnMount(container)
        }
    }

    // 加载子组件资源 并将子组件钩子放入state
    _runEntry = async () => {
        const { compKey } = this.props
        const { componentVersionName, componentVersionUrl } = await requestServer(compKey)
        await this._getComponent(componentVersionName, componentVersionUrl)
    }

    // 异步加载组件并将组件生命周期放入state中
    _getComponent = async (componentVersionName, componentVersionUrl) => {
        return loaderInst.require(componentVersionName, componentVersionUrl)
            .then((comp) => {
                this.setChildCompState(comp)
            })
    }

    _destroy = () => {
        this.setState({
            ...Container.initChildComState
        })
    }

    //将子组件的钩子放入state中,使container组件重新渲染
    setChildCompState = comp => {
        if (comp?.hasOwnProperty?.('mount')) {
            const { mount = Waiting, unmount = Waiting, shouldUpdate = update, compareKey = [] } = comp
            this.setState({
                childMount: mount,
                childUnMount: unmount,
                childShouldUpdate: shouldUpdate,
                needCompareChildPropKeys: compareKey
            })
        } else {
            this.setState({
                childMount: comp
            })
        }
    }

    render() {
        const {containerStyle = {}} = this.props
        return (
            <div className="react-container" style={{position: 'relative', ...containerStyle}}>
                <div id={this.containerId} />
            </div>
        )
    }
}