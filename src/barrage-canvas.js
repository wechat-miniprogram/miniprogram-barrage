import {substring, getFontSize, getRandom} from './utils'

class Bullet {
  constructor(barrage, opt = {}) {
    const defaultBulletOpt = {
      color: '#000000', // 默认黑色
      font: '10px sans-serif',
      fontSize: 10, // 全局字体大小
      content: '',
      textWidth: 0,
      speed: 0, // 根据屏幕停留时长计算
      x: 0,
      y: 0,
      tunnelId: 0,
      // 弹幕图片结构
      // {
      //   image, // 图片资源
      //   dWidth, // 绘制宽度
      //   dHeight, // 绘制高度
      //   position // 显示位置，弹幕开头(head)、结尾(tail)
      //   gap // 与弹幕文字的距离，默认4
      // }
      images: []
      // status: 0 //0:待播放 1: 未完全进入屏幕 2: 完全进入屏幕 3: 完全退出屏幕
    }
    Object.assign(this, defaultBulletOpt, opt)

    this.barrage = barrage
    this.ctx = barrage.ctx
  }

  move() {
    this.images.forEach(item => {
      const {
        image,
        dWidth = this.fontSize,
        dHeight = this.fontSize,
        position = 'head',
        gap = 4
      } = item
      const x = position === 'tail' ? this.x + this.textWidth + gap : this.x - gap - dWidth
      const y = this.y - 0.5 * dHeight
      this.ctx.drawImage(image, x, y, dWidth, dHeight)
    })
    this.x = this.x - this.speed

    this.ctx.fillStyle = this.color
    this.ctx.fillText(this.content, this.x, this.y)
  }
}

// tunnel（轨道）
class Tunnel {
  constructor(barrage, opt = {}) {
    const defaultTunnelOpt = {
      activeQueue: [], // 正在屏幕中列表
      nextQueue: [], // 待播放列表
      maxNum: 10,
      freeNum: 10, // 剩余可添加量
      height: 0,
      width: 0,
      disabled: false,
      tunnelId: 0,
      safeArea: 4,
      sending: false, // 弹幕正在发送
    }
    Object.assign(this, defaultTunnelOpt, opt)

    this.freeNum = this.maxNum
    this.barrage = barrage // 控制中心
    this.ctx = barrage.ctx
  }

  disable() {
    this.disabled = true
  }

  enable() {
    this.disabled = false
  }

  clear() {
    this.activeQueue = []
    this.nextQueue = []
    this.sending = false
    this.freeNum = this.maxNum
  }

  addBullet(bullet) {
    if (this.disabled) return
    if (this.freeNum === 0) return
    this.nextQueue.push(bullet)
    this.freeNum--
    if (this.freeNum === 0) {
      this.barrage.removeIdleTunnel(this.tunnelId)
    }
  }

  animate() {
    if (this.disabled) return
    // 无正在发送弹幕，添加一条
    const nextQueue = this.nextQueue
    const activeQueue = this.activeQueue
    if (!this.sending && nextQueue.length > 0) {
      const bullet = nextQueue.shift()
      activeQueue.push(bullet)
      this.freeNum++
      this.sending = true
      this.barrage.addIdleTunnel(this.tunnelId)
    }

    if (activeQueue.length > 0) {
      activeQueue.forEach(bullet => bullet.move())
      const head = activeQueue[0]
      const tail = activeQueue[activeQueue.length - 1]
      // 队首移出屏幕
      if (head.x + head.textWidth < 0) {
        activeQueue.shift()
      }
      // 队尾离开超过安全区
      if (tail.x + tail.textWidth + this.safeArea < this.width) {
        this.sending = false
      }
    }
  }
}

