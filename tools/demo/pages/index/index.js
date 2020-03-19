const { mockData } = require('./util')

Page({
  data: {
    src: 'http://wxsnsdy.tc.qq.com/105/20210/snsdyvideodownload?filekey=30280201010421301f0201690402534804102ca905ce620b1241b726bc41dcff44e00204012882540400&bizid=1023&hy=SH&fileparam=302c020101042530230204136ffd93020457e3c4ff02024ef202031e8d7f02030f42400204045a320a0201000400',
    open: false
  },
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
      tunnelShow: false,
      range: [0, 1]
    })
  },

  addData() {
    const data = mockData(100)
    this.barrage.addData(data)
    this.timer = setInterval(() => {
      const data = mockData(100)
      this.barrage.addData(data)
    }, 2000)
  },

  openDanmu() {
    this.barrage.open()
    this.addData()
  },

  closeDanmu() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    this.barrage.close()
  },

  toggleDanmu() {
    const open = this.data.open
    if (open) {
      this.closeDanmu()
    } else {
      this.openDanmu()
    }
    this.setData({
      open: !open
    })
  },

  fullscreenchange() {
    this.setData({ toggle: false })
    setTimeout(() => {
      if (this.barrage) this.barrage.close()
      this.setData({ toggle: true })
      this.addBarrage()
    }, 1000)
  }
})
