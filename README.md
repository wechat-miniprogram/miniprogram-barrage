# Barrage for MiniProgram

[![](https://img.shields.io/npm/v/miniprogram-barrage)](https://www.npmjs.com/package/miniprogram-barrage)
[![](https://img.shields.io/npm/l/miniprogram-barrage)](https://github.com/wechat-miniprogram/miniprogram-barrage)

小程序弹幕组件，覆盖在 原生组件上时，请确保组件已经同层化。[参考用例](https://developers.weixin.qq.com/s/FvXaI3mt7EgY)。弹幕组件的实现采用了 canvas & dom 两种方式，通过 rendering-mode 属性进行指定。dom 的方式兼容性高，当对小程序基础库低版本( v2.9.2 以下）有要求时，可以采用这种渲染方式。canvas 的方式通常性能更好，动画更为流畅，但仅在基础库 v2.9.2 版本及以上可以使用。

注意事项：在开发者工具上，canvas 的渲染方式无法使用 `view` 等普通组件覆盖在弹幕上方，需采用 `cover-view`。真机上可以使用普通的 `view` 覆盖在弹幕上。

## 属性列表

| 属性           | 类型   | 默认值 | 必填 | 说明       |
| -------------- | ------ | ------ | ---- | ---------- |
| z-index        | number | 10     | 否   | 弹幕的层级 |
| rendering-mode | string | canvas | 否   | 渲染模式   |


## 使用方法
1. npm 安装，参考 [小程序 npm 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)

```
npm install --save miniprogram-barrage
```

2. JSON 组件声明
```json
{
  "usingComponents": {
    "barrage": "miniprogram-barrage",
  }
}

```

3. wxml 引入弹幕组件
```html
<video class="video" src="{{src}}">
  <barrage class="barrage" rendering-mode="canvas" z-index="100"></barrage>
</video>
```

4. js 获取实例
```js
 Page({
  onReady() {
    this.addBarrage()
  },
  addBarrage() {
    const barrageComp = this.selectComponent('.barrage')
    this.barrage = barrageComp.getBarrageInstance({
      font: 'bold 16px sans-serif',
      duration: this.data.duration,
      lineHeight: 2,
      mode: 'separate',
      padding: [10, 0, 10, 0],
      range: [0, 1]
    })
    this.barrage.open()
    this.barrage.addData(data)
  }
 })

```

## 配置
### Barrage 默认配置
```js
{
  duration: 15, // 弹幕动画时长 (移动 2000px 所需时长)
  lineHeight: 1.2, // 弹幕行高
  padding: [0, 0, 0, 0], // 弹幕区四周留白
  alpha: 1, // 全局透明度
  font: '10px sans-serif', // 字体大小
  mode: 'separate', // 弹幕重叠 overlap  不重叠 separate
  range: [0, 1], // 弹幕显示的垂直范围，支持两个值。[0,1]表示弹幕整个随机分布，
  tunnelShow: false, // 显示轨道线
  tunnelMaxNum: 30, // 隧道最大缓冲长度
  maxLength: 30, // 弹幕最大字节长度，汉字算双字节
  safeGap: 4, // 发送时的安全间隔
}
```
### 弹幕数据配置
```js
{
  color: '#000000', // 默认黑色
  content: '', // 弹幕内容
  image: {
    head: {src, width, height, gap = 4}, // 弹幕头部添加图片
    tail: {src, width, height, gap = 4}, // 弹幕尾部添加图片
  }
  
}
```

## 接口
```js
barrage.open() // 开启弹幕功能
barrage.close() // 关闭弹幕功能，清空弹幕
barrage.addData(data: array) // 添加弹幕数据
barrage.send(data: object) // 发送一条弹幕数据
barrage.setRange(range: array) // 设置垂直方向显示范围，默认 [0, 1]
barrage.setFont(font: string) // 设置全局字体，注 canvas 的渲染方式仅可设置大小，不支持字体设置
barrage.setAlpha(alpha: number) // 设置全局透明度, alpha 0 ~ 1, 值越小，越透明
barrage.showTunnel() // 显示弹幕轨道
barrage.hideTunnel() // 隐藏弹幕轨道
```