class Barrage {
  constructor(opt = {}) {
    this._promise = new Promise((resolve, reject) => {
      const defaultBarrageOpt = {
        font: '10px sans-serif',
        duration: 10, // 弹幕屏幕停留时长
        lineHeight: 1.2,
        padding: [0, 0, 0, 0],
        tunnelHeight: 0,
        tunnelNum: 0,
        tunnelMaxNum: 30, // 隧道最大缓冲长度
        maxLength: 30, // 最大字节长度，汉字算双字节
        safeArea: 4, // 发送时的安全间隔
        tunnels: [],
        idleTunnels: [],
        enableTunnels: [],
        alpha: 1, // 全局透明度
        mode: 'separate', // 弹幕重叠 overlap  不重叠 separate
        range: [0, 1], // 弹幕显示的垂直范围，支持两个值。[0,1]表示弹幕整个随机分布，
        fps: 60, // 刷新率
        tunnelShow: false, // 显示轨道线
        comp: null, // 组件实例
      }
      Object.assign(this, defaultBarrageOpt, opt)
      const systemInfo = wx.getSystemInfoSync()
      this.ratio = systemInfo.pixelRatio
      this.selector = '#weui-canvas'

      const query = this.comp.createSelectorQuery()
      query.select(this.selector).boundingClientRect()
      query.select(this.selector).node()
      query.exec((res) => {
        this.canvas = res[1].node
        this.init(res[0])
        if (this.canvas) {
          resolve()
        } else {
          reject()
        }
      })
    })
  }

  init(opt = {}) {
    this.width = opt.width
    this.height = opt.height
    this.fontSize = getFontSize(this.font)
    this.innerDuration = this.transfromDuration2Canvas(this.duration)

    const ratio = this.ratio// 设备像素比
    this.canvas.width = this.width * ratio
    this.canvas.height = this.height * ratio
    this.ctx = this.canvas.getContext('2d')
    this.ctx.scale(ratio, ratio)

    this.ctx.textBaseline = 'middle'
    this.ctx.globalAlpha = this.alpha
    this.ctx.font = this.font

    this.idleTunnels = []
    this.enableTunnels = []
    this.tunnels = []

    this.availableHeight = (this.height - this.padding[0] - this.padding[2])
    this.tunnelHeight = this.fontSize * this.lineHeight
    this.tunnelNum = Math.floor(this.availableHeight / this.tunnelHeight)
    for (let i = 0; i < this.tunnelNum; i++) {
      this.idleTunnels.push(i) // 空闲的隧道id集合
      this.enableTunnels.push(i) // 可用的隧道id集合
      this.tunnels.push(new Tunnel(this, { // 隧道集合
        width: this.width,
        height: this.tunnelHeight,
        safeArea: this.safeArea,
        maxNum: this.tunnelMaxNum,
        tunnelId: i,
      }))
    }
    // 筛选符合范围的隧道
    this.setRange()
    this._isActive = false
  }

  transfromDuration2Canvas(duration) {
    // 2000 是 dom 中移动的距离
    return duration * this.width / 2000
  }

