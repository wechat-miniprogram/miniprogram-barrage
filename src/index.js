import Barrage from './barrage'

Component({
  methods: {
    getBarrageInstance(opt) {
      opt.comp = this
      this.barrage = new Barrage(opt)
      return this.barrage
    },
    onAnimationend(e) {
      const {tunnelid, bulletid} = e.currentTarget.dataset
      this.barrage.animationend({
        tunnelId: tunnelid,
        bulletId: bulletid
      })
    },

    onTapBullet(e) {
      const {tunnelid, bulletid} = e.currentTarget.dataset
      this.barrage.tapBullet({
        tunnelId: tunnelid,
        bulletId: bulletid
      })
    },
  }
})
