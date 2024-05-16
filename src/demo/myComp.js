import React from 'react'
import ReactDOM from 'react-dom'

/**
 * 打包的时候，dependences里写上react react-dom，把这两个都直接打包进最终产物
 * 这样业务方用的时候就不会有react版本冲突问题，业务方render的时候直接调用的是组件的mount方法，用的是组件自己的react-dom来渲染的了
 * 这样子的缺点就是会有冗余的react代码了
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
const App = props => {
    return (
        <div>haha</div>
    )
}

function mount(container, props, callback) {
    ReactDOM.render(<App {...props}/>, container, callback)
}

function unmount(container) {
    ReactDOM.unmountComponentAtNode(container)
}

function shouldUpdate(preProps, currentProps) {
    return preProps.text !== currentProps.text
}

export default {
    mount,
    unmount,
    shouldUpdate,
    compareKey: []  // 当前组件的哪些props发生变化时更新组件
}
