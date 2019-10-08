# Barrage for MiniProgram

[![](https://img.shields.io/npm/v/miniprogram-barrage)](https://www.npmjs.com/package/miniprogram-barrage)
[![](https://img.shields.io/npm/l/miniprogram-barrage)](https://github.com/wechat-miniprogram/miniprogram-barrage)

小程序弹幕组件。通过 view 的 transform 移动弹幕，覆盖在 原生组件上时，请确保组件已经同层化。[参考用例]()


## 使用方法
1. npm 安装，参考 [小程序 npm 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)

```
npm install --save miniprogram-barrage
```

2. JSON 组件声明
```
{
  "usingComponents": {
    "barrage": "miniprogram-barrage",
  }
}

```

3. wxml 引入弹幕组件
```
<video class="video" src="{{src}}">
  <barrage class="barrage"></barrage>
</video>
```

4. js 获取实例
```
 Page({
  onReady() {
    this.addBarrage()
  },
  addBarrage() {
    const barrageComp = this.selectComponent('.barrage')
    this.barrage = barrageComp.getBarrageInstance({
      font: 'bold 16px sans-serif',
      duration: 10,
      lineHeight: 2,
      mode: 'separate',
      padding: [10, 0, 10, 0],
      tunnelShow: false
    })
    this.barrage.open()
    this.barrage.addData(data)
  }
 })

```

## 配置
### Barrage 默认配置
```
{
  duration: 10, // 弹幕动画时长 (移动 2000px 所需时长)
  lineHeight: 1.2, // 弹幕行高
  padding: [0, 0, 0, 0], // 弹幕区四周留白
  alpha: 1, // 全局透明度
  font: '10px sans-serif', // 全局字体
  mode: 'separate', // 弹幕重叠 overlap  不重叠 separate
  range: [0, 1], // 弹幕显示的垂直范围，支持两个值。[0,1]表示弹幕整个随机分布，
  tunnelShow: false, // 显示轨道线
  tunnelMaxNum: 30, // 隧道最大缓冲长度
  maxLength: 30, // 弹幕最大字节长度，汉字算双字节
  safeGap: 4, // 发送时的安全间隔
  enableTap: false, // 点击弹幕停止动画高亮显示
}
```
### 弹幕数据配置
```
{
  color: '#000000', // 默认黑色
  content: '', // 弹幕内容
  image: {
    head: {src, width, height}, // 弹幕头部添加图片
    tail: {src, width, height}, // 弹幕尾部添加图片
    gap: 4 // 图片与文本间隔
  }
  
}
```

## 接口
```
barrage.open() // 开启弹幕功能
barrage.close() // 关闭弹幕功能，清空弹幕
barrage.addData() // 添加弹幕数据
barrage.setRange() // 设置垂直方向显示范围
barrage.setFont() // 设置全局字体
barrage.setAlpha() // 设置全局透明度
barrage.showTunnel() // 显示弹幕轨道
barrage.hideTunnel() // 隐藏弹幕轨道
```

## 说明
1. 通过 canvas 实现弹幕组件时，对于低版本基础库由于缺失 raf 接口，动画效果不够流畅。
2. 2.9.0 起小程序新的 canvas 接口可替代 view 的实现，[参考片段](https://developers.weixin.qq.com/s/zcNZRXmi7nbe)