  // 设置显示范围 range: [0,1]
  setRange(range) {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      range = range || this.range
      const top = range[0] * this.tunnelNum
      const bottom = range[1] * this.tunnelNum

      // 释放符合要求的隧道
      // 找到目前空闲的隧道
      const idleTunnels = []
      const enableTunnels = []
      this.tunnels.forEach((tunnel, tunnelId) => {
        if (tunnelId >= top && tunnelId < bottom) {
          tunnel.enable()
          enableTunnels.push(tunnelId)
          if (this.idleTunnels.indexOf(tunnelId) >= 0) {
            idleTunnels.push(tunnelId)
          }
        } else {
          tunnel.disable()
        }
      })
      this.idleTunnels = idleTunnels
      this.enableTunnels = enableTunnels
      this.range = range
    })
  }

  setFont(font) {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      if (typeof font !== 'string') return

      this.font = font
      this.fontSize = getFontSize(this.font)
      this.ctx.font = font
    })
  }

  setAlpha(alpha) {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      if (typeof alpha !== 'number') return

      this.alpha = alpha
      this.ctx.globalAlpha = alpha
    })
  }

  setDuration(duration) {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      if (typeof duration !== 'number') return

      this.clear()
      this.duration = duration
      this.innerDuration = this.transfromDuration2Canvas(duration)
    })
  }

  // 开启弹幕
  open() {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      if (this._isActive) return
      this._isActive = true
      this.play()
    })
  }

  // 关闭弹幕，清除所有数据
  close() {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      this._isActive = false
      this.pause()
      this.clear()
    })
  }

  // 开启弹幕滚动
  play() {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      this._rAFId = this.canvas.requestAnimationFrame(() => {
        this.animate()
        this.play()
      })
    })
  }

  // 停止弹幕滚动
  pause() {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      if (typeof this._rAFId === 'number') {
        this.canvas.cancelAnimationFrame(this._rAFId)
      }
      if (typeof this._timer === 'number') {
        clearInterval(this._timer)
      }
    })
  }

  // 清空屏幕和缓冲的数据
  clear() {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      this.ctx.clearRect(0, 0, this.width, this.height)
      this.tunnels.forEach(tunnel => tunnel.clear())
    })
  }

  // 添加一批弹幕，轨道满时会被丢弃
  addData(data = []) {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      if (!this._isActive) return
      data.forEach(item => this.addBullet2Tunnel(item))
    })
  }

  // 发送一条弹幕
  // 为保证发送成功，选取一条可用隧道，替换待发送队列队头元素
  send(opt = {}) {
    // eslint-disable-next-line promise/catch-or-return
    this._promise.then(() => {
      const tunnel = this.getEnableTunnel()
      if (tunnel === null) return

      opt.tunnelId = tunnel.tunnelId
      const bullet = this.registerBullet(opt)
      tunnel.nextQueue[0] = bullet
    })
  }

  // 添加至轨道 {content, color}
  addBullet2Tunnel(opt = {}) {
    const tunnel = this.getIdleTunnel()
    if (tunnel === null) return

    opt.tunnelId = tunnel.tunnelId
    const bullet = this.registerBullet(opt)
    tunnel.addBullet(bullet)
  }

  registerBullet(opt = {}) {
    opt.tunnelId = opt.tunnelId || 0
    opt.content = substring(opt.content, this.maxLength)
    const textWidth = this.getTextWidth(opt.content)
    const distance = this.mode === 'overlap' ? this.width + textWidth : this.width
    opt.textWidth = textWidth
    opt.speed = distance / (this.innerDuration * this.fps)
    opt.fontSize = this.fontSize
    opt.x = this.width
    opt.y = this.tunnelHeight * (opt.tunnelId + 0.5) + this.padding[0]
    return new Bullet(this, opt)
  }

  // 每帧执行的操作
  animate() {
    // 清空画面后重绘
    this.ctx.clearRect(0, 0, this.width, this.height)
    if (this.tunnelShow) {
      this.drawTunnel()
    }
    this.tunnels.forEach(tunnel => tunnel.animate())
  }

  showTunnel() {
    this.tunnelShow = true
  }

  hideTunnel() {
    this.tunnelShow = false
  }

  removeIdleTunnel(tunnelId) {
    const idx = this.idleTunnels.indexOf(tunnelId)
    if (idx >= 0) this.idleTunnels.splice(idx, 1)
  }

  addIdleTunnel(tunnelId) {
    const idx = this.idleTunnels.indexOf(tunnelId)
    if (idx < 0) this.idleTunnels.push(tunnelId)
  }

  // 从可用的隧道中随机挑选一个
  getEnableTunnel() {
    if (this.enableTunnels.length === 0) return null
    const index = getRandom(this.enableTunnels.length)
    return this.tunnels[this.enableTunnels[index]]
  }

  // 从还有余量的隧道中随机挑选一个
  getIdleTunnel() {
    if (this.idleTunnels.length === 0) return null
    const index = getRandom(this.idleTunnels.length)
    return this.tunnels[this.idleTunnels[index]]
  }

  getTextWidth(content) {
    this.ctx.font = this.font
    return Math.ceil(this.ctx.measureText(content).width)
  }

  drawTunnel() {
    const ctx = this.ctx
    const tunnelColor = '#CCB24D'
    for (let i = 0; i <= this.tunnelNum; i++) {
      const y = this.padding[0] + i * this.tunnelHeight
      ctx.beginPath()
      ctx.strokeStyle = tunnelColor
      ctx.setLineDash([5, 10])
      ctx.moveTo(0, y)
      ctx.lineTo(this.width, y)
      ctx.stroke()
      if (i < this.tunnelNum) {
        ctx.fillStyle = tunnelColor
        ctx.fillText(`弹道${i + 1}`, 10, this.tunnelHeight / 2 + y)
      }
    }
  }
}

export default Barrage
