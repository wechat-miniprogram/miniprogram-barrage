import DomBarrage from './barrage-dom'
import CanvasBarrage from './barrage-canvas'

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    zIndex: {
      type: Number,
      value: 10
    },

    renderingMode: {
      type: String,
      value: 'canvas'
    }
  },

  methods: {
    getBarrageInstance(opt = {}) {
      opt.comp = this
      this.barrageInstance = this.data.renderingMode === 'dom'
        ? new DomBarrage(opt)
        : new CanvasBarrage(opt)
      return this.barrageInstance
    },

    onAnimationend(e) {
      const {tunnelid, bulletid} = e.currentTarget.dataset
      this.barrageInstance.animationend({
        tunnelId: tunnelid,
        bulletId: bulletid
      })
    },

    onTapBullet(e) {
      const {tunnelid, bulletid} = e.currentTarget.dataset
      this.barrageInstance.tapBullet({
        tunnelId: tunnelid,
        bulletId: bulletid
      })
    },
  }
})
