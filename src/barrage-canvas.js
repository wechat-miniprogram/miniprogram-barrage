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
      // image: {
      //   head: {src, width, height}, // 弹幕头部添加图片
      //   tail: {src, width, height}, // 弹幕尾部添加图片
      //   gap: 4 // 图片与文本间隔
      // }
      image: {},
      imageHead: null, // Image 对象
      imageTail: null,
      // status: 0 //0:待播放 1: 未完全进入屏幕 2: 完全进入屏幕 3: 完全退出屏幕
    }
    Object.assign(this, defaultBulletOpt, opt)

    this.barrage = barrage
    this.ctx = barrage.ctx
    this.canvas = barrage.canvas
  }

  move() {
    if (this.image.head && !this.imageHead) {
      const Image = this.canvas.createImage()
      Image.src = this.image.head.src
      Image.onload = () => {
        this.imageHead = Image
      }
      Image.onerror = () => {
        // eslint-disable-next-line no-console
        console.log(`Fail to load image: ${this.image.head.src}`)
      }
    }

    if (this.image.tail && !this.imageTail) {
      const Image = this.canvas.createImage()
      Image.src = this.image.tail.src
      Image.onload = () => {
        this.imageTail = Image
      }
      Image.onerror = () => {
        // eslint-disable-next-line no-console
        console.log(`Fail to load image: ${this.image.tail.src}`)
      }
    }

    if (this.imageHead) {
      const {
        width = this.fontSize,
        height = this.fontSize,
        gap = 4
      } = this.image.head
      const x = this.x - gap - width
      const y = this.y - 0.5 * height
      this.ctx.drawImage(this.imageHead, x, y, width, height)
    }

    if (this.imageTail) {
      const {
        width = this.fontSize,
        height = this.fontSize,
        gap = 4
      } = this.image.tail
      const x = this.x + this.textWidth + gap
      const y = this.y - 0.5 * height
      this.ctx.drawImage(this.imageTail, x, y, width, height)
    }

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
      maxNum: 30,
      freeNum: 30, // 剩余可添加量
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
    this.barrage.addIdleTunnel(this.tunnelId)
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
    const defaultBarrageOpt = {
      font: '10px sans-serif',
      duration: 15, // 弹幕屏幕停留时长
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
    this._ready = false
    this._deferred = []

    const query = this.comp.createSelectorQuery()
    query.select(this.selector).boundingClientRect()
    query.select(this.selector).node()
    query.exec((res) => {
      this.canvas = res[1].node
      this.init(res[0])
      this.ready()
    })
  }

  ready() {
    this._ready = true
    this._deferred.forEach(item => {
      // eslint-disable-next-line prefer-spread
      this[item.callback].apply(this, item.args)
    })

    this._deferred = []
  }

  _delay(method, args) {
    this._deferred.push({
      callback: method,
      args
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
    if (!this._ready) {
      this._delay('setRange', range)
      return
    }

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
  }

  setFont(font) {
    if (!this._ready) {
      this._delay('setFont', font)
      return
    }

    this.font = font
    this.fontSize = getFontSize(this.font)
    this.ctx.font = font
  }

  setAlpha(alpha) {
    if (!this._ready) {
      this._delay('setAlpha', alpha)
      return
    }

    this.alpha = alpha
    this.ctx.globalAlpha = alpha
  }

  setDuration(duration) {
    if (!this._ready) {
      this._delay('setDuration', duration)
      return
    }

    this.clear()
    this.duration = duration
    this.innerDuration = this.transfromDuration2Canvas(duration)
  }

  // 开启弹幕
  open() {
    if (!this._ready) {
      this._delay('open')
      return
    }

    if (this._isActive) return
    this._isActive = true
    this.play()
  }

  // 关闭弹幕，清除所有数据
  close() {
    if (!this._ready) {
      this._delay('close')
      return
    }

    if (!this._isActive) return
    this._isActive = false
    this.pause()
    this.clear()
  }

  // 开启弹幕滚动
  play() {
    this._rAFId = this.canvas.requestAnimationFrame(() => {
      this.animate()
      this.play()
    })
  }

  // 停止弹幕滚动
  pause() {
    if (typeof this._rAFId === 'number') {
      this.canvas.cancelAnimationFrame(this._rAFId)
    }
  }

  // 清空屏幕和缓冲的数据
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.tunnels.forEach(tunnel => tunnel.clear())
  }

  // 添加一批弹幕，轨道满时会被丢弃
  addData(data = []) {
    if (!this._ready) {
      this._delay('addData', data)
      return
    }

    if (!this._isActive) return
    data.forEach(item => this.addBullet2Tunnel(item))
  }

  // 发送一条弹幕
  // 为保证发送成功，选取一条可用隧道，替换待发送队列队头元素
  send(opt = {}) {
    if (!this._ready) {
      this._delay('send', opt)
      return
    }

    const tunnel = this.getEnableTunnel()
    if (tunnel === null) return

    opt.tunnelId = tunnel.tunnelId
    const bullet = this.registerBullet(opt)
    tunnel.nextQueue[0] = bullet
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
