const {mockData} = require('./util')

Page({
  data: {
    src: 'http://wxsnsdy.tc.qq.com/105/20210/snsdyvideodownload?filekey=30280201010421301f0201690402534804102ca905ce620b1241b726bc41dcff44e00204012882540400&bizid=1023&hy=SH&fileparam=302c020101042530230204136ffd93020457e3c4ff02024ef202031e8d7f02030f42400204045a320a0201000400',
    open: false,
    alpha: 1,
    fontSize: 16,
    duration: 15,
    showSetting: false,
  },

  onUnload() {
    clearInterval(this.timer)
  },

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
  },

  addData() {
    // 发送带图片的弹幕
    // const data = [
    //   {
    //     content: '6666666666',
    //     color: '#00ff00',
    //     image: {
    //       head: {
    //         src: '/assets/bookmark.png',
    //       },
    //       tail: {
    //         src: '/assets/bookmark.png',
    //       }
    //     }
    //   },
    // ]
    // this.barrage.addData(data)

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

  // fullscreenchange() {
  //   this.setData({
  //     toggle: false
  //   })
  //   setTimeout(() => {
  //     if (this.barrage) this.barrage.close()
  //     this.setData({
  //       toggle: true
  //     })
  //     this.addBarrage()
  //   }, 1000)
  // },

  disableDanmu() {
    this.barrage.setRange([0, 0])
  },

  showTopDanmu() {
    this.barrage.setRange([0, 0.3])
  },

  showAllDanmu() {
    this.barrage.setRange([0, 1])
  },

  toggleBarrageSetting() {
    this.setData({
      showSetting: !this.data.showSetting
    })
  },

  fontChange(e) {
    const fontSize = e.detail.value
    this.setData({
      fontSize
    })
    this.barrage.setFont(`${fontSize}px sans-serif`)
  },

  transparentChange(e) {
    const alpha = (e.detail.value / 100).toFixed(2)
    this.setData({
      alpha
    })
    this.barrage.setAlpha(Number(alpha))
  },

  durationChange(e) {
    const duration = e.detail.value
    this.setData({
      duration
    })
    this.barrage.setDuration(duration)
  },

  send(e) {
    const value = e.detail.value
    this.barrage.send({
      content: value,
      color: '#ff0000',
      image: {
        head: {
          src: '/assets/car.png',
          gap: 10,
        },
        tail: {
          src: '/assets/car.png',
          gap: 10
        },
      }
    })
  },
})
